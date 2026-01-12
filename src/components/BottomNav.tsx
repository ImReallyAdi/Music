import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'search', icon: 'search', label: 'Search' },
    { id: 'library', icon: 'library_music', label: 'Library' },
    { id: 'stats', icon: 'bar_chart', label: 'Stats' },
  ];

  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 1 }}
            className="fixed bottom-0 w-full z-40 bg-surface-container"
        >
          {/* @ts-ignore */}
          <md-navigation-bar active-index={activeIndex} hide-inactive-labels="false">
            {tabs.map((tab) => (
               <md-navigation-tab
                  key={tab.id}
                  label={tab.label}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
               >
                 <md-icon slot="active-icon" class="material-symbols-rounded filled">{tab.icon}</md-icon>
                 <md-icon slot="inactive-icon" class="material-symbols-rounded">{tab.icon}</md-icon>
               </md-navigation-tab>
            ))}
          </md-navigation-bar>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomNav;
