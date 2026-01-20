import React from 'react';
import BottomNav from './BottomNav';
import { Track } from '../types';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentTrack?: Track | null;
  className?: string;
  isVisible?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  currentTrack,
  className = "",
  isVisible = true
}) => {
  return (
    <div className={cn("flex flex-col min-h-screen w-full bg-background text-foreground overflow-hidden relative", className)}>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pb-32 pt-safe relative z-10">
        {children}
      </main>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
         <div className="pointer-events-auto">
             <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isVisible={isVisible} />
         </div>
      </div>
    </div>
  );
};
