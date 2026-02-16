const User = require('../models/User');

exports.searchUsers = async (req, res) => {
  try {
    const search = req.query.q || '';
    const limit = parseInt(req.query.limit) || 10;
    if (!search.trim()) {
      return res.json({ users: [] });
    }
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    })
      .select('name email')
      .limit(limit)
      .lean();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to search users' });
  }
};
