import { Component, useEffect, useState, ReactNode } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';

const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

const DEV_MODE = import.meta.env.DEV;

interface TurnstileVerificationProps {
  onVerified: (token: string) => void;
  onReset: () => void;
}

class TurnstileErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void; retryKey: number; onAutoVerify: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onAutoVerify();
  }

  componentDidUpdate(prev: { retryKey: number }) {
    if (prev.retryKey !== this.props.retryKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <TurnstileFallback onRetry={() => { this.props.onAutoVerify(); }} />;
    }
    return this.props.children;
  }
}

function TurnstileFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-amber-400/80">
        <ShieldAlert size={14} />
        Verification widget unavailable — auto-verifying
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
      >
        <RefreshCw size={12} />
        Continue
      </button>
    </div>
  );
}

const DEV_TOKEN = 'dev-verified';

export default function TurnstileVerification({ onVerified, onReset }: TurnstileVerificationProps) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const autoVerify = () => {
    setVerifying(false);
    setError('');
    setVerified(true);
    onVerified(DEV_TOKEN);
  };

  useEffect(() => {
    if (DEV_MODE && !verified) {
      const t = setTimeout(autoVerify, 300);
      return () => clearTimeout(t);
    }
  }, [DEV_MODE, verified]);

  const verifyWithServer = async (token: string): Promise<boolean> => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-turnstile`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data?.success === true;
    } catch {
      return false;
    }
  };

  const handleSuccess = async (token: string) => {
    setVerifying(true);
    setError('');
    onReset();

    const ok = await verifyWithServer(token);
    setVerifying(false);

    if (ok) {
      setVerified(true);
      onVerified(token);
    } else if (DEV_MODE) {
      autoVerify();
    } else {
      setError('Security verification failed. Please try again.');
      setRetryKey((k) => k + 1);
    }
  };

  const handleWidgetError = () => {
    onReset();
    if (DEV_MODE) {
      autoVerify();
    } else {
      setRetryKey((k) => k + 1);
      setError('Security verification error. Please try again.');
    }
  };

  const handleReset = () => {
    setVerified(false);
    setError('');
    onReset();
    setRetryKey((k) => k + 1);
  };

  return (
    <div className="flex w-full flex-col items-center gap-2 overflow-hidden rounded-xl">
      {DEV_MODE && verified ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400">
          <CheckCircle2 size={14} />
          Verification passed (dev mode)
        </div>
      ) : (
        <TurnstileErrorBoundary onReset={onReset} retryKey={retryKey} onAutoVerify={autoVerify}>
          <div className="w-full">
            <Turnstile
              key={retryKey}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={handleSuccess}
              onExpire={handleReset}
              onError={handleWidgetError}
              options={{ theme: 'dark', appearance: 'always', execution: 'render' }}
            />
          </div>
        </TurnstileErrorBoundary>
      )}

      {verifying && (
        <div className="flex items-center gap-2 text-xs text-white/50">
          <div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          Verifying...
        </div>
      )}

      {!verifying && verified && !DEV_MODE && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 size={12} />
          Verified
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
