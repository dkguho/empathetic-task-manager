'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Brain, BatteryWarning, BatteryCharging, BatteryFull,
  Clock, CheckCircle2, Bot, Play, Pause, RotateCcw,
  Plus, Sun, CloudSun, Moon, Infinity as AnyTimeIcon, BarChart3, Zap,
  Droplets, Heart, Fish, Trash2, Bell, BellRing, Volume2, LogOut
} from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import SpiritCompanion3D from '@/components/companion/SpiritCompanion3D';

export default function EmpatheticDashboard() {
  const router = useRouter();
  const { user, initAuth, logout } = useAuthStore();
  const {
    awarenessPoints, lifelines, energyLevel, sickMode, companion,
    tasks, doneList, twoMinutePopupTask, delayReasonModalTask,
    setEnergyLevel, toggleSickMode, setCompanionViewMode, nurtureCompanion,
    clearCompanionEffect, addSmartTask, processBrainDumpToTasks, completeTask,
    deleteTask, snoozeTask15Min, triggerReschedule, submitDelayReason, breakdownTaskWithAI,
    toggleSubTask, closeModals, fetchTasks, clearStore, fetchGhostQuestions, ghostQuestionsData, isGhostLoading, completeGhostProtocol
  } = useTaskStore();

  const [activeTab, setActiveTab] = useState('tasks');
  const [dateFilter, setDateFilter] = useState('today');
const [todayStr, setTodayStr] = useState('');
  const [smartInput, setSmartInput] = useState('');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('auto');
  const [exactTimeInput, setExactTimeInput] = useState('');
  const [selectedDateInput, setSelectedDateInput] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('blue');
  const [brainDumpText, setBrainDumpText] = useState('');
  const [delayReasonText, setDelayReasonText] = useState('');
  const [useLifelineCheck, setUseLifelineCheck] = useState(false);

  const [notifPermission, setNotifPermission] = useState('default');
  const [activeAlarmTask, setActiveAlarmTask] = useState(null);
  const triggeredAlarmsRef = useRef(new Set());

  const [showGhostModal, setShowGhostModal] = useState(false);
  const [ghostInputText, setGhostInputText] = useState('');
  const [ghostAnswerText, setGhostAnswerText] = useState('');

  const totalTime = 25 * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isRunning, setIsRunning] = useState(false);
  const circumference = 2 * Math.PI * 80;

  useEffect(() => {
    if (initAuth) initAuth();
    fetchTasks(); // <--- লগইন করলেই ক্লাউড থেকে সব টাস্ক টেনে আনবে
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, [initAuth, fetchTasks]);

  // NEW: অটোমেটিকভাবে আজকের ডেট এবং কারেন্ট টাইম সেট করা
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    setTodayStr(dateStr);
    setSelectedDateInput(dateStr);
    setExactTimeInput(`${hours}:${minutes}`);
  }, []);

  const playAlarmSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.18);
        osc.stop(ctx.currentTime + idx * 0.18 + 0.6);
      });
    } catch (e) {
      console.error('Audio playback blocked until user interacts:', e);
    }
  };

  const requestNotificationAccess = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Your browser does not support desktop notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      playAlarmSound();
      new Notification('🌱 Empathetic Space Ready!', {
        body: 'Alarms and gentle task reminders are now active!'
      });
    }
  };

  useEffect(() => {
    const checkTaskAlarms = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      tasks.forEach((task) => {
        if (!task.exactTime) return;
        const dateMatches = !task.date || task.date === todayStr;
        const alarmKey = `${task._id}-${task.date || todayStr}-${task.exactTime}`;

        if (dateMatches && task.exactTime === currentTimeStr && !triggeredAlarmsRef.current.has(alarmKey)) {
          triggeredAlarmsRef.current.add(alarmKey);
          setActiveAlarmTask(task);
          playAlarmSound();

          if (notifPermission === 'granted') {
            new Notification(`⏰ Time for: ${task.title}`, {
              body: task.aiMotivationalNote || 'Take a gentle breath and start when ready! 🌱'
            });
          }
        }
      });
    };

    const alarmInterval = setInterval(checkTaskAlarms, 10000);
    checkTaskAlarms();
    return () => clearInterval(alarmInterval);
  }, [tasks, notifPermission]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      playAlarmSound();
      firePremiumConfetti();
      setShowGhostModal(true);
      if (notifPermission === 'granted') {
        new Notification('🎉 Focus Session Complete!', {
          body: 'Awesome job! Take a short break and hydrate.'
        });
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, notifPermission]);

  const firePremiumConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.65 },
      colors: ['#a18cd1', '#fbc2eb', '#34d399', '#fcb69f']
    });
  };

  const handleNurture = (type) => {
    nurtureCompanion(type);
    setTimeout(() => clearCompanionEffect(), 2200);
  };

  const handleComplete = (id) => {
    firePremiumConfetti();
    completeTask(id);
    if (activeAlarmTask && activeAlarmTask._id === id) {
      setActiveAlarmTask(null);
    }
    setTimeout(() => clearCompanionEffect(), 2500);
  };

  const handleDelete = (id) => {
    if (deleteTask) {
      deleteTask(id);
    }
  };

  const handleLogout = () => {
    clearStore(); // <--- ইউজারের পার্সোনাল ডেটা লোকাল ব্রাউজার থেকে মুছে ফেলবে
    if (logout) logout();
    router.push('/auth');
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!smartInput.trim()) return;
    addSmartTask(smartInput, {
      manualTimeBlock: selectedTimeOfDay,
      manualExactTime: exactTimeInput,
      manualDate: selectedDateInput,
      manualPriority: selectedPriority,
      isBrainDump: false
    });
    setSmartInput('');
    setExactTimeInput('');
    setSelectedDateInput('');
  };

  const handleBrainDumpSubmit = () => {
    if (!brainDumpText.trim()) return;
    processBrainDumpToTasks(brainDumpText);
    setBrainDumpText('');
    setActiveTab('tasks');
  };

  const visibleTasks = tasks.filter((t) => {
    if (!todayStr) return false;

    // NEW: ডেটাবেস থেকে আসা scheduledDate ঠিকভাবে রিড করা
    const rawDate = t.scheduledDate || t.date;
    const taskDate = rawDate ? new Date(rawDate).toISOString().split('T')[0] : todayStr;

    if (dateFilter === 'today' && taskDate !== todayStr) return false;
    if (dateFilter === 'upcoming' && taskDate <= todayStr) return false;

    if (energyLevel === 'low') {
      return t.isBareMinimum || t.isDopamineStarter || t.isGuiltFreeHobby || t.priorityColor === 'red';
    }
    return true;
  });

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const strokeOffset = circumference - (timeLeft / totalTime) * circumference;

  const timeGroups = [
    { key: 'morning', title: 'Morning', icon: <Sun className="w-5 h-5 text-sky-500" />, color: 'text-sky-600' },
    { key: 'afternoon', title: 'Afternoon', icon: <CloudSun className="w-5 h-5 text-amber-500" />, color: 'text-amber-600' },
    { key: 'night', title: 'Night', icon: <Moon className="w-5 h-5 text-indigo-500" />, color: 'text-indigo-600' },
    { key: 'anytime', title: 'Anytime (Flexible)', icon: <AnyTimeIcon className="w-5 h-5 text-purple-500" />, color: 'text-purple-600' }
  ];

  const renderPriorityBadge = (task) => {
    if (task.priorityColor === 'red') return <span className="tag-urgent px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">🚨 Urgent</span>;
    if (task.priorityColor === 'green' || task.isDopamineStarter) return <span className="tag-dopamine px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">🎮 Fun Starter</span>;
    if (task.priorityColor === 'purple' || task.isGuiltFreeHobby) return <span className="tag-guilt-free px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">🍿 Guilt-Free Time</span>;
    return <span className="tag-normal px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">✨ Normal</span>;
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="mesh-bg" />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 pt-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-box p-6 sm:p-7 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <div className="flex items-center gap-4 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e1e2d] m-0">
                স্বাগতম, {user?.name || 'গেস্ট'}! 👋
              </h1>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                title="Logout Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[#646477] font-medium text-sm sm:text-base">
              {energyLevel === 'low'
                ? 'Low energy mode active — focusing only on gentle & bare minimum steps 🌱'
                : 'Complete tasks to earn Care Points and keep Mochi & your Sakura Tree thriving!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={requestNotificationAccess}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all shadow-sm ${
                notifPermission === 'granted'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              {notifPermission === 'granted' ? (
                <><BellRing className="w-4 h-4 text-emerald-600" /><span>Alarms Active 🔔</span></>
              ) : (
                <><Bell className="w-4 h-4 text-amber-600 animate-bounce" /><span>Enable Alarms</span></>
              )}
            </button>

            <div className="flex items-center gap-2 bg-white/60 p-1.5 rounded-full border border-white shadow-sm">
              <span className="pl-3 pr-1 text-xs font-bold text-[#646477]">Energy:</span>
              <button onClick={() => setEnergyLevel('low')} className={`btn-glass-pill px-3.5 py-2 text-xs flex items-center gap-1.5 ${energyLevel === 'low' ? 'active' : ''}`}><BatteryWarning className="w-4 h-4" /> Low</button>
              <button onClick={() => setEnergyLevel('medium')} className={`btn-glass-pill px-3.5 py-2 text-xs flex items-center gap-1.5 ${energyLevel === 'medium' ? 'active' : ''}`}><BatteryCharging className="w-4 h-4" /> Okay</button>
              <button onClick={() => setEnergyLevel('high')} className={`btn-glass-pill px-3.5 py-2 text-xs flex items-center gap-1.5 ${energyLevel === 'high' ? 'active' : ''}`}><BatteryFull className="w-4 h-4" /> Super</button>
            </div>

            <Link href="/analytics" className="btn-premium px-5 py-2.5 text-xs flex items-center gap-2 shadow-sm">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Link>
          </div>
        </motion.div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="inline-flex bg-white/60 p-1.5 rounded-full border border-white shadow-sm">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'tasks' ? 'bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] text-white shadow-md' : 'text-[#646477] hover:text-[#1e1e2d]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>📋 Plan ({visibleTasks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('brain-dump')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'brain-dump' ? 'bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] text-white shadow-md' : 'text-[#646477] hover:text-[#1e1e2d]'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>🧠 Brain Dump</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/80 border border-white rounded-full px-4 py-2 text-xs font-extrabold text-purple-700 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Care Points: {awarenessPoints} ✨</span>
            </div>
            <div className="bg-white/75 border border-white rounded-full px-4 py-2 text-xs font-bold text-[#1e1e2d] flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>Streak Saver 💖 ({lifelines})</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'tasks' ? (
                <motion.div
                  key="tasks-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="bento-box p-5 sm:p-6 space-y-4">
                    <form onSubmit={handleAddTask} className="flex items-center bg-white/80 border border-white rounded-full p-2 pl-5 shadow-inner focus-within:ring-2 focus-within:ring-purple-300 transition-all">
                      <Sparkles className="w-6 h-6 text-[#a18cd1] mr-3 shrink-0" />
                      <input
                        type="text"
                        value={smartInput}
                        onChange={(e) => setSmartInput(e.target.value)}
                        placeholder={energyLevel === 'low' ? 'Take it easy. Type a small task...' : 'Type what you want to do...'}
                        className="w-full bg-transparent border-none outline-none text-[#1e1e2d] placeholder:text-slate-400 font-medium text-base"
                      />
                      <button type="submit" className="btn-premium px-6 py-3 text-sm shrink-0 flex items-center gap-2">
                        <span>Add</span><Plus className="w-4 h-4" />
                      </button>
                    </form>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1 px-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[#646477] mr-1">⏰ When:</span>
                        <input
                          type="date"
                          value={selectedDateInput}
                          onChange={(e) => setSelectedDateInput(e.target.value)}
                          className="px-2.5 py-1.5 rounded-full bg-white/80 border border-purple-200 text-[#1e1e2d] font-semibold outline-none"
                        />
                        <input
                          type="time"
                          value={exactTimeInput}
                          onChange={(e) => setExactTimeInput(e.target.value)}
                          className="px-2.5 py-1.5 rounded-full bg-white/80 border border-purple-200 text-[#1e1e2d] font-semibold outline-none"
                        />
                        {[{ id: 'auto', label: '✨ AI' }, { id: 'morning', label: '🌅 AM' }, { id: 'afternoon', label: '☀️ Noon' }, { id: 'night', label: '🌙 PM' }, { id: 'anytime', label: '⏳ Any' }].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTimeOfDay(t.id)}
                            className={`px-3 py-1.5 rounded-full font-semibold transition-all ${selectedTimeOfDay === t.id ? 'bg-[#a18cd1] text-white shadow-sm' : 'bg-white/60 text-[#646477] hover:bg-white'}`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[#646477] mr-1">🎯 Priority:</span>
                        {[{ id: 'blue', label: 'Normal', cls: 'bg-sky-100 text-sky-800 border-sky-300' }, { id: 'red', label: '🚨 Urgent', cls: 'bg-rose-100 text-rose-800 border-rose-300' }, { id: 'green', label: '🎮 Warm-up', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' }, { id: 'purple', label: '🍿 Guilt-Free', cls: 'bg-orange-100 text-orange-800 border-orange-300' }].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPriority(p.id)}
                            className={`px-3 py-1.5 rounded-full font-bold border transition-all ${selectedPriority === p.id ? `${p.cls} ring-2 ring-offset-1 ring-purple-400 scale-105` : 'bg-white/50 text-[#646477] border-transparent hover:bg-white'}`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bento-box p-6 sm:p-7 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-extrabold text-[#1e1e2d]">Your Plan</h3>
                        <span className="text-xs font-semibold text-[#646477]">
                          Earn +10 to +20 Care Points per task 🌸🐾
                        </span>
                      </div>
                      
                      <div className="flex bg-slate-100/80 p-1.5 rounded-full text-[11px] font-bold border border-slate-200/50 shadow-inner w-full lg:w-auto overflow-x-auto">
                        {[
                          { id: 'today', label: '📅 Today' },
                          { id: 'upcoming', label: '🚀 Upcoming' },
                          { id: 'all', label: '📂 All' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setDateFilter(tab.id)}
                            className={`flex-1 lg:flex-none px-4 py-1.5 rounded-full transition-all whitespace-nowrap ${
                              dateFilter === tab.id
                                ? 'bg-white shadow-sm text-purple-700'
                                : 'text-[#646477] hover:text-[#1e1e2d]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {visibleTasks.length === 0 && (
                      <div className="text-center py-8 bg-white/40 rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500 font-bold text-sm">No tasks here! Enjoy your free time. 🌱</p>
                      </div>
                    )}

                    {timeGroups.map((group) => {
                      const groupTasks = visibleTasks.filter((t) => t.timeBlock === group.key);
                      if (groupTasks.length === 0) return null;

                      return (
                        <div key={group.key} className="space-y-3">
                          <div className={`flex items-center gap-2 font-bold text-base ${group.color}`}>
                            {group.icon}
                            <span>{group.title}</span>
                          </div>

                          <div className="space-y-3">
                            {groupTasks.map((task) => (
                              <motion.div key={task._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="bg-white/65 hover:bg-white/95 border border-white rounded-2xl p-4 transition-all shadow-sm group">
                                <div className="flex items-center gap-4">
                                  <button onClick={() => handleComplete(task._id)} className="w-7 h-7 rounded-full border-2 border-slate-300 hover:border-purple-400 bg-white flex items-center justify-center transition-all hover:scale-110 shrink-0"><CheckCircle2 className="w-4 h-4 text-purple-500 opacity-0 hover:opacity-100" /></button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <p className="font-bold text-base text-[#1e1e2d] m-0">{task.title}</p>
                                      {renderPriorityBadge(task)}
                                      {task.date && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700">📅 {task.date}</span>}
                                      {task.exactTime && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">⏰ {task.exactTime}</span>}
                                      <span className="text-[11px] font-bold text-slate-400">• Reschedules: {task.rescheduleCount}/3</span>
                                    </div>
                                    <p className="text-xs text-[#646477] m-0">{task.aiMotivationalNote}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => snoozeTask15Min(task._id)} className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-white flex items-center justify-center text-[#646477] hover:text-[#1e1e2d] shadow-sm"><Clock className="w-4 h-4" /></button>
                                    <button onClick={() => breakdownTaskWithAI(task._id)} className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-white flex items-center justify-center text-[#a18cd1] shadow-sm hover:scale-105"><Bot className="w-4 h-4" /></button>
                                    <button onClick={() => triggerReschedule(task._id)} className="px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-white text-xs font-bold text-[#646477] shadow-sm">Delay ({3 - task.rescheduleCount})</button>
                                    <button onClick={() => handleDelete(task._id)} className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-500 hover:text-rose-700 shadow-sm transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </div>
                                {task.subTasks && task.subTasks.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-purple-100 pl-11 space-y-1.5">
                                    {task.subTasks.map((st, i) => (
                                      <label key={i} onClick={() => toggleSubTask(task._id, i)} className="flex items-center gap-2 text-xs font-medium text-[#1e1e2d] cursor-pointer">
                                        <input type="checkbox" checked={st.isCompleted} onChange={() => {}} className="accent-purple-500 rounded" />
                                        <span className={st.isCompleted ? 'line-through text-slate-400' : ''}>{st.title}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {doneList.length > 0 && (
                      <div className="pt-4 border-t border-white/80 space-y-2">
                        <h4 className="text-sm font-extrabold text-emerald-700">🎉 Done List ({doneList.length} Celebrated!)</h4>
                        <div className="space-y-2">
                          {doneList.slice(0, 4).map((item) => (
                            <div key={item._id} className="bg-white/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs opacity-75">
                              <span className="line-through font-semibold text-[#1e1e2d]">{item.title}</span>
                              <span className="font-bold text-emerald-700">{item.completedAt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="brain-dump-tab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bento-box p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1e1e2d] flex items-center gap-2"><Brain className="w-7 h-7 text-[#fcb69f]" /><span>Nighttime Brain Dump Studio 🌙</span></h2>
                    <p className="text-sm text-[#646477] mt-1">Write down racing thoughts. AI will organize them into tomorrow&apos;s plan.</p>
                  </div>
                  <textarea rows={7} value={brainDumpText} onChange={(e) => setBrainDumpText(e.target.value)} placeholder="Thoughts here..." className="w-full bg-white/70 focus:bg-white border border-white rounded-3xl p-5 text-base text-[#1e1e2d] outline-none shadow-inner transition-all" />
                  <div className="flex justify-end">
                    <button onClick={handleBrainDumpSubmit} className="btn-premium px-7 py-3.5 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /><span>Organize with AI</span></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bento-box p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div><h4 className="text-base font-extrabold text-[#1e1e2d] m-0">🌸 Sanctuary</h4><p className="text-[11px] font-semibold text-[#646477] m-0">Spend points to nurture Mochi & Bonsai</p></div>
                <div className="flex bg-white/70 p-1 rounded-full border border-white text-[11px] font-bold">
                  {[{ id: 'both', label: 'Both' }, { id: 'cat', label: '🐱 Cat' }, { id: 'tree', label: '🌳 Tree' }].map((m) => (
                    <button key={m.id} onClick={() => setCompanionViewMode(m.id)} className={`px-2.5 py-1 rounded-full transition-all ${companion.activeMode === m.id ? 'bg-[#a18cd1] text-white shadow-xs' : 'text-[#646477]'}`}>{m.label}</button>
                  ))}
                </div>
              </div>

              <SpiritCompanion3D companion={companion} />
              <motion.div key={companion.message} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 border border-white rounded-2xl p-3 text-xs font-semibold text-[#1e1e2d] text-center shadow-xs">{companion.message}</motion.div>

              <div className="grid grid-cols-2 gap-2.5 pt-1 text-[11px] font-bold">
                <div className="bg-white/60 rounded-2xl p-2.5 border border-white">
                  <div className="flex justify-between text-sky-700 mb-1"><span>🌳 Tree Water</span><span>{companion.treeHydration}%</span></div>
                  <div className="w-full h-2 bg-sky-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${companion.treeHydration}%` }} /></div>
                </div>
                <div className="bg-white/60 rounded-2xl p-2.5 border border-white">
                  <div className="flex justify-between text-rose-700 mb-1"><span>🐱 Mochi Love</span><span>{companion.catHunger}%</span></div>
                  <div className="w-full h-2 bg-rose-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-orange-400 to-pink-500" style={{ width: `${companion.catHunger}%` }} /></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => handleNurture('water')} className="btn-glass-pill py-2.5 px-3 text-xs flex items-center justify-center gap-1.5"><Droplets className="w-4 h-4 text-sky-500" /><span>Water (-10)</span></button>
                <button onClick={() => handleNurture('sun')} className="btn-glass-pill py-2.5 px-3 text-xs flex items-center justify-center gap-1.5"><Sun className="w-4 h-4 text-amber-500" /><span>Sunlight (-10)</span></button>
                <button onClick={() => handleNurture('feed')} className="btn-glass-pill py-2.5 px-3 text-xs flex items-center justify-center gap-1.5"><Fish className="w-4 h-4 text-orange-500" /><span>Feed (-15)</span></button>
                <button onClick={() => handleNurture('play')} className="btn-glass-pill py-2.5 px-3 text-xs flex items-center justify-center gap-1.5"><Heart className="w-4 h-4 text-pink-500" /><span>Play (-10)</span></button>
              </div>

              <button onClick={toggleSickMode} className={`w-full py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 border transition-all ${sickMode ? 'bg-emerald-400/25 border-emerald-400 text-emerald-900' : 'bg-white/75 border-white text-[#1e1e2d] hover:bg-white'}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${sickMode ? 'bg-emerald-500' : 'bg-slate-400'}`} /><span>Sick Mode: {sickMode ? 'ON 🛡️' : 'OFF 🛡️'}</span>
              </button>
            </div>

            <div className="bento-box p-6 text-center">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-base font-extrabold text-[#1e1e2d] flex items-center gap-2 m-0"><Clock className="w-5 h-5 text-[#a18cd1]" /><span>Focus Timer</span></h5>
                <button onClick={playAlarmSound} className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"><Volume2 className="w-4 h-4" /> Test Sound</button>
              </div>

              <div className="relative w-[170px] h-[170px] mx-auto mb-4 flex items-center justify-center">
                <svg className="-rotate-90 w-full h-full" viewBox="0 0 180 180">
                  <defs>
                    <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a18cd1" /><stop offset="100%" stopColor="#fbc2eb" /></linearGradient>
                  </defs>
                  <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="8" />
                  <circle cx="90" cy="90" r="80" fill="none" stroke="url(#timerGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeOffset} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <div className="absolute text-3xl font-extrabold text-[#1e1e2d] tabular-nums">{formatTimer(timeLeft)}</div>
              </div>

              <div className="flex justify-center gap-3">
                <button onClick={() => setIsRunning(!isRunning)} className="w-12 h-12 rounded-full bg-white/80 hover:bg-white border border-white flex items-center justify-center text-[#a18cd1] shadow-sm transition-all hover:scale-105">
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <button onClick={() => { setIsRunning(false); setTimeLeft(totalTime); }} className="w-12 h-12 rounded-full bg-white/80 hover:bg-white border border-white flex items-center justify-center text-[#646477] shadow-sm hover:scale-105"><RotateCcw className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeAlarmTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bento-box bg-white max-w-md w-full p-6 text-center space-y-4 border-2 border-purple-300 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto animate-bounce"><BellRing className="w-7 h-7" /></div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-purple-100 text-purple-700">⏰ Scheduled Reminder</span>
              <h3 className="text-xl font-extrabold text-[#1e1e2d] m-0">{activeAlarmTask.title}</h3>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { snoozeTask15Min(activeAlarmTask._id); setActiveAlarmTask(null); }} className="btn-glass-pill flex-1 py-2.5 text-xs font-bold">Snooze +15m 💤</button>
                <button onClick={() => handleComplete(activeAlarmTask._id)} className="btn-premium flex-1 py-2.5 text-xs justify-center">Complete Now! 🎉</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {twoMinutePopupTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bento-box bg-white/95 max-w-md w-full p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto"><Zap className="w-6 h-6" /></div>
              <h3 className="text-lg font-extrabold text-[#1e1e2d]">⚡ 2-Minute Magic Rule!</h3>
              <p className="text-sm text-[#646477]"><strong>&ldquo;{twoMinutePopupTask.title}&rdquo;</strong> takes under 2 minutes! Complete it now to earn instant Care Points!</p>
              <div className="flex gap-3">
                <button onClick={closeModals} className="btn-glass-pill flex-1 py-2.5 text-xs">Do Later</button>
                <button onClick={() => handleComplete(twoMinutePopupTask._id)} className="btn-premium flex-1 py-2.5 text-xs justify-center">Done Right Now! 🎉</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {delayReasonModalTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bento-box bg-white/95 max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-extrabold text-[#1e1e2d]">🤝 Rescheduled 3 times — what&apos;s getting in the way?</h3>
              <p className="text-xs text-[#646477]">Writing down why you&apos;re delaying helps AI spot your habit patterns without guilt.</p>
              <textarea rows={3} value={delayReasonText} onChange={(e) => setDelayReasonText(e.target.value)} placeholder="e.g., Feeling tired, task feels too big..." className="w-full rounded-2xl bg-purple-50/70 border border-purple-200 p-3 text-xs text-[#1e1e2d] outline-none" />
              {lifelines > 0 && !sickMode && (
                <label className="flex items-center gap-2 text-xs font-bold text-purple-700 cursor-pointer">
                  <input type="checkbox" checked={useLifelineCheck} onChange={(e) => setUseLifelineCheck(e.target.checked)} className="accent-purple-600" />
                  <span>Use 1 Streak Saver 💖 ({lifelines} available) to protect my Tree & Cat</span>
                </label>
              )}
              <div className="flex gap-3">
                <button onClick={closeModals} className="btn-glass-pill flex-1 py-2.5 text-xs">Cancel</button>
                <button onClick={() => { if (!delayReasonText.trim()) return; submitDelayReason(delayReasonModalTask._id, delayReasonText, useLifelineCheck); setDelayReasonText(''); }} className="btn-premium flex-1 py-2.5 text-xs justify-center">Save Reason</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Ghost Protocol Modal (Active Retrieval Engine) */}
      <AnimatePresence>
        {showGhostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bento-box bg-white max-w-xl w-full p-6 sm:p-8 space-y-6 border-2 border-indigo-400 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#1e1e2d] m-0">Ghost Protocol 🕵️‍♂️</h3>
                  <p className="text-xs font-bold text-indigo-600 m-0">
                    Close your books. Active Retrieval Mode.
                  </p>
                </div>
              </div>

              {!ghostQuestionsData ? (
                // Phase 1: Free Recall (Brain Dump)
                <div className="space-y-4">
                  <p className="text-sm text-[#646477] font-medium">
                    গত ২৫ মিনিটে তুমি কী কী শিখেছ বা কাজ করেছ? না দেখে নিজের ভাষায় নিচে লেখো। (ভুল হলে সমস্যা নেই!)
                  </p>
                  <textarea
                    rows={4}
                    value={ghostInputText}
                    onChange={(e) => setGhostInputText(e.target.value)}
                    placeholder="যেমন: আজ ক্যালকুলাসের চেইন রুল প্র্যাকটিস করলাম..."
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-[#1e1e2d] outline-none focus:border-indigo-400 focus:bg-white transition-all"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowGhostModal(false)}
                      className="btn-glass-pill px-5 py-2.5 text-xs font-bold"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => fetchGhostQuestions(ghostInputText)}
                      disabled={isGhostLoading || !ghostInputText.trim()}
                      className="btn-premium flex-1 py-2.5 text-xs justify-center flex items-center gap-2"
                    >
                      {isGhostLoading ? (
                        <span className="animate-pulse">AI is creating context questions... 🤖</span>
                      ) : (
                        <>Submit Recall <Sparkles className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // Phase 2: AI Elaborative Interrogation
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                    <p className="text-xs font-bold text-emerald-700 m-0">
                      {ghostQuestionsData.encouragement}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {ghostQuestionsData.questions.map((q, idx) => (
                      <div key={idx} className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                        <p className="text-sm font-semibold text-indigo-900 m-0">
                          <span className="font-extrabold text-indigo-400 mr-2">Q{idx + 1}.</span>{q}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs font-bold text-[#646477] mt-4 mb-2">
                    যেকোনো ১টি প্রশ্নের উত্তর নিচে দাও (১-২ লাইনে):
                  </p>
                  <textarea
                    rows={2}
                    value={ghostAnswerText}
                    onChange={(e) => setGhostAnswerText(e.target.value)}
                    placeholder="আমি Q2 এর উত্তর দিচ্ছি: কারণ..."
                    className="w-full rounded-2xl bg-white border border-indigo-200 p-3 text-sm text-[#1e1e2d] outline-none focus:ring-2 focus:ring-indigo-300"
                  />

                  <button
                    onClick={() => {
                      completeGhostProtocol();
                      setShowGhostModal(false);
                      setGhostInputText('');
                      setGhostAnswerText('');
                    }}
                    disabled={!ghostAnswerText.trim()}
                    className="w-full btn-premium py-3 text-sm justify-center flex items-center gap-2 mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-indigo-200"
                  >
                    Unlock Deep Memory (+50 Pts) <Trophy className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}