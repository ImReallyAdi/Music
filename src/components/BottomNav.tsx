import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Library, BarChart3 } from 'lucide-react';
import { cn } from '../utils/cn';

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
    { id: 'stats', icon: BarChart3, label: 'Stats' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.25, 0, 0, 1] }}
            className="fixed bottom-0 w-full z-40 bg-background/95 backdrop-blur-md border-t border-border"
        >
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
            {tabs.map((tab) => {
               const isActive = activeTab === tab.id;
               return (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-150 group",
                      isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"
                    )}
                 >
                   <tab.icon
                      size={24}
                      strokeWidth={1.5}
                      className={cn(
                        "transition-transform duration-150",
                        isActive ? "scale-105" : "group-hover:scale-105"
                      )}
                    />
                   <span className="text-[10px] uppercase tracking-widest font-mono">
                     {tab.label}
                   </span>
                   {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 w-8 h-0.5 bg-accent"
                        transition={{ duration: 0.2 }}
                      />
                   )}
                 </button>
               )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomNav;
