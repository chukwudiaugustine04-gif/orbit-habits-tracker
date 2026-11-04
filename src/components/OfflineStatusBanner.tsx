import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CloudUpload, WifiOff } from 'lucide-react';
import { loadPendingCompletions } from '@/lib/offlineSync';

export default function OfflineStatusBanner() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const pending = loadPendingCompletions().length;
  if (online && pending === 0) return null;

  const offline = !online;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      className="mb-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs"
      style={{
        borderColor: offline ? 'rgba(251,191,36,0.35)' : 'var(--border-active)',
        background: offline ? 'rgba(251,191,36,0.08)' : 'var(--accent-glow)',
        color: offline ? '#fcd34d' : 'var(--accent-primary)',
      }}
    >
      {offline ? <WifiOff size={15} className="flex-shrink-0" /> : <CloudUpload size={15} className="flex-shrink-0" />}
      <span>
        {offline
          ? `You're offline. Completions are saved on this device and will sync when you reconnect.`
          : `Syncing ${pending} offline ${pending === 1 ? 'completion' : 'completions'}...`}
      </span>
    </motion.div>
  );
}
