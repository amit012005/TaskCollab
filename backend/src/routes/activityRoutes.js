const express = require('express');
const { getBoardActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');
const { checkBoardAccess } = require('../middleware/boardAccess');

const router = express.Router();
router.use(protect);

router.get('/boards/:boardId/activities', checkBoardAccess, getBoardActivities);

module.exports = router;
