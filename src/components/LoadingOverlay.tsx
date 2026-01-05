import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Sparkles, Command } from 'lucide-react';

interface LoadingOverlayProps {
  progress: number;
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress, message }) => {
  // Clamp progress to ensure it doesn't break visual bounds
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, filter: "blur(10px)" }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 text-white overflow-hidden"
      >
        {/* --- Background Ambient Effects --- */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Rotating Gradient Orb */}
          <motion.div 
            animate={{ 
              rotate: 360, 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px]" 
          />
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          
          {/* Large Watermark (Stroked Text) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 
              className="text-[20vw] font-black text-transparent -rotate-12 select-none whitespace-nowrap opacity-5"
              style={{ WebkitTextStroke: '2px rgba(255,255,255,0.2)' }}
            >
              imreallyadi
            </h1>
          </div>
        </div>

        {/* --- Main Card Layout --- */}
        <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center">
          
          {/* Icon Stage */}
          <motion.div 
            className="relative mb-8 group"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Ripple Effects behind icon */}
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 bg-indigo-500 rounded-[32px]"
                animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
            
            <div className="relative w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[32px] border border-white/10 shadow-2xl flex items-center justify-center z-10">
              <Music className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" strokeWidth={2} />
              
              {/* Corner Decoration */}
              <motion.div 
                className="absolute -top-2 -right-2 bg-white text-zinc-900 p-1.5 rounded-full shadow-lg"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles size={14} fill="currentColor" />
              </motion.div>
            </div>
          </motion.div>

          {/* Typography */}
          <div className="text-center space-y-1 mb-10">
            <motion.h2 
              layoutId="title"
              className="text-3xl font-bold tracking-tight text-white/90"
            >
              Syncing Library
            </motion.h2>
            <motion.p 
              key={message} // Triggers animation on change
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-indigo-200/60 h-5"
            >
              {message}
            </motion.p>
          </div>

          {/* Large Expressive Percentage */}
          <div className="relative w-full mb-4 flex justify-between items-end px-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Progress</span>
            <motion.span 
              className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 tabular-nums leading-none"
            >
              {Math.round(clampedProgress)}%
            </motion.span>
          </div>

          {/* Track / Progress Bar */}
          <div className="w-full h-4 bg-zinc-800/50 rounded-full overflow-hidden p-1 border border-white/5 backdrop-blur-sm">
            <motion.div
              className="h-full bg-indigo-500 rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${clampedProgress}%` }}
              transition={{ type: "spring", stiffness: 40, damping: 15 }} // Smooth fluid motion
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-[shimmer_1.5s_infinite]" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-400 opacity-100" />
            </motion.div>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingOverlay;
