const Game = require('./Game');

class GamesManager {
  constructor() {
    this.onChange = () => {};
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
    this.onChange(this.summary());
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
    this.onChange(this.summary());
  }

  summary() {
    const activeGames = [...this.games.entries()].map(([room, game]) => ({
      room,
      players: game.teamInfo().playerCounts,
      turn: game.turn,
    }));
    return { type: 'ACTIVE_GAMES', activeGames };
  }
}

module.exports = GamesManager;
