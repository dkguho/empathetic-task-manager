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
    <div className="relative min-h-screen flex items-center justify-center p-4 selection:bg-purple-200">
      {/* প্যাস্টেল মেস অ্যানিমেটেড ব্যাকগ্রাউন্ড */}
      <div className="mesh-bg" />

      <div className="w-full max-w-md">
        {/* লোগো ও টাইটেল */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb] flex items-center justify-center shadow-lg shadow-purple-300/40 mb-3">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1e1e2d] mb-1">Empathetic Space</h1>
          <p className="text-[#646477] font-semibold text-sm">তোমার কাজের জন্য একটি চাপমুক্ত ও বন্ধুসুলভ জায়গা 🌱</p>
        </motion.div>

        {/* অথেন্টিকেশন বেন্টো কার্ড */}
        <motion.div 
          layout
          className="bento-box p-7 sm:p-9 shadow-xl relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <h2 className="text-xl font-extrabold text-[#1e1e2d] mb-5">
                {isLogin ? 'ফিরে আসার জন্য স্বাগতম 👋' : 'নতুন যাত্রা শুরু করো 🚀'}
              </h2>

              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {error}
                </div>
              )}

              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0b2]" />
                  <input
                    type="text"
                    required
                    placeholder="তোমার নাম"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/70 border border-white focus:border-purple-300 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-sm text-[#1e1e2d] font-semibold placeholder:text-[#a0a0b2] outline-none transition-all shadow-inner"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0b2]" />
                <input
                  type="email"
                  required
                  placeholder="ইমেইল অ্যাড্রেস"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/70 border border-white focus:border-purple-300 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-sm text-[#1e1e2d] font-semibold placeholder:text-[#a0a0b2] outline-none transition-all shadow-inner"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0b2]" />
                <input
                  type="password"
                  required
                  placeholder="পাসওয়ার্ড"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/70 border border-white focus:border-purple-300 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-sm text-[#1e1e2d] font-semibold placeholder:text-[#a0a0b2] outline-none transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-full btn-premium font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
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

          <div className="mt-6 pt-5 border-t border-white/80 text-center">
            <p className="text-xs font-bold text-[#646477]">
              {isLogin ? 'অ্যাকাউন্ট নেই?' : 'আগে থেকেই অ্যাকাউন্ট আছে?'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="ml-2 font-extrabold text-purple-600 hover:text-purple-800 transition-colors"
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