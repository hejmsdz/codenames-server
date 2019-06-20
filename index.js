const ws = require('ws');

const port = process.env.PORT || 8000;
const server = new ws.Server({ port });

console.log(`listening on port ${server.options.port}`);

const words = [
  ['soul', 'pound', 'state', 'microscope', 'sub'],
  ['kid', 'mole', 'Europe', 'pitch', 'hawk'],
  ['chest', 'flute', 'triangle', 'ice cream', 'pass'],
  ['dwarf', 'change', 'life', 'satellite', 'rabbit'],
  ['thumb', 'cat', 'bar', 'novel', 'box'],
];

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
        color: `team${Math.random() > 0.5 ? 0 : 1}`,
        turn: 0
      });
    }
  });

  socket.send(JSON.stringify({
    type: 'START',
    words,
    team: 0,
    turn: 0,
    master: false,
  }));

  socket.on('close', () => clients.delete(socket));
});
