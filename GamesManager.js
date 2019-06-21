const Game = require('./Game');

class GamesManager {
  constructor() {
    this.games = new Map();
  }

  join(room, socket, name) {
    let game;
    if (this.games.has(room)) {
      game = this.games.get(room);
    } else {
      game = new Game();
      this.games.set(room, game);
    }
    game.addPlayer(socket, name);
    return game;
  }

  leave(room, socket) {
    if (!this.games.has(room)) {
      return;
    }
    const game = this.games.get(room);
    game.removePlayer(socket);
    if (game.playersCount() === 0) {
      this.games.delete(room);
    }
  }
}

module.exports = GamesManager;
