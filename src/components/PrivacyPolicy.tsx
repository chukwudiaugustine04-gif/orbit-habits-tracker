import { Shield, Mail, Lock, Database, Eye, ExternalLink } from 'lucide-react';
import OrbitLogo from './OrbitLogo';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-emerald-600/8 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10 flex flex-col items-center gap-3">
          <OrbitLogo size="md" />
          <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Policy</h1>
          <p className="text-sm text-white/40">Last updated: November 1, 2026</p>
        </div>

        <div className="space-y-8">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">1. About Orbit Habit Tracker</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Orbit Habit Tracker ("Orbit", "we", "us") is a habit-tracking application available at{' '}
              <a
                href="https://orbit-habits-tracker.vercel.app"
                className="text-cyan-400 underline hover:text-cyan-300"
                rel="noopener noreferrer"
                target="_blank"
              >
                https://orbit-habits-tracker.vercel.app
                <ExternalLink size={11} className="ml-0.5 inline" />
              </a>
              . This Privacy Policy explains what data we collect, how we use it, and your rights regarding your information.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Eye size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">2. Data We Collect</h2>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/60">
              We collect minimal profile information solely through Google OAuth authentication for account creation and login:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Name</strong> — your display name, used to personalize your experience.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Email address</strong> — used for authentication and account identification.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">User-generated content</strong> — habits, tasks, schedules, and completion logs you create while using the app.</span>
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              We do <strong className="text-white/80">not</strong> collect location data, browsing history, or any other personal information beyond what is described above.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Database size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">3. How We Use &amp; Store Your Data</h2>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/60">
              Your data — including tasks, habits, schedules, and completion logs — is stored securely in our Supabase database with <strong className="text-white/80">Row Level Security (RLS)</strong> enabled. This means:
            </p>
            <ul className="ml-4 space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span>Each user's data is strictly isolated and tied to their unique authenticated user ID.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span>You can only see, edit, and manage your own tasks, habits, and alarms — never another user's data.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span>Data is encrypted in transit and at rest by Supabase's infrastructure.</span>
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              We use your data exclusively to provide and improve the Orbit Habit Tracker app. We do <strong className="text-white/80">not</strong> sell, rent, or share your personal data with third parties.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Lock size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">4. Data Privacy &amp; Security</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              We implement industry-standard security measures to protect your data. Access to your personal information is restricted to what is necessary for the app to function. All authentication is handled through Google OAuth, and we never store your password — Google manages the authentication process securely on its end.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">5. Your Rights</h2>
            </div>
            <ul className="ml-4 space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Access</strong> — you can view all your data within the app at any time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Deletion</strong> — you can request deletion of your account and all associated data by contacting us at the email below.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                <span><strong className="text-white/80">Account closure</strong> — signing out and deleting your habits within the app removes your task data. For full account deletion, email us.</span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Mail size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">6. Contact Us</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              If you have any questions about this Privacy Policy, want to request access to or deletion of your data, or have any privacy concerns, please contact us at:
            </p>
            <a
              href="mailto:chukwudiaugustine04@gmail.com"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-500/20"
            >
              <Mail size={16} />
              chukwudiaugustine04@gmail.com
            </a>
          </section>
        </div>

        <div className="mt-8 flex items-center justify-center">
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
