const express = require('express');
const {
  createList,
  updateList,
  deleteList,
} = require('../controllers/listController');
const { protect } = require('../middleware/auth');
const { checkBoardAccess } = require('../middleware/boardAccess');

const router = express.Router();
router.use(protect);

router.post('/boards/:boardId/lists', checkBoardAccess, createList);
router.patch('/lists/:id', updateList);
router.delete('/lists/:id', deleteList);

module.exports = router;
