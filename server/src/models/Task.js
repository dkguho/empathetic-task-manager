const mongoose = require('mongoose');

const subTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false }
});

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },

  // ১. ফ্লেক্সিবল টাইম ব্লক ও নির্দিষ্ট সময়
  scheduledDate: { type: Date, required: true },
  timeBlock: { 
    type: String, 
    enum: ['morning', 'afternoon', 'evening', 'night', 'anytime'], 
    default: 'anytime' 
  },
  exactTime: { type: String, default: null }, // যদি ইউজার নির্দিষ্ট সময় চায় (যেমন: "15:30")

  // ১. ক্যাটাগরি, প্রায়োরিটি কালার কোড ও বিশেষ টাস্কের ধরন
  category: { 
    type: String, 
    enum: ['work', 'study', 'health', 'chores', 'entertainment', 'warmup'], 
    default: 'work' 
  },
  priorityColor: { 
    type: String, 
    enum: ['red', 'blue', 'green', 'purple'], // লাল=জরুরি, নীল=সাধারণ, সবুজ=ওয়ার্ম-আপ, বেগুনি=বিনোদন
    default: 'blue' 
  },
  isDopamineStarter: { type: Boolean, default: false }, // ওয়ার্ম-আপ টাস্ক (যেমন: জল খাওয়া)
  isGuiltFreeHobby: { type: Boolean, default: false },  // গিল্ট-ফ্রি বিনোদন (যেমন: নেটফ্লিক্স দেখা)
  isBareMinimum: { type: Boolean, default: false },     // লো এনার্জির দিনের জন্য জরুরি সহজ কাজ

  // ২. এআই অ্যাসিস্ট্যান্ট ফিচার (ব্রেকডাউন ও ২-মিনিট রুল)
  estimatedMinutes: { type: Number, default: 15 },
  isTwoMinuteTask: { type: Boolean, default: false },   // ২ মিনিটের কম হলে পপ-আপ দেবে
  subTasks: [subTaskSchema],                            // AI দিয়ে ৩-৪টি ছোট ধাপে ভাঙা কাজ

  // ৩. অলসতা কাটানোর ট্রিকস (Snooze, Grace Period, Delay Reason)
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'snoozed'], 
    default: 'pending' 
  },
  rescheduleCount: { type: Number, default: 0, max: 3 }, // সর্বোচ্চ ৩ বার পেছানো যাবে
  snoozeUntil: { type: Date, default: null },            // "আমাকে ১৫ মিনিট সময় দাও"
  gracePeriodEndsAt: { type: Date, default: null },      // কাজের সময়ের পর ১৫-৩০ মিনিট বাড়তি সময়
  delayReasons: [{                                       // ৩ বার পেছানোর পর আসল কারণগুলো জমা থাকবে
    reason: String,
    loggedAt: { type: Date, default: Date.now }
  }],

  // ৫. ডান লিস্ট (Done List)
  completedAt: { type: Date, default: null },
  aiMotivationalNote: { type: String, default: '' }      // কাজ মিস হলে বা শেষ করলে AI-এর পজিটিভ মেসেজ
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);