import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import OnboardingScreen from '@/components/OnboardingScreen';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';
import SessionLockScreen from '@/components/SessionLockScreen';
import { supabase } from '@/lib/supabase';
import { applyTheme, type ThemeId } from '@/lib/themes';
import type { Session } from '@supabase/supabase-js';
import { InstallPrompt } from "./components/InstallPrompt";
import { initAlarmNotificationSystem } from "./lib/alarmSettings";

const LOCK_KEY = 'orbit-session-locked';

type Screen = 'onboarding' | 'auth' | 'dashboard';

const NAME_KEY = 'orbit-user-name';
const COUNTRY_KEY = 'orbit-user-country';
const PHONE_KEY = 'orbit-user-phone';

async function syncUserProfile(session: Session, name: string) {
  const user = session.user;
  const email = user.email || user.phone || '';
  const phone = user.phone || localStorage.getItem(PHONE_KEY) || null;
  const countryName = localStorage.getItem(COUNTRY_KEY) || null;

  const googleId = user.app_metadata?.provider === 'google'
    ? user.app_metadata?.provider_id || null
    : null;

  await supabase.from('user_profiles').upsert(
    {
      id: user.id,
      full_name: name,
      email: email || null,
      phone,
      country_name: countryName,
      google_id: googleId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [userName, setUserName] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Session lock: flag the session as locked whenever the tab is hidden,
  // and show the lock screen when the user returns. Only applies once the
  // user is already signed in — the onboarding/auth flow is unaffected.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (session) sessionStorage.setItem(LOCK_KEY, '1');
      } else if (document.visibilityState === 'visible') {
        if (sessionStorage.getItem(LOCK_KEY) === '1' && session) {
          sessionStorage.removeItem(LOCK_KEY);
          setIsLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [session]);

  const handleUnlocked = () => {
    setIsLocked(false);
  };

  useEffect(() => {
    // Initialize the alarm notification system & request permission
  initAlarmNotificationSystem();
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('orbit-theme') as ThemeId | null;
    applyTheme(savedTheme || 'dark-space');

    // Restore session + saved name on load
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);

      if (data.session) {
        const savedName =
          data.session.user?.user_metadata?.full_name ||
          localStorage.getItem(NAME_KEY) ||
          '';
        if (savedName) setUserName(savedName);
        setScreen('dashboard');
      } else {
        const savedName = localStorage.getItem(NAME_KEY);
        if (savedName) {
          setUserName(savedName);
          setScreen('auth');
        }
      }
    });

    // Listen for auth changes (covers Google OAuth redirect)
    supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession) {
          const name =
            newSession.user?.user_metadata?.full_name ||
            localStorage.getItem(NAME_KEY) ||
            '';
          if (name) {
            setUserName(name);
            await syncUserProfile(newSession, name);
          }
          setScreen('dashboard');
        }
      })();
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(NAME_KEY);
    setSession(null);
    setUserName('');
    setScreen('onboarding');
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  // Dashboard doesn't need the animated background
  if (screen === 'dashboard' && session) {
    return (
      <>
        <Dashboard
          userName={userName}
          userId={session.user.id}
          onSignOut={handleSignOut}
        />
        {isLocked && (
          <SessionLockScreen
            email={session.user.email || session.user.phone || ''}
            onUnlocked={handleUnlocked}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a] text-white">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-emerald-600/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full border border-white/5" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[800px] w-[800px] rounded-full border border-white/[0.03]" />
        </div>
      </div>
      
<InstallPrompt />
      
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          {screen === 'onboarding' && (
            <OnboardingScreen
              key="onboarding"
              onComplete={(name) => {
                setUserName(name);
                localStorage.setItem(NAME_KEY, name);
                setScreen('auth');
              }}
            />
          )}
          {screen === 'auth' && (
            <AuthScreen
              key="auth"
              userName={userName}
              onBack={() => setScreen('onboarding')}
              onAuthenticated={() => {
                // Session is set by onAuthStateChange; this is a fallback for OTP flows
                supabase.auth.getSession().then(({ data }) => {
                  if (data.session) {
                    setSession(data.session);
                    const name =
                      data.session.user?.user_metadata?.full_name ||
                      localStorage.getItem(NAME_KEY) ||
                      '';
                    if (name) {
                      syncUserProfile(data.session, name).catch(() => {});
                    }
                    setScreen('dashboard');
                  }
                });
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
