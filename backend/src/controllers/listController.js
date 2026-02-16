const List = require('../models/List');
const { emitBoardUpdate } = require('../services/socketEmitter');
const Board = require('../models/Board');
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

exports.createList = async (req, res) => {
  try {
    const { boardId } = req.params;
    const maxOrder = await List.findOne({ board: boardId }).sort({ order: -1 }).select('order');
    const order = (maxOrder?.order ?? -1) + 1;
    const list = await List.create({
      title: req.body.title || 'New List',
      board: boardId,
      order,
    });
    await Board.findByIdAndUpdate(boardId, { $push: { lists: list._id } });
    await logActivity(boardId, req.user.id, 'create_list', 'list', list._id, { title: list.title });
    emitBoardUpdate(boardId, 'board:updated', { type: 'create_list', list });
    res.status(201).json(list);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create list' });
  }
};

exports.updateList = async (req, res) => {
  try {
    const list = await List.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!list) return res.status(404).json({ message: 'List not found' });
    await logActivity(list.board, req.user.id, 'update_list', 'list', list._id, req.body);
    emitBoardUpdate(list.board, 'board:updated', { type: 'update_list', list });
    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update list' });
  }
};

exports.deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id).populate('tasks');
    if (!list) return res.status(404).json({ message: 'List not found' });
    const boardId = list.board;
    await Board.findByIdAndUpdate(boardId, { $pull: { lists: list._id } });
    const Task = require('../models/Task');
    await Task.deleteMany({ list: list._id });
    await List.findByIdAndDelete(req.params.id);
    await logActivity(boardId, req.user.id, 'delete_list', 'list', list._id, { title: list.title });
    emitBoardUpdate(boardId, 'board:updated', { type: 'delete_list', listId: list._id });
    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete list' });
  }
};
