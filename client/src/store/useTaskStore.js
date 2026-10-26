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

      // === NEW: Fetch from MongoDB Cloud on Login ===
      fetchTasks: async () => {
        try {
          const res = await apiClient.get('/tasks');
          if (res.data) {
            set({ tasks: res.data });
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
          brainDumpHistory: []
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
        const {
          manualTimeBlock = 'auto',
          manualExactTime = '',
          manualDate = '',
          manualPriority = 'blue',
          isBrainDump = false
        } = options;

        const lower = rawText.toLowerCase();
        const isTwoMin =
          lower.includes('water') ||
          rawText.includes('জল') ||
          lower.includes('2 min') ||
          lower.includes('call') ||
          manualPriority === 'green';

        let resolvedTimeBlock = manualTimeBlock;
        if (manualTimeBlock === 'auto') {
          if (lower.includes('morning') || rawText.includes('সকাল')) resolvedTimeBlock = 'morning';
          else if (
            lower.includes('afternoon') ||
            lower.includes('evening') ||
            rawText.includes('দুপুর') ||
            rawText.includes('বিকেল')
          )
            resolvedTimeBlock = 'afternoon';
          else if (lower.includes('night') || lower.includes('tonight') || rawText.includes('রাত'))
            resolvedTimeBlock = 'night';
          else resolvedTimeBlock = 'anytime';
        }

        const newTask = {
          _id: 't_' + Date.now() + Math.random().toString(36).slice(2, 6),
          title: rawText,
          date: manualDate || new Date().toISOString().split('T')[0],
          timeBlock: resolvedTimeBlock,
          exactTime: manualExactTime || null,
          category:
            manualPriority === 'purple'
              ? 'entertainment'
              : manualPriority === 'green'
              ? 'warmup'
              : 'work',
          priorityColor: manualPriority,
          estimatedMinutes: isTwoMin ? 2 : 25,
          isDopamineStarter: manualPriority === 'green',
          isGuiltFreeHobby: manualPriority === 'purple',
          isBareMinimum: manualPriority === 'red' || manualPriority === 'green',
          isTwoMinuteTask: isTwoMin,
          status: 'pending',
          rescheduleCount: 0,
          subTasks: [],
          aiMotivationalNote: isBrainDump
            ? 'Organized from your Brain Dump! 🌙'
            : manualExactTime
            ? `Scheduled for ${manualExactTime} (+30m Grace Period included)`
            : 'Complete this to earn Care Points for Mochi & your Tree! ✨'
        };

        set((state) => ({
          tasks: [newTask, ...state.tasks],
          twoMinutePopupTask: isTwoMin && !isBrainDump ? newTask : null,
          companion: {
            ...state.companion,
            message: isTwoMin
              ? '2-Minute Rule! Knock this out right now for instant Care Points! ⚡'
              : 'New task added! Mochi is cheering you on. 🐾'
          }
        }));

        try {
          await apiClient.post('/tasks', newTask);
        } catch (e) {}
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

      triggerReschedule: (taskId) => {
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

      closeModals: () => set({ twoMinutePopupTask: null, delayReasonModalTask: null })
    }),
    {
      name: 'kushal-sanctuary-v2-storage',
      storage: createJSONStorage(() => idbStorage)
    }
  )
);