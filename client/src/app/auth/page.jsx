'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const router = useRouter();
  
  const { login, register, isLoading, error, initAuth, token } = useAuthStore();

  // যদি আগে থেকেই লগইন করা থাকে, তবে সরাসরি ড্যাশবোর্ডে পাঠিয়ে দেবে
  useEffect(() => {
    initAuth();
    if (token) {
      router.push('/dashboard');
    }
  }, [token, initAuth, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let success = false;

    if (isLogin) {
      success = await login(formData.email, formData.password);
    } else {
      success = await register(formData.name, formData.email, formData.password);
    }

    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 selection:bg-emerald-500/30">
      {/* অরোরা ব্যাকগ্রাউন্ড */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#07090e]">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-sky-500/15 blur-[150px]" />
      </div>

      <div className="w-full max-w-md">
        {/* লোগো ও টাইটেল */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
            <Sparkles className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Empathetic Space</h1>
          <p className="text-slate-400 text-sm">তোমার কাজের জন্য একটি চাপমুক্ত ও বন্ধুসুলভ জায়গা 🌱</p>
        </motion.div>

        {/* অথেন্টিকেশন কার্ড */}
        <motion.div 
          layout
          className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-white mb-6">
                {isLogin ? 'ফিরে আসার জন্য স্বাগতম 👋' : 'নতুন যাত্রা শুরু করো 🚀'}
              </h2>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                  {error}
                </div>
              )}

              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="তোমার নাম"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/10 focus:border-emerald-400/50 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="ইমেইল অ্যাড্রেস"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950/50 border border-white/10 focus:border-emerald-400/50 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="পাসওয়ার্ড"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950/50 border border-white/10 focus:border-emerald-400/50 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? 'লগইন করো' : 'অ্যাকাউন্ট তৈরি করো'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400">
              {isLogin ? 'অ্যাকাউন্ট নেই?' : 'আগে থেকেই অ্যাকাউন্ট আছে?'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="ml-2 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {isLogin ? 'নতুন তৈরি করো' : 'লগইন করো'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}