const childProcess = require('child_process');

const NUM_TEAMS = 2;
const WORDS_BY_TEAM = [9, 8];
const BOARD_ROWS= 5;
const BOARD_COLS = 5;

class Game {
  constructor() {
    this.words = Game.randomWords();
    this.colors = Game.randomColors();
    this.players = new Array(NUM_TEAMS).fill().map(() => new Set());
    this.turn = 0;
  }

  click(i, j) {
    const color = this.colors[i][j];
    if (color.startsWith('team')) {
      const team = parseInt(color.slice(4));
      if (team === this.turn) {
        return color;
      }
    }
    this.turn++;
    this.turn %= NUM_TEAMS;
    return color;
  }

  static randomWords() {
    const out = childProcess.execSync(`cat words.txt | sort -R | head -n ${BOARD_ROWS * BOARD_COLS}`);
    const words = out.toString().split("\n");
    return Array(BOARD_ROWS).fill().map((_, i) => words.slice(i * BOARD_COLS, (i + 1) * BOARD_COLS));
  }

  static randomColors() {
    const colors = new Array(BOARD_ROWS).fill().map(() => new Array(BOARD_COLS).fill('neutral'));
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
