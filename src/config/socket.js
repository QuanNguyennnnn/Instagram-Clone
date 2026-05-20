const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true }
  });

  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
    });

    socket.on('leave', (userId) => {
      socket.leave(`user:${userId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
