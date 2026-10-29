const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  registerUser,
  loginUser,
  checkInEnergy,
  toggleSickMode
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/energy-checkin', protect, checkInEnergy);
router.patch('/sick-mode', protect, toggleSickMode);
router.patch('/settings', protect, require('../controllers/authController').updateSettings);

module.exports = router;