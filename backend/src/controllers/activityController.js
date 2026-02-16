const Activity = require('../models/Activity');

exports.getBoardActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find({ board: req.params.boardId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments({ board: req.params.boardId }),
    ]);

    res.json({ activities, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch activities' });
  }
};
