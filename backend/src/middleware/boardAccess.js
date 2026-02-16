const Board = require('../models/Board');
const Task = require('../models/Task');

const checkBoardAccess = async (req, res, next) => {
  try {
    const boardId = req.params.boardId || req.params.id;
    if (!boardId) return res.status(400).json({ message: 'Board ID required' });
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    const isCreator = board.createdBy.toString() === req.user.id;
    const isMember = board.members.some((m) => m.toString() === req.user.id);
    const isAssigned = await Task.exists({ board: boardId, assignedTo: req.user.id });
    if (!isCreator && !isMember && !isAssigned) {
      return res.status(403).json({ message: 'Access denied to this board' });
    }
    req.board = board;
    req.params.boardId = boardId;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkBoardAccess };
