import React from 'react';
import { motion } from 'framer-motion';
import { Home, Library, Search, Settings } from 'lucide-react';
import { useMetadata } from '../context/MetadataContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const { metadata } = useMetadata();

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'search', icon: Search, label: 'Search' },
  ];

  // Responsive Navigation:
  // - Mobile: Bottom Bar
  // - Tablet/Desktop: Side Rail

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-white/90 backdrop-blur-3xl border-t border-black/[0.05] flex items-center justify-around px-4 z-[60] pb-safe-bottom">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center gap-1 group relative w-full h-full"
            >
              <div className={`relative h-8 w-16 flex items-center justify-center rounded-full transition-colors ${isActive ? 'bg-[#EADDFF]' : ''}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-[#21005D]' : 'text-[#49454F]'}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[12px] font-medium transition-colors ${isActive ? 'text-[#1D1B20]' : 'text-[#49454F]'}`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Desktop/iPad Side Rail */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-24 bg-surface-container flex-col items-center py-8 z-[60] border-r border-outline-variant">
         <div className="mb-8">
            {/* App Icon or Logo could go here */}
         </div>
         <div className="flex flex-col gap-4 w-full items-center">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex flex-col items-center justify-center gap-2 group relative w-full p-2"
                    >
                    <div className={`relative h-14 w-14 flex items-center justify-center rounded-full transition-colors duration-300 ${isActive ? 'bg-primary-container' : 'hover:bg-surface-variant'}`}>
                        <Icon className={`w-6 h-6 ${isActive ? 'text-on-primary-container' : 'text-on-surface-variant'}`} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-[12px] font-medium transition-colors ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {tab.label}
                    </span>
                    </motion.button>
                );
            })}
         </div>
      </nav>
    </>
  );
}
