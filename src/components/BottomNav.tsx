import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isVisible: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isVisible }) => {
  const tabs = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'search', icon: 'search', label: 'Search' },
    { id: 'library', icon: 'library_music', label: 'Library' },
    { id: 'stats', icon: 'bar_chart', label: 'Stats' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
          className="fixed bottom-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-t border-white/5 pb-safe"
        >
          <div className="flex justify-around items-center h-[60px] px-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              // Using mc-icon-button (simulated with custom logic if library doesn't support labels well in nav bar)
              // Actually, standard Material Navigation Bar uses icons + labels.
              // The library likely has navigation components or we compose them.
              // Let's use standard HTML composition with mc-icon for the look.

              return (
                <div
                  key={tab.id}
                  className="flex-1 flex flex-col items-center justify-center cursor-pointer select-none"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className={`relative flex items-center justify-center rounded-full w-16 h-8 transition-colors duration-300 ${isActive ? 'bg-primary-container' : 'bg-transparent'}`}>
                    <mc-icon
                      name={tab.icon}
                      style={{
                        color: isActive ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
                        fontSize: '24px'
                      } as any}
                    ></mc-icon>
                  </div>
                  <span className={`text-[12px] font-medium mt-1 transition-colors duration-300 ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    {tab.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default BottomNav;
