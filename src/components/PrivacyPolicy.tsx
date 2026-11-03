import { Shield, Mail, Lock, Database, Eye, ExternalLink, Clock, KeyRound, Trash2, Server } from 'lucide-react';
import OrbitLogo from './OrbitLogo';

export default function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-emerald-600/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center gap-3">
          <OrbitLogo size="md" />
          <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Policy</h1>
          <p className="text-sm text-white/40">Last updated: November 3, 2026</p>
        </div>

        <div className="space-y-6">
          {/* Intro / About */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">1. About Orbit Habit Tracker</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Orbit Habit Tracker ("Orbit", "we", "us", or "the app") is a personal habit-tracking
              and productivity application available at{' '}
              <a
                href="https://orbit-habits-tracker.vercel.app"
                className="text-cyan-400 underline hover:text-cyan-300"
                rel="noopener noreferrer"
                target="_blank"
              >
                https://orbit-habits-tracker.vercel.app
                <ExternalLink size={11} className="ml-0.5 inline" />
              </a>
              . It allows users to create sequential daily habits, set timed alarms, track streaks,
              and monitor progress over time. This Privacy Policy describes what data we collect,
              how we use and protect it, and the rights you have over your information.
            </p>
          </section>

          {/* Authentication — Google OAuth */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">2. Authentication &amp; Google OAuth</h2>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/60">
              Orbit uses Google OAuth exclusively for account creation and login. When you sign in
              with your Google account, Google authenticates you on its own secure infrastructure
              and shares the following basic profile information with us:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Name</strong> — your display name from your Google profile, used to personalize your experience.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Email address</strong> — used to uniquely identify your account and enable sign-in.</span>
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              We do <strong className="text-white/80">not</strong> receive or store your Google
              password at any point. The OAuth flow grants us only a limited token to verify your
              identity — Google manages authentication entirely on its end. We also do not request
              access to your Google contacts, calendar, documents, or any other Google service
              data beyond basic profile scope.
            </p>
          </section>

          {/* Data we collect */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Eye size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">3. Data We Collect</h2>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/60">
              In addition to the basic profile data received via Google OAuth (name and email), the
              app collects and stores the following user-generated content as you use Orbit:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Habits &amp; Tasks</strong> — the habits you create, including titles, start times, end times, categories, and ordering.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Timers &amp; Alarms</strong> — alarm settings, snooze durations, and sound preferences you configure for each habit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Completion logs</strong> — records of which habits you completed and on which dates, used to calculate streaks and analytics.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">App preferences</strong> — theme selection, avatar choice, and auto-logout settings stored in your browser's local storage.</span>
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              We do <strong className="text-white/80">not</strong> collect location data, browsing
              history, device identifiers, biometric data, or any information beyond what is listed
              above. Custom alarm audio files you upload are stored locally in your browser's
              IndexedDB and never transmitted to our servers.
            </p>
          </section>

          {/* Data storage & RLS */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Database size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">4. Data Storage &amp; Row Level Security (RLS)</h2>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/60">
              All user data — including tasks, habits, timers, alarms, and completion logs — is
              stored securely in a <strong className="text-white/80">Supabase</strong> PostgreSQL
              database. Supabase provides enterprise-grade encryption both in transit (TLS) and at
              rest, ensuring your data is protected at all times.
            </p>
            <p className="mb-3 text-sm leading-relaxed text-white/60">
              Critically, every table in our database has{' '}
              <strong className="text-white/80">Row Level Security (RLS)</strong> enabled with
              per-user ownership policies. This means:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span>Each habit, task, timer, and completion log is tied specifically to your unique authenticated user ID.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span>You can <strong className="text-white/80">only</strong> see, create, edit, and delete your own data — the database enforces this at the row level, not just in the app interface.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span>No user can access, query, or modify another user's tasks, habits, alarms, or history — even with direct database access.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span>If you sign in with a different Google account, you start with a completely fresh, empty workspace — no data carries over between accounts.</span>
              </li>
            </ul>
          </section>

          {/* How we use data */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">5. How We Use Your Data</h2>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/60">
              Your data is used exclusively to provide and improve the core features of Orbit Habit Tracker:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span>Displaying your habits, schedules, and completion history within the app.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span>Triggering alarms and notifications at your configured times.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span>Calculating streaks, progress, and analytics for your personal dashboard.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span>Saving your theme, avatar, and alarm preferences so they persist across sessions.</span>
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              We do <strong className="text-white/80">not</strong> sell, rent, trade, or share your
              personal data with any third party. We do not use your data for advertising, profiling,
              or any purpose outside of running the app.
            </p>
          </section>

          {/* Security */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Lock size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">6. Data Security</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="mt-3 ml-4 space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span><strong className="text-white/80">Encryption in transit</strong> — all communication between your browser and our servers is encrypted via TLS/HTTPS.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span><strong className="text-white/80">Encryption at rest</strong> — Supabase encrypts stored data at the infrastructure level.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span><strong className="text-white/80">Row Level Security</strong> — database-level access control ensures no user can read or write another user's data.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span><strong className="text-white/80">No password storage</strong> — authentication is handled entirely by Google OAuth. We never receive or store your password.</span>
              </li>
            </ul>
          </section>

          {/* Third-party services */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Server size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">7. Third-Party Services</h2>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/60">
              Orbit relies on the following third-party services to function:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Google OAuth</strong> — handles user authentication. Google's Privacy Policy applies to the data processed during sign-in.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Supabase</strong> — provides the database, authentication backend, and hosting infrastructure. Supabase complies with GDPR and SOC 2 standards.</span>
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              We do not share your personal data with any advertising networks, analytics trackers,
              or data brokers.
            </p>
          </section>

          {/* Your rights */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">8. Your Rights &amp; Data Control</h2>
            </div>
            <ul className="ml-4 space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Access</strong> — you can view all your habits, tasks, and completion history within the app at any time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Deletion in-app</strong> — you can delete individual habits and completion records directly within the app at any time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Full account deletion</strong> — to permanently delete your account and all associated data, contact us at the email below and we will remove everything within 72 hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Data export</strong> — you may request an export of your data by contacting us.</span>
              </li>
            </ul>
          </section>

          {/* Data retention */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Trash2 size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">9. Data Retention</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Your data is retained for as long as your account is active. When you delete a habit or
              completion record, it is immediately removed from the database. If you request full
              account deletion, all of your data — habits, tasks, timers, completion logs, and
              profile information — will be permanently erased from our servers. Browser-stored
              preferences (themes, avatars, custom alarm sounds) are cleared when you sign out or
              clear your browser data.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Mail size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">10. Contact Us</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              If you have any questions about this Privacy Policy, want to request access to,
              export of, or deletion of your data, or have any privacy or security concerns, please
              contact our developer support team at:
            </p>
            <a
              href="mailto:chukwudiaugustine04@gmail.com"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-500/20"
            >
              <Mail size={16} />
              chukwudiaugustine04@gmail.com
            </a>
            <p className="mt-4 text-xs leading-relaxed text-white/40">
              You may also use this email to file a formal data deletion request under applicable
              privacy laws (such as GDPR or CCPA). We will respond to all legitimate requests
              within 72 hours.
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-10 flex items-center justify-center">
          <a
            href="/"
            className="text-sm text-white/40 transition-colors hover:text-cyan-400"
          >
            ← Back to Orbit
          </a>
        </div>
      </div>
    </div>
  );
}
