import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ArrowRight } from 'lucide-react';

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  onVerify: (code: string) => void;
  title: string;
  subtitle: string;
}

export default function OtpModal({ open, onClose, onVerify, title, subtitle }: OtpModalProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setError('');
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < 3) {
      const el = document.getElementById(`otp-${index + 1}`);
      el?.focus();
    }

    if (next.every((d) => d !== '')) {
      const code = next.join('');
      onVerify(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const el = document.getElementById(`otp-${index - 1}`);
      el?.focus();
    }
  };

  const handleClose = () => {
    setDigits(['', '', '', '']);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1424] p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-white/30 transition-colors hover:text-white/60"
            >
              <X size={20} />
            </button>

            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10">
                <ShieldCheck size={22} className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm text-white/40">{subtitle}</p>
            </div>

            <div className="mb-5 flex justify-center gap-3">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`h-14 w-12 rounded-xl border bg-white/5 text-center text-xl font-bold text-white outline-none transition-all duration-200 ${
                    error
                      ? 'border-red-500/50'
                      : digit
                      ? 'border-cyan-400/60 bg-cyan-500/10'
                      : 'border-white/10 focus:border-cyan-400/50'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="mb-4 text-center text-xs text-red-400">{error}</p>
            )}

            <p className="mb-5 text-center text-xs text-white/30">
              Didn't receive a code?{' '}
              <span className="cursor-pointer font-medium text-cyan-400 hover:text-cyan-300">
                Resend
              </span>
            </p>

            <button
              onClick={() => {
                const code = digits.join('');
                if (code.length === 4) {
                  onVerify(code);
                } else {
                  setError('Please enter all 4 digits');
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30"
            >
              Verify Code
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
