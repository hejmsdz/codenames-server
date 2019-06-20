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

  static randomWords() {
    return [
      ['soul', 'pound', 'state', 'microscope', 'sub'],
      ['kid', 'mole', 'Europe', 'pitch', 'hawk'],
      ['chest', 'flute', 'triangle', 'ice cream', 'pass'],
      ['dwarf', 'change', 'life', 'satellite', 'rabbit'],
      ['thumb', 'cat', 'bar', 'novel', 'box'],
    ];
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
