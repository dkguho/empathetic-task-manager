const Task = require('../models/Task');
const DailyLog = require('../models/DailyLog');
const User = require('../models/User');
const { analyzeWeeklyHabits } = require('../services/aiService');

exports.getWeeklyDashboard = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const user = await User.findById(req.user._id);
    const weeklyTasks = await Task.find({
      user: req.user._id,
      scheduledDate: { $gte: sevenDaysAgo }
    });

    // ১. ক্যাটাগরি ও টাইম ব্লক অনুযায়ী কাজ পেছানোর হিসাব (চার্টের জন্য)
    const procrastinationByTimeBlock = { morning: 0, afternoon: 0, evening: 0, night: 0, anytime: 0 };
    const procrastinationByCategory = { work: 0, study: 0, health: 0, chores: 0, entertainment: 0, warmup: 0 };
    const allDelayReasons = [];

    let completedCount = 0;
    let totalRescheduled = 0;

    weeklyTasks.forEach(task => {
      if (task.status === 'completed') completedCount++;
      if (task.rescheduleCount > 0) {
        totalRescheduled += task.rescheduleCount;
        procrastinationByTimeBlock[task.timeBlock] = (procrastinationByTimeBlock[task.timeBlock] || 0) + task.rescheduleCount;
        procrastinationByCategory[task.category] = (procrastinationByCategory[task.category] || 0) + task.rescheduleCount;
      }
      if (task.delayReasons && task.delayReasons.length > 0) {
        task.delayReasons.forEach(r => allDelayReasons.push(r.reason));
      }
    });

    // ২. AI Habit Tracking রিপোর্ট তৈরি করা
    const summaryForAI = {
      completedTasks: completedCount,
      totalTasks: weeklyTasks.length,
      procrastinationByTimeBlock,
      procrastinationByCategory,
      commonDelayReasons: allDelayReasons.slice(0, 10)
    };

    const aiHabitReport = await analyzeWeeklyHabits(summaryForAI);

    // ৩. গত ৭ দিনের পয়েন্ট ও এনার্জি লগ
    const dailyLogs = await DailyLog.find({ user: req.user._id })
      .sort({ dateString: -1 })
      .limit(7);

    res.json({
      userStats: {
        awarenessPoints: user.awarenessPoints,
        lifelines: user.lifelines,
        companion: user.companion
      },
      weeklyMetrics: {
        totalTasks: weeklyTasks.length,
        completedCount,
        totalRescheduled
      },
      charts: {
        procrastinationByTimeBlock,
        procrastinationByCategory,
        recentDelayReasons: allDelayReasons,
        dailyLogs
      },
      aiHabitReport // যেমন: "তুমি বিকেলের কাজ বেশি পেছাও..."
    });
  } catch (error) {
    res.status(500).json({ message: 'ড্যাশবোর্ড ডেটা লোড করতে সমস্যা হয়েছে', error: error.message });
  }
};