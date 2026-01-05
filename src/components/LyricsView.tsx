import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLyrics } from '../utils/lyrics';
import { Track, Lyrics } from '../types';
import { Loader2, Music2, Mic2 } from 'lucide-react';

interface LyricsViewProps {
  track: Track;
  currentTime: number;
  onSeek: (time: number) => void;
  onTrackUpdate?: (track: Track) => void;
}

const LyricsView: React.FC<LyricsViewProps> = ({ track, currentTime, onSeek, onTrackUpdate }) => {
  const [lyrics, setLyrics] = useState<Lyrics | null>(track.lyrics || null);
  const [loading, setLoading] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Normalize Time (handle ms vs seconds)
  const normalizedTime = useMemo(() => {
    return currentTime > 10000 ? currentTime / 1000 : currentTime;
  }, [currentTime]);

  // Fetch Logic
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Optimistic render if we already have data
      if (track.lyrics && !track.lyrics.error) {
        setLyrics(track.lyrics);
      } else {
        setLoading(true);
      }

      const data = await fetchLyrics(track);
      
      if (mounted) {
        if (JSON.stringify(data) !== JSON.stringify(track.lyrics)) {
           setLyrics(data);
           if (onTrackUpdate && !data.error) onTrackUpdate({ ...track, lyrics: data });
        }
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [track.title, track.artist]);

  // Sync Active Line
  useEffect(() => {
    if (!lyrics?.synced) return;
    const index = lyrics.lines.findIndex((line, i) => {
      const nextLine = lyrics.lines[i + 1];
      return line.time <= normalizedTime && (!nextLine || nextLine.time > normalizedTime);
    });
    
    if (index !== -1 && index !== activeLineIndex) setActiveLineIndex(index);
  }, [normalizedTime, lyrics]);

  // Auto Scroll
  useEffect(() => {
    if (activeLineIndex !== -1 && scrollRef.current && !isUserScrolling) {
      const activeEl = scrollRef.current.children[activeLineIndex] as HTMLElement;
      activeEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineIndex, isUserScrolling]);

  const handleScroll = () => {
    setIsUserScrolling(true);
    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    userScrollTimeout.current = setTimeout(() => setIsUserScrolling(false), 2500);
  };

  const renderContent = () => {
    if (loading && !lyrics) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white/50 animate-pulse">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="uppercase tracking-widest text-sm font-semibold">Loading Lyrics</p>
        </div>
      );
    }

    if (!lyrics || (!lyrics.lines.length && !lyrics.plain)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white/30">
          <Music2 size={64} className="mb-6 opacity-40" />
          <p className="font-bold text-xl">No Lyrics Found</p>
        </div>
      );
    }

    // Plain text fallback
    if (!lyrics.synced) {
        return (
            <div className="p-10 text-center overflow-y-auto h-full no-scrollbar relative">
                <p className="whitespace-pre-wrap text-2xl md:text-3xl font-bold leading-relaxed text-white/80">
                  {lyrics.plain}
                </p>
            </div>
        );
    }

    // Synced View
    return (
      <div 
        className="w-full h-full overflow-y-auto px-4 py-[50vh] no-scrollbar relative"
        onWheel={handleScroll}
        onTouchMove={handleScroll}
        // Gradient Mask for "Fade out" effect at top/bottom
        style={{ 
          scrollBehavior: 'smooth',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
        }}
      >
        <div ref={scrollRef} className="flex flex-col gap-8 md:gap-12 max-w-4xl mx-auto text-left pl-4">
          {lyrics.lines.map((line, i) => {
            const isActive = i === activeLineIndex;
            const isPast = i < activeLineIndex;

            // --- KARAOKE WORD RENDERER ---
            if (lyrics.isWordSynced && line.words?.length) {
              return (
                <motion.div 
                    key={i} 
                    className={`origin-left cursor-pointer transition-all duration-500`}
                    initial={{ scale: 1, opacity: 0.5, filter: 'blur(2px)' }}
                    animate={{ 
                        scale: isActive ? 1.05 : 1, 
                        opacity: isActive ? 1 : isPast ? 0.3 : 0.4,
                        filter: isActive ? 'blur(0px)' : 'blur(1.5px)'
                    }}
                    onClick={() => onSeek(line.time)}
                >
                  <p className="text-3xl md:text-5xl font-black leading-tight flex flex-wrap gap-x-3 gap-y-1">
                    {line.words.map((word, wIdx) => {
                       const nextWord = line.words![wIdx + 1];
                       
                       // 1. Is this word currently being sung?
                       const isWordActive = isActive && normalizedTime >= word.time && (!nextWord || normalizedTime < nextWord.time);
                       
                       // 2. Has this word already been sung?
                       const isWordPast = isActive && normalizedTime >= word.time;

                       return (
                         <motion.span 
                           key={wIdx}
                           animate={{
                               color: isWordActive ? '#ffffff' : (isWordPast ? '#ffffff' : 'rgba(255,255,255,0.3)'),
                               scale: isWordActive ? 1.1 : 1,
                               textShadow: isWordActive ? "0 0 20px rgba(255,255,255,0.7)" : "none",
                               y: isWordActive ? -2 : 0
                           }}
                           transition={{ type: "spring", stiffness: 400, damping: 20 }}
                           className="inline-block origin-bottom will-change-transform"
                         >
                           {word.text}
                         </motion.span>
                       )
                    })}
                  </p>
                </motion.div>
              );
            }

            // --- STANDARD LINE RENDERER (Fallback) ---
            return (
              <motion.div
                key={i}
                className="cursor-pointer origin-left will-change-transform"
                onClick={() => onSeek(line.time)}
                animate={{
                    scale: isActive ? 1.05 : 1,
                    opacity: isActive ? 1 : isPast ? 0.3 : 0.4,
                    filter: isActive ? 'blur(0px)' : 'blur(2px)',
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)'
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <p className={`text-3xl md:text-4xl font-extrabold leading-tight ${isActive ? 'drop-shadow-lg' : ''}`}>
                  {line.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-50 bg-black/60 backdrop-blur-3xl rounded-xl overflow-hidden border border-white/5 shadow-2xl"
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
};

export default LyricsView;
