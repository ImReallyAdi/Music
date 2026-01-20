import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface LoadingOverlayProps {
  progress: number;
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress, message }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background text-foreground"
      >
        <div className="w-full max-w-md px-8 flex flex-col items-center gap-12">
          
          <div className="relative">
             <Music2 size={64} strokeWidth={1} className="text-muted-foreground animate-pulse" />
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            <h1 className="text-8xl font-black font-display tracking-tighter tabular-nums leading-none">
                {Math.round(clampedProgress)}%
            </h1>
            <p className="text-lg text-muted-foreground font-mono uppercase tracking-widest animate-pulse">
                {message}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${clampedProgress}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
            />
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingOverlay;
