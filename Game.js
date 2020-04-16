const childProcess = require('child_process');

const NUM_TEAMS = 2;
const WORDS_BY_TEAM = [9, 8];
const BOARD_ROWS= 5;
const BOARD_COLS = 5;

class Game {
  constructor() {
    this.words = [];
    this.colors = [];
    this.leftToReveal = [...WORDS_BY_TEAM];
    this.players = new Map();
    this.turn = -1;
    this.winner = -1;
  }

  addPlayer(socket, name, setTeam = null) {
    const { playerCounts, hasMaster } = this.teamInfo();
    const team = setTeam === null ? playerCounts.indexOf(Math.min(...playerCounts)) : setTeam;
    const master = !hasMaster[team];
    this.players.set(socket, { name, team, master });
  }

  setPlayerTeam(socket, team) {
    const name = this.players.get(socket).name;
    this.removePlayer(socket);
    this.addPlayer(socket, name, team);
  }

  removePlayer(socket) {
    const player = this.players.get(socket);
    if (!player) {
      return;
    }
    const team = player.team;
    this.players.delete(socket);
    const { hasMaster } = this.teamInfo();
    if (!hasMaster[team]) {
      const newMaster = [...this.players.values()].find(player => player.team === team);
      if (newMaster) {
        newMaster.master = true;
      }
    }
    return player;
  }

  playersCount() {
    return this.players.size;
  }

  eachPlayer(callback) {
    this.players.forEach(callback);
  }

  teamInfo() {
    const playerCounts = WORDS_BY_TEAM.map(() => 0);
    const hasMaster = WORDS_BY_TEAM.map(() => false);
    this.players.forEach(({ team, master }) => {
      playerCounts[team]++;
      if (master) {
        hasMaster[team] = true;
      }
    });
    return { playerCounts, hasMaster };
  }

  start() {
    if (this.isActive()) {
      return true;
    }

    const { playerCounts, hasMaster } = this.teamInfo();
    if (!(playerCounts.every(n => n > 0) && hasMaster.every(m => m))) {
      return false;
    }

    this.words = Game.randomWords();
    this.colors = Game.randomColors();
    this.leftToReveal = [...WORDS_BY_TEAM];
    this.winner = -1;
    this.turn = 0;
    return true;
  }

  finish(winner) {
    this.winner = winner;
    this.turn = -1;
  }

  isOver() {
    return this.winner > -1;
  }

  isActive() {
    return this.turn > -1;
  }

  click(i, j) {
    let keepTurn = false;
    const color = this.colors[i][j];
    if (color.startsWith('team')) {
      const team = parseInt(color.slice(4));
      this.leftToReveal[team]--;
      if (team === this.turn) {
        keepTurn = true;
      }
    } else if (color === 'black') {
      const winner = (this.turn + 1) % NUM_TEAMS;
      this.finish(winner);
    }
    if (!keepTurn) {
      this.pass();
    }
    const winner = this.leftToReveal.findIndex(x => x === 0);
    if (winner > -1) {
      this.finish(winner);
    }
    return color;
  }

  pass() {
    if (this.turn > -1) {
      this.turn++;
      this.turn %= NUM_TEAMS;
    }
  }

  static buildBoard(fill) {
    const fillFunc = (typeof fill === 'function') ? fill : () => fill;
    return new Array(BOARD_ROWS)
      .fill()
      .map((_, i) => new Array(BOARD_COLS)
        .fill()
        .map((_, j) => fillFunc(i, j, i * BOARD_ROWS + j))
      );
  }

  static randomWords() {
    const out = childProcess.execSync(`cat words.txt | sort -R | head -n ${BOARD_ROWS * BOARD_COLS}`);
    const words = out.toString().split("\n");
    return Game.buildBoard((_i, _j, index) => words[index]);
  }

  static randomColors() {
    const colors = Game.buildBoard('neutral');
    const randomIndex = () => [
      Math.floor(Math.random() * BOARD_ROWS),
      Math.floor(Math.random() * BOARD_COLS),
    ];
    WORDS_BY_TEAM.forEach((num, team) => {
      while (num) {
        const [i, j] = randomIndex();
        if (colors[i][j] === 'neutral') {
          colors[i][j] = `team${team}`;
          num--;
        }
      }
    });
    while (true) {
      const [i, j] = randomIndex();
      if (colors[i][j] === 'neutral') {
        colors[i][j] = `black`;
        break;
      }
    }
    return colors;
  }
}

module.exports = Game;
