import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackgroundAmbienceProps {
  coverArt?: string;
  className?: string;
}

export const BackgroundAmbience: React.FC<BackgroundAmbienceProps> = ({
  coverArt,
  className = ""
}) => {
  return (
    <div className={`fixed inset-0 -z-10 bg-background overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout">
        {coverArt ? (
          <motion.div
            key={coverArt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
             <img
               src={coverArt}
               alt=""
               className="w-full h-full object-cover blur-[100px] scale-125 opacity-60"
             />
             <div className="absolute inset-0 bg-background/40 mix-blend-overlay" />
          </motion.div>
        ) : (
          <motion.div
            key="default-blobs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
             <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary/20 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
             <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-secondary/10 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '9s' }} />
             <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Texture Overlay for more depth */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
};
