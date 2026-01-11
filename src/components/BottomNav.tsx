import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Library, BarChart2 } from 'lucide-react';
import '@material/web/labs/navigationbar/navigation-bar.js';
import '@material/web/labs/navigationtab/navigation-tab.js';
import '@material/web/icon/icon.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-navigation-bar': any;
      'md-navigation-tab': any;
      'md-icon': any;
    }
  }
}

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

  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            className="fixed bottom-0 w-full z-40 bg-surface"
        >
          {/* @ts-ignore */}
          <md-navigation-bar activeIndex={activeIndex} hideInactiveLabels={false}>
            {tabs.map((tab, index) => {
               const Icon = tab.icon;
               return (
                 <md-navigation-tab
                    key={tab.id}
                    label={tab.label}
                    active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                 >
                   <md-icon slot="activeIcon">
                      <Icon size={24} className="text-on-secondary-container" strokeWidth={2.5} />
                   </md-icon>
                   <md-icon slot="inactiveIcon">
                      <Icon size={24} className="text-on-surface-variant" strokeWidth={2} />
                   </md-icon>
                 </md-navigation-tab>
               );
            })}
          </md-navigation-bar>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomNav;
