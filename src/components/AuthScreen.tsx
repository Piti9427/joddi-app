import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  if (normalized.includes('rate limit exceeded'))
    return 'ขออภัย! คุณทำรายการบ่อยเกินไป โปรดรอสักครู่แล้วลองใหม่อีกครั้ง';

  return message || 'Authentication failed';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type AuthPhase = 'idle' | 'submitting' | 'success_pending' | 'error';

export default function AuthScreen({
  onAuthSuccess,
  allowGuestReadOnly = false,
  onContinueAsGuest,
}: Readonly<AuthScreenProps>) {
  const [authPhase, setAuthPhase] = useState<AuthPhase>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');


  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const ensureAuthInputIsValid = () => {
    if (!isValidEmail(normalizedEmail)) {
      setErrorMsg('กรุณากรอกอีเมลให้ถูกต้อง');
      return false;
    }

    if (password.length < 6) {
      setErrorMsg('รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร');
      return false;
    }

    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');


    if (!ensureAuthInputIsValid()) return;

    setLoading(true);
    setAuthPhase('submitting');

    try {
      // Step 1: Try to Sign In
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!signInError && signInData.session) {
        onAuthSuccess();
        return;
      }

      // Step 2: If sign in failed, try to Sign Up (Assuming new user)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (signUpError) throw signUpError;

      // Autologin after signup or immediate session
      if (signUpData.session) {
        onAuthSuccess();
        return;
      }

      // Email confirmation required case
      if (requireEmailVerification && signUpData.user && !signUpData.session) {
        setAuthPhase('success_pending');

        return;
      }

      // Final fallback
      onAuthSuccess();
    } catch (err: any) {
      setAuthPhase('error');
      setErrorMsg(mapAuthError(err?.message || 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg('');


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

    } catch (err: any) {
      setErrorMsg(mapAuthError(err?.message || 'Unable to send reset email'));
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (authPhase === 'idle') {
      return (
        <motion.div
          key="auth-form"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <div className="flex justify-center mb-8">
            <div className="size-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-primary/25">
              <Wallet size={32} />
            </div>
          </div>

          <h2 className="text-3xl font-black text-text-dark dark:text-white text-center tracking-tight mb-2">
            เริ่มต้นใช้งาน
          </h2>
          <p className="text-text-secondary text-center text-sm font-bold mb-8">
            ล็อกอินหรือสมัครสมาชิกเพื่อบันทึกข้อมูลส่วนตัวของคุณ
          </p>

          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-500/10 text-expense p-4 rounded-2xl text-xs font-bold mb-6 border border-rose-100 dark:border-rose-500/20 text-center">
              {errorMsg}
            </div>
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
                placeholder="อีเมล"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-text-dark dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="รหัสผ่าน"
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
                  เข้าใช้งาน
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading}
              className="text-[11px] font-bold px-4 py-2 bg-slate-100 dark:bg-slate-800 text-secondary hover:text-text-dark dark:hover:text-white rounded-xl disabled:opacity-60 transition-colors"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>

          {allowGuestReadOnly && (
            <div className="mt-6">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="w-full rounded-2xl py-3 text-xs font-black bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} />
                เข้าใช้งานโหมดอ่านอย่างเดียว
              </button>
            </div>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div
        key="auth-status"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="text-center py-8"
      >
        <div className="flex justify-center mb-8">
          {(() => {
            let statusColor = 'bg-primary text-white';
            if (authPhase === 'success_pending') statusColor = 'bg-emerald-500 text-white';
            if (authPhase === 'error') statusColor = 'bg-rose-500 text-white';
            
            return (
              <motion.div
                animate={authPhase === 'submitting' ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`size-20 rounded-3xl flex items-center justify-center shadow-xl ${statusColor}`}
              >
                {authPhase === 'submitting' && <Loader2 size={40} className="animate-spin" />}
                {authPhase === 'success_pending' && <Mail size={40} />}
                {authPhase === 'error' && <ShieldCheck size={40} className="rotate-180" />}
              </motion.div>
            );
          })()}
        </div>

        <h2 className="text-2xl font-black text-text-dark dark:text-white mb-4">
          {authPhase === 'submitting' && 'กำลังดำเนินการ...'}
          {authPhase === 'success_pending' && 'ส่งอีเมลเรียบร้อย!'}
          {authPhase === 'error' && 'เกิดข้อผิดพลาด'}
        </h2>

        <p className="text-text-secondary font-bold text-sm mb-10 px-4 leading-relaxed">
          {authPhase === 'submitting' && 'กรุณารอสักครู่ ระบบกำลังจัดเตรียมข้อมูลให้คุณ'}
          {authPhase === 'success_pending' && (
            <>
              เราส่งลิงก์ยืนยันไปที่ <span className="text-primary">{normalizedEmail}</span> แล้ว
              กรุณาตรวจสอบกล่องจดหมาย (หรือ Junk mail) เพื่อเริ่มต้นใช้งาน
            </>
          )}
          {authPhase === 'error' && (errorMsg || 'ไม่สามารถดำเนินการได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง')}
        </p>

        <div className="space-y-3">
          {authPhase === 'error' && (
            <button
              onClick={() => setAuthPhase('idle')}
              className="w-full bg-text-dark dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              ลองใหม่อีกครั้ง
            </button>
          )}
          {authPhase === 'success_pending' && (
            <button
              onClick={() => {
                if (onContinueAsGuest) onContinueAsGuest();
              }}
              className="w-full bg-slate-100 dark:bg-slate-800 text-text-dark dark:text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              ตกลง
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div
      className="min-h-full flex flex-col justify-center px-6 py-12 bg-background-light dark:bg-background-dark relative overflow-hidden"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)' }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 rounded-full blur-[80px] -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/8 rounded-full blur-[80px] -ml-32 -mb-32"></div>

      <div className="w-full max-w-sm mx-auto z-10">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
}
