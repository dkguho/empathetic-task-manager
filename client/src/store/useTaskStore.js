import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';
import { apiClient } from '@/lib/apiClient';

const idbStorage = {
  getItem: async (name) => {
    const value = await get(name);
    return value !== undefined ? value : null;
  },
  setItem: async (name, value) => await idbSet(name, value),
  removeItem: async (name) => await del(name),
};

const defaultCompanionState = {
  activeMode: 'both',
  mood: 'happy',
  growthStage: 2,
  treeHydration: 72,
  treeSunlight: 80,
  catHunger: 68,
  catAffection: 75,
  totalNurtures: 3,
  lastActionEffect: null,
  message: 'Mochi the Cat is purring under the Sakura Bonsai! Complete tasks to earn points & care for them. 🌸🐾'
};

const initialDemoTasks = [
  {
    _id: 't1',
    title: 'Drink a big glass of water 💧',
    date: null,
    timeBlock: 'morning',
    exactTime: null,
    category: 'warmup',
    priorityColor: 'green',
    estimatedMinutes: 2,
    isDopamineStarter: true,
    isGuiltFreeHobby: false,
    isBareMinimum: true,
    isTwoMinuteTask: true,
    status: 'pending',
    rescheduleCount: 0,
    subTasks: [],
    aiMotivationalNote: 'Fun Starter! Complete this to earn +10 Care Points for your Cat & Tree.'
  }
];

export const useTaskStore = create(
  persist(
    (set, get) => ({
      awarenessPoints: 65,
      lifelines: 2,
      energyLevel: 'medium',
      sickMode: false,
      companion: defaultCompanionState,
      tasks: initialDemoTasks,
      doneList: [],
      brainDumpHistory: [],
      twoMinutePopupTask: null,
      delayReasonModalTask: null,
      analyticsData: null, // NEW: Holds backend stats

      fetchAnalytics: async () => {
        try {
          const res = await apiClient.get('/ai/weekly-dashboard');
          if (res.data) set({ analyticsData: res.data });
        } catch (error) {
          console.error('Failed to fetch analytics:', error);
        }
      },

      // === NEW: Fetch from MongoDB Cloud on Login ===
      fetchTasks: async () => {
        try {
          const res = await apiClient.get('/tasks');
          if (res.data) {
            const pendingTasks = res.data.filter(t => t.status !== 'completed');
            // ডান-লিস্ট যেন অতিরিক্ত বড় হয়ে ড্যাশবোর্ড স্লো না করে, তাই শেষের ২০টি কাজ রাখা হলো
            const completedTasks = res.data
              .filter(t => t.status === 'completed')
              .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
              .slice(0, 20); 
            
            set({ 
              tasks: pendingTasks, 
              doneList: completedTasks 
            });
          }
        } catch (error) {
          console.error('Failed to sync tasks from cloud:', error);
        }
      },

      // === NEW: Clear Local Data on Logout ===
      clearStore: () => {
        set({
          awarenessPoints: 65,
          lifelines: 2,
          energyLevel: 'medium',
          sickMode: false,
          companion: defaultCompanionState,
          tasks: [],
          doneList: [],
          brainDumpHistory: [],
          analyticsData: null,
          ghostQuestionsData: null,
      isGhostLoading: false,
        });
      },

      setCompanionViewMode: (mode) =>
        set((state) => ({
          companion: { ...state.companion, activeMode: mode }
        })),

      nurtureCompanion: (actionType) =>
        set((state) => {
          const costs = { water: 10, sun: 10, feed: 15, play: 10 };
          const cost = costs[actionType] || 10;

          if (state.awarenessPoints < cost) {
            return {
              companion: {
                ...state.companion,
                message: `Not enough Care Points! Complete a task first to earn ${cost} pts. 🌱`
              }
            };
          }

          let { treeHydration, treeSunlight, catHunger, catAffection, totalNurtures, growthStage } = state.companion;
          let msg = '';

          if (actionType === 'water') {
            treeHydration = Math.min(100, treeHydration + 25);
            msg = '💧 You watered the Bonsai! Its leaves are dewy and vibrant.';
          } else if (actionType === 'sun') {
            treeSunlight = Math.min(100, treeSunlight + 25);
            msg = '☀️ Warm sunlight bathed the branches! New pink blossoms are opening.';
          } else if (actionType === 'feed') {
            catHunger = Math.min(100, catHunger + 30);
            catAffection = Math.min(100, catAffection + 10);
            msg = '🐟 Mochi happily munched the salmon treat and is purring loudly!';
          } else if (actionType === 'play') {
            catAffection = Math.min(100, catAffection + 28);
            msg = '🧶 You cuddled and played with Mochi! Look at that happy tail wag!';
          }

          const nextNurtures = totalNurtures + 1;
          const nextStage = Math.min(5, 1 + Math.floor(nextNurtures / 2));
          const avgHealth = (treeHydration + treeSunlight + catHunger + catAffection) / 4;
          const nextMood = state.sickMode
            ? 'sleeping'
            : avgHealth >= 80
            ? 'thriving'
            : avgHealth >= 50
            ? 'happy'
            : 'wilting';

          return {
            awarenessPoints: state.awarenessPoints - cost,
            companion: {
              ...state.companion,
              treeHydration,
              treeSunlight,
              catHunger,
              catAffection,
              totalNurtures: nextNurtures,
              growthStage: nextStage,
              mood: nextMood,
              lastActionEffect: actionType,
              message: msg
            }
          };
        }),

      clearCompanionEffect: () =>
        set((state) => ({
          companion: { ...state.companion, lastActionEffect: null }
        })),

      setEnergyLevel: async (level) => {
        set((state) => ({
          energyLevel: level,
          companion: {
            ...state.companion,
            message:
              level === 'low'
                ? 'Low energy? Mochi curled up quietly beside you. Do just 1 gentle task today! 🐾'
                : 'Great energy! Let’s complete tasks and help the Sakura Tree bloom! 🌸'
          }
        }));
        try {
          await apiClient.post('/users/energy-checkin', { energyLevel: level });
        } catch (e) {}
      },

      toggleSickMode: async () => {
        const nextSick = !get().sickMode;
        set((state) => ({
          sickMode: nextSick,
          companion: {
            ...state.companion,
            mood: nextSick ? 'sleeping' : 'happy',
            message: nextSick
              ? 'Sick Mode ON 🛡️: Mochi & your Tree are resting peacefully with you. Health never drops in Sick Mode!'
              : 'Welcome back! Mochi missed you—start slow whenever you feel ready. 🌸'
          }
        }));
        try {
          await apiClient.patch('/users/sick-mode', { isActive: nextSick });
        } catch (e) {}
      },

      addSmartTask: async (rawText, options = {}) => {
        if (!rawText.trim()) return;
        
        // UI Loading State
        set((state) => ({ 
          companion: { ...state.companion, message: 'AI is thinking... adding your task! 🤖✨' } 
        }));
        
        try {
          // রিয়েল এআই এবং ব্যাকএন্ডে ম্যানুয়াল ডেট/টাইম (overrides) পাঠানো হচ্ছে
          const res = await apiClient.post('/ai/smart-input', { 
            rawText, 
            isNightBrainDump: false,
            overrides: options 
          });
          
          set((state) => ({
            tasks: [...res.data.tasks, ...state.tasks],
            companion: { ...state.companion, message: res.data.message || 'Task added!' },
            twoMinutePopupTask: res.data.twoMinuteAlerts && res.data.twoMinuteAlerts.length > 0 ? res.data.tasks[0] : null
          }));
        } catch (error) {
          console.error("AI Smart Input failed:", error);
          set((state) => ({ 
            companion: { ...state.companion, message: 'Failed to connect to AI. Please try again! 💤' } 
          }));
        }
      },

      processBrainDumpToTasks: async (dumpText) => {
        if (!dumpText.trim()) return;
        const lines = dumpText
          .split(/\n|,|\.| এবং | and /i)
          .map((s) => s.trim())
          .filter((s) => s.length > 2);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const created = lines.map((line) => {
          const lower = line.toLowerCase();
          const timeBlock =
            lower.includes('morning') || line.includes('সকাল')
              ? 'morning'
              : lower.includes('afternoon') || line.includes('বিকেল')
              ? 'afternoon'
              : lower.includes('night') || line.includes('রাত')
              ? 'night'
              : 'anytime';

          const priorityColor =
            lower.includes('urgent') || line.includes('জরুরি')
              ? 'red'
              : lower.includes('game') || lower.includes('movie') || line.includes('গান')
              ? 'purple'
              : 'blue';

          return {
            _id: 'bd_' + Date.now() + Math.random().toString(36).slice(2, 6),
            title: line,
            date: tomorrowStr,
            timeBlock,
            exactTime: null,
            category: 'work',
            priorityColor,
            estimatedMinutes: 20,
            isDopamineStarter: false,
            isGuiltFreeHobby: priorityColor === 'purple',
            isBareMinimum: priorityColor === 'red',
            isTwoMinuteTask: false,
            status: 'pending',
            rescheduleCount: 0,
            subTasks: [],
            aiMotivationalNote: 'Extracted from your Night Brain Dump 🧠'
          };
        });

        set((state) => ({
          tasks: [...created, ...state.tasks],
          brainDumpHistory: [
            { id: Date.now(), text: dumpText, count: created.length, date: new Date().toLocaleTimeString() },
            ...state.brainDumpHistory
          ],
          companion: {
            ...state.companion,
            message: `Organized ${created.length} thoughts into tomorrow's plan! Rest easy tonight. 🌙`
          }
        }));
      },

      completeTask: async (taskId) => {
        const task = get().tasks.find((t) => t._id === taskId);
        if (!task) return;

        const pts = task.isDopamineStarter ? 10 : task.isGuiltFreeHobby ? 12 : 20;
        const completed = { ...task, status: 'completed', completedAt: new Date().toLocaleTimeString() };

        set((state) => ({
          tasks: state.tasks.filter((t) => t._id !== taskId),
          doneList: [completed, ...state.doneList],
          awarenessPoints: state.awarenessPoints + pts,
          twoMinutePopupTask: null,
          companion: {
            ...state.companion,
            mood: 'thriving',
            lastActionEffect: 'celebrate',
            message: `Yay! You earned +${pts} Care Points! Use them below to feed Mochi or water your Tree! 🎉`
          }
        }));

        try {
          await apiClient.patch(`/tasks/${taskId}/complete`);
          get().fetchAnalytics(); // NEW: কাজ শেষ হলেই ব্যাকএন্ড থেকে অ্যানালিটিক্স আপডেট হবে!
        } catch (e) {}
      },

      deleteTask: async (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t._id !== taskId),
          companion: {
            ...state.companion,
            message: 'Task removed. Keeping your sanctuary clean and tidy! 🧹'
          }
        }));

        try {
          await apiClient.delete(`/tasks/${taskId}`);
        } catch (e) {
          console.error('Failed to sync deletion with backend:', e);
        }
      },

      snoozeTask15Min: async (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === taskId
              ? { ...t, status: 'snoozed', aiMotivationalNote: 'Snoozed for 15m ☕ Take a breather, no points lost!' }
              : t
          ),
          companion: {
            ...state.companion,
            message: 'Taking a 15-minute breather? Mochi is stretching with you! ☕🐾'
          }
        }));
      },

      triggerReschedule: async (taskId) => {
        const task = get().tasks.find((t) => t._id === taskId);
        if (!task) return;
        if (task.rescheduleCount >= 3) {
          set({ delayReasonModalTask: task });
          return;
        }
        const nextCount = task.rescheduleCount + 1;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === taskId
              ? {
                  ...t,
                  rescheduleCount: nextCount,
                  aiMotivationalNote: `Rescheduled (${nextCount}/3). Click the AI Robot button to break it into tiny steps!`
                }
              : t
          )
        }));

        try {
          await apiClient.patch(`/tasks/${taskId}/reschedule`, {});
          get().fetchAnalytics(); // NEW: ডেটাবেসে সিঙ্ক এবং অ্যানালিটিক্স আপডেট
        } catch (e) {}
      },

      submitDelayReason: async (taskId, reason, useLifeline) => {
        set((state) => {
          let nextLife = state.lifelines;
          let { treeHydration, catHunger } = state.companion;
          let msg = '';

          if (state.sickMode) {
            msg = 'Sick Mode is active—your Tree & Cat are protected! 🛌';
          } else if (useLifeline && state.lifelines > 0) {
            nextLife -= 1;
            msg = 'Streak Saver 💖 protected your sanctuary from wilting!';
          } else {
            treeHydration = Math.max(20, treeHydration - 15);
            catHunger = Math.max(20, catHunger - 15);
            msg = 'Your Tree looks a bit thirsty & Mochi is hungry. Complete a tiny warm-up task to care for them! 🌱';
          }

          return {
            lifelines: nextLife,
            delayReasonModalTask: null,
            tasks: state.tasks.map((t) =>
              t._id === taskId ? { ...t, aiMotivationalNote: `Delay Reason: "${reason}"` } : t
            ),
            companion: {
              ...state.companion,
              treeHydration,
              catHunger,
              mood: treeHydration < 40 ? 'wilting' : 'happy',
              message: msg
            }
          };
        });

        try {
          await apiClient.patch(`/tasks/${taskId}/reschedule`, { delayReason: reason, useLifeline });
          get().fetchAnalytics(); // NEW: কারণ সেভ হওয়ার সাথে সাথে অ্যানালিটিক্স আপডেট
        } catch (e) {}
      },

      breakdownTaskWithAI: async (taskId) => {
        const task = get().tasks.find((t) => t._id === taskId);
        if (!task) return;

        // UI-তে লোডিং স্টেটের জন্য সাময়িক মেসেজ
        set((state) => ({
          companion: { ...state.companion, message: 'AI is thinking... breaking it down for you! 🤖✨' }
        }));

        try {
          const res = await apiClient.post(`/ai/breakdown/${taskId}`);
          
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t._id === taskId
                ? {
                    ...t,
                    subTasks: res.data.subTasks,
                    aiMotivationalNote: res.data.message
                  }
                : t
            ),
            companion: {
              ...state.companion,
              message: 'Bite-sized steps make everything easier! You got this. 🐾'
            }
          }));
        } catch (error) {
          console.error("AI Breakdown failed:", error);
          set((state) => ({
            companion: { ...state.companion, message: 'Oops, AI is sleepy right now. Try again later! 💤' }
          }));
        }
      },

      toggleSubTask: (taskId, idx) =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t._id !== taskId) return t;
            const subs = [...t.subTasks];
            subs[idx] = { ...subs[idx], isCompleted: !subs[idx].isCompleted };
            return { ...t, subTasks: subs };
          })
        })),

        fetchGhostQuestions: async (learnedText) => {
        if (!learnedText.trim()) return;
        set({ isGhostLoading: true, ghostQuestionsData: null });
        try {
          const res = await apiClient.post('/ai/ghost-protocol', { learnedText });
          set({ ghostQuestionsData: res.data, isGhostLoading: false });
        } catch (error) {
          console.error("Ghost Protocol failed:", error);
          set({ isGhostLoading: false });
        }
      },

      completeGhostProtocol: () => {
        // Award massive points for doing the hard cognitive work
        set((state) => ({
          awarenessPoints: state.awarenessPoints + 50,
          ghostQuestionsData: null,
          companion: {
            ...state.companion,
            mood: 'thriving',
            message: 'Deep Memory Unlocked! 🧠 You earned +50 Care Points for active retrieval!'
          }
        }));
      },

      // === NEW: Ghost Protocol-এর আগের ডেটা মুছে ফেলার ফাংশন ===
      clearGhostData: () => set({ ghostQuestionsData: null }),

      closeModals: () => set({ twoMinutePopupTask: null, delayReasonModalTask: null })
    }),
    {
      name: 'kushal-sanctuary-v2-storage',
      storage: createJSONStorage(() => idbStorage)
    }
  )
);