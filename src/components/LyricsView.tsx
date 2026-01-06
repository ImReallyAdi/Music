import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLyrics } from '../utils/lyrics';
import { Track, Lyrics } from '../types';
import { Loader2, Music2, Sparkles, Mic2 } from 'lucide-react';
import { useToast } from './Toast';

interface LyricsViewProps {
  track: Track;
  currentTime: number;
  onSeek: (time: number) => void;
  onClose?: () => void;
  onTrackUpdate?: (track: Track) => void;
}

const LyricsView: React.FC<LyricsViewProps> = ({ track, currentTime, onSeek, onTrackUpdate }) => {
  const [lyrics, setLyrics] = useState<Lyrics | null>(track.lyrics || null);
  const [loading, setLoading] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const { addToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch Lyrics
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Optimistic render
      if (track.lyrics && !track.lyrics.error) {
        setLyrics(track.lyrics);
        setLoading(false);
      } else {
        setLoading(true);
        setLyrics(null);
        setActiveLineIndex(-1);
      }

      try {
        const data = await fetchLyrics(track);
        
        if (mounted) {
          if (data !== track.lyrics) {
              setLyrics(data);
              if (onTrackUpdate && !data.error) {
                 onTrackUpdate({ ...track, lyrics: data });
              }
          }
        }
      } catch (error) {
        console.error("Failed to load lyrics:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [track.id, track.title, track.artist]); // Re-run if track changes

  const handleGenerateWordSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const data = await fetchLyrics(track, true, true);
      setLyrics(data);
      if (onTrackUpdate && !data.error) {
        onTrackUpdate({ ...track, lyrics: data });
      }

      if (data.isWordSynced) {
        addToast("Lyrics enhanced!", "success");
      } else {
        addToast("Enhancement failed. Try again.", "error");
      }
    } catch (error) {
      console.error("Failed to enhance lyrics:", error);
      addToast("Failed to enhance lyrics", "error");
    } finally {
      setLoading(false);
    }
  };

  // Optimized Active Line Sync
  useEffect(() => {
    if (!lyrics || !lyrics.synced) return;

    let idx = activeLineIndex;

    // 1. Handle backward seek or invalid state (reset search)
    if (idx === -1 || (lyrics.lines[idx] && lyrics.lines[idx].time > currentTime)) {
        // Fast reset: If we seeked backwards, start from -1 or findIndex again
        // Ideally we just reset to -1 and let the while loop catch up, 
        // but for long songs a binary search is better. 
        // For simplicity/safety, we reset to -1 if we detect a backward jump.
        idx = -1; 
    }

    // 2. Incremental forward scan
    // We only loop forward. This prevents scanning the whole array every tick.
    while (idx + 1 < lyrics.lines.length && lyrics.lines[idx + 1].time <= currentTime) {
      idx++;
    }

    if (idx !== activeLineIndex) {
      setActiveLineIndex(idx);
    }
  }, [currentTime, lyrics, activeLineIndex]);

  // Handle User Interaction (Scroll)
  const handleUserScroll = useCallback(() => {
    setIsUserScrolling(true);
    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);

    userScrollTimeout.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3000);
  }, []);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    };
  }, []);

  // Auto Scroll logic (Optimized with RAF)
  useEffect(() => {
    if (activeLineIndex !== -1 && scrollRef.current && !isUserScrolling) {
      const activeEl = scrollRef.current.children[activeLineIndex] as HTMLElement;
      if (activeEl) {
        // Wrap in RAF to prevent layout thrashing
        requestAnimationFrame(() => {
           activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    }
  }, [activeLineIndex, isUserScrolling]);

  // Render Content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/50 space-y-4">
          <div className="relative">
            <Loader2 className="animate-spin text-primary" size={40} />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          </div>
          <p className="font-medium tracking-wide animate-pulse">Syncing with audio...</p>
        </div>
      );
    }

    if (!lyrics || (lyrics.lines.length === 0 && !lyrics.plain)) {
       return (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/50 px-8 text-center">
          <div className="bg-white/5 p-6 rounded-full mb-6">
            <Music2 className="opacity-40" size={48} />
          </div>
          <p className="text-xl font-bold mb-2">No Lyrics Found</p>
          <p className="text-sm opacity-60 max-w-[200px]">
            We couldn't find synchronized lyrics for this track.
          </p>
        </div>
      );
    }

    if (!lyrics.synced && lyrics.plain) {
        return (
            <div 
                className="w-full h-full overflow-y-auto px-8 py-12 text-center no-scrollbar"
                style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}
            >
                <p className="text-white/90 whitespace-pre-wrap text-xl leading-relaxed font-medium font-sans">
                    {lyrics.plain}
                </p>
            </div>
        );
    }

    return (
      <div
        ref={containerRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        className="w-full h-full overflow-y-auto px-4 py-[50%] no-scrollbar"
        style={{ 
            scrollBehavior: 'smooth',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
        }}
      >
        <div ref={scrollRef} className="flex flex-col gap-6 text-left pl-4 pr-2 max-w-4xl mx-auto">
            {lyrics.lines.map((line, i) => {
                const isActive = i === activeLineIndex;
                
                // Detect dense lines to slightly reduce size
                const wordCount = line.words ? line.words.length : line.text.split(' ').length;
                const isLongLine = wordCount > 10;
                
                // Calculate next line time for capping
                const nextLineTime = lyrics.lines[i + 1]?.time ?? Infinity;

                // --- WORD-LEVEL SYNC RENDERING (ENHANCED) ---
                if (lyrics.isWordSynced && line.words && line.words.length > 0) {
                      return (
                        <motion.div
                            key={i}
                            layout
                            onClick={() => onSeek(line.time)}
                            initial={{ opacity: 0.5, scale: 1 }}
                            animate={{
                                opacity: isActive ? 1 : 0.35,
                                scale: isActive ? 1.05 : 1,
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="cursor-pointer origin-left py-2"
                        >
                             <p className={`font-bold leading-relaxed flex flex-wrap gap-x-[0.4em] gap-y-2 ${
                                isLongLine 
                                  ? 'text-xl md:text-2xl'
                                  : 'text-2xl md:text-4xl'
                             }`}>
                               {line.words.map((word, wIdx) => {
                                   // Dynamic HOLD calculation based on gaps
                                   // 1. Determine absolute end of this word (either explicit duration or start of next word)
                                   const nextWordTime = line.words![wIdx + 1]?.time ?? nextLineTime;
                                   const rawEndTime = word.endTime ?? nextWordTime;
                                   
                                   // 2. Cap the end time so it doesn't bleed into the next LINE
                                   const absoluteEndTime = Math.min(rawEndTime, nextLineTime);
                                   
                                   // 3. Dynamic Hold: Shorter hold for fast raps, longer for ballads
                                   const gap = absoluteEndTime - word.time;
                                   const HOLD = Math.min(0.35, gap * 0.4); 

                                   let isWordActive = false;
                                   
                                   // Check if within time window
                                   if (currentTime >= word.time) {
                                       if (currentTime < (absoluteEndTime + HOLD)) {
                                           isWordActive = true;
                                       }
                                   }

                                   // Check if word is in the past (for fading)
                                   const isWordPast = currentTime >= (absoluteEndTime + HOLD);

                                   // Enhanced "Glow" Transition Config
                                   const transitionConfig = isWordActive
                                     ? { type: "spring", stiffness: 300, damping: 15 } // Snappy pop
                                     : { duration: 0.3, ease: 'easeOut' }; // Smooth fade out

                                   return (
                                         <motion.span 
                                           key={wIdx}
                                           className="relative inline-block origin-bottom rounded-md px-1 -mx-1"
                                           animate={{
                                               color: isWordActive 
                                                  ? '#FFFFFF' 
                                                  : isWordPast 
                                                      ? 'rgba(255,255,255,0.9)' 
                                                      : 'rgba(255,255,255,0.25)',
                                               
                                               scale: isWordActive ? 1.25 : 1,
                                               y: isWordActive ? -4 : 0,
                                               
                                               textShadow: isWordActive
                                                  ? '0 0 20px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.6), 0 0 30px rgba(100, 200, 255, 0.4)' 
                                                  : '0 0 0px rgba(0,0,0,0)',
                                               
                                               filter: isWordActive 
                                                  ? 'brightness(1.3) contrast(1.1)' 
                                                  : 'brightness(1)',

                                               // Correct CSS property for stroke
                                               WebkitTextStroke: isWordActive ? '1px rgba(255,255,255,0.2)' : '0px transparent',
                                           }}
                                           transition={transitionConfig}
                                         >
                                             {word.text}
                                         </motion.span>
                                   );
                               })}
                             </p>
                             {line.translation && (
                               <motion.p
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: isActive ? 0.7 : 0, y: isActive ? 0 : 5 }}
                                 className="text-lg font-medium text-primary/80 mt-2 block pl-1"
                               >
                                 {line.translation}
                               </motion.p>
                             )}
                        </motion.div>
                    );
                }

                // --- STANDARD LINE SYNC (PRESERVED) ---
                return (
                    <motion.div
                        key={i}
                        layout
                        onClick={() => onSeek(line.time)}
                        initial={{ opacity: 0.5, scale: 1, filter: 'blur(2px)' }}
                        animate={{
                            opacity: isActive ? 1 : 0.4,
                            scale: isActive ? 1.05 : 1,
                            filter: isActive ? 'blur(0px)' : 'blur(1.5px)',
                            color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)'
                        }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="cursor-pointer origin-left"
                    >
                         <p className={`font-bold leading-tight transition-all duration-300 ${
                            isLongLine 
                                ? 'text-lg md:text-xl'
                                : 'text-xl md:text-2xl'
                          }`}>
                           {line.text}
                         </p>
                         {line.translation && (
                           <p className="text-lg font-medium text-white/60 mt-2">
                             {line.translation}
                           </p>
                         )}
                    </motion.div>
                );
            })}
        </div>
      </div>
    );
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute inset-0 z-20 flex flex-col bg-black/80 backdrop-blur-3xl rounded-t-3xl md:rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
    >
      <div className="absolute top-6 right-6 z-50">
        <button
           onClick={handleGenerateWordSync}
           className={`group relative p-3 rounded-full transition-all duration-300 ${
               lyrics?.isWordSynced 
                ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
           }`}
           title={lyrics?.isWordSynced ? "Lyrics Enhanced" : "Enhance with Magic Sync"}
         >
           {loading ? (
                <Loader2 size={18} className="animate-spin" />
           ) : (
                <>
                    <Sparkles size={18} className={`transition-transform duration-500 group-hover:rotate-12 ${lyrics?.isWordSynced ? 'fill-current' : ''}`} />
                    {!lyrics?.isWordSynced && (
                        <span className="absolute -bottom-8 right-0 w-max px-2 py-1 text-xs bg-black/80 backdrop-blur text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            Enhance Sync
                        </span>
                    )}
                </>
           )}
         </button>
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
      
      {renderContent()}
    </motion.div>
  );
};

export default LyricsView;
