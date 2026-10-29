const User = require('../models/User');
const DailyLog = require('../models/DailyLog');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// ১. ইউজার রেজিস্ট্রেশন ও লগইন (সহজ রাখার জন্য একসাথে দেওয়া হলো)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, companionType } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে।' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      companion: { type: companionType || 'tree', mood: 'neutral', growthStage: 1 }
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'রেজিস্ট্রেশন ব্যর্থ হয়েছে', error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, user });
    } else {
      res.status(401).json({ message: 'ইমেইল বা পাসওয়ার্ড ভুল।' });
    }
  } catch (error) {
    res.status(500).json({ message: 'লগইন ব্যর্থ হয়েছে', error: error.message });
  }
};

// ২. সকালের এনার্জি চেক-ইন (Energy Check-in)
exports.checkInEnergy = async (req, res) => {
  try {
    const { energyLevel } = req.body; // 'high', 'medium', 'low'
    const log = await DailyLog.findOneAndUpdate(
      { user: req.user._id, dateString: getTodayDateString() },
      { energyLevel },
      { new: true, upsert: true }
    );

    let aiAdvice = 'চলো আজকের দিনটা দারুণভাবে শুরু করি! 🌟';
    if (energyLevel === 'low') {
      aiAdvice = 'এনার্জি কম থাকলে একদম চাপ নেবে না। আমি বড় কাজগুলো সরিয়ে শুধু ছোট ও জরুরি (Bare Minimum) কাজগুলো সামনে রাখছি। আগে এক গ্লাস জল খেয়ে নাও! 💧';
    }

    res.json({
      message: aiAdvice,
      energyLevel: log.energyLevel,
      activateLowEnergyFilter: energyLevel === 'low'
    });
  } catch (error) {
    res.status(500).json({ message: 'এনার্জি চেক-ইন সেভ করতে সমস্যা হয়েছে', error: error.message });
  }
};

// ৩. পজ বা সিক মোড চালু/বন্ধ করা (Sick Mode Toggle)
exports.toggleSickMode = async (req, res) => {
  try {
    const { isActive, reason } = req.body;
    const user = await User.findById(req.user._id);

    user.sickMode.isActive = isActive;
    user.sickMode.activatedAt = isActive ? new Date() : null;
    user.sickMode.reason = isActive ? (reason || 'বিশ্রাম প্রয়োজন') : '';

    // সিক মোড চালু করলে পেট ঘুমিয়ে পড়বে (sleeping), বন্ধ করলে স্বাভাবিক (neutral) হবে
    user.companion.mood = isActive ? 'sleeping' : 'neutral';

    await user.save();

    res.json({
      message: isActive
        ? 'সিক মোড চালু হয়েছে। সব রিমাইন্ডার এবং পয়েন্ট কাটা বন্ধ রাখা হলো। নিজের যত্ন নাও এবং বিশ্রাম করো! 🛌🍵'
        : 'স্বাগতম! আশা করি এখন ভালো বোধ করছ। ধীরে ধীরে ছোট কাজ দিয়ে শুরু করো। 🌱',
      sickMode: user.sickMode,
      companion: user.companion
    });
  } catch (error) {
    res.status(500).json({ message: 'সিক মোড পরিবর্তন করতে সমস্যা হয়েছে', error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { name, password, timezone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (timezone) user.timezone = timezone;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    
    // পাসওয়ার্ড বাদে বাকি ডেটা ফ্রন্টএন্ডে পাঠানো হচ্ছে
    res.json({ 
      message: 'সেটিংস সফলভাবে আপডেট হয়েছে!', 
      user: { _id: user._id, name: user.name, email: user.email, timezone: user.timezone } 
    });
  } catch (error) {
    res.status(500).json({ message: 'সেটিংস আপডেট করতে সমস্যা হয়েছে', error: error.message });
  }
};