let io = null;

const setIO = (socketIO) => {
  io = socketIO;
};

const emitBoardUpdate = (boardId, event, data) => {
  if (io) {
    io.to(`board:${boardId}`).emit(event, data);
  }
};

module.exports = { setIO, emitBoardUpdate };
