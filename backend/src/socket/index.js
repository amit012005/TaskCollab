const jwt = require('jsonwebtoken');
const User = require('../models/User');

const boardRooms = new Map();

const getUserIdFromToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    return user ? user._id.toString() : null;
  } catch {
    return null;
  }
};

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const userId = await getUserIdFromToken(token);
    if (!userId) return next(new Error('Invalid token'));
    socket.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    socket.on('join_board', (boardId) => {
      const room = `board:${boardId}`;
      socket.join(room);
      const members = boardRooms.get(room) || new Set();
      members.add(socket.userId);
      boardRooms.set(room, members);
    });

    socket.on('leave_board', (boardId) => {
      const room = `board:${boardId}`;
      socket.leave(room);
      const members = boardRooms.get(room);
      if (members) {
        members.delete(socket.userId);
        if (members.size === 0) boardRooms.delete(room);
        else boardRooms.set(room, members);
      }
    });

    socket.on('disconnect', () => {
      boardRooms.forEach((members, room) => {
        members.delete(socket.userId);
        if (members.size === 0) boardRooms.delete(room);
      });
    });
  });

  return {
    emitToBoard: (boardId, event, data) => {
      io.to(`board:${boardId}`).emit(event, data);
    },
  };
};

module.exports = { setupSocket };
