import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '@material/web/icon/icon.js';

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
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface text-on-surface overflow-hidden"
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
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-container rounded-full blur-[100px] opacity-20"
          />
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          
          {/* Large Watermark (Stroked Text) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 
              className="text-[20vw] font-black text-transparent -rotate-12 select-none whitespace-nowrap opacity-5"
              style={{ WebkitTextStroke: '2px var(--md-sys-color-on-surface)' }}
            >
              adi
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
                className="absolute inset-0 bg-primary rounded-[32px]"
                animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
            
            <div className="relative w-24 h-24 bg-gradient-to-br from-surface-container to-surface-container-high rounded-[32px] border border-white/10 shadow-elevation-3 flex items-center justify-center z-10">
              <md-icon class="material-symbols-rounded text-primary drop-shadow-md" style={{ fontSize: '40px' }}>music_note</md-icon>
              
              {/* Corner Decoration */}
              <motion.div 
                className="absolute -top-2 -right-2 bg-on-surface text-surface p-1.5 rounded-full shadow-lg flex items-center justify-center"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <md-icon class="material-symbols-rounded filled" style={{ fontSize: '14px' }}>auto_awesome</md-icon>
              </motion.div>
            </div>
          </motion.div>

          {/* Typography */}
          <div className="text-center space-y-1 mb-10">
            <motion.h2 
              layoutId="title"
              className="text-headline-small font-bold tracking-tight text-on-surface"
            >
              Syncing Library
            </motion.h2>
            <motion.p 
              key={message} // Triggers animation on change
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-body-medium font-medium text-primary h-5"
            >
              {message}
            </motion.p>
          </div>

          {/* Large Expressive Percentage */}
          <div className="relative w-full mb-4 flex justify-between items-end px-2">
            <span className="text-label-medium font-bold uppercase tracking-widest text-on-surface-variant">Progress</span>
            <motion.span 
              className="text-display-large font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-on-surface to-on-surface-variant tabular-nums leading-none"
            >
              {Math.round(clampedProgress)}%
            </motion.span>
          </div>

          {/* Track / Progress Bar */}
          <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden p-1 border border-outline-variant/20 backdrop-blur-sm">
            <motion.div
              className="h-full bg-primary rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${clampedProgress}%` }}
              transition={{ type: "spring", stiffness: 40, damping: 15 }} // Smooth fluid motion
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-[shimmer_1.5s_infinite]" />
              <div className="absolute inset-0 bg-primary opacity-100" />
            </motion.div>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingOverlay;
