'use client';
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, BrainCircuit, Activity, TrendingUp,
  Trophy, Flame, Target, Sparkles, Clock, Heart
} from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';

export default function AnalyticsDashboard() {
  const { awarenessPoints, companion, fetchAnalytics, analyticsData } = useTaskStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real Database Metrics
  const totalCompleted = analyticsData?.weeklyMetrics?.completedCount || 0;
  const totalTasks = analyticsData?.weeklyMetrics?.totalTasks || 0;
  const totalSnoozed = analyticsData?.weeklyMetrics?.totalRescheduled || 0;
  const completionRate = totalTasks === 0 ? 0 : Math.round((totalCompleted / totalTasks) * 100);

  // Real AI Habit Report
  const aiReport = analyticsData?.aiHabitReport || {};

  // Procrastination Stats by Time Block (from backend)
  const delays = analyticsData?.charts?.procrastinationByTimeBlock || { morning: 0, afternoon: 0, night: 0 };
  const maxDelay = Math.max(1, delays.morning, delays.afternoon, delays.night);

  const timeBlockBreakdown = [
    { 
      label: '🌅 সকাল (Morning)', 
      rate: maxDelay === 0 ? 0 : Math.round((delays.morning / maxDelay) * 100),
      note: delays.morning > 0 ? `${delays.morning}x delayed` : 'Perfect focus!', 
      color: 'bg-emerald-400' 
    },
    { 
      label: '☀️ বিকেল (Afternoon)', 
      rate: maxDelay === 0 ? 0 : Math.round((delays.afternoon / maxDelay) * 100),
      note: delays.afternoon > 0 ? `${delays.afternoon}x delayed` : 'Perfect focus!', 
      color: 'bg-amber-400' 
    },
    { 
      label: '🌙 রাত (Night)', 
      rate: maxDelay === 0 ? 0 : Math.round((delays.night / maxDelay) * 100),
      note: delays.night > 0 ? `${delays.night}x delayed` : 'Perfect focus!', 
      color: 'bg-purple-400' 
    }
  ];

  const weeklyBars = [
    { day: 'Day 1', completed: 0, gradient: 'from-slate-200/50 to-slate-300/50' },
    { day: 'Day 2', completed: 0, gradient: 'from-slate-200/50 to-slate-300/50' },
    { day: 'Day 3', completed: 0, gradient: 'from-slate-200/50 to-slate-300/50' },
    { day: 'Day 4', completed: 0, gradient: 'from-slate-200/50 to-slate-300/50' },
    { day: 'Day 5', completed: 0, gradient: 'from-slate-200/50 to-slate-300/50' },
    { day: 'Yesterday', completed: 0, gradient: 'from-slate-200/50 to-slate-300/50' },
    { day: 'Today', completed: completionRate, gradient: 'from-[#a18cd1] to-[#fbc2eb]' }
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="mesh-bg" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-8 space-y-6">
        <motion.header
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-box p-6 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="w-11 h-11 rounded-full bg-white/80 hover:bg-white border border-white flex items-center justify-center text-[#1e1e2d] shadow-sm transition-transform hover:-translate-x-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e1e2d] m-0">
                উইকলি অ্যানালিটিক্স ও হ্যাবিট ট্র্যাকার ✨
              </h1>
              <p className="text-sm font-semibold text-[#646477] m-0">
                তোমার কাজের প্যাটার্ন, স্যাংকচুয়ারি গ্রোথ এবং এআই ইনসাইট 📊
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/85 border border-white rounded-full px-5 py-2.5 flex items-center gap-2 shadow-sm">
              <Flame className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-bold text-[#646477]">মোট পয়েন্ট:</span>
              <span className="text-lg font-extrabold text-[#1e1e2d]">{awarenessPoints}</span>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatBentoCard
            icon={<Target className="w-6 h-6 text-emerald-600" />}
            badgeBg="bg-emerald-100"
            title="সম্পন্ন কাজ (Completed)"
            value={totalCompleted}
            subtitle="এই সপ্তাহে ডান লিস্টে জমা হয়েছে"
            delay={0.05}
          />
          <StatBentoCard
            icon={<Activity className="w-6 h-6 text-purple-600" />}
            badgeBg="bg-purple-100"
            title="কমপ্লিশন রেট (Success Rate)"
            value={`${completionRate}%`}
            subtitle="কাজের ধারাবাহিকতা"
            delay={0.1}
          />
          <StatBentoCard
            icon={<Clock className="w-6 h-6 text-amber-600" />}
            badgeBg="bg-amber-100"
            title="মোট পেছানো (Rescheduled)"
            value={totalSnoozed}
            subtitle="৩-বার লিমিট ট্র্যাকার"
            delay={0.15}
          />
          <StatBentoCard
            icon={<Heart className="w-6 h-6 text-rose-600" />}
            badgeBg="bg-rose-100"
            title="স্যাংকচুয়ারি লেভেল"
            value={`Lv. ${companion?.growthStage || 1}`}
            subtitle={`Mochi Love: ${companion?.catHunger || 100}% • Tree: ${companion?.treeHydration || 100}%`}
            delay={0.2}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-7 bento-box p-6 sm:p-8 flex flex-col justify-between space-y-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb] flex items-center justify-center text-white shadow-md shrink-0">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-purple-100 text-purple-800">
                  Empathetic AI Habit Coach
                </span>
                <h2 className="text-xl font-extrabold text-[#1e1e2d] mt-2">
                  AI হ্যাবিট অ্যানালাইসিস ও সমাধান
                </h2>
              </div>
            </div>

            <div className="space-y-3 bg-white/70 border border-white rounded-3xl p-5">
              {!analyticsData ? (
                <p className="text-sm sm:text-base text-[#1e1e2d] leading-relaxed m-0 animate-pulse">
                  <strong className="text-purple-700">💡 AI is analyzing your patterns...</strong>
                </p>
              ) : (
                <>
                  <p className="text-sm sm:text-base text-[#1e1e2d] leading-relaxed m-0">
                    <strong className="text-purple-700">💡 মূল প্যাটার্ন:</strong> {aiReport.mainInsight || "No insights yet."}
                  </p>
                  <p className="text-sm sm:text-base text-[#1e1e2d] leading-relaxed m-0">
                    <strong className="text-emerald-700">🎯 অ্যাকশন প্ল্যান:</strong> {aiReport.actionableSuggestion || "Complete a few tasks first!"}
                  </p>
                  <p className="text-sm sm:text-base text-[#1e1e2d] leading-relaxed m-0">
                    <strong className="text-rose-600">💖 কোচ নোট:</strong> {aiReport.cheerleaderNote || "You're doing great! 🌟"}
                  </p>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-5 bento-box p-6 sm:p-8 space-y-5"
          >
            <h3 className="text-lg font-extrabold text-[#1e1e2d] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>সময় অনুযায়ী কাজের হার</span>
            </h3>

            <div className="space-y-4">
              {timeBlockBreakdown.map((item, i) => (
                <div key={i} className="bg-white/65 border border-white rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm font-extrabold text-[#1e1e2d]">
                    <span>{item.label}</span>
                    <span>{item.rate}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.rate}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                  <p className="text-xs font-medium text-[#646477] m-0">{item.note}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bento-box p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-[#1e1e2d] flex items-center gap-2 m-0">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span>গত ৭ দিনের ওভারভিউ (Weekly Momentum)</span>
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-[#1e1e2d]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb]" />
                সম্পন্ন কাজ (Completed)
              </span>
            </div>
          </div>

          <div className="h-60 flex items-end justify-between gap-3 sm:gap-6 px-2 pt-6 border-b border-white/80 pb-4">
            {weeklyBars.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[11px] font-extrabold text-[#1e1e2d] mb-2 opacity-80 group-hover:opacity-100">
                  {bar.completed}%
                </span>
                <div className="w-full max-w-[54px] h-[170px] bg-white/60 border border-white rounded-2xl p-1 flex items-end overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${bar.completed}%` }}
                    transition={{ delay: 0.4 + idx * 0.08, type: 'spring', stiffness: 120 }}
                    className={`w-full rounded-xl bg-gradient-to-t ${bar.gradient} shadow-md`}
                  />
                </div>
                <span className="text-xs font-bold text-[#1e1e2d] mt-3">{bar.day}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatBentoCard({ icon, badgeBg, title, value, subtitle, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bento-box p-6 flex flex-col justify-between space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl ${badgeBg} flex items-center justify-center shadow-xs`}>
          {icon}
        </div>
        <Sparkles className="w-4 h-4 text-purple-300" />
      </div>
      <div>
        <h4 className="text-3xl font-extrabold text-[#1e1e2d] m-0">{value}</h4>
        <p className="text-sm font-bold text-[#1e1e2d] mt-1 mb-0.5">{title}</p>
        <p className="text-xs font-semibold text-[#646477] m-0">{subtitle}</p>
      </div>
    </motion.div>
  );
}