'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  Sparkles, Brain, BatteryWarning, BatteryCharging, BatteryFull,
  Clock, CheckCircle2, Bot, Play, Pause, RotateCcw,
  Plus, Sun, CloudSun, Moon, Infinity as AnyTimeIcon, BarChart3, Zap,
  Droplets, Heart, Fish, Trees, Cat
} from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import SpiritCompanion3D from '@/components/companion/SpiritCompanion3D';

export default function EmpatheticDashboard() {
  const {
    awarenessPoints, lifelines, energyLevel, sickMode, companion,
    tasks, doneList, brainDumpHistory, twoMinutePopupTask, delayReasonModalTask,
    setEnergyLevel, toggleSickMode, setCompanionViewMode, nurtureCompanion,
    clearCompanionEffect, addSmartTask, processBrainDumpToTasks, completeTask,
    snoozeTask15Min, triggerReschedule, submitDelayReason, breakdownTaskWithAI,
    toggleSubTask, closeModals
  } = useTaskStore();

  const [activeTab, setActiveTab] = useState('tasks');
  const [smartInput, setSmartInput] = useState('');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('auto');
  const [exactTimeInput, setExactTimeInput] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('blue');
  const [brainDumpText, setBrainDumpText] = useState('');
  const [delayReasonText, setDelayReasonText] = useState('');
  const [useLifelineCheck, setUseLifelineCheck] = useState(false);

  const totalTime = 25 * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isRunning, setIsRunning] = useState(false);
  const circumference = 2 * Math.PI * 80;

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      firePremiumConfetti();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

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
    setTimeout(() => clearCompanionEffect(), 2500);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!smartInput.trim()) return;
    addSmartTask(smartInput, {
      manualTimeBlock: selectedTimeOfDay,
      manualExactTime: exactTimeInput,
      manualPriority: selectedPriority,
      isBrainDump: false
    });
    setSmartInput('');
    setExactTimeInput('');
  };

  const handleBrainDumpSubmit = () => {
    if (!brainDumpText.trim()) return;
    processBrainDumpToTasks(brainDumpText);
    setBrainDumpText('');
    setActiveTab('tasks');
  };

  const visibleTasks = tasks.filter((t) => {
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
    if (task.priorityColor === 'red') {
      return <span className="tag-urgent px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">🚨 Urgent</span>;
    }
    if (task.priorityColor === 'green' || task.isDopamineStarter) {
      return <span className="tag-dopamine px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">🎮 Fun Starter</span>;
    }
    if (task.priorityColor === 'purple' || task.isGuiltFreeHobby) {
      return <span className="tag-guilt-free px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">🍿 Guilt-Free Time</span>;
    }
    return <span className="tag-normal px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">✨ Normal</span>;
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="mesh-bg" />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* ১. Header & Energy Check-in */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-box p-6 sm:p-7 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e1e2d] mb-1">
              Good afternoon, Kushal! ✨
            </h1>
            <p className="text-[#646477] font-medium text-sm sm:text-base">
              {energyLevel === 'low'
                ? 'Low energy mode active — focusing only on gentle & bare minimum steps 🌱'
                : 'Complete tasks to earn Care Points and keep Mochi & your Sakura Tree thriving!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/60 p-1.5 rounded-full border border-white shadow-sm">
              <span className="pl-3 pr-1 text-xs font-bold text-[#646477]">Energy:</span>
              <button
                onClick={() => setEnergyLevel('low')}
                className={`btn-glass-pill px-3.5 py-2 text-xs flex items-center gap-1.5 ${energyLevel === 'low' ? 'active' : ''}`}
              >
                <BatteryWarning className="w-4 h-4" /> Low
              </button>
              <button
                onClick={() => setEnergyLevel('medium')}
                className={`btn-glass-pill px-3.5 py-2 text-xs flex items-center gap-1.5 ${energyLevel === 'medium' ? 'active' : ''}`}
              >
                <BatteryCharging className="w-4 h-4" /> Okay
              </button>
              <button
                onClick={() => setEnergyLevel('high')}
                className={`btn-glass-pill px-3.5 py-2 text-xs flex items-center gap-1.5 ${energyLevel === 'high' ? 'active' : ''}`}
              >
                <BatteryFull className="w-4 h-4" /> Super
              </button>
            </div>

            <Link
              href="/analytics"
              className="btn-premium px-5 py-2.5 text-xs flex items-center gap-2 shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Weekly Analytics & Habits</span>
            </Link>
          </div>
        </motion.div>

        {/* ২. Main Navigation Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="inline-flex bg-white/60 p-1.5 rounded-full border border-white shadow-sm">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'tasks'
                  ? 'bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] text-white shadow-md'
                  : 'text-[#646477] hover:text-[#1e1e2d]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>📋 Your Daily Plan ({visibleTasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('brain-dump')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'brain-dump'
                  ? 'bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] text-white shadow-md'
                  : 'text-[#646477] hover:text-[#1e1e2d]'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>🧠 Night Brain Dump</span>
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

        {/* ৩. Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols) */}
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
                  {/* Smart Input + Time & Priority Picker */}
                  <div className="bento-box p-5 sm:p-6 space-y-4">
                    <form
                      onSubmit={handleAddTask}
                      className="flex items-center bg-white/80 border border-white rounded-full p-2 pl-5 shadow-inner focus-within:ring-2 focus-within:ring-purple-300 transition-all"
                    >
                      <Sparkles className="w-6 h-6 text-[#a18cd1] mr-3 shrink-0" />
                      <input
                        type="text"
                        value={smartInput}
                        onChange={(e) => setSmartInput(e.target.value)}
                        placeholder={
                          energyLevel === 'low'
                            ? 'Take it easy. Type a small, gentle task...'
                            : 'Just type what you want to do... (e.g. Do math homework tonight)'
                        }
                        className="w-full bg-transparent border-none outline-none text-[#1e1e2d] placeholder:text-slate-400 font-medium text-base"
                      />
                      <button type="submit" className="btn-premium px-6 py-3 text-sm shrink-0 flex items-center gap-2">
                        <span>Add</span>
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1 px-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[#646477] mr-1">⏰ Time:</span>
                        {[
                          { id: 'auto', label: '✨ Auto AI' },
                          { id: 'morning', label: '🌅 Morning' },
                          { id: 'afternoon', label: '☀️ Afternoon' },
                          { id: 'night', label: '🌙 Night' },
                          { id: 'anytime', label: '⏳ Anytime' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTimeOfDay(t.id)}
                            className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                              selectedTimeOfDay === t.id
                                ? 'bg-[#a18cd1] text-white shadow-sm'
                                : 'bg-white/60 text-[#646477] hover:bg-white'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                        <input
                          type="time"
                          value={exactTimeInput}
                          onChange={(e) => setExactTimeInput(e.target.value)}
                          className="ml-1 px-2.5 py-1 rounded-full bg-white/80 border border-purple-200 text-[#1e1e2d] font-semibold outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[#646477] mr-1">🎯 Priority:</span>
                        {[
                          { id: 'blue', label: 'Normal', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
                          { id: 'red', label: '🚨 Urgent', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
                          { id: 'green', label: '🎮 Warm-up', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
                          { id: 'purple', label: '🍿 Guilt-Free', cls: 'bg-orange-100 text-orange-800 border-orange-300' }
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPriority(p.id)}
                            className={`px-3 py-1.5 rounded-full font-bold border transition-all ${
                              selectedPriority === p.id
                                ? `${p.cls} ring-2 ring-offset-1 ring-purple-400 scale-105`
                                : 'bg-white/50 text-[#646477] border-transparent hover:bg-white'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Task List */}
                  <div className="bento-box p-6 sm:p-7 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-extrabold text-[#1e1e2d]">Your Plan</h3>
                      <span className="text-xs font-semibold text-[#646477]">
                        Each completed task earns +10 to +20 Care Points 🌸🐾
                      </span>
                    </div>

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
                              <motion.div
                                key={task._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 40 }}
                                className="bg-white/65 hover:bg-white/95 border border-white rounded-2xl p-4 transition-all shadow-sm"
                              >
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={() => handleComplete(task._id)}
                                    className="w-7 h-7 rounded-full border-2 border-slate-300 hover:border-purple-400 bg-white flex items-center justify-center transition-all hover:scale-110 shrink-0"
                                    title="Complete task & earn Care Points"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-purple-500 opacity-0 hover:opacity-100" />
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <p className="font-bold text-base text-[#1e1e2d] m-0">{task.title}</p>
                                      {renderPriorityBadge(task)}
                                      {task.exactTime && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
                                          ⏰ {task.exactTime}
                                        </span>
                                      )}
                                      <span className="text-[11px] font-bold text-slate-400">
                                        • Reschedules: {task.rescheduleCount}/3
                                      </span>
                                    </div>
                                    <p className="text-xs text-[#646477] m-0">{task.aiMotivationalNote}</p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => snoozeTask15Min(task._id)}
                                      title="Snooze 15m"
                                      className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-white flex items-center justify-center text-[#646477] hover:text-[#1e1e2d] shadow-sm transition-all"
                                    >
                                      <Clock className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => breakdownTaskWithAI(task._id)}
                                      title="AI 3-Step Breakdown"
                                      className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-white flex items-center justify-center text-[#a18cd1] hover:scale-105 shadow-sm transition-all"
                                    >
                                      <Bot className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => triggerReschedule(task._id)}
                                      className="px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-white text-xs font-bold text-[#646477] hover:text-[#1e1e2d] shadow-sm transition-all"
                                    >
                                      Delay ({3 - task.rescheduleCount})
                                    </button>
                                  </div>
                                </div>

                                {task.subTasks && task.subTasks.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-purple-100 pl-11 space-y-1.5">
                                    {task.subTasks.map((st, i) => (
                                      <label
                                        key={i}
                                        onClick={() => toggleSubTask(task._id, i)}
                                        className="flex items-center gap-2 text-xs font-medium text-[#1e1e2d] cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={st.isCompleted}
                                          onChange={() => {}}
                                          className="accent-purple-500 rounded"
                                        />
                                        <span className={st.isCompleted ? 'line-through text-slate-400' : ''}>
                                          {st.title}
                                        </span>
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
                        <h4 className="text-sm font-extrabold text-emerald-700">
                          🎉 Done List ({doneList.length} Celebrated!)
                        </h4>
                        <div className="space-y-2">
                          {doneList.slice(0, 4).map((item) => (
                            <div
                              key={item._id}
                              className="bg-white/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs opacity-75"
                            >
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
                <motion.div
                  key="brain-dump-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bento-box p-6 sm:p-8 space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1e1e2d] flex items-center gap-2">
                      <Brain className="w-7 h-7 text-[#fcb69f]" />
                      <span>Nighttime Brain Dump Studio 🌙</span>
                    </h2>
                    <p className="text-sm text-[#646477] mt-1">
                      Write down all your racing thoughts before bed—AI will organize them into tomorrow&apos;s plan.
                    </p>
                  </div>

                  <textarea
                    rows={7}
                    value={brainDumpText}
                    onChange={(e) => setBrainDumpText(e.target.value)}
                    placeholder="Write each thought on a new line or separated by commas..."
                    className="w-full bg-white/70 focus:bg-white border border-white rounded-3xl p-5 text-base text-[#1e1e2d] placeholder:text-slate-400 outline-none shadow-inner transition-all"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleBrainDumpSubmit}
                      className="btn-premium px-7 py-3.5 text-sm flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Organize into My Plan with AI</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column (4 cols): 3D Living Tree & Cat Sanctuary + Care System */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bento-box p-5 sm:p-6 space-y-4">
              {/* Top Header & Mode Switcher (Both / Tree / Cat) */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-extrabold text-[#1e1e2d] m-0">
                    🌸 Living Sanctuary
                  </h4>
                  <p className="text-[11px] font-semibold text-[#646477] m-0">
                    Spend points to nurture Mochi & Bonsai
                  </p>
                </div>

                <div className="flex bg-white/70 p-1 rounded-full border border-white text-[11px] font-bold">
                  {[
                    { id: 'both', label: 'Both' },
                    { id: 'cat', label: '🐱 Cat' },
                    { id: 'tree', label: '🌳 Tree' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setCompanionViewMode(m.id)}
                      className={`px-2.5 py-1 rounded-full transition-all ${
                        companion.activeMode === m.id
                          ? 'bg-[#a18cd1] text-white shadow-xs'
                          : 'text-[#646477]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Realistic 3D Tree & Cat Canvas */}
              <SpiritCompanion3D companion={companion} />

              {/* Emotional Status Dialogue */}
              <motion.div
                key={companion.message}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 border border-white rounded-2xl p-3 text-xs font-semibold text-[#1e1e2d] text-center shadow-xs"
              >
                {companion.message}
              </motion.div>

              {/* Live Vitality Meters (Tree Hydration & Cat Fullness/Love) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-[11px] font-bold">
                <div className="bg-white/60 rounded-2xl p-2.5 border border-white">
                  <div className="flex justify-between text-sky-700 mb-1">
                    <span>🌳 Tree Water</span>
                    <span>{companion.treeHydration}%</span>
                  </div>
                  <div className="w-full h-2 bg-sky-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${companion.treeHydration}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/60 rounded-2xl p-2.5 border border-white">
                  <div className="flex justify-between text-rose-700 mb-1">
                    <span>🐱 Mochi Love</span>
                    <span>{companion.catHunger}%</span>
                  </div>
                  <div className="w-full h-2 bg-rose-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-500"
                      style={{ width: `${companion.catHunger}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 4 Interactive Care Buttons (Spend Earned Points) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleNurture('water')}
                  className="btn-glass-pill py-2.5 px-3 text-xs flex items-center justify-center gap-1.5 hover:border-sky-300"
                >
                  <Droplets className="w-4 h-4 text-sky-500" />
                  <span>Water Tree (-10)</span>
                </button>
                <button
                  onClick={() => handleNurture('sun')}
                  className="btn-glass-pill py-2.5 px-3 text-xs flex items-center justify-center gap-1.5 hover:border-amber-300"
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Sunlight (-10)</span>
                </button>
                <button
                  onClick={() => handleNurture('feed')}
                  className="btn-glass-pill py-2.5 px-3 text-xs flex items-center justify-center gap-1.5 hover:border-orange-300"
                >
                  <Fish className="w-4 h-4 text-orange-500" />
                  <span>Feed Mochi (-15)</span>
                </button>
                <button
                  onClick={() => handleNurture('play')}
                  className="btn-glass-pill py-2.5 px-3 text-xs flex items-center justify-center gap-1.5 hover:border-pink-300"
                >
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span>Pet Mochi (-10)</span>
                </button>
              </div>

              {/* Sick Mode Pause Button */}
              <button
                onClick={toggleSickMode}
                className={`w-full py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  sickMode
                    ? 'bg-emerald-400/25 border-emerald-400 text-emerald-900'
                    : 'bg-white/75 border-white text-[#1e1e2d] hover:bg-white'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${sickMode ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span>Sick Mode: {sickMode ? 'ON 🛡️ (Sanctuary Protected)' : 'OFF 🛡️'}</span>
              </button>
            </div>

            {/* Focus Mode Timer */}
            <div className="bento-box p-6 text-center">
              <h5 className="text-base font-extrabold text-[#1e1e2d] text-left mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#a18cd1]" />
                <span>Focus Mode</span>
              </h5>

              <div className="relative w-[170px] h-[170px] mx-auto mb-4 flex items-center justify-center">
                <svg className="-rotate-90 w-full h-full" viewBox="0 0 180 180">
                  <defs>
                    <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a18cd1" />
                      <stop offset="100%" stopColor="#fbc2eb" />
                    </linearGradient>
                  </defs>
                  <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="8" />
                  <circle
                    cx="90"
                    cy="90"
                    r="80"
                    fill="none"
                    stroke="url(#timerGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute text-3xl font-extrabold text-[#1e1e2d] tabular-nums">
                  {formatTimer(timeLeft)}
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className="w-12 h-12 rounded-full bg-white/80 hover:bg-white border border-white flex items-center justify-center text-[#a18cd1] shadow-sm transition-all hover:scale-105"
                >
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <button
                  onClick={() => {
                    setIsRunning(false);
                    setTimeLeft(totalTime);
                  }}
                  className="w-12 h-12 rounded-full bg-white/80 hover:bg-white border border-white flex items-center justify-center text-[#646477] shadow-sm transition-all hover:scale-105"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Minute Rule & Delay Reason Modals */}
      <AnimatePresence>
        {twoMinutePopupTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bento-box bg-white/95 max-w-md w-full p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1e1e2d]">⚡ 2-Minute Magic Rule!</h3>
              <p className="text-sm text-[#646477]">
                <strong>&ldquo;{twoMinutePopupTask.title}&rdquo;</strong> takes under 2 minutes! Complete it now to earn instant Care Points for Mochi & your Tree!
              </p>
              <div className="flex gap-3">
                <button onClick={closeModals} className="btn-glass-pill flex-1 py-2.5 text-xs">
                  Do Later
                </button>
                <button
                  onClick={() => handleComplete(twoMinutePopupTask._id)}
                  className="btn-premium flex-1 py-2.5 text-xs justify-center"
                >
                  Done Right Now! 🎉
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {delayReasonModalTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bento-box bg-white/95 max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-extrabold text-[#1e1e2d]">
                🤝 Rescheduled 3 times — what&apos;s getting in the way?
              </h3>
              <p className="text-xs text-[#646477]">
                Writing down why you&apos;re delaying helps AI spot your habit patterns without guilt.
              </p>
              <textarea
                rows={3}
                value={delayReasonText}
                onChange={(e) => setDelayReasonText(e.target.value)}
                placeholder="e.g., Feeling tired, task feels too big..."
                className="w-full rounded-2xl bg-purple-50/70 border border-purple-200 p-3 text-xs text-[#1e1e2d] outline-none"
              />
              {lifelines > 0 && !sickMode && (
                <label className="flex items-center gap-2 text-xs font-bold text-purple-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useLifelineCheck}
                    onChange={(e) => setUseLifelineCheck(e.target.checked)}
                    className="accent-purple-600"
                  />
                  <span>Use 1 Streak Saver 💖 ({lifelines} available) to protect my Tree & Cat</span>
                </label>
              )}
              <div className="flex gap-3">
                <button onClick={closeModals} className="btn-glass-pill flex-1 py-2.5 text-xs">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!delayReasonText.trim()) return;
                    submitDelayReason(delayReasonModalTask._id, delayReasonText, useLifelineCheck);
                    setDelayReasonText('');
                  }}
                  className="btn-premium flex-1 py-2.5 text-xs justify-center"
                >
                  Save Reason
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}