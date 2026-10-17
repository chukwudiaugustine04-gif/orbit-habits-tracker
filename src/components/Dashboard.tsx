import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import TaskScheduler from './TaskScheduler';
import IntegrationsHub from './IntegrationsHub';
import PerformanceDashboard from './PerformanceDashboard';
import ThemeSettings from './ThemeSettings';
import type { InterfaceTab } from '@/lib/types';

interface DashboardProps {
  userName: string;
  userId: string;
  onSignOut: () => void;
}

export default function Dashboard({ userName, userId, onSignOut }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<InterfaceTab>('scheduler');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
    >
      <Header
        onSignOut={onSignOut}
        logoSize="sm"
        userName={userName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <AnimatePresence mode="wait">
        {activeTab === 'scheduler' && (
          <motion.div
            key="scheduler"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <TaskScheduler userId={userId} userName={userName} />
          </motion.div>
        )}
        {activeTab === 'integrations' && (
          <motion.div
            key="integrations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <IntegrationsHub userName={userName} />
          </motion.div>
        )}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <PerformanceDashboard userName={userName} />
          </motion.div>
        )}
        {activeTab === 'themes' && (
          <motion.div
            key="themes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <ThemeSettings userName={userName} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
