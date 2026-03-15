import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { supabase, getAuthRedirectUrl, requireEmailVerification } from '../lib/supabase';
import { Wallet, Mail, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: () => void;
  allowGuestReadOnly?: boolean;
  onContinueAsGuest?: () => void;
}

function mapAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (normalized.includes('email not confirmed')) return 'ยังไม่ได้ยืนยันอีเมล กรุณาเช็กเมลแล้วกดยืนยันก่อนเข้าสู่ระบบ';
  if (normalized.includes('password should be at least')) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
  if (normalized.includes('user already registered')) return 'อีเมลนี้ถูกใช้งานแล้ว';
  if (normalized.includes('unable to validate email address')) return 'รูปแบบอีเมลไม่ถูกต้อง';
  if (normalized.includes('rate limit exceeded')) return 'ขออภัย! คุณทำรายการบ่อยเกินไป โปรดรอสักครู่แล้วลองใหม่อีกครั้ง';

  return message || 'Authentication failed';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AuthScreen({ onAuthSuccess, allowGuestReadOnly = false, onContinueAsGuest }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const ensureAuthInputIsValid = () => {
    if (!isValidEmail(normalizedEmail)) {
      setErrorMsg('กรุณากรอกอีเมลให้ถูกต้อง');
      return false;
    }

    if (!isLogin && password.length < 6) {
      setErrorMsg('รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร');
      return false;
    }

    if (password.length === 0) {
      setErrorMsg('กรุณากรอกรหัสผ่าน');
      return false;
    }

    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!ensureAuthInputIsValid()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;
        if (!data.session) {
          setSuccessMsg('เข้าสู่ระบบสำเร็จ');
          return;
        }

        onAuthSuccess();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) throw error;

      if (data.user?.identities && data.user.identities.length === 0) {
        setErrorMsg('อีเมลนี้ถูกใช้งานแล้ว');
        return;
      }

      if (data.session && !requireEmailVerification) {
        onAuthSuccess();
        return;
      }

      setSuccessMsg('สมัครสมาชิกสำเร็จ กรุณาเปิดอีเมลและยืนยันบัญชีก่อนเข้าสู่ระบบ');
      setIsLogin(true);
    } catch (err: any) {
      setErrorMsg(mapAuthError(err?.message || 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!isValidEmail(normalizedEmail)) {
      setErrorMsg('กรุณากรอกอีเมลก่อนส่งลิงก์รีเซ็ตรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: getAuthRedirectUrl(),
      });
      if (error) throw error;
      setSuccessMsg('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบอีเมล');
    } catch (err: any) {
      setErrorMsg(mapAuthError(err?.message || 'Unable to send reset email'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!isValidEmail(normalizedEmail)) {
      setErrorMsg('กรุณากรอกอีเมลให้ถูกต้องเพื่อส่งยืนยันตัวตนซ้ำ');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });
      if (error) throw error;
      setSuccessMsg('ส่งอีเมลยืนยันตัวตนซ้ำแล้ว กรุณาตรวจสอบกล่องจดหมาย');
    } catch (err: any) {
      setErrorMsg(mapAuthError(err?.message || 'Unable to resend verification email'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center px-6 py-12 bg-background-light dark:bg-background-dark relative overflow-hidden" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)' }}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm mx-auto z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="size-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-primary/30 rotate-12">
            <Wallet size={32} />
          </div>
        </div>

        <h2 className="text-3xl font-black text-text-dark dark:text-white text-center tracking-tight mb-2">
          {isLogin ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-text-secondary text-center text-sm font-bold mb-8">
          {isLogin ? 'ล็อกอินเพื่อเข้าถึงข้อมูลส่วนตัวของคุณ' : 'สมัครสมาชิกแล้วเริ่มติดตามการเงินได้ทันที'}
        </p>

        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 dark:bg-rose-500/10 text-expense p-4 rounded-2xl text-xs font-bold mb-6 border border-rose-100 dark:border-rose-500/20 text-center">
            {errorMsg}
          </motion.div>
        )}

        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold mb-6 border border-emerald-100 dark:border-emerald-500/20 text-center">
            {successMsg}
          </motion.div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary">
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-text-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              placeholder="Email address"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary">
              <Lock size={18} />
            </div>
            <input
              type="password"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-text-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-text-dark dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Sign Up'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 flex justify-center">
          {isLogin ? (
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading}
              className="text-[11px] font-bold px-4 py-2 bg-slate-100 dark:bg-slate-800 text-secondary hover:text-text-dark dark:hover:text-white rounded-xl disabled:opacity-60 transition-colors"
            >
              Forgot Password?
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={loading}
              className="text-[11px] font-bold px-4 py-2 bg-slate-100 dark:bg-slate-800 text-secondary hover:text-text-dark dark:hover:text-white rounded-xl disabled:opacity-60 transition-colors"
            >
              Didn't receive verification email? Resend
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-secondary text-sm font-bold hover:text-text-dark dark:hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span className="text-primary underline underline-offset-4">{isLogin ? 'Sign up' : 'Log in'}</span>
          </button>
        </div>

        {allowGuestReadOnly && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full rounded-2xl py-3 text-xs font-black bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} />
              Continue in Read-only Mode
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
