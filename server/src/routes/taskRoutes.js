const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  createTask,
  getTasks,
  snoozeTask15Min,
  rescheduleTask,
  completeTask
} = require('../controllers/taskController');

router.route('/')
  .post(protect, createTask)
  .get(protect, getTasks);

router.patch('/:id/snooze', protect, snoozeTask15Min);
router.patch('/:id/reschedule', protect, rescheduleTask);
router.patch('/:id/complete', protect, completeTask);

module.exports = router;