import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  User,
  Sparkles,
  CheckCircle2,
  Lock,
  TrendingUp,
  Watch,
  ShieldCheck,
} from 'lucide-react';
import OrbitLogo from './OrbitLogo';
import TurnstileVerification from './TurnstileVerification';

interface OnboardingScreenProps {
  onComplete: (name: string) => void;
}

const featureHighlights = [
  { icon: TrendingUp, label: 'Sequential Habits' },
  { icon: Watch, label: 'Wearable Sync' },
  { icon: ShieldCheck, label: 'Secure Cloud' },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [name, setName] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [focused, setFocused] = useState(false);

  const canContinue = name.trim().length >= 2 && captchaVerified;

  return (
    <motion.div
      key="onboarding"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      {/* Logo + Slogan */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <OrbitLogo size="lg" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm font-medium tracking-wide text-cyan-400/70"
        >
          Your habit in orbit
        </motion.p>
      </div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-6 flex items-center justify-center gap-2"
      >
        {featureHighlights.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
          >
            <f.icon size={12} className="text-cyan-400/70" />
            <span className="text-[10px] font-medium text-white/50">{f.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl"
      >
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        {/* Header */}
        <div className="mb-7 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1">
            <Sparkles size={13} className="text-cyan-400" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-400/80">
              Welcome
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-white">
            Hi there, input your name
          </h2>
          <p className="mt-2 text-sm text-white/40">
            Let's personalize your habit journey
          </p>
        </div>

        {/* Name Input */}
        <div className="mb-5">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
            Your Name
          </label>
          <div
            className={`group relative flex items-center rounded-xl border bg-white/5 transition-all duration-300 ${
              focused
                ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                : name.trim().length >= 2
                ? 'border-emerald-500/30'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="pl-4">
              <User
                size={18}
                className={`transition-colors duration-300 ${
                  focused
                    ? 'text-cyan-400'
                    : name.trim().length >= 2
                    ? 'text-emerald-400'
                    : 'text-white/30'
                }`}
              />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. Alex Morgan"
              className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder-white/25 outline-none"
              maxLength={40}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canContinue) onComplete(name.trim());
              }}
            />
            {name.length > 0 && (
              <div className="pr-4">
                {name.trim().length >= 2 ? (
                  <CheckCircle2 size={16} className="text-emerald-400/70" />
                ) : (
                  <span className="text-[11px] text-white/30">{name.length}/40</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cloudflare Turnstile verification */}
        <div className="mb-6">
          <TurnstileVerification
            onVerified={() => setCaptchaVerified(true)}
            onReset={() => setCaptchaVerified(false)}
          />
        </div>

        {/* Continue Button */}
        <motion.button
          type="button"
          disabled={!canContinue}
          onClick={() => canContinue && onComplete(name.trim())}
          whileHover={canContinue ? { scale: 1.02 } : undefined}
          whileTap={canContinue ? { scale: 0.98 } : undefined}
          className={`group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-300 ${
            canContinue
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30'
              : 'cursor-not-allowed border border-white/10 bg-white/5 text-white/30'
          }`}
        >
          {canContinue ? (
            <>
              Continue to Authentication
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </>
          ) : (
            <>
              <Lock size={15} />
              Complete name & verification
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Trust indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 flex items-center justify-center gap-4"
      >
        <div className="flex items-center gap-1.5 text-[11px] text-white/30">
          <ShieldCheck size={12} className="text-cyan-400/40" />
          End-to-end encrypted
        </div>
        <div className="h-3 w-px bg-white/10" />
        <div className="flex items-center gap-1.5 text-[11px] text-white/30">
          <Lock size={12} className="text-cyan-400/40" />
          Privacy protected
        </div>
      </motion.div>

      {/* Terms */}
      <p className="mt-4 text-center text-xs text-white/25">
        By continuing, you agree to Orbit's Terms of Service & Privacy Policy
      </p>
    </motion.div>
  );
}
