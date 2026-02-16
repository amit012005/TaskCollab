const mongoose = require('mongoose');
const Task = require('../models/Task');
const { emitBoardUpdate } = require('../services/socketEmitter');
const List = require('../models/List');
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

exports.createTask = async (req, res) => {
  try {
    const { listId } = req.params;
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ message: 'List not found' });
    const maxOrder = await Task.findOne({ list: listId }).sort({ order: -1 }).select('order');
    const order = (maxOrder?.order ?? -1) + 1;
    const task = await Task.create({
      ...req.body,
      list: listId,
      board: list.board,
      order,
    });
    await List.findByIdAndUpdate(listId, { $push: { tasks: task._id } });
    await logActivity(list.board, req.user.id, 'create_task', 'task', task._id, { title: task.title });
    const populated = await Task.findById(task._id).populate('assignedTo', 'name email');
    emitBoardUpdate(list.board, 'board:updated', { type: 'create_task', task: populated });
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const previousData = { ...task.toObject() };
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name email');
    await logActivity(task.board, req.user.id, 'update_task', 'task', task._id, req.body, previousData);
    emitBoardUpdate(task.board, 'board:updated', { type: 'update_task', task: updated });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const listId = task.list;
    const boardId = task.board;
    await List.findByIdAndUpdate(listId, { $pull: { tasks: task._id } });
    await Task.findByIdAndDelete(req.params.id);
    await logActivity(boardId, req.user.id, 'delete_task', 'task', task._id, { title: task.title });
    emitBoardUpdate(boardId, 'board:updated', { type: 'delete_task', taskId: task._id, listId });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete task' });
  }
};

exports.moveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { targetListId, newOrder } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const oldListId = task.list;
    if (oldListId.toString() === targetListId) {
      task.order = newOrder ?? task.order;
      await task.save();
      await logActivity(task.board, req.user.id, 'move_task', 'task', task._id, {
        listId: targetListId,
        order: task.order,
      });
    } else {
      await List.findByIdAndUpdate(oldListId, { $pull: { tasks: task._id } });
      await List.findByIdAndUpdate(targetListId, { $push: { tasks: task._id } });
      task.list = targetListId;
      task.order = newOrder ?? 0;
      await task.save();
      await logActivity(task.board, req.user.id, 'move_task', 'task', task._id, {
        fromListId: oldListId,
        toListId: targetListId,
        order: task.order,
      });
    }
    const updated = await Task.findById(taskId).populate('assignedTo', 'name email');
    emitBoardUpdate(task.board, 'board:updated', { type: 'move_task', task: updated });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to move task' });
  }
};

exports.assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const board = await Board.findById(task.board);
    if (!board || board.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the board owner can assign tasks' });
    }
    if (!task.assignedTo.some((id) => id.toString() === userId)) {
      const assigneeId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
      task.assignedTo.push(assigneeId);
      await task.save();
      await logActivity(task.board, req.user.id, 'assign_task', 'task', task._id, { assignedUserId: userId });
      if (board.createdBy.toString() !== userId && !board.members.some((m) => m.toString() === userId)) {
        await Board.findByIdAndUpdate(task.board, { $addToSet: { members: assigneeId } });
      }
    }
    const updated = await Task.findById(taskId).populate('assignedTo', 'name email');
    emitBoardUpdate(task.board, 'board:updated', { type: 'assign_task', task: updated });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to assign task' });
  }
};

exports.unassignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const board = await Board.findById(task.board);
    if (!board || board.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the board owner can unassign tasks' });
    }
    task.assignedTo = task.assignedTo.filter((id) => id.toString() !== userId);
    await task.save();
    await logActivity(task.board, req.user.id, 'unassign_task', 'task', task._id, { unassignedUserId: userId });
    const updated = await Task.findById(taskId).populate('assignedTo', 'name email');
    emitBoardUpdate(task.board, 'board:updated', { type: 'unassign_task', task: updated });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to unassign task' });
  }
};
