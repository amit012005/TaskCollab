const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'create_board',
        'update_board',
        'delete_board',
        'create_list',
        'update_list',
        'delete_list',
        'create_task',
        'update_task',
        'delete_task',
        'move_task',
        'assign_task',
        'unassign_task',
      ],
    },
    entityType: {
      type: String,
      enum: ['board', 'list', 'task'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    previousData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

activitySchema.index({ board: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
