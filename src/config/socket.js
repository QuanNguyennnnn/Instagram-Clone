const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true }
  });

  // JWT auth middleware — mọi kết nối socket phải có token hợp lệ
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('_id username avatar isBanned');
      if (!user || user.isBanned) return next(new Error('Unauthorized'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Auto-join personal room để nhận notifications
    socket.join(`user:${userId}`);

    // Đăng ký chat handlers
    require('../sockets/chat.handler')(io, socket);

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
