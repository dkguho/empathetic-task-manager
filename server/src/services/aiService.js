// AI-কে প্রম্পট পাঠানোর এবং JSON উত্তর পাওয়ার মূল ফাংশন
const callAI = async (systemPrompt, userPrompt) => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://empathetic-task-manager.vercel.app', // OpenRouter usually expects this
        'X-Title': 'Empathetic Task Manager'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API responded with status ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean up any Markdown markdown blocks if the AI accidentally includes them
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();

    return JSON.parse(content);
  } catch (error) {
    console.error('AI Service Error:', error.message);
    return null; // AI কাজ না করলে নিচে আমরা নিরাপদ Fallback রেখেছি
  }
};

// ১. স্মার্ট ইনপুট ও রাতের ব্রেইন ডাম্প থেকে কাজ বের করা
exports.parseSmartInputOrBrainDump = async (rawText) => {
  const systemPrompt = `
তুমি একটি এম্প্যাথেটিক টাস্ক ম্যানেজার এআই। ইউজার সাধারণ ভাষায় তার প্ল্যান বা রাতের এলোমেলো চিন্তা (Brain Dump) লিখবে। 
সেখান থেকে কাজগুলো আলাদা করে নিচের JSON ফরম্যাটে রিটার্ন করো:
{
  "tasks": [
    {
      "title": "কাজের নাম (বাংলায় বা ইউজারের ভাষায়)",
      "timeBlock": "morning" | "afternoon" | "night" | "anytime",
      "exactTime": "HH:MM" বা null,
      "category": "work" | "study" | "health" | "chores" | "entertainment" | "warmup",
      "priorityColor": "red" (জরুরি) | "blue" (সাধারণ) | "green" (ওয়ার্ম-আপ) | "purple" (বিনোদন/শখ),
      "estimatedMinutes": সংখ্যা (যেমন 2, 15, 60),
      "isDopamineStarter": true/false (খুব ছোট সহজ কাজ হলে true),
      "isGuiltFreeHobby": true/false (গান শোনা, মুভি দেখা বা শখের কাজ হলে true),
      "isBareMinimum": true/false (সবচেয়ে জরুরি কাজ যা না করলেই নয়)
    }
  ],
  "empatheticMessage": "ইউজারকে উৎসাহ দিয়ে ১ লাইনের একটি সুন্দর বাংলা মেসেজ"
}
গুরুত্বপূর্ণ নির্দেশ: শুধুমাত্র বৈধ JSON রিটার্ন করবে, অন্য কোনো টেক্সট বা মার্কডাউন নয়।`;

  const result = await callAI(systemPrompt, rawText);

  // যদি API Key না থাকে বা ইন্টারনেটে সমস্যা হয়, তবে নিজে থেকেই একটি বেসিক টাস্ক বানিয়ে দেবে
  if (!result || !result.tasks) {
    return {
      tasks: [{
        title: rawText,
        timeBlock: 'anytime',
        exactTime: null,
        category: 'work',
        priorityColor: 'blue',
        estimatedMinutes: 15,
        isDopamineStarter: false,
        isGuiltFreeHobby: false,
        isBareMinimum: true
      }],
      empatheticMessage: 'তোমার কাজটি লিস্টে যোগ করে নিয়েছি! ধীরেসুস্থে শুরু করো। 🌱'
    };
  }

  return result;
};

// ২. বড় কাজকে ৩-৪টি ছোট ও সহজ ধাপে ভেঙে দেওয়া (Task Breakdown)
exports.generateSubtasks = async (taskTitle) => {
  const systemPrompt = `
ইউজার একটি বড় বা কঠিন কাজের নাম দেবে। যাতে তার ভয় না লাগে, সেজন্য কাজটিকে ৩ থেকে ৪টি খুব ছোট এবং সহজ ধাপে ভেঙে দাও (প্রথম ধাপটি যেন ২ মিনিটে শুরু করার মতো সহজ হয়)।
JSON ফরম্যাট:
{
  "subTasks": [
    { "title": "ধাপ ১..." },
    { "title": "ধাপ ২..." },
    { "title": "ধাপ ৩..." }
  ],
  "motivationalTip": "কাজটি শুরু করার জন্য ছোট ১ লাইনের উৎসাহ"
}
গুরুত্বপূর্ণ নির্দেশ: শুধুমাত্র বৈধ JSON রিটার্ন করবে।`;

  const result = await callAI(systemPrompt, `কাজের নাম: ${taskTitle}`);
  
  if (!result || !result.subTasks) {
    return {
      subTasks: [
        { title: 'কাজের জায়গাটি গুছিয়ে বসো এবং ১ গ্লাস জল খাও' },
        { title: `"${taskTitle}"-এর প্রথম ছোট অংশটি মাত্র ৫ মিনিটের জন্য শুরু করো` },
        { title: 'বাকি অংশটুকু শেষ করে নিজেকে বাহবা দাও!' }
      ],
      motivationalTip: 'পুরো কাজটা একবারে ভাবতে হবে না, শুধু প্রথম ধাপটা শুরু করো! 💪'
    };
  }
  
  return result;
};

// ৩. এআই হ্যাবিট ট্র্যাকিং (সপ্তাহের ডেটা দেখে অলসতার প্যাটার্ন বের করা)
exports.analyzeWeeklyHabits = async (summaryData) => {
  const systemPrompt = `
তুমি একজন বন্ধুসুলভ হ্যাবিট কোচ। ইউজারের গত ৭ দিনের কাজের ডেটা দেখে কোনো বকা না দিয়ে খুব পজিটিভভাবে তাকে জানাও সে কোন সময়ের বা কোন ক্যাটাগরির কাজ বেশি পেছাচ্ছে এবং কীভাবে সেটি ঠিক করা যায়।
JSON ফরম্যাট:
{
  "mainInsight": "যেমন: তুমি বিকেলের পড়াশোনার কাজগুলো বেশি পেছাচ্ছ...",
  "actionableSuggestion": "১টি খুব সহজ পরামর্শ (যেমন: বিকেলে বড় কাজের আগে ১টি ওয়ার্ম-আপ টাস্ক রাখো)",
  "cheerleaderNote": "সপ্তাহের ভালো দিকগুলো নিয়ে উৎসাহমূলক মেসেজ"
}
গুরুত্বপূর্ণ নির্দেশ: শুধুমাত্র বৈধ JSON রিটার্ন করবে।`;

  const result = await callAI(systemPrompt, JSON.stringify(summaryData));
  
  if (!result) {
    return {
      mainInsight: 'তুমি এই সপ্তাহে বেশ কিছু কাজ চেষ্টা করেছ, তবে কিছু কাজ বারবার পেছানো হয়েছে।',
      actionableSuggestion: 'যে কাজগুলো কঠিন লাগছে সেগুলোকে AI Breakdown দিয়ে ছোট ভাগে ভেঙে নাও।',
      cheerleaderNote: 'নিজের কাজের হিসাব রাখাটাই সবচেয়ে বড় জয়! পরের সপ্তাহ আরও ভালো যাবে। 🌟'
    };
  }
  
  return result;
};

// ৪. Ghost Protocol - Dynamic Interrogation
exports.generateGhostQuestions = async (learnedText) => {
  const systemPrompt = `
You are an empathetic cognitive learning coach. The user just finished a 25-minute study session and wrote down what they remember. 
Your job is to generate exactly 3 SHORT, distinct "Elaborative Interrogation" questions based on their text to deepen their memory.

Rules for Question Generation:
- If the subject is Math/Calculus/Physics: DO NOT ask them to prove or derive the theory. Instead, ask: "What is the clue in a question that tells you to use this rule?", "What is a common mistake students make here?", or "Explain this to a beginner."
- If Coding: Ask about alternatives, edge cases, or explaining it simply.
- If Theory/History: Ask about real-world impact, or summarizing the core concept in 1 sentence.
- Ask the questions in Bengali (or the language the user wrote in).

JSON FORMAT:
{
  "encouragement": "A short 1-line praise for remembering this much!",
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}
IMPORTANT: Return ONLY valid JSON.`;

  const result = await callAI(systemPrompt, `User just learned: ${learnedText}`);
  
  if (!result || !result.questions) {
    return {
      encouragement: "দারুণ চেষ্টা করেছ! স্মৃতি ধরে রাখার জন্য এই প্রশ্নগুলোর যেকোনো ১টির উত্তর দাও:",
      questions: [
        "এই টপিকের সবচেয়ে কঠিন বা কনফিউজিং অংশ কোনটা ছিল?",
        "এটি তুমি তোমার নিজের ভাষায় একজন নতুন মানুষকে কীভাবে বোঝাবে?",
        "পরীক্ষার খাতায় এই টপিক থেকে প্রশ্ন আসলে কোন ভুলটা হওয়ার সম্ভাবনা সবচেয়ে বেশি?"
      ]
    };
  }
  
  return result;
};