import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLyrics } from '../utils/lyrics';
import { Track, Lyrics } from '../types';
import { useToast } from './Toast';

// Material Web Components
import '@material/web/iconbutton/icon-button.js';
import '@material/web/iconbutton/filled-icon-button.js'; // Added for emphasis
import '@material/web/icon/icon.js';
import '@material/web/progress/circular-progress.js'; // Standard MD3 loader

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-icon-button': any;
      'md-filled-icon-button': any;
      'md-icon': any;
      'md-circular-progress': any;
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
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

const LyricsView: React.FC<LyricsViewProps> = ({
  track,
  currentTime: rawCurrentTime,
  onSeek,
  onTrackUpdate,
  onClose,
  lyricOffset = 0,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  // Apply offset to current time
  const currentTime = rawCurrentTime + (lyricOffset / 1000);
  
  const { addToast } = useToast();
  
  // State
  const [lyrics, setLyrics] = useState<Lyrics | null>(track.lyrics || null);
  const [isFetching, setIsFetching] = useState(false); // Initial load
  const [isEnhancing, setIsEnhancing] = useState(false); // AI Sync active
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // 1. Smart Fetch Logic (Fixes "Loading" flash)
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const hasExistingLyrics = track.lyrics && !track.lyrics.error;
      
      // Only show skeleton if we have absolutely nothing
      if (!hasExistingLyrics) {
        setIsFetching(true);
        setLyrics(null);
      } else {
        setLyrics(track.lyrics);
      }

      try {
        // Fetch in background if we have lyrics, or foreground if we don't
        const data = await fetchLyrics(track);

        if (mounted) {
          if (data && (!hasExistingLyrics || JSON.stringify(data) !== JSON.stringify(track.lyrics))) {
            setLyrics(data);
            if (onTrackUpdate && !data.error) {
              onTrackUpdate({ ...track, lyrics: data });
            }
          }
        }
      } catch (error) {
        console.error("Lyrics load failed:", error);
      } finally {
        if (mounted) setIsFetching(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [track.id, track.title, track.artist]); // Removed onTrackUpdate from deps to prevent loops

  // 2. Non-blocking AI Enhancement
  const handleGenerateWordSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEnhancing) return;

    setIsEnhancing(true);
    addToast("Enhancing sync with AI...", "info");

    try {
      const data = await fetchLyrics(track, true, true); // force=true, sync=true
      
      setLyrics(data);
      if (onTrackUpdate && !data.error) {
        onTrackUpdate({ ...track, lyrics: data });
      }

      if (data.isWordSynced) {
        addToast("Lyrics enhanced!", "success");
      } else {
        addToast("Could not enhance precision.", "error");
      }
    } catch (error) {
      console.error("Enhance failed:", error);
      addToast("Enhancement failed", "error");
    } finally {
      setIsEnhancing(false);
    }
  };

  // 3. Optimized Line Detection
  useEffect(() => {
    if (!lyrics || !lyrics.synced) return;

    // Binary search could be faster, but findIndex is fine for <100 lines
    const index = lyrics.lines.findIndex((line, i) => {
      const nextLine = lyrics.lines[i + 1];
      return line.time <= currentTime && (!nextLine || nextLine.time > currentTime);
    });

    if (index !== activeLineIndex) {
      setActiveLineIndex(index);
    }
  }, [currentTime, lyrics]); 

  // 4. Scroll Handling
  const handleUserScroll = useCallback(() => {
    setIsUserScrolling(true);
    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    userScrollTimeout.current = setTimeout(() => setIsUserScrolling(false), 2000);
  }, []);

  useEffect(() => {
    if (activeLineIndex !== -1 && scrollRef.current && !isUserScrolling) {
      const activeEl = scrollRef.current.children[activeLineIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLineIndex, isUserScrolling]);

  // 5. Active Word Calculation
  const activeWordInfo = useMemo(() => {
    if (!lyrics?.isWordSynced || activeLineIndex === -1) return null;
    
    const line = lyrics.lines[activeLineIndex];
    if (!line.words?.length) return null;

    const wIndex = line.words.findIndex((w, i) => {
      const nextW = line.words![i + 1];
      const nextTime = nextW?.time ?? w.endTime ?? Infinity;
      return w.time <= currentTime && currentTime < nextTime;
    });

    const idx = wIndex === -1 ? (currentTime < line.words[0].time ? -1 : line.words.length - 1) : wIndex;
    if (idx === -1) return null;

    const word = line.words[idx];
    const nextTime = word.endTime ?? line.words[idx + 1]?.time ?? (word.time + 0.5);
    const progress = clamp((currentTime - word.time) / (nextTime - word.time), 0, 1);

    return { index: idx, progress, word };
  }, [lyrics, activeLineIndex, currentTime]);

  // -- RENDERERS --

  const renderSkeleton = () => (
    <div className="w-full h-full px-8 py-20 flex flex-col items-center gap-8 opacity-50">
      <div className="w-16 h-16 rounded-full bg-surface-variant animate-pulse mb-4" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-full max-w-lg h-8 rounded-full bg-surface-variant/30 animate-pulse" 
             style={{ width: `${80 - (i * 10) + (Math.random() * 20)}%` }} />
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
      className={`absolute inset-0 z-20 flex flex-col overflow-hidden shadow-2xl bg-black ${
        isFullscreen ? 'rounded-none' : 'rounded-[32px]'
      }`}
    >
      {/* 1. Dynamic Background from Cover Art */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <motion.img
           key={track.coverArt}
           src={track.coverArt}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1 }}
           className="w-full h-full object-cover blur-[80px] scale-150 brightness-[0.4]"
           alt=""
         />
         {/* Tonal Scrim for Readability */}
         <div className="absolute inset-0 bg-surface/40 mix-blend-multiply" />
         {/* Gradient Vignette */}
         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* Header - Glassmorphism */}
      <div className="relative z-50 px-4 py-3 flex items-center justify-between backdrop-blur-md bg-white/5 border-b border-white/5">
        {/* Track Info */}
        <div className="flex flex-col ml-2">
          <span className="text-title-medium font-bold text-on-surface tracking-wide truncate max-w-[200px]">
            {track.title}
          </span>
          <span className="text-label-medium font-medium text-on-surface-variant truncate max-w-[200px]">
            {track.artist}
          </span>
        </div>

        {/* Actions Toolbar */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/5">
          {onToggleFullscreen && (
            <md-icon-button onClick={onToggleFullscreen} title="Toggle Fullscreen">
              <md-icon class="material-symbols-rounded text-on-surface">
                {isFullscreen ? 'close_fullscreen' : 'open_in_full'}
              </md-icon>
            </md-icon-button>
          )}

          {/* Primary Action: Enhanced Button */}
          <div className="relative group">
            <md-filled-icon-button 
              onClick={handleGenerateWordSync} 
              disabled={isEnhancing}
              title="AI Magic Sync"
              style={{
                '--md-sys-color-primary': isEnhancing ? 'var(--md-sys-color-surface-variant)' : 'var(--md-sys-color-primary-container)',
                '--md-sys-color-on-primary': isEnhancing ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-primary-container)',
              }}
            >
              {isEnhancing ? (
                <md-circular-progress indeterminate style={{'--md-circular-progress-size': '20px', '--md-circular-progress-active-indicator-width': '12'}} />
              ) : (
                <md-icon class="material-symbols-rounded">auto_awesome</md-icon>
              )}
            </md-filled-icon-button>
          </div>

          {onClose && (
            <md-icon-button onClick={onClose} title="Close">
              <md-icon class="material-symbols-rounded text-on-surface">close</md-icon>
            </md-icon-button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={containerRef}
        className="relative z-10 flex-1 overflow-y-auto no-scrollbar scroll-smooth outline-none"
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        tabIndex={0}
      >
        {isFetching ? (
          renderSkeleton()
        ) : !lyrics || (lyrics.lines.length === 0 && !lyrics.plain) ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-4">
            <md-icon class="material-symbols-rounded text-[48px] opacity-40">music_off</md-icon>
            <p className="text-body-large">Lyrics not available</p>
          </div>
        ) : lyrics.synced ? (
          <div className="py-[45vh] px-6 max-w-4xl mx-auto flex flex-col gap-6">
            <div ref={scrollRef} className="contents">
              {lyrics.lines.map((line, i) => {
                const isActive = i === activeLineIndex;
                const isPast = i < activeLineIndex;
                
                // --- Word Sync Rendering ---
                if (lyrics.isWordSynced && line.words?.length) {
                  return (
                    <motion.div
                      key={i}
                      layout
                      onClick={() => onSeek(line.time - (lyricOffset/1000))}
                      className={`cursor-pointer origin-left transition-all duration-500`}
                    >
                      <p className={`font-bold leading-tight flex flex-wrap gap-x-[0.3em] gap-y-1 ${
                        line.words.length > 8 ? 'text-headline-medium' : 'text-display-small'
                      }`}>
                        {line.words.map((word, wIdx) => {
                          const isWordActive = isActive && activeWordInfo?.index === wIdx;
                          const isWordPast = isActive && activeWordInfo?.index! > wIdx;
                          
                          return (
                            <span 
                              key={wIdx} 
                              className="relative inline-block transition-all duration-200"
                              style={{
                                // Word-level activation: Primary for active word, Muted for others
                                color: isWordActive
                                    ? 'var(--md-sys-color-primary)'
                                    : (isWordPast || isPast
                                        ? 'var(--md-sys-color-on-surface-variant)'
                                        : 'var(--md-sys-color-on-surface-variant)'),
                                opacity: isWordActive ? 1 : (isWordPast || isPast ? 0.6 : 0.4),
                                transform: isWordActive ? 'scale(1.05)' : 'scale(1)',
                                textShadow: isWordActive ? '0 0 20px rgba(0,0,0,0.5)' : 'none'
                              }}
                            >
                              {word.text}
                            </span>
                          );
                        })}
                      </p>
                    </motion.div>
                  );
                }

                // --- Line Sync Rendering ---
                return (
                  <motion.div
                    key={i}
                    layout
                    onClick={() => onSeek(line.time - (lyricOffset/1000))}
                    animate={{
                      scale: isActive ? 1 : 0.98,
                      opacity: isActive ? 1 : isPast ? 0.5 : 0.4,
                      x: isActive ? 0 : 0,
                      filter: isActive ? 'blur(0px)' : 'blur(0.5px)'
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="cursor-pointer origin-left group py-2"
                  >
                    <p className={`font-bold transition-colors duration-300 ${
                       isActive
                        ? 'text-headline-medium text-primary'
                        : 'text-title-large text-on-surface-variant group-hover:text-on-surface'
                    }`}>
                      {line.text}
                    </p>
                    {line.translation && (
                      <p className={`text-body-large text-secondary mt-1 transition-all ${isActive ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
                        {line.translation}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Plain Lyrics */
          <div className="py-20 px-8 text-center whitespace-pre-wrap text-body-large text-on-surface leading-relaxed font-medium">
            {lyrics.plain}
          </div>
        )}
      </div>

      {/* Footer Gradient Mask */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
      
      {/* Scroll Hint */}
      <AnimatePresence>
        {isUserScrolling && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="bg-surface-container-high/50 backdrop-blur-md px-4 py-2 rounded-full text-label-medium font-medium text-on-surface shadow-lg border border-outline-variant">
              Auto-scroll paused
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LyricsView;
