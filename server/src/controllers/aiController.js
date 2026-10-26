const Task = require('../models/Task');
const DailyLog = require('../models/DailyLog');
const { parseSmartInputOrBrainDump, generateSubtasks } = require('../services/aiService');
const { generateGhostQuestions } = require('../services/aiService');
const getTodayDateString = () => new Date().toISOString().split('T')[0];

// ১. স্মার্ট ইনপুট বা রাতের ব্রেইন ডাম্প থেকে স্বয়ংক্রিয়ভাবে টাস্ক তৈরি করা
exports.processSmartInput = async (req, res) => {
  try {
    const { rawText, isNightBrainDump } = req.body;
    if (!rawText) return res.status(400).json({ message: 'কিছু একটা লিখে পাঠাও!' });

    // AI দিয়ে লেখাটি বিশ্লেষণ করা
    const aiResult = await parseSmartInputOrBrainDump(rawText);

    // যদি রাতের Brain Dump হয়, তবে কাজগুলো আগামীকালের তারিখে সেট হবে
    const targetDate = new Date();
    if (isNightBrainDump) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const createdTasks = [];
    const twoMinuteAlerts = [];

    for (const item of aiResult.tasks) {
      const isTwoMin = item.estimatedMinutes && Number(item.estimatedMinutes) <= 2;
      if (isTwoMin) {
        twoMinuteAlerts.push(`"${item.title}" কাজটি করতে ২ মিনিটেরও কম লাগবে, এখনই করে ফেলবে নাকি? ⚡`);
      }

      const newTask = await Task.create({
        user: req.user._id,
        title: item.title,
        scheduledDate: targetDate,
        timeBlock: item.timeBlock || 'anytime',
        exactTime: item.exactTime || null,
        category: item.category || 'work',
        priorityColor: item.priorityColor || 'blue',
        estimatedMinutes: item.estimatedMinutes || 15,
        isTwoMinuteTask: isTwoMin,
        isDopamineStarter: item.isDopamineStarter || false,
        isGuiltFreeHobby: item.isGuiltFreeHobby || false,
        isBareMinimum: item.isBareMinimum || false
      });

      createdTasks.push(newTask);
    }

    // DailyLog-এ ব্রেইন ডাম্প বা সকালের প্রম্পট সেভ করে রাখা
    const updateField = isNightBrainDump
      ? { nightBrainDump: { rawText, isProcessedByAI: true } }
      : { morningPromptInput: rawText };

    await DailyLog.findOneAndUpdate(
      { user: req.user._id, dateString: getTodayDateString() },
      updateField,
      { upsert: true }
    );

    res.status(201).json({
      message: aiResult.empatheticMessage,
      twoMinuteAlerts, // ২ মিনিটের কাজ থাকলে পপ-আপ দেখানোর লিস্ট
      tasks: createdTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'স্মার্ট ইনপুট প্রসেস করতে সমস্যা হয়েছে', error: error.message });
  }
};

// ২. বড় কাজকে ৩-৪টি ছোট ধাপে ভেঙে দেওয়া (Task Breakdown)
exports.breakdownTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'কাজটি পাওয়া যায়নি' });

    const aiBreakdown = await generateSubtasks(task.title);

    task.subTasks = aiBreakdown.subTasks.map(st => ({
      title: st.title,
      isCompleted: false
    }));
    task.aiMotivationalNote = aiBreakdown.motivationalTip;

    await task.save();

    res.json({
      message: aiBreakdown.motivationalTip,
      subTasks: task.subTasks,
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'কাজটি ছোট ধাপে ভাঙতে সমস্যা হয়েছে', error: error.message });
  }
};

// ৩. Ghost Protocol Interrogation
exports.processGhostProtocol = async (req, res) => {
  try {
    const { learnedText } = req.body;
    if (!learnedText) return res.status(400).json({ message: 'Please provide what you learned.' });

    const aiResponse = await generateGhostQuestions(learnedText);
    
    // Optional: Save this to DailyLog if you want to track their ghost protocol answers later
    
    res.json(aiResponse);
  } catch (error) {
    res.status(500).json({ message: 'Ghost protocol processing failed', error: error.message });
  }
};