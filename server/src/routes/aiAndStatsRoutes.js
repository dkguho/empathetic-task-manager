const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { processSmartInput, breakdownTask } = require('../controllers/aiController');
const { getWeeklyDashboard } = require('../controllers/statsController');

// AI Routes
router.post('/smart-input', protect, processSmartInput);
router.post('/breakdown/:id', protect, breakdownTask);

// Analytics & Habit Tracker Route
router.get('/weekly-dashboard', protect, getWeeklyDashboard);

module.exports = router;