const Board = require('../models/Board');
const { emitBoardUpdate } = require('../services/socketEmitter');
const List = require('../models/List');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

const logActivity = async (boardId, userId, action, entityType, entityId, details = {}, previousData = null) => {
  await Activity.create({
    board: boardId,
    user: userId,
    action,
    entityType,
    entityId,
    details,
    previousData,
  });
};

exports.createBoard = async (req, res) => {
  try {
    const board = await Board.create({
      ...req.body,
      createdBy: req.user.id,
    });
    await logActivity(board._id, req.user.id, 'create_board', 'board', board._id, { title: board.title });
    emitBoardUpdate(board._id, 'board:updated', { type: 'create_board', board });
    res.status(201).json(board);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create board' });
  }
};

exports.getBoards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const assignedBoardIds = await Task.distinct('board', { assignedTo: req.user.id });

    const query = {
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id },
        { _id: { $in: assignedBoardIds } },
      ],
    };
    if (search.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$and = [{ $or: [{ title: regex }, { description: regex }] }];
    }

    const [boards, total] = await Promise.all([
      Board.find(query).populate('createdBy', 'name email').sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Board.countDocuments(query),
    ]);

    res.json({ boards, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch boards' });
  }
};

exports.getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .populate({
        path: 'lists',
        populate: {
          path: 'tasks',
          populate: { path: 'assignedTo', select: 'name email' },
        },
      })
      .lean();
    if (!board) return res.status(404).json({ message: 'Board not found' });
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch board' });
  }
};

exports.updateBoard = async (req, res) => {
  try {
    const board = await Board.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!board) return res.status(404).json({ message: 'Board not found' });
    await logActivity(board._id, req.user.id, 'update_board', 'board', board._id, req.body);
    emitBoardUpdate(board._id, 'board:updated', { type: 'update_board', board });
    res.json(board);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update board' });
  }
};

exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    await Task.deleteMany({ board: board._id });
    await List.deleteMany({ board: board._id });
    await Activity.deleteMany({ board: board._id });
    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete board' });
  }
};
