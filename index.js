const ws = require('ws');

const port = process.env.PORT || 8000;
const server = new ws.Server({ port });

server.on('connection', (socket) => {
  socket.on('message', (message) => {
    console.log('received: %s', message);
  });

  socket.send('something');
});
