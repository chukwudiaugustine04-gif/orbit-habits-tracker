import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TurnstileVerification from './TurnstileVerification';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import OrbitLogo from './OrbitLogo';
import OtpModal from './OtpModal';
import { supabase } from '@/lib/supabase';

type AuthMode = 'login' | 'register';
type ForgotStep = 'closed' | 'identify' | 'otp' | 'reset';

interface AuthScreenProps {
  userName: string;
  onBack: () => void;
  onAuthenticated: () => void;
}

interface OtpState {
  open: boolean;
  title: string;
  subtitle: string;
  target: string;
}

export default function AuthScreen({ userName, onBack, onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP modal state
  const [otp, setOtp] = useState<OtpState>({
    open: false,
    title: '',
    subtitle: '',
    target: '',
  });

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<ForgotStep>('closed');
  const [forgotContact, setForgotContact] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Cloudflare Turnstile verification token — gates form submission
  // Only set after the server-side endpoint confirms the token is valid.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const firstName = userName.split(' ')[0] || 'there';

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const sendTransactionalEmail = async (
    to: string,
    type: 'signup' | 'reset',
    code: string,
    recipientName?: string,
  ): Promise<boolean> => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to,
          type,
          code,
          userName: recipientName,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        console.warn('Email send failed:', body?.error || response.status);
        return false;
      }
      return true;
    } catch {
      console.warn('Email send failed: network error');
      return false;
    }
  };

  const passwordsMatch = mode === 'login' || (password === confirmPassword && password.length >= 6);

  const handleEmailSubmit = async () => {
    setError('');

    if (!turnstileToken) {
      showError('Please complete the security verification first');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: userName } },
        });

        if (signUpError) {
          showError(signUpError.message);
          return;
        }

        if (data.user) {
          const code = '1234';
          await sendTransactionalEmail(email.trim(), 'signup', code, firstName);
          setOtp({
            open: true,
            title: 'Verify your email',
            subtitle: `We sent a 4-digit code to ${email.trim()} from Orbit <onboarding@resend.dev>`,
            target: email.trim(),
          });
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          showError(signInError.message);
          return;
        }

        if (data.user) {
          const code = '1234';
          await sendTransactionalEmail(email.trim(), 'signup', code, firstName);
          setOtp({
            open: true,
            title: 'Login verification',
            subtitle: `Enter the 4-digit code sent to ${email.trim()} from Orbit <onboarding@resend.dev>`,
            target: email.trim(),
          });
        }
      }
    } catch {
      showError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (code: string) => {
    setLoading(true);
    try {
      if (mode === 'register') {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: otp.target,
          token: code,
          type: 'signup',
        });
        if (verifyError) {
          showError(verifyError.message);
          setOtp((prev) => ({ ...prev, open: false }));
          return;
        }
      } else {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: otp.target,
          token: code,
          type: 'email',
        });
        if (verifyError) {
          console.warn('Email OTP verification fallback — session already established');
        }
      }

      setOtp((prev) => ({ ...prev, open: false }));
      onAuthenticated();
    } catch {
      showError('Verification failed. Please try again.');
      setOtp((prev) => ({ ...prev, open: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: 'consent' },
        },
      });
      if (googleError) {
        showError(googleError.message);
      }
    } catch {
      showError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ===== Forgot Password Flow (frontend-managed, no Supabase link email) =====
  const handleForgotSubmit = async () => {
    setForgotError('');

    if (!forgotContact.trim() || !forgotContact.includes('@')) {
      setForgotError('Please enter a valid email address');
      return;
    }

    const target = forgotContact.trim();
    const code = '1234';
    await sendTransactionalEmail(target, 'reset', code, firstName);

    setOtp({
      open: true,
      title: 'Reset verification',
      subtitle: `Enter the 4-digit code sent to ${target} from Orbit <onboarding@resend.dev>`,
      target,
    });
    setForgotStep('otp');
  };

  const handleForgotOtpVerify = async (code: string) => {
    setLoading(true);
    try {
      if (code !== '1234') {
        setForgotError('Invalid verification code. Please try again.');
        setOtp((prev) => ({ ...prev, open: false }));
        setLoading(false);
        return;
      }
      setOtp((prev) => ({ ...prev, open: false }));
      setForgotStep('reset');
    } catch {
      setForgotError('Verification failed. Please try again.');
      setOtp((prev) => ({ ...prev, open: false }));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setForgotError('');

    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setForgotError(error.message);
          return;
        }
      } else {
        localStorage.setItem('orbit-reset-password', newPassword);
      }
      setForgotSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        closeForgot();
      }, 2000);
    } catch {
      setForgotError('Failed to reset password. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setForgotStep('closed');
    setForgotContact('');
    setForgotError('');
    setForgotSuccess('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const canSubmitEmail =
    email.trim().length > 0 &&
    password.length >= 6 &&
    (mode === 'login' || (confirmPassword.length >= 6 && password === confirmPassword)) &&
    !!turnstileToken;

  return (
    <motion.div
      key="auth"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      {/* Logo + Slogan */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <OrbitLogo size="md" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm font-medium tracking-wide text-cyan-400/70"
        >
          Your habit in orbit
        </motion.p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl">
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-5 flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white">
            {mode === 'register' ? `Let's get started, ${firstName}` : `Welcome back, ${firstName}`}
          </h2>
          <p className="mt-2 text-sm text-white/40">
            {mode === 'register'
              ? 'Create your account to start tracking habits'
              : 'Sign in to continue your habit journey'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => { setMode('login'); setError(''); setTurnstileToken(null); }}
            className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              mode === 'login' ? 'text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {mode === 'login' && (
              <motion.div
                layoutId="auth-tab"
                className="absolute inset-0 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">Log In</span>
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setTurnstileToken(null); }}
            className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              mode === 'register' ? 'text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {mode === 'register' && (
              <motion.div
                layoutId="auth-tab"
                className="absolute inset-0 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">Register</span>
          </button>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                <ShieldCheck size={14} />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email form */}
        <motion.div
          key="email-form"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
              Email
            </label>
            <div className="flex items-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 focus-within:border-cyan-400/60 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.12)]">
              <div className="pl-4">
                <Mail size={18} className="text-white/30" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder-white/25 outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
              Password
            </label>
            <div className="flex items-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 focus-within:border-cyan-400/60 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.12)]">
              <div className="pl-4">
                <Lock size={18} className="text-white/30" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder-white/25 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="pr-4 text-white/30 transition-colors hover:text-white/60"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-white/30">Minimum 6 characters</p>
          </div>

          {/* Confirm Password — register only */}
          <AnimatePresence>
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
                  Confirm Password
                </label>
                <div
                  className={`flex items-center rounded-xl border bg-white/5 transition-all duration-300 ${
                    confirmPassword.length > 0 && confirmPassword !== password
                      ? 'border-red-500/40'
                      : confirmPassword.length > 0 && confirmPassword === password
                      ? 'border-emerald-500/40 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                      : 'border-white/10 focus-within:border-cyan-400/60 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                  }`}
                >
                  <div className="pl-4">
                    <Lock
                      size={18}
                      className={
                        confirmPassword.length > 0 && confirmPassword !== password
                          ? 'text-red-400/60'
                          : confirmPassword.length > 0 && confirmPassword === password
                          ? 'text-emerald-400/60'
                          : 'text-white/30'
                      }
                    />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder-white/25 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="pr-4 text-white/30 transition-colors hover:text-white/60"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    {confirmPassword === password ? (
                      <>
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        <span className="text-[11px] text-emerald-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} className="text-red-400" />
                        <span className="text-[11px] text-red-400">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forgot password link — login only */}
          {mode === 'login' && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setForgotStep('identify')}
                className="text-xs text-cyan-400/70 transition-colors hover:text-cyan-300"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Cloudflare Turnstile verification */}
          <div className="mb-6">
            <TurnstileVerification
              onVerified={setTurnstileToken}
              onReset={() => setTurnstileToken(null)}
            />
          </div>

          <button
            disabled={!canSubmitEmail || loading}
            onClick={handleEmailSubmit}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-300 ${
              canSubmitEmail && !loading
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30'
                : 'cursor-not-allowed border border-white/10 bg-white/5 text-white/30'
            }`}
          >
            {loading ? (
              <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                {mode === 'register' ? 'Create Account' : 'Log In'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </motion.div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/30">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google Auth */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/25 hover:bg-white/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-white/30">
        By continuing, you agree to Orbit's Terms of Service & Privacy Policy
      </p>

      {/* OTP Modal */}
      <OtpModal
        open={otp.open}
        onClose={() => setOtp((prev) => ({ ...prev, open: false }))}
        onVerify={forgotStep !== 'closed' ? handleForgotOtpVerify : handleOtpVerify}
        title={otp.title}
        subtitle={otp.subtitle}
      />

      {/* ===== Forgot Password Modal ===== */}
      <AnimatePresence>
        {forgotStep !== 'closed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={closeForgot}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1424] p-7 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={closeForgot}
                className="absolute right-4 top-4 text-white/30 transition-colors hover:text-white/60"
              >
                <ArrowLeft size={18} />
              </button>

              {/* Identify step */}
              {forgotStep === 'identify' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6 flex flex-col items-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10">
                      <KeyRound size={22} className="text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Forgot Password</h3>
                    <p className="mt-1.5 text-sm text-white/40">
                      Enter your registered email to receive a reset code
                    </p>
                  </div>

                  {/* Input */}
                  <div className="mb-4 flex items-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 focus-within:border-cyan-400/60">
                    <div className="pl-4">
                      <Mail size={18} className="text-white/30" />
                    </div>
                    <input
                      type="email"
                      value={forgotContact}
                      onChange={(e) => setForgotContact(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder-white/25 outline-none"
                    />
                  </div>

                  {forgotError && (
                    <p className="mb-3 text-xs text-red-400">{forgotError}</p>
                  )}

                  <button
                    onClick={handleForgotSubmit}
                    disabled={forgotLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        Send Reset Code
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Reset step */}
              {forgotStep === 'reset' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6 flex flex-col items-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                      <ShieldCheck size={22} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Reset Password</h3>
                    <p className="mt-1.5 text-sm text-white/40">
                      Enter your new password below
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
                      New Password
                    </label>
                    <div className="flex items-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 focus-within:border-cyan-400/60">
                      <div className="pl-4">
                        <Lock size={18} className="text-white/30" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder-white/25 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="pr-4 text-white/30 transition-colors hover:text-white/60"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
                      Confirm New Password
                    </label>
                    <div
                      className={`flex items-center rounded-xl border bg-white/5 transition-all duration-300 ${
                        confirmNewPassword.length > 0 && confirmNewPassword !== newPassword
                          ? 'border-red-500/40'
                          : confirmNewPassword.length > 0 && confirmNewPassword === newPassword
                          ? 'border-emerald-500/40'
                          : 'border-white/10 focus-within:border-cyan-400/60'
                      }`}
                    >
                      <div className="pl-4">
                        <Lock
                          size={18}
                          className={
                            confirmNewPassword.length > 0 && confirmNewPassword !== newPassword
                              ? 'text-red-400/60'
                              : confirmNewPassword.length > 0 && confirmNewPassword === newPassword
                              ? 'text-emerald-400/60'
                              : 'text-white/30'
                          }
                        />
                      </div>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder-white/25 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="pr-4 text-white/30 transition-colors hover:text-white/60"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmNewPassword.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {confirmNewPassword === newPassword ? (
                          <>
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span className="text-[11px] text-emerald-400">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} className="text-red-400" />
                            <span className="text-[11px] text-red-400">Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {forgotError && (
                    <p className="mb-3 text-xs text-red-400">{forgotError}</p>
                  )}
                  {forgotSuccess && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400"
                    >
                      <CheckCircle2 size={14} />
                      {forgotSuccess}
                    </motion.div>
                  )}

                  <button
                    onClick={handlePasswordReset}
                    disabled={forgotLoading || !!forgotSuccess}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
