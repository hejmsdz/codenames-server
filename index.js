const ws = require('ws');
const Game = require('./Game');

const port = process.env.PORT || 8000;
const server = new ws.Server({ port });

console.log(`listening on port ${server.options.port}`);

const game = new Game();

let i = 0;

const clients = new Set();

const broadcast = (action) => clients.forEach(socket => socket.send(JSON.stringify(action)));

server.on('connection', (socket) => {
  clients.add(socket);

  socket.on('message', (message) => {
    const action = JSON.parse(message);
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

  const master = i === 0;
  socket.send(JSON.stringify({
    type: 'START',
    words: game.words,
    team: i++ % 2,
    turn: 0,
    master,
    colors: master ? game.colors : undefined,
  }));

  socket.on('close', () => clients.delete(socket));
});
