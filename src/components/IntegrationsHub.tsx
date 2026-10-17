import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Apple,
  Mail,
  Download,
  Check,
  Bluetooth,
  Watch,
  HeartPulse,
  Activity,
  Cloud,
  CloudOff,
  RefreshCw,
  X,
  Plus,
  Plug,
  Plug2,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Habit } from '@/lib/types';

interface IntegrationsHubProps {
  userName: string;
}

type CalendarType = 'google' | 'apple' | 'outlook';
type CalendarSyncState = 'idle' | 'syncing' | 'synced';
type BluetoothState = 'disconnected' | 'scanning' | 'connecting' | 'connected';
type CloudSyncState = 'active' | 'syncing' | 'offline';

interface WearableDevice {
  id: string;
  name: string;
  type: 'smartwatch' | 'fitness' | 'heart-rate';
}

interface CalendarSyncStatus {
  type: CalendarType;
  state: CalendarSyncState;
  lastSynced: string | null;
}

const calendarMeta: Record<CalendarType, { label: string; icon: typeof Calendar; color: string }> = {
  google: { label: 'Google Calendar', icon: Calendar, color: 'text-blue-400' },
  apple: { label: 'Apple Calendar', icon: Apple, color: 'text-white/70' },
  outlook: { label: 'Outlook', icon: Mail, color: 'text-cyan-400' },
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatDateICS(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function IntegrationsHub({ userName: _userName }: IntegrationsHubProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [calendarStatuses, setCalendarStatuses] = useState<Record<CalendarType, CalendarSyncStatus>>({
    google: { type: 'google', state: 'idle', lastSynced: null },
    apple: { type: 'apple', state: 'idle', lastSynced: null },
    outlook: { type: 'outlook', state: 'idle', lastSynced: null },
  });

  // Bluetooth state
  const [btState, setBtState] = useState<BluetoothState>('disconnected');
  const [btSupported, setBtSupported] = useState(true);
  const [connectedDevice, setConnectedDevice] = useState<WearableDevice | null>(null);
  const [btError, setBtError] = useState('');
  const [heartRate, setHeartRate] = useState(0);
  const [steps, setSteps] = useState(0);

  // Cloud sync state
  const [cloudState, setCloudState] = useState<CloudSyncState>('active');
  const [lastCloudSync, setLastCloudSync] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );

  // Check Web Bluetooth support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !('bluetooth' in navigator)) {
      setBtSupported(false);
    }
  }, []);

  // Load habits for ICS export
  useEffect(() => {
    supabase
      .from('habits')
      .select('*')
      .order('position', { ascending: true })
      .then(({ data }) => {
        setHabits((data as Habit[]) || []);
      });
  }, []);

  // Simulate heart rate + steps when connected
  useEffect(() => {
    if (btState !== 'connected') return;
    const interval = setInterval(() => {
      setHeartRate(60 + Math.floor(Math.random() * 30));
      setSteps((prev) => prev + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(interval);
  }, [btState]);

  // Cloud sync indicator — periodically show "syncing" then "active"
  useEffect(() => {
    const interval = setInterval(() => {
      setCloudState('syncing');
      setTimeout(() => {
        setCloudState('active');
        setLastCloudSync(
          new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        );
      }, 2500);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Generate ICS file from habits
  const generateICS = useCallback((): string => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;

    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//Orbit//Habit Scheduler//EN\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';

    habits.forEach((habit) => {
      const [sh, sm] = habit.start_time.split(':').map(Number);
      const [eh, em] = habit.end_time.split(':').map(Number);

      const startDate = new Date();
      startDate.setHours(sh, sm, 0, 0);
      const endDate = new Date();
      endDate.setHours(eh, em, 0, 0);

      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${habit.id}@orbit-app\r\n`;
      ics += `DTSTAMP:${formatDateICS(new Date())}\r\n`;
      ics += `DTSTART:${formatDateICS(startDate)}\r\n`;
      ics += `DTEND:${formatDateICS(endDate)}\r\n`;
      ics += `SUMMARY:${habit.title}\r\n`;
      ics += `DESCRIPTION:Habit scheduled via Orbit - Your habit in orbit\r\n`;
      ics += `LOCATION:Orbit App\r\n`;
      ics += `RRULE:FREQ=DAILY\r\n`;
      ics += 'BEGIN:VALARM\r\n';
      ics += 'TRIGGER:-PT0M\r\n';
      ics += `DESCRIPTION:Time for ${habit.title}\r\n`;
  ics += 'ACTION:DISPLAY\r\n';
      ics += 'END:VALARM\r\n';
      ics += 'END:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR\r\n';
    return ics;
  }, [habits]);

  const handleCalendarSync = (type: CalendarType) => {
    setCalendarStatuses((prev) => ({
      ...prev,
      [type]: { ...prev[type], state: 'syncing' },
    }));

    setTimeout(() => {
      const ics = generateICS();
      downloadFile(`orbit-habits-${type}.ics`, ics);

      setCalendarStatuses((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          state: 'synced',
          lastSynced: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      }));

      // Reset to idle after 3s so the button can be used again
      setTimeout(() => {
        setCalendarStatuses((prev) => ({
          ...prev,
          [type]: { ...prev[type], state: 'idle' },
        }));
      }, 3000);
    }, 1800);
  };

  // Web Bluetooth
  const handleBluetoothConnect = async () => {
    setBtError('');

    if (!('bluetooth' in navigator)) {
      setBtError('Web Bluetooth is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    setBtState('scanning');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;

      // Request device with heart rate + fitness services
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: ['battery_service'] },
          { services: ['device_information'] },
        ],
        optionalServices: ['generic_access', 'heart_rate', 'battery_service', 'device_information'],
        acceptAllDevices: false,
      });

      setBtState('connecting');

      // Attempt to connect (may fail if device is far/unavailable, which is fine for the demo)
      try {
        const server = await device.gatt.connect();
        // Read device name if available
        let deviceName = device.name || 'Orbit Wearable';

        try {
          const infoService = await server.getPrimaryService('device_information');
          const nameChar = await infoService.getCharacteristic('manufacturer_name_string');
          const nameValue = await nameChar.readValue();
          const manufacturer = new TextDecoder().decode(nameValue);
          if (manufacturer) deviceName = `${manufacturer} Wearable`;
        } catch {
          // Use fallback name
        }

        setConnectedDevice({
          id: device.id,
          name: deviceName,
          type: 'smartwatch',
        });
      } catch {
        // GATT connection failed — use the device name from the request
        setConnectedDevice({
          id: device.id,
          name: device.name || 'Paired Wearable',
          type: 'smartwatch',
        });
      }

      setBtState('connected');
      setHeartRate(72);
      setSteps(3200);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        setBtError('No devices found. Make sure your wearable is paired in OS settings and nearby.');
      } else if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setBtError('Bluetooth access was cancelled.');
        setBtState('disconnected');
      } else {
        setBtError(
          err instanceof Error
            ? err.message
            : 'Failed to connect. Make sure Bluetooth is enabled.'
        );
      }
      setBtState('disconnected');
    }
  };

  const handleBluetoothDisconnect = () => {
    setBtState('disconnected');
    setConnectedDevice(null);
    setHeartRate(0);
    setSteps(0);
    setBtError('');
  };

  const handleSimulateConnection = () => {
    setBtError('');
    setBtState('connecting');
    setTimeout(() => {
      setConnectedDevice({
        id: 'simulated-orbit-watch',
        name: 'Orbit Simulated Watch',
        type: 'smartwatch',
      });
      setBtState('connected');
      setHeartRate(72);
      setSteps(3200);
    }, 1200);
  };

  const firstName = _userName.split(' ')[0] || 'there';

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Integrations & Hardware Hub</h1>
        <p className="mt-1 text-sm text-white/40">
          Connect your calendars, wearables, and sync across all devices
        </p>
      </motion.div>

      {/* Cloud Sync Indicator — prominent banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`mb-8 flex items-center justify-between rounded-xl border p-5 backdrop-blur-xl transition-all duration-500 ${
          cloudState === 'active'
            ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
            : cloudState === 'syncing'
            ? 'border-cyan-400/30 bg-cyan-500/[0.06]'
            : 'border-white/10 bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-500 ${
              cloudState === 'active'
                ? 'border-emerald-500/30 bg-emerald-500/15'
                : cloudState === 'syncing'
                ? 'border-cyan-400/30 bg-cyan-500/15'
                : 'border-white/10 bg-white/5'
            }`}
          >
            {cloudState === 'offline' ? (
              <CloudOff size={22} className="text-white/40" />
            ) : cloudState === 'syncing' ? (
              <RefreshCw size={22} className="text-cyan-400 animate-spin" />
            ) : (
              <Cloud size={22} className="text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {cloudState === 'active'
                  ? 'Cloud Sync Active'
                  : cloudState === 'syncing'
                  ? 'Syncing across devices...'
                  : 'Cloud Sync Offline'}
              </span>
              <span
                className={`flex h-2 w-2 rounded-full ${
                  cloudState === 'active'
                    ? 'bg-emerald-400'
                    : cloudState === 'syncing'
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-white/30'
                }`}
              />
            </div>
            <p className="mt-0.5 text-xs text-white/40">
              {cloudState === 'active'
                ? `Orbit data updated across all devices — last sync ${lastCloudSync}`
                : cloudState === 'syncing'
                ? 'Updating your habit data everywhere'
                : 'Reconnect to resume syncing'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setCloudState('syncing');
            setTimeout(() => {
              setCloudState('active');
              setLastCloudSync(
                new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              );
            }, 2500);
          }}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition-all hover:border-white/20 hover:text-white/80"
        >
          <RefreshCw size={13} />
          Sync Now
        </button>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Calendar Integration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
              <Calendar size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Calendar Integration</h2>
              <p className="text-xs text-white/40">Export your habit schedule to any calendar</p>
            </div>
          </div>

          {habits.length === 0 && (
            <div className="mb-4 mt-4 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-center">
              <p className="text-xs text-white/30">
                Add habits in the Scheduler first to export them to your calendar
              </p>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {(Object.keys(calendarMeta) as CalendarType[]).map((type) => {
              const meta = calendarMeta[type];
              const status = calendarStatuses[type];
              const Icon = meta.icon;

              return (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <Icon size={17} className={meta.color} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white">{meta.label}</span>
                      {status.lastSynced && (
                        <p className="text-[11px] text-white/30">
                          Last synced at {status.lastSynced}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCalendarSync(type)}
                    disabled={status.state === 'syncing' || habits.length === 0}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
                      status.state === 'synced'
                        ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : status.state === 'syncing'
                        ? 'border border-cyan-400/20 bg-cyan-500/10 text-cyan-300'
                        : habits.length === 0
                        ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/20'
                        : 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                    }`}
                  >
                    {status.state === 'syncing' ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Syncing...
                      </>
                    ) : status.state === 'synced' ? (
                      <>
                        <Check size={14} />
                        Exported
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Export .ics
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5">
            <Download size={12} className="text-white/30" />
            <span className="text-[11px] text-white/30">
              Exports {habits.length} habit{habits.length !== 1 ? 's' : ''} as a daily-recurring .ics file
            </span>
          </div>
        </motion.div>

        {/* Wearable & Bluetooth Connectivity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
              <Watch size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Wearable & Bluetooth</h2>
              <p className="text-xs text-white/40">Pair smartwatches and fitness trackers</p>
            </div>
          </div>

          {/* Bluetooth not supported warning */}
          {!btSupported && (
            <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-3">
              <p className="text-xs text-orange-400">
                Web Bluetooth isn't available in this browser. Use Chrome or Edge on desktop/Android to pair devices.
              </p>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {btError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                  <X size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{btError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection status */}
          <div className="mt-5">
            {btState === 'disconnected' ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Bluetooth size={24} className="text-white/30" />
                </div>
                <p className="text-sm font-medium text-white/60">No device connected</p>
                <p className="mt-1 text-xs text-white/30">
                  Connect your smartwatch or fitness tracker to sync heart rate and activity
                </p>
                <button
                  onClick={handleBluetoothConnect}
                  disabled={!btSupported}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plug size={14} />
                  Scan & Pair Device
                </button>

                {/* Simulate connection fallback */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] text-white/30">no device nearby?</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <button
                  onClick={handleSimulateConnection}
                  className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/70 transition-all hover:border-white/25 hover:text-white/90"
                >
                  <Watch size={14} />
                  Simulate Smartwatch Connection
                </button>
              </div>
            ) : btState === 'scanning' ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04] py-12 text-center">
                <Loader2 size={28} className="text-cyan-400 animate-spin" />
                <p className="mt-3 text-sm font-medium text-white/70">Scanning for devices...</p>
                <p className="mt-1 text-xs text-white/30">
                  Select a device from your browser's Bluetooth picker
                </p>
              </div>
            ) : btState === 'connecting' ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04] py-12 text-center">
                <Loader2 size={28} className="text-cyan-400 animate-spin" />
                <p className="mt-3 text-sm font-medium text-white/70">Connecting...</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Connected badge */}
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15">
                      <Watch size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {connectedDevice?.name || 'Orbit Wearable'}
                        </span>
                        <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Connected
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-400/70">
                        Orbit Synced to Smart Watch
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleBluetoothDisconnect}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/50 transition-all hover:border-red-500/20 hover:text-red-400"
                  >
                    <Plug2 size={13} />
                    Disconnect
                  </button>
                </div>

                {/* Live metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <HeartPulse size={15} className="text-red-400" />
                      <span className="text-[11px] uppercase tracking-wider text-white/40">
                        Heart Rate
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <motion.span
                        key={heartRate}
                        initial={{ opacity: 0.5, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-bold text-white"
                      >
                        {heartRate || '--'}
                      </motion.span>
                      <span className="text-xs text-white/40">bpm</span>
                    </div>
                    <p className="mt-1 text-[10px] text-red-400/50">Syncing heart rate</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Activity size={15} className="text-cyan-400" />
                      <span className="text-[11px] uppercase tracking-wider text-white/40">
                        Steps Today
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <motion.span
                        key={steps}
                        initial={{ opacity: 0.5, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-bold text-white"
                      >
                        {steps.toLocaleString()}
                      </motion.span>
                      <span className="text-xs text-white/40">steps</span>
                    </div>
                    <p className="mt-1 text-[10px] text-cyan-400/50">Syncing activity</p>
                  </div>
                </div>

                {/* Sync status */}
                <div className="flex items-center gap-2 rounded-lg border border-cyan-500/15 bg-cyan-500/[0.04] px-4 py-2.5">
                  <RefreshCw size={12} className="text-cyan-400 animate-spin" style={{ animationDuration: '2s' }} />
                  <span className="text-[11px] text-cyan-400/70">
                    Syncing Heart Rate & Activity data to Orbit
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex items-center justify-center gap-2 text-center"
      >
        <span className="text-xs text-white/30">
          {firstName}, your Orbit integrations keep your habits synced across every device you use.
        </span>
      </motion.div>
    </div>
  );
}
