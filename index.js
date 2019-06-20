const ws = require('ws');
const Game = require('./Game');

const port = process.env.PORT || 8000;
const server = new ws.Server({ port });

console.log(`listening on port ${server.options.port}`);

const game = new Game();
console.log(game.colors);

let i = 0;

const clients = new Set();

const broadcast = (action) => clients.forEach(socket => socket.send(JSON.stringify(action)));

server.on('connection', (socket) => {
  clients.add(socket);

  socket.on('message', (message) => {
    const action = JSON.parse(message);
    if (action.type === 'CLICK') {
      broadcast({
        type: 'REVEAL',
        i: action.i,
        j: action.j,
        color: game.colors[action.i][action.j],
        turn: 0
      });
    }
  });

  socket.send(JSON.stringify({
    type: 'START',
    words: game.words,
    team: i++ % 2,
    turn: 0,
    master: false,
  }));

  socket.on('close', () => clients.delete(socket));
});
