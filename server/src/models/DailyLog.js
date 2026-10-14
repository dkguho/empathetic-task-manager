const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateString: { type: String, required: true }, // ফরম্যাট: "YYYY-MM-DD"

  // ২. সকালের এনার্জি চেক-ইন
  energyLevel: { 
    type: String, 
    enum: ['high', 'medium', 'low', 'unChecked'], 
    default: 'unChecked' 
  },
  morningPromptInput: { type: String, default: '' }, // সকালে সাধারণ ভাষায় লেখা প্ল্যান

  // ১. রাতের ব্রেইন ডাম্প (Brain Dump)
  nightBrainDump: {
    rawText: { type: String, default: '' },          // ঘুমানোর আগে মাথার সব এলোমেলো চিন্তা
    isProcessedByAI: { type: Boolean, default: false } // AI সেখান থেকে পরের দিনের কাজ বানিয়েছে কি না
  },

  // প্রতিদিনের সামারি (উইকলি চার্টের জন্য কাজে লাগবে)
  tasksCompletedCount: { type: Number, default: 0 },
  tasksSnoozedCount: { type: Number, default: 0 },
  pointsChangeToday: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);