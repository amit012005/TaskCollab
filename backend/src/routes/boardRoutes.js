const express = require('express');
const {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
} = require('../controllers/boardController');
const { protect } = require('../middleware/auth');
const { checkBoardAccess } = require('../middleware/boardAccess');

const router = express.Router();
router.use(protect);

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:id', checkBoardAccess, getBoard);
router.patch('/:id', checkBoardAccess, updateBoard);
router.delete('/:id', checkBoardAccess, deleteBoard);

module.exports = router;
