import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTaskStats,
  getTasks,
  updateTask,
} from '../controllers/taskController.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/stats', getTaskStats);
router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
