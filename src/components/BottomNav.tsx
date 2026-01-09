import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Library, BarChart2 } from 'lucide-react';
import { PixelButton } from './PixelComponents';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isVisible: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isVisible }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'stats', icon: BarChart2, label: 'Stats' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed bottom-0 w-full z-40 pb-safe bg-zinc-900 border-t-2 border-black shadow-[0_-4px_0_0_rgba(0,0,0,0.5)]"
        >
          <div className="flex justify-around items-center h-[60px] px-2 pt-1 gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <PixelButton
                  key={tab.id}
                  variant={isActive ? 'primary' : 'ghost'}
                  active={isActive}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 h-[50px] !border-0 !shadow-none !translate-x-0 !translate-y-0
                    ${isActive ? 'bg-zinc-800 border-2 !border-black !shadow-[2px_2px_0_0_#000]' : ''}
                  `}
                  onClick={() => setActiveTab(tab.id)}
                  style={isActive ? { backgroundColor: '#e4e4e7', color: 'black' } : {}}
                >
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 3 : 2}
                      className="mb-0.5"
                    />
                  <span className="text-[10px] font-pixel uppercase tracking-widest">
                    {tab.label}
                  </span>
                </PixelButton>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default BottomNav;
