import React from 'react';
import { motion } from 'framer-motion';
import { Music, Sparkles } from 'lucide-react';

interface LoadingOverlayProps {
  progress: number;
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress, message }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.5 } }}
    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-3xl text-surface-on p-6 overflow-hidden"
  >
    {/* Background Watermark (Subtle Branding) */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <h1 className="text-[20vw] font-black text-white/[0.02] -rotate-12 select-none whitespace-nowrap">
        imreallyadi
      </h1>
    </div>

    {/* Main Content Card */}
    <div className="relative z-10 flex flex-col items-center w-full max-w-md">
      
      {/* Icon Container with Breathing Animation */}
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="mb-12 relative"
      >
        <div className="absolute inset-0 bg-[#EADDFF] blur-3xl opacity-20 rounded-full animate-pulse" />
        <div className="relative w-32 h-32 bg-surface-container-high rounded-[48px] flex items-center justify-center shadow-2xl border border-white/10">
          <Music className="w-14 h-14 text-[#EADDFF]" strokeWidth={1.5} />
        </div>
        
        {/* Floating Sparkle Decoration */}
        <motion.div 
          animate={{ y: [-5, 5, -5], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2 bg-[#EADDFF] text-neutral-900 p-2 rounded-full"
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
      </motion.div>

      {/* Typography */}
      <motion.h2 
        layout
        className="text-display-small md:text-display-medium font-bold text-[#EADDFF] mb-2 tracking-tight text-center"
      >
        Syncing Library
      </motion.h2>
      
      <motion.p 
        layout
        className="text-body-large text-surface-variant mb-12 text-center h-6"
      >
        {message || "Curating your experience..."}
      </motion.p>

      {/* Expressive Progress Bar */}
      <div 
        role="progressbar" 
        aria-valuenow={progress} 
        aria-valuemin={0} 
        aria-valuemax={100}
        className="w-full h-16 bg-surface-container-highest/30 rounded-[32px] p-2 flex items-center relative overflow-hidden backdrop-blur-md border border-white/5"
      >
        {/* Liquid Fill */}
        <motion.div
          className="h-full bg-[#EADDFF] rounded-[24px] shadow-[0_0_15px_rgba(234,221,255,0.3)] relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
        >
           {/* Shimmer Effect inside the bar */}
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_1s_infinite]" />
        </motion.div>
        
        {/* Percentage Text (floats inside or outside based on width) */}
        <div className="absolute inset-0 flex items-center justify-end px-6 pointer-events-none">
          <span className="text-title-large font-bold tabular-nums mix-blend-difference text-white/90">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default LoadingOverlay;
