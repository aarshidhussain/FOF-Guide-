import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, TreeDeciduous, BookOpen, Map as MapIcon, GraduationCap, LogOut } from 'lucide-react';
import { AppTab } from '../lib/types';
import { useAuth } from './FirebaseProvider';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user, logout } = useAuth();
  const tabs: { id: AppTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'species', label: 'Trees', icon: TreeDeciduous },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'research', label: 'Research', icon: GraduationCap },
    { id: 'map', label: 'Map', icon: MapIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-2xl relative">
      {/* Header */}
      <header className="p-6 bg-forest-900 text-white rounded-b-3xl shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <TreeDeciduous className="w-8 h-8 text-forest-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Welcome to Forestry</h1>
              <p className="text-[10px] text-forest-200 font-bold uppercase tracking-[0.2em]">Forestry Companion</p>
            </div>
          </div>
          {user && (
            <button 
              onClick={logout}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-forest-300" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-forest-900/90 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/10 z-50">
        <ul className="flex justify-between items-center px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id} className="relative">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center p-2 transition-all duration-300 ${
                    isActive ? 'text-forest-200 scale-110' : 'text-white/60'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute -bottom-1 w-1 h-1 bg-forest-200 rounded-full"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
