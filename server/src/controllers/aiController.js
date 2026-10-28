const Task = require('../models/Task');
const DailyLog = require('../models/DailyLog');
const { parseSmartInputOrBrainDump, generateSubtasks } = require('../services/aiService');
const { generateGhostQuestions } = require('../services/aiService');
const getTodayDateString = () => new Date().toISOString().split('T')[0];

// ১. স্মার্ট ইনপুট বা রাতের ব্রেইন ডাম্প থেকে স্বয়ংক্রিয়ভাবে টাস্ক তৈরি করা
// ১. স্মার্ট ইনপুট বা রাতের ব্রেইন ডাম্প থেকে স্বয়ংক্রিয়ভাবে টাস্ক তৈরি করা
exports.processSmartInput = async (req, res) => {
  try {
    // NEW: overrides রিসিভ করা হচ্ছে
    const { rawText, isNightBrainDump, overrides } = req.body;
    if (!rawText) return res.status(400).json({ message: 'কিছু একটা লিখে পাঠাও!' });

    const aiResult = await parseSmartInputOrBrainDump(rawText);

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

      // NEW: ইউজারের ম্যানুয়াল ইনপুটগুলো ওভাররাইড হিসেবে কাজ করবে
      let finalDate = targetDate;
      if (overrides?.manualDate) finalDate = new Date(overrides.manualDate);

      let finalTimeBlock = item.timeBlock || 'anytime';
      if (overrides?.manualTimeBlock && overrides.manualTimeBlock !== 'auto') finalTimeBlock = overrides.manualTimeBlock;

      const newTask = await Task.create({
        user: req.user._id,
        title: item.title,
        scheduledDate: finalDate,
        timeBlock: finalTimeBlock,
        exactTime: overrides?.manualExactTime || item.exactTime || null,
        category: item.category || 'work',
        priorityColor: overrides?.manualPriority || item.priorityColor || 'blue',
        estimatedMinutes: item.estimatedMinutes || 15,
        isTwoMinuteTask: isTwoMin,
        isDopamineStarter: item.isDopamineStarter || false,
        isGuiltFreeHobby: item.isGuiltFreeHobby || false,
        isBareMinimum: item.isBareMinimum || false
      });

      createdTasks.push(newTask);
    }

    const updateField = isNightBrainDump
      ? { nightBrainDump: { rawText, isProcessedByAI: true } }
      : { morningPromptInput: rawText };

    await DailyLog.findOneAndUpdate(
      { user: req.user._id, dateString: new Date().toISOString().split('T')[0] },
      updateField,
      { upsert: true }
    );

    res.status(201).json({
      message: aiResult.empatheticMessage,
      twoMinuteAlerts,
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