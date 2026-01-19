import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLyrics } from '../utils/lyrics';
import { Track, Lyrics } from '../types';
import { useToast } from './Toast';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

// Add type declarations for custom elements to prevent TS errors if not globally defined
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-icon-button': any;
      'md-icon': any;
    }
  }
}

interface LyricsViewProps {
  track: Track;
  currentTime: number;
  onSeek: (time: number) => void;
  onClose?: () => void;
  onTrackUpdate?: (track: Track) => void;
  lyricOffset?: number;
  setLyricOffset?: (offset: number) => void;
}

const LyricsView: React.FC<LyricsViewProps> = ({
  track,
  currentTime: rawCurrentTime,
  onSeek,
  onClose,
  onTrackUpdate,
  lyricOffset = 0,
  setLyricOffset
}) => {
  const [lyrics, setLyrics] = useState<Lyrics | null>(track.lyrics || null);
  const [loading, setLoading] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [localOffset, setLocalOffset] = useState(lyricOffset);

  // Apply offset to current time for sync logic
  const currentTime = rawCurrentTime + (localOffset / 1000);

  const { addToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync local offset with prop if it changes externally
  useEffect(() => {
    setLocalOffset(lyricOffset);
  }, [lyricOffset]);

  const updateOffset = (delta: number) => {
    const newOffset = localOffset + delta;
    setLocalOffset(newOffset);
    if (setLyricOffset) setLyricOffset(newOffset);
    
    window.dispatchEvent(new CustomEvent('update-player-settings', {
      detail: { lyricOffset: newOffset }
    }));
  };

  // Fetch Lyrics Logic
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Use existing lyrics immediately if available
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
          // Update if data is new or different
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
  }, [track.id, track.title, track.artist]);

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
        addToast("Enhancement unavailable for this track.", "error");
      }
    } catch (error) {
      console.error("Failed to enhance lyrics:", error);
      addToast("Failed to enhance lyrics", "error");
    } finally {
      setLoading(false);
    }
  };

  // Determine Active Line
  useEffect(() => {
    if (!lyrics || !lyrics.synced) return;

    const index = lyrics.lines.findIndex((line, i) => {
      const nextLine = lyrics.lines[i + 1];
      return line.time <= currentTime && (!nextLine || nextLine.time > currentTime);
    });

    if (index !== -1 && index !== activeLineIndex) {
      setActiveLineIndex(index);
    }
  }, [currentTime, lyrics, activeLineIndex]);

  // Handle User Scroll Interaction
  const handleUserScroll = useCallback(() => {
    setIsUserScrolling(true);
    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);

    // Resume auto-scroll faster (1.5s) to keep sync feeling responsive
    userScrollTimeout.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    };
  }, []);

  // Auto-Scroll Active Line into View
  useEffect(() => {
    if (activeLineIndex !== -1 && scrollRef.current && !isUserScrolling) {
      const activeEl = scrollRef.current.children[activeLineIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLineIndex, isUserScrolling]);

  // Renderers
  const renderLoading = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 z-10 pointer-events-none">
      <md-icon class="material-symbols-rounded animate-spin mb-4 text-primary" style={{fontSize: '32px'}}>progress_activity</md-icon>
      <p className="font-medium tracking-wide text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">Syncing lyrics...</p>
    </div>
  );

  const renderEmpty = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-white/50 px-8 text-center">
      <md-icon class="material-symbols-rounded mb-6 opacity-40" style={{fontSize: '56px'}}>lyrics</md-icon>
      <p className="text-xl font-bold mb-2">No Lyrics Found</p>
      <p className="text-sm opacity-60 max-w-[250px]">
        We couldn't find time-synced lyrics for this track.
      </p>
    </div>
  );

  const renderPlainLyrics = () => (
    <div className="w-full h-full overflow-y-auto px-8 py-12 text-center no-scrollbar">
      <p className="text-white/90 whitespace-pre-wrap text-lg md:text-xl leading-relaxed font-medium opacity-90">
        {lyrics?.plain}
      </p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-20 flex flex-col bg-black/80 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl border border-white/5"
    >
      {/* --- Controls Header --- */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-start pointer-events-none bg-gradient-to-b from-black/60 to-transparent">
        {/* Placeholder for left side (if needed) */}
        <div />

        {/* Right Side Controls */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {/* Close Button */}
          {onClose && (
             <md-icon-button onClick={onClose} style={{ '--md-icon-button-icon-size': '24px' }}>
                <md-icon class="material-symbols-rounded">close</md-icon>
             </md-icon-button>
          )}

          {/* Sync Controls Group */}
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-1 bg-white/10 rounded-full p-1 backdrop-blur-md border border-white/5 shadow-lg">
                <md-icon-button onClick={() => updateOffset(-100)} title="Delay Lyrics (-100ms)" style={{ '--md-icon-button-icon-size': '18px', '--md-icon-button-state-layer-width': '32px', '--md-icon-button-state-layer-height': '32px' }}>
                    <md-icon class="material-symbols-rounded">remove</md-icon>
                </md-icon-button>
                
                <span className="text-xs font-mono min-w-[3rem] text-center text-white/90 font-bold select-none">
                  {localOffset > 0 ? '+' : ''}{localOffset}ms
                </span>
                
                <md-icon-button onClick={() => updateOffset(100)} title="Advance Lyrics (+100ms)" style={{ '--md-icon-button-icon-size': '18px', '--md-icon-button-state-layer-width': '32px', '--md-icon-button-state-layer-height': '32px' }}>
                    <md-icon class="material-symbols-rounded">add</md-icon>
                </md-icon-button>
            </div>

            {/* AI Sync Magic Button */}
            <md-icon-button
               onClick={handleGenerateWordSync}
               title="AI Word-Level Sync"
               disabled={loading}
               style={{ '--md-icon-button-icon-size': '20px', backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
               <md-icon class={`material-symbols-rounded ${loading ? 'animate-spin' : 'text-primary'}`}>
                  {loading ? 'sync' : 'auto_awesome'}
               </md-icon>
            </md-icon-button>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      {loading && renderLoading()}
      
      {!loading && (!lyrics || (lyrics.lines.length === 0 && !lyrics.plain)) && renderEmpty()}

      {!loading && lyrics && !lyrics.synced && lyrics.plain && renderPlainLyrics()}

      {!loading && lyrics && lyrics.synced && (
        <div
          ref={containerRef}
          onWheel={handleUserScroll}
          onTouchMove={handleUserScroll}
          className="w-full h-full overflow-y-auto px-6 no-scrollbar"
          style={{ 
            scrollBehavior: 'smooth',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
          }}
        >
          {/* Padding vertical 50vh keeps the first and last lines centerable */}
          <div ref={scrollRef} className="flex flex-col gap-8 text-left py-[50vh] max-w-4xl mx-auto">
              {lyrics.lines.map((line, i) => {
                  const isActive = i === activeLineIndex;
                  const isPast = i < activeLineIndex;
                  
                  const wordCount = line.words ? line.words.length : line.text.split(' ').length;
                  const isLongLine = wordCount > 10;
                  
                  // --- Word Level Rendering ---
                  if (lyrics.isWordSynced && line.words && line.words.length > 0) {
                        return (
                          <motion.div
                              key={i}
                              layout
                              onClick={() => onSeek(line.time - (localOffset/1000))}
                              initial={{ opacity: 0.5 }}
                              animate={{
                                  scale: isActive ? 1 : 0.98,
                                  opacity: isActive ? 1 : isPast ? 0.3 : 0.35,
                                  filter: isActive ? 'blur(0px)' : 'blur(1px)',
                              }}
                              transition={{ duration: 0.4 }}
                              className="cursor-pointer origin-left group"
                          >
                               <p className={`font-bold leading-tight flex flex-wrap gap-x-[0.35em] gap-y-1 transition-all duration-300 ${
                                  isLongLine ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'
                               }`}>
                                 {line.words.map((word, wIdx) => {
                                     // Determine word active state based on strict timing
                                     const nextWordTime = word.endTime ?? line.words![wIdx + 1]?.time ?? Infinity;
                                     const isWordActive = isActive && currentTime >= word.time && currentTime < nextWordTime;
                                     const isWordPast = isActive && currentTime >= nextWordTime;

                                     return (
                                           <span 
                                             key={wIdx}
                                             className="relative inline-block transition-transform duration-200"
                                             style={{
                                                transform: isWordActive ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
                                                color: isActive 
                                                  ? (isWordActive || isWordPast ? '#ffffff' : 'rgba(255,255,255,0.3)')
                                                  : 'inherit'
                                             }}
                                           >
                                                {word.text}
                                           </span>
                                     );
                                 })}
                               </p>
                               {line.translation && (
                                 <motion.p
                                   initial={{ opacity: 0, height: 0 }}
                                   animate={{ 
                                     opacity: isActive ? 0.8 : 0,
                                     height: isActive ? 'auto' : 0
                                   }}
                                   className="text-lg md:text-xl font-medium text-primary mt-2 block overflow-hidden"
                                 >
                                   {line.translation}
                                 </motion.p>
                               )}
                          </motion.div>
                      );
                  }

                  // --- Line Level Rendering ---
                  return (
                      <motion.div
                          key={i}
                          layout
                          onClick={() => onSeek(line.time - (localOffset/1000))}
                          animate={{
                              scale: isActive ? 1 : 0.95,
                              opacity: isActive ? 1 : isPast ? 0.3 : 0.35,
                              filter: isActive ? 'blur(0px)' : 'blur(1.5px)',
                              x: isActive ? 0 : -10 // Slight indentation for inactive lines
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`cursor-pointer origin-left transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
                      >
                           <p className={`font-bold leading-tight ${
                              isLongLine ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
                           }`}>
                             {line.text}
                           </p>
                           {line.translation && (
                             <p className={`text-lg font-medium text-primary mt-2 transition-opacity duration-300 ${isActive ? 'opacity-90' : 'opacity-0 h-0 overflow-hidden'}`}>
                               {line.translation}
                             </p>
                           )}
                      </motion.div>
                  );
              })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LyricsView;
