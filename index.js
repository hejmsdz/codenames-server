const ws = require('ws');
const GamesManager = require('./GamesManager');

const port = process.env.PORT || 8000;
const server = new ws.Server({ port });

console.log(`listening on port ${server.options.port}`);

const manager = new GamesManager();

server.on('connection', (socket, request) => {
  const room = request.url.slice(1);
  let game;
  
  const broadcast = (action) => game.eachPlayer((_, socket) => socket.send(JSON.stringify(action)));

  socket.on('message', (message) => {
    const action = JSON.parse(message);
    if (action.type === 'JOIN') {
      const { playerName } = action;
      game = manager.join(room, socket, playerName);
      broadcast({
        type: 'PLAYERS',
        players: Array.from(game.players.values()),
      });
    }
    if (action.type === 'SET_TEAM') {
      const { team } = action;
      game.players.get(socket).team = team;
      broadcast({
        type: 'PLAYERS',
        players: Array.from(game.players.values()),
      });
    }
    if (action.type === 'START') {
      game.start();
      game.eachPlayer(({ team, master }, socket) => socket.send(JSON.stringify({
        type: 'START',
        team,
        master,
        words: game.words,
        colors: master ? game.colors : null,
        turn: game.turn,
      })));
    }
    if (action.type === 'CLICK') {
      const { i, j } = action;
      const color = game.click(i, j);
      broadcast({ type: 'REVEAL', i, j, color, turn: game.turn });
    }
    if (action.type === 'PASS') {
      game.pass();
      broadcast({ type: 'PASS', turn: game.turn });
    }
  });

  socket.on('close', () => {
    manager.leave(room, socket);
  });
});
