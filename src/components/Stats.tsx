import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, Music, X, Play, Share2 } from 'lucide-react';
import { dbService } from '../db';
import { Track } from '../types';

// --- CONFIGURATION ---
// Set this to TRUE to see the button even if it's not Nov/Dec
const DEV_OVERRIDE = true; 

// --- UTILS ---
const Counter: React.FC<{ value: number }> = ({ value }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useSpring(0, { duration: 2000, bounce: 0 });
  
  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.floor(latest).toLocaleString();
      }
    });
  }, [motionValue]);

  return <span ref={ref} />;
};

// --- RETRO GRAPHICS ---

const FilmGrain = () => (
  <div className="absolute inset-0 pointer-events-none opacity-20 z-0 mix-blend-multiply" 
       style={{ 
         backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
       }} 
  />
);

const RetroWaves = () => (
  <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full h-auto text-[#FF2E2E] opacity-100 z-10" preserveAspectRatio="none">
    <path fill="transparent" stroke="currentColor" strokeWidth="40" d="M0,160 C320,300,420,0,740,160 C1060,320,1160,0,1480,160" />
    <path fill="transparent" stroke="currentColor" strokeWidth="40" d="M0,260 C320,400,420,100,740,260 C1060,420,1160,100,1480,260" />
  </svg>
);

const RetroArches = () => (
  <svg viewBox="0 0 500 500" className="absolute bottom-[-10%] left-1/2 transform -translate-x-1/2 w-full max-w-md text-[#FF2E2E] z-10">
    <path d="M50 500 A 200 200 0 0 1 450 500" fill="transparent" stroke="currentColor" strokeWidth="30" />
    <path d="M100 500 A 150 150 0 0 1 400 500" fill="transparent" stroke="currentColor" strokeWidth="30" />
    <path d="M150 500 A 100 100 0 0 1 350 500" fill="transparent" stroke="currentColor" strokeWidth="30" />
  </svg>
);

const RetroBurst = () => (
  <svg viewBox="0 0 200 200" className="absolute bottom-[-50px] left-1/2 transform -translate-x-1/2 w-80 h-80 text-[#FF2E2E] z-10 animate-spin-slow">
    <path fill="currentColor" d="M100 0 L120 80 L200 100 L120 120 L100 200 L80 120 L0 100 L80 80 Z" />
    <path fill="currentColor" opacity="0.5" transform="rotate(45 100 100)" d="M100 0 L120 80 L200 100 L120 120 L100 200 L80 120 L0 100 L80 80 Z" />
  </svg>
);

// --- ADI RETROGRADE (WRAPPED) COMPONENT ---

const AdiRetrograde: React.FC<{ isOpen: boolean; onClose: () => void; stats: any }> = ({ isOpen, onClose, stats }) => {
  const [slide, setSlide] = useState(0);
  const currentYear = new Date().getFullYear();

  // Auto-advance logic
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (slide < 3) setSlide(s => s + 1);
      // Note: We don't auto-close on the last slide so they can share/replay
    }, 6000); 
    return () => clearTimeout(timer);
  }, [slide, isOpen]);

  const slideVariants = {
    enter: { x: '100%', opacity: 1 },
    center: { x: 0, opacity: 1 },
    exit: { x: '-50%', opacity: 0 }
  };

  const slides = [
    // SLIDE 1: INTRO
    {
      bg: "bg-[#FFFDF8]",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 relative z-20">
          <motion.div
            initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="font-black text-6xl md:text-7xl text-[#FF2E2E] leading-[0.85] tracking-tighter drop-shadow-sm mix-blend-multiply"
          >
            <div>ADI</div>
            <div>RETRO</div>
            <div>GRADE</div>
            <div className="text-5xl mt-2 tracking-widest bg-[#FF2E2E] text-[#FFFDF8] inline-block px-4 -rotate-3">{currentYear}</div>
          </motion.div>
        </div>
      ),
      graphic: <RetroWaves />
    },
    
    // SLIDE 2: TOP SONG
    {
      bg: "bg-[#FFFDF8]",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 relative z-20 pb-24">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-black text-4xl text-[#FF2E2E] mb-8 leading-none tracking-tight"
          >
            Clearly you<br/>were on<br/>something
          </motion.h2>

          {stats.topTrack && (
            <motion.div 
              initial={{ scale: 0, rotate: 10 }}
              animate={{ scale: 1, rotate: -3 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="bg-[#FF2E2E] p-4 pb-8 rounded-sm shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative"
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-black/20" />
              <img 
                src={stats.topTrack.coverArt} 
                className="w-56 h-56 border-2 border-black/10 object-cover grayscale-[0.2] contrast-125" 
                alt="Top Track"
              />
              <div className="mt-4 text-white text-left">
                <div className="font-black text-2xl leading-none">{stats.topTrack.title}</div>
                <div className="text-white/90 text-sm font-mono mt-1 uppercase">{stats.topTrack.artist}</div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-black text-white px-3 py-1 font-mono text-xs font-bold rotate-3">
                #{stats.topTrack.playCount} PLAYS
              </div>
            </motion.div>
          )}
        </div>
      ),
      graphic: <RetroArches />
    },

    // SLIDE 3: STATS
    {
      bg: "bg-[#FFFDF8]",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 relative z-20">
           <motion.h2 
            className="font-black text-6xl text-[#FF2E2E] mb-8 tracking-tighter"
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            THE<br/>DAMAGES
          </motion.h2>

          <div className="grid grid-cols-1 gap-6 w-full max-w-xs">
            {/* Total Plays Card */}
            <motion.div 
               initial={{ x: -50, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               className="bg-[#FF2E2E] text-white p-6 rounded-none skew-x-[-6deg] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
            >
              <div className="skew-x-[6deg]">
                <div className="text-5xl font-black tabular-nums">
                  <Counter value={stats.totalPlays} />
                </div>
                <div className="text-sm font-mono uppercase tracking-widest border-t-2 border-white/30 pt-2 mt-1">Tracks Played</div>
              </div>
            </motion.div>
            
            {/* Minutes Card */}
            <motion.div 
               initial={{ x: 50, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="bg-white text-[#FF2E2E] p-6 rounded-none skew-x-[-6deg] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-[#FF2E2E]"
            >
              <div className="skew-x-[6deg]">
                <div className="text-5xl font-black tabular-nums">
                  <Counter value={Math.floor(stats.totalTime / 60)} />
                </div>
                <div className="text-sm font-mono uppercase tracking-widest border-t-2 border-[#FF2E2E]/20 pt-2 mt-1 text-black">Minutes Lost</div>
              </div>
            </motion.div>
          </div>
        </div>
      ),
      graphic: <div className="absolute right-0 top-0 bottom-0 w-12 bg-[#FF2E2E] opacity-10" style={{ backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
    },

    // SLIDE 4: OUTRO
    {
      bg: "bg-[#FFFDF8]",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 relative z-20 pb-32">
           <motion.h2 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-black text-5xl text-[#FF2E2E] leading-tight tracking-tighter mb-8"
          >
            SEE YOU<br/>NEXT<br/>YEAR?
          </motion.h2>
          
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSlide(0)}
              className="w-full px-8 py-4 bg-black text-white font-bold font-mono text-lg border-2 border-black hover:bg-transparent hover:text-black transition-colors"
            >
              REPLAY ↺
            </motion.button>
            
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full px-8 py-4 bg-[#FF2E2E] text-white font-bold font-mono text-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Share2 size={20} /> CLOSE
            </motion.button>
          </div>
        </div>
      ),
      graphic: <RetroBurst />
    }
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col bg-black/90 backdrop-blur-sm"
    >
      <div className="w-full h-full max-w-md mx-auto relative overflow-hidden bg-[#FFFDF8] shadow-2xl">
        <FilmGrain />
        
        {/* Progress Bars */}
        <div className="absolute top-2 left-0 right-0 flex gap-1 px-2 z-50">
          {slides.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-black/10 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-[#FF2E2E]"
                initial={{ width: "0%" }}
                animate={{ width: i < slide ? "100%" : i === slide ? "100%" : "0%" }}
                transition={i === slide ? { duration: 6, ease: "linear" } : { duration: 0 }}
              />
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-4 z-50 p-2 text-black/30 hover:text-[#FF2E2E] transition-colors">
          <X size={28} strokeWidth={3} />
        </button>

        {/* Slide Content */}
        <AnimatePresence mode="wait" custom={slide}>
          <motion.div
            key={slide}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`absolute inset-0 flex flex-col ${slides[slide].bg}`}
            onClick={(e) => {
               // Navigation logic
               const width = e.currentTarget.offsetWidth;
               const x = e.nativeEvent.offsetX;
               if (x > width / 2) {
                 if (slide < slides.length - 1) setSlide(s => s + 1);
               } else {
                 if (slide > 0) setSlide(s => s - 1);
               }
            }}
          >
            {slides[slide].content}
            {slides[slide].graphic}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};


// --- MAIN STATS TAB COMPONENT ---

interface StatsProps {
  playTrack: (id: string) => void;
}

const Stats: React.FC<StatsProps> = ({ playTrack }) => {
  const [topTracks,
