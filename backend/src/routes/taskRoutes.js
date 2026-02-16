const express = require('express');
const {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  assignTask,
  unassignTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.post('/lists/:listId/tasks', createTask);
router.patch('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);
router.post('/tasks/:taskId/move', moveTask);
router.post('/tasks/:taskId/assign', assignTask);
router.post('/tasks/:taskId/unassign', unassignTask);

module.exports = router;
