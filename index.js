const ws = require('ws');
const GamesManager = require('./GamesManager');

const port = process.env.PORT || 8000;
const server = new ws.Server({ port });

console.log(`listening on port ${server.options.port}`);

const admins = new Set();
const sendJSON = (socket, message) => socket.send(JSON.stringify(message));
const adminBroadcast = (message) => admins.forEach(socket => sendJSON(socket, message));

const manager = new GamesManager();
manager.onChange = adminBroadcast;

server.on('connection', (socket, request) => {
  const room = request.url.slice(1);
  if (room === 'admin') {
    admins.add(socket);
    socket.send(JSON.stringify(manager.summary()));
    socket.on('close', () => {
      admins.delete(socket);
    });
    return;
  }

  let game;
  const broadcast = (action) => game.eachPlayer((_, socket) => sendJSON(socket, action));
  const respond = (action) => sendJSON(socket, action);

  socket.on('message', (message) => {
    let action;
    const turn0 = game ? game.turn : -1;
    try {
      action = JSON.parse(message);
    } catch (e) {
      console.log('invalid message', message);
    }

    if (action.type === 'PING') {
      respond({ type: 'PONG' });
    }
    if (action.type === 'JOIN') {
      const { playerName } = action;
      try {
        game = manager.join(room, socket, playerName);
        respond({ type: 'JOIN', room, playerName });
        respond({ type: 'SET_DICTIONARY', dictionary: game.dictionary });
        broadcast({
          type: 'PLAYERS',
          players: Array.from(game.players.values()),
        });
      } catch (e) {
        respond({ type: 'ERROR', message: e.message });
      }
    }
    if (action.type === 'SET_TEAM') {
      const { team } = action;
      game.setPlayerTeam(socket, team);
      broadcast({
        type: 'PLAYERS',
        players: Array.from(game.players.values()),
      });
      manager.handleChange();
    }
    if (action.type === 'SET_DICTIONARY') {
      game.setDictionary(action.dictionary);
      broadcast({ type: 'SET_DICTIONARY', dictionary: game.dictionary });
    }
    if (action.type === 'START') {
      if (game.isActive()) {
        const { team, master } = game.players.get(socket);
        respond({
          type: 'START',
          team,
          master,
          words: game.words,
          colors: master ? game.colors : null,
          turn: game.turn,
        });
        if (!master) {
          game.revealed.forEach(({ i, j }) => respond({
            type: 'REVEAL',
            i,
            j,
            turn: game.turn,
            color: game.colors[i][j],
          }));
        }
      } else {
        game.start();
        game.eachPlayer(({ team, master }, socket) => sendJSON(socket, {
          type: 'START',
          team,
          master,
          words: game.words,
          colors: master ? game.colors : null,
          turn: game.turn,
        }));
      };
    }
    if (action.type === 'CLICK') {
      const { i, j } = action;
      const color = game.click(i, j);
      broadcast({ type: 'REVEAL', i, j, color, turn: game.turn });
      if (game.isOver()) {
        broadcast({ type: 'OVER', winner: game.winner });
      }
    }
    if (action.type === 'PASS') {
      game.pass();
      broadcast({ type: 'PASS', turn: game.turn });
    }

    if (game && turn0 !== game.turn) {
      adminBroadcast({ type: 'TURN_CHANGE', room, turn: game.turn });
    }
  });

  socket.on('close', () => {
    manager.leave(room, socket);
    if (game) {
      broadcast({
        type: 'PLAYERS',
        players: Array.from(game.players.values()),
      });
    }
  });
});
