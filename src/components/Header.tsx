import { useState } from 'react';
import OrbitLogo from './OrbitLogo';
import { LogOut, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InterfaceTab } from '@/lib/types';

interface HeaderProps {
  showSlogan?: boolean;
  onSignOut?: () => void;
  logoSize?: 'sm' | 'md' | 'lg';
  userName?: string;
  activeTab?: InterfaceTab;
  onTabChange?: (tab: InterfaceTab) => void;
}

const navTabs: { id: InterfaceTab; label: string }[] = [
  { id: 'scheduler', label: 'Scheduler' },
  { id: 'health', label: 'Health' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'themes', label: 'Themes' },
];

export default function Header({
  showSlogan = true,
  onSignOut,
  logoSize = 'sm',
  userName,
  activeTab,
  onTabChange,
}: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initials = userName
    ? userName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const handleTabClick = (tab: InterfaceTab) => {
    onTabChange?.(tab);
    setDrawerOpen(false);
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--header-bg)' }}
      >
        <div className="mx-auto max-w-7xl px-6">
          {/* Top row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <OrbitLogo size={logoSize} showText={false} />
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Orbit
                </span>
                {showSlogan && (
                  <span
                    className="text-[10px] font-medium tracking-wide"
                    style={{ color: 'var(--accent-primary)', opacity: 0.7 }}
                  >
                    Your habit in orbit
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* User profile */}
              <div className="flex items-center gap-2.5">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {userName || 'User'}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    In Orbit
                  </p>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ border: '1px solid var(--border-active)', background: 'var(--accent-glow)' }}
                >
                  {userName ? (
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {initials}
                    </span>
                  ) : (
                    <User size={16} style={{ color: 'var(--accent-primary)' }} />
                  )}
                </div>
              </div>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all hover:opacity-80 sm:flex"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              )}

              {/* Mobile hamburger */}
              {onTabChange && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:opacity-80 lg:hidden"
                  style={{ color: 'var(--text-primary)' }}
                  aria-label="Open menu"
                >
                  <Menu size={22} />
                </button>
              )}
            </div>
          </div>

          {/* Desktop nav tabs */}
          {onTabChange && (
            <nav className="hidden gap-1 lg:flex">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id ? '' : 'hover:opacity-80'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="nav-tab-indicator"
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                      style={{
                        background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span
                    style={{
                      color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
            </nav>
          )}

          {/* Mobile horizontal-scrolling nav bar */}
          {onTabChange && (
            <nav
              className="flex gap-1 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Mobile navigation"
            >
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="relative flex-shrink-0 whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors"
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="nav-tab-indicator-mobile"
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                      style={{
                        background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span
                    style={{
                      color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 h-full w-72 overflow-y-auto lg:hidden"
              style={{ background: 'var(--bg-base)', borderLeft: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5">
                  <OrbitLogo size="sm" showText={false} />
                  <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Orbit
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex flex-col gap-1 p-4">
                {navTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all"
                    style={{
                      background: activeTab === tab.id ? 'var(--accent-glow)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="drawer-tab-indicator"
                        className="ml-auto h-1.5 w-1.5 rounded-full"
                        style={{ background: 'var(--accent-primary)' }}
                      />
                    )}
                  </button>
                ))}
              </nav>

              {/* User + sign out */}
              <div className="mt-4 p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ border: '1px solid var(--border-active)', background: 'var(--accent-glow)' }}
                  >
                    <span className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {initials}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {userName || 'User'}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      In Orbit
                    </p>
                  </div>
                </div>
                {onSignOut && (
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      onSignOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
