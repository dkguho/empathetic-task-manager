const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // ৪. ডেটা, পয়েন্ট ও ট্র্যাকিং
  awarenessPoints: { type: Number, default: 100 }, // সেলফ-অ্যাওয়ারনেস পয়েন্ট (শুরুতে ১০০)
  currentStreak: { type: Number, default: 0 },     // টানা কতদিন কাজ করেছে
  lifelines: { type: Number, default: 1 },         // স্ট্রাইক সেভার (জরুরি দিনে পয়েন্ট বাঁচাবে)

  // ৩. সিক মোড বা পজ মোড
  sickMode: {
    isActive: { type: Boolean, default: false },
    activatedAt: { type: Date, default: null },
    reason: { type: String, default: '' }
  },

  // ৫. কিউট ভিজ্যুয়াল কম্প্যানিয়ন (3D Pet/Tree State)
  companion: {
    type: { type: String, enum: ['tree', 'pet'], default: 'tree' },
    mood: { type: String, enum: ['happy', 'neutral', 'sad', 'sleeping'], default: 'neutral' },
    growthStage: { type: Number, default: 1 } // কাজ করলে গাছ বড় হবে বা ফুল ফুটবে (১ থেকে ৫)
  },

  // ৬. ক্যালেন্ডার সিঙ্ক
  googleCalendarToken: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);