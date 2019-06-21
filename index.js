const ws = require('ws');
const GamesManager = require('./GamesManager');

const port = process.env.PORT || 8000;
const server = new ws.Server({ port });

console.log(`listening on port ${server.options.port}`);

const manager = new GamesManager();
let i = 0;

server.on('connection', (socket, request) => {
  const room = request.url.slice(1);
  let game;
  
  const broadcast = (action) => game.eachPlayer((_, socket) => socket.send(JSON.stringify(action)));

  socket.on('message', (message) => {
    const action = JSON.parse(message);
    if (action.type === 'JOIN') {
      const { playerName } = action;
      game = manager.join(room, socket, playerName);

      const master = i === 0;
      socket.send(JSON.stringify({
        type: 'START',
        words: game.words,
        team: i++ % 2,
        turn: 0,
        master,
        colors: master ? game.colors : undefined,
      }));
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
