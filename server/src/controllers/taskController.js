const Task = require('../models/Task');
const User = require('../models/User');
const DailyLog = require('../models/DailyLog');

// আজকের তারিখ "YYYY-MM-DD" ফরম্যাটে পাওয়ার হেল্পার ফাংশন
const getTodayDateString = () => new Date().toISOString().split('T')[0];

// ১. নতুন কাজ তৈরি করা (ওভারলোড ওয়ার্নিং, ২-মিনিট রুল ও গ্রেস পিরিয়ডসহ)
exports.createTask = async (req, res) => {
  try {
    const {
      title, description, scheduledDate, timeBlock, exactTime,
      category, priorityColor, estimatedMinutes,
      isDopamineStarter, isGuiltFreeHobby, isBareMinimum, subTasks
    } = req.body;

    const taskDate = scheduledDate ? new Date(scheduledDate) : new Date();
    const startOfDay = new Date(taskDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(taskDate.setHours(23, 59, 59, 999));

    // ওভারলোড ওয়ার্নিং চেক (একদিনে ৮টির বেশি বড় কাজ হলে সতর্ক করবে)
    const todayTasksCount = await Task.countDocuments({
      user: req.user._id,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      isDopamineStarter: false
    });

    let overloadWarning = null;
    if (todayTasksCount >= 8) {
      overloadWarning = 'আজকের লিস্টে অনেক কাজ হয়ে গেছে! নিজেকে প্রেশার না দিয়ে কিছু কাজ কালকের জন্য রাখবে কি? 🌱';
    }

    // ২ মিনিটের ম্যাজিক রুল চেক
    const isTwoMin = estimatedMinutes && Number(estimatedMinutes) <= 2;

    // গ্রেস পিরিয়ড (Grace Period) সেট করা: যদি নির্দিষ্ট সময় (যেমন "15:30") দেওয়া থাকে, তবে ৩০ মিনিট বাড়তি সময় দেওয়া হবে
    let gracePeriodEndsAt = null;
    if (exactTime) {
      const [hours, minutes] = exactTime.split(':').map(Number);
      const graceDate = new Date(scheduledDate || Date.now());
      graceDate.setHours(hours, minutes + 30, 0, 0); // ৩০ মিনিট গ্রেস পিরিয়ড
      gracePeriodEndsAt = graceDate;
    }

    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      scheduledDate: scheduledDate || new Date(),
      timeBlock: timeBlock || 'anytime',
      exactTime,
      gracePeriodEndsAt,
      category: category || 'work',
      priorityColor: isDopamineStarter ? 'green' : isGuiltFreeHobby ? 'purple' : (priorityColor || 'blue'),
      estimatedMinutes: estimatedMinutes || 15,
      isTwoMinuteTask: isTwoMin,
      isDopamineStarter: isDopamineStarter || false,
      isGuiltFreeHobby: isGuiltFreeHobby || false,
      isBareMinimum: isBareMinimum || false,
      subTasks: subTasks || []
    });

    res.status(201).json({
      task,
      overloadWarning,
      twoMinutePrompt: isTwoMin ? 'এটা তো ২ মিনিটের কাজ, এখনই করে ফেলো! ⚡' : null
    });
  } catch (error) {
    res.status(500).json({ message: 'কাজ তৈরি করতে সমস্যা হয়েছে', error: error.message });
  }
};

// ২. কাজ লোড করা (Calendar এবং Upcoming সাপোর্ট সহ)
exports.getTasks = async (req, res) => {
  try {
    const { date, lowEnergyFilter } = req.query;
    let query = { user: req.user._id };

    if (date) {
      // যদি স্পেসিফিক কোনো ডেট চায় (যেমন ক্যালেন্ডার থেকে)
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // ডিফল্টভাবে: গতকাল থেকে শুরু করে আগামী ৩০ দিনের কাজ ফ্রন্টএন্ডে পাঠাবে
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      
      query.scheduledDate = { $gte: yesterday, $lte: nextMonth };
    }

    // এনার্জি কম থাকলে শুধু Bare Minimum, Warm-up এবং Guilt-free কাজগুলো দেখাবে
    if (lowEnergyFilter === 'true') {
      query.$or = [
        { isBareMinimum: true },
        { isDopamineStarter: true },
        { isGuiltFreeHobby: true },
        { priorityColor: 'red' }
      ];
    }

    const tasks = await Task.find(query).sort({ scheduledDate: 1, status: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'কাজ লোড করতে সমস্যা হয়েছে', error: error.message });
  }
};

// ৩. "আমাকে ১৫ মিনিট সময় দাও" (Snooze Feature - কোনো পয়েন্ট কাটবে না)
exports.snoozeTask15Min = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'কাজটি পাওয়া যায়নি' });

    const fifteenMinsLater = new Date(Date.now() + 15 * 60 * 1000);
    task.status = 'snoozed';
    task.snoozeUntil = fifteenMinsLater;
    task.aiMotivationalNote = 'কোনো ব্যাপার না! ১৫ মিনিট জিরিয়ে নাও, তারপর ছোট করে শুরু করো। ☕';
    await task.save();

    res.json({
      message: 'কাজটি ১৫ মিনিটের জন্য স্নুজ করা হয়েছে।',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'স্নুজ করতে সমস্যা হয়েছে', error: error.message });
  }
};

// ৪. কাজ পেছানো বা রিশিডিউল (৩-বারের লিমিট, কারণ জানতে চাওয়া এবং পয়েন্ট লজিক)
exports.rescheduleTask = async (req, res) => {
  try {
    const { newTimeBlock, newDate, delayReason, useLifeline } = req.body;
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    const user = await User.findById(req.user._id);

    if (!task) return res.status(404).json({ message: 'কাজটি পাওয়া যায়নি' });

    // চেক ১: গ্রেস পিরিয়ড এখনো চলছে কি না
    const isWithinGracePeriod = task.gracePeriodEndsAt && new Date() <= new Date(task.gracePeriodEndsAt);

    // চেক ২: যদি ৩ বার ইতিমধ্যে পেছানো হয়ে থাকে (rescheduleCount >= 3)
    if (task.rescheduleCount >= 3) {
      // কারণ না লিখলে ফ্রন্টএন্ডকে বলবে পপ-আপ বক্স দেখাতে
      if (!delayReason || delayReason.trim() === '') {
        return res.status(400).json({
          requireReason: true,
          message: 'তুমি কাজটি ৩ বার পিছিয়েছ। কোনো সমস্যা হচ্ছে কি? আসল কারণটা ছোট করে লেখো, যাতে আমরা সমাধান খুঁজে বের করতে পারি।'
        });
      }

      // কারণটি সেভ করা (AI Habit Tracker পরে এটি বিশ্লেষণ করবে)
      task.delayReasons.push({ reason: delayReason });

      let pointsDeducted = 0;
      let feedbackMessage = 'কারণটি লিখে রাখার জন্য ধন্যবাদ! নিজের প্যাটার্ন বোঝাটাই আসল উন্নতি। 🌱';

      // পয়েন্ট ও পেট লজিক (সিক মোড বা গ্রেস পিরিয়ডে থাকলে কোনো পয়েন্ট কাটবে না)
      if (!user.sickMode.isActive && !isWithinGracePeriod) {
        if (useLifeline && user.lifelines > 0) {
          user.lifelines -= 1;
          feedbackMessage = 'তোমার স্ট্রাইক সেভার (Lifeline) ব্যবহার করা হয়েছে! কোনো পয়েন্ট কাটা হয়নি। 🛡️';
        } else {
          pointsDeducted = 5;
          user.awarenessPoints = Math.max(0, user.awarenessPoints - pointsDeducted);
          user.companion.mood = 'sad'; // কাজ ৩ বারের বেশি পেছালে পেট মন খারাপ করবে
          feedbackMessage = 'সেলফ-অ্যাওয়ারনেস পয়েন্ট ৫ কমেছে। মন খারাপ করো না, কাজটি ছোট ভাগে ভেঙে আবার শুরু করা যাক! 🤝';
        }
      }

      if (newTimeBlock) task.timeBlock = newTimeBlock;
      if (newDate) task.scheduledDate = new Date(newDate);
      task.aiMotivationalNote = feedbackMessage;

      await task.save();
      await user.save();

      // প্রতিদিনের লগ আপডেট
      await DailyLog.findOneAndUpdate(
        { user: user._id, dateString: getTodayDateString() },
        { $inc: { tasksSnoozedCount: 1, pointsChangeToday: -pointsDeducted } },
        { upsert: true }
      );

      return res.json({
        message: feedbackMessage,
        pointsDeducted,
        currentPoints: user.awarenessPoints,
        companionMood: user.companion.mood,
        task
      });
    }

    // যদি ৩ বারের কম পেছানো হয়ে থাকে (১ম, ২য় বা ৩য় বার)
    task.rescheduleCount += 1;
    if (newTimeBlock) task.timeBlock = newTimeBlock;
    if (newDate) task.scheduledDate = new Date(newDate);

    const friendlyNotes = [
      'সময় পরিবর্তন করা হয়েছে! যখন প্রস্তুত মনে করবে তখন শুরু কোরো। 😊',
      'দ্বিতীয়বার পেছানো হলো। কাজটি কি একটু কঠিন লাগছে? চাইলে AI দিয়ে ছোট ভাগে ভেঙে নিতে পারো! 🧩',
      'এটি ৩য় বারের মতো পেছানো হলো। পরের বার পেছাতে হলে কিন্তু কারণ জানাতে হবে! 💪'
    ];
    task.aiMotivationalNote = friendlyNotes[task.rescheduleCount - 1];

    await task.save();
    res.json({
      message: task.aiMotivationalNote,
      rescheduleCount: task.rescheduleCount,
      remainingReschedules: 3 - task.rescheduleCount,
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'কাজ পেছাতে সমস্যা হয়েছে', error: error.message });
  }
};

// ৫. কাজ শেষ করা এবং স্বয়ংক্রিয় Spaced Retrieval (Interval Trigger)
exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    const user = await User.findById(req.user._id);

    if (!task) return res.status(404).json({ message: 'কাজটি পাওয়া যায়নি' });
    if (task.status === 'completed') {
      return res.status(400).json({ message: 'এই কাজটি আগেই সম্পন্ন হয়েছে!' });
    }

    task.status = 'completed';
    task.completedAt = new Date();

    // পয়েন্ট হিসাব 
    let pointsEarned = task.isDopamineStarter ? 3 : task.isGuiltFreeHobby ? 5 : 10;
    user.awarenessPoints += pointsEarned;
    user.companion.mood = 'happy';

    // প্রতিদিনের লগ আপডেট 
    const todayLog = await DailyLog.findOneAndUpdate(
      { user: user._id, dateString: getTodayDateString() },
      { $inc: { tasksCompletedCount: 1, pointsChangeToday: pointsEarned } },
      { new: true, upsert: true }
    );

    if (todayLog.tasksCompletedCount % 3 === 0 && user.companion.growthStage < 5) user.companion.growthStage += 1;
    if (todayLog.tasksCompletedCount === 5) user.lifelines += 1;

    task.aiMotivationalNote = task.isGuiltFreeHobby
      ? 'নিজের আনন্দের জন্য সময় কাটানোও জরুরি! দারুণ করেছ! 🎉'
      : 'অসাধারণ! আরেকটি কাজ ডান লিস্টে জমা হলো! 🚀';

    await task.save();
    await user.save();

    // ==========================================
    // 🧠 THE INTERVAL TRIGGER (SPACED RETRIEVAL)
    // ==========================================
    // চেক করা হচ্ছে কাজটি পড়াশোনা বা লার্নিং রিলেটেড কি না
    const studyKeywords = ['study', 'learn', 'read', 'chapter', 'math', 'physics', 'course', 'পড়া', 'শিখলাম', 'অধ্যায়', 'গণিত'];
    const titleLower = task.title.toLowerCase();
    const isStudyTask = studyKeywords.some(keyword => titleLower.includes(keyword));

    if (isStudyTask) {
      const intervals = [1, 3, 7, 14]; // ১ দিন, ৩ দিন, ৭ দিন এবং ১৪ দিন পর
      const recallTasks = intervals.map(days => {
        const recallDate = new Date();
        recallDate.setDate(recallDate.getDate() + days);
        return {
          user: user._id,
          title: `🧠 Active Recall: ${task.title}`,
          scheduledDate: recallDate,
          timeBlock: task.timeBlock,
          category: 'work',
          priorityColor: 'blue',
          estimatedMinutes: 5,
          isTwoMinuteTask: true,
          aiMotivationalNote: `Spaced Retrieval (Day ${days}). No books! Use Ghost Protocol to test your memory. 🕵️‍♂️`
        };
      });
      // ডাটাবেসে একসাথে ৪টি রিভিশন টাস্ক ইনসার্ট করা হলো
      await Task.insertMany(recallTasks);
    }

    res.json({
      message: task.aiMotivationalNote,
      triggerConfetti: true,
      pointsEarned,
      currentPoints: user.awarenessPoints,
      companion: user.companion,
      lifelines: user.lifelines,
      task,
      spacedRetrievalTriggered: isStudyTask // ফ্রন্টএন্ডকে জানিয়ে দেওয়া হলো
    });
  } catch (error) {
    res.status(500).json({ message: 'কাজ সম্পন্ন করতে সমস্যা হয়েছে', error: error.message });
  }
};