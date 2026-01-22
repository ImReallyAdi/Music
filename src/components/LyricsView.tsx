import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLyrics } from '../utils/lyrics';
import { Track, Lyrics } from '../types';
import { useToast } from './Toast';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';

interface LyricsViewProps {
  track: Track;
  currentTime: number;
  onSeek: (time: number) => void;
  onClose?: () => void;
  onTrackUpdate?: (track: Track) => void;
  lyricOffset?: number;
  setLyricOffset?: (offset: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const LyricsView: React.FC<LyricsViewProps> = ({
    track,
    currentTime,
    onSeek,
    onTrackUpdate,
    lyricOffset = 0,
    setLyricOffset,
    isFullscreen,
    onToggleFullscreen,
    onClose
}) => {
  const [lyrics, setLyrics] = useState<Lyrics | null>(track.lyrics || null);
  const [loading, setLoading] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [viewMode, setViewMode] = useState<'synced' | 'static'>('synced');

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
        // Default to static if not synced
        if (!track.lyrics.synced && track.lyrics.plain) {
            setViewMode('static');
        } else {
            setViewMode('synced');
        }
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
              if (!data.synced && data.plain) setViewMode('static');

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

  // Sync Active Line
  useEffect(() => {
    if (!lyrics || !lyrics.synced || viewMode === 'static') return;

    const adjustedTime = currentTime + (lyricOffset / 1000);

    // Find the current line (last line where time <= currentTime)
    const index = lyrics.lines.findIndex((line, i) => {
      const nextLine = lyrics.lines[i + 1];
      return line.time <= adjustedTime && (!nextLine || nextLine.time > adjustedTime);
    });

    if (index !== -1 && index !== activeLineIndex) {
      setActiveLineIndex(index);
    }
  }, [currentTime, lyrics, activeLineIndex, lyricOffset, viewMode]);

  // Handle User Interaction (Scroll)
  const handleUserScroll = useCallback(() => {
    if (viewMode === 'static') return;

    setIsUserScrolling(true);
    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);

    userScrollTimeout.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3000);
  }, [viewMode]);

  useEffect(() => {
    return () => {
      if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    };
  }, []);

  // Auto Scroll logic
  useEffect(() => {
    if (viewMode === 'static') return;

    if (activeLineIndex !== -1 && scrollRef.current && !isUserScrolling) {
      const activeEl = scrollRef.current.children[activeLineIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLineIndex, isUserScrolling, viewMode]);

  // Render Content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant">
          <md-icon class="material-symbols-rounded animate-spin mb-4" style={{ fontSize: '32px' }}>progress_activity</md-icon>
          <p className="font-medium tracking-wide">Fetching lyrics...</p>
        </div>
      );
    }

    if (!lyrics || (lyrics.lines.length === 0 && !lyrics.plain)) {
       return (
        <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/50 px-8 text-center">
          <md-icon class="material-symbols-rounded mb-6 opacity-40" style={{ fontSize: '56px' }}>lyrics</md-icon>
          <p className="text-xl font-bold mb-2 text-on-surface">No Lyrics Found</p>
          <p className="text-sm opacity-60 max-w-[200px]">
            We couldn't find lyrics for this song.
          </p>
        </div>
      );
    }

    // STATIC TEXT MODE
    if (viewMode === 'static' || (!lyrics.synced && lyrics.plain)) {
        return (
            <div className="w-full h-full overflow-y-auto px-8 py-12 text-center no-scrollbar mask-image-gradient">
                <p className="text-on-surface whitespace-pre-wrap text-xl leading-relaxed font-medium">
                    {lyrics.plain || lyrics.lines.map(l => l.text).join('\n')}
                </p>
            </div>
        );
    }

    // SYNCED MODE
    return (
      <div
        ref={containerRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        className="w-full h-full overflow-y-auto px-6 py-[50vh] no-scrollbar mask-image-gradient"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div ref={scrollRef} className="flex flex-col gap-10 text-left max-w-4xl mx-auto">
            {lyrics.lines.map((line, i) => {
                const isActive = i === activeLineIndex;
                const isPast = i < activeLineIndex;
                
                // Font Size Logic
                const wordCount = line.words ? line.words.length : line.text.split(' ').length;
                const isLongLine = wordCount > 10;
                
                const adjustedTime = currentTime + (lyricOffset / 1000);

                // Word-level Sync Rendering
                if (lyrics.isWordSynced && line.words && line.words.length > 0) {
                      return (
                        <motion.div
                            key={i}
                            layout
                            onClick={() => onSeek(line.time)}
                            initial={{ opacity: 0.5, scale: 0.95 }}
                            animate={{
                                scale: isActive ? 1.05 : 0.95,
                                opacity: isActive ? 1 : isPast ? 0.3 : 0.15, // Higher contrast
                                filter: isActive ? 'blur(0px)' : 'blur(1px)',
                                y: 0,
                                x: isActive ? 0 : 0
                            }}
                            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                            className="cursor-pointer origin-left will-change-transform"
                        >
                             <p className={`font-black tracking-tight leading-tight flex flex-wrap gap-x-[0.35em] gap-y-1 transition-colors ${
                                isLongLine 
                                  ? 'text-2xl md:text-3xl lg:text-4xl'
                                  : 'text-3xl md:text-4xl lg:text-5xl'
                             }`}>
                               {line.words.map((word, wIdx) => {
                                   const nextWordTime = word.endTime ?? line.words![wIdx + 1]?.time ?? Infinity;
                                   const isWordActive = isActive && adjustedTime >= word.time && adjustedTime < nextWordTime;
                                   const isWordPast = isActive && adjustedTime >= nextWordTime;

                                   return (
                                       <span 
                                         key={wIdx}
                                         className="relative inline-block transition-transform duration-200"
                                         style={{
                                            transform: isWordActive ? 'scale(1.1)' : 'scale(1)',
                                         }}
                                       >
                                            <span
                                             className="relative z-10 transition-colors duration-200"
                                             style={{
                                                 color: isActive
                                                   ? (isWordActive || isWordPast ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)')
                                                   : 'inherit',
                                                 opacity: isActive && !isWordActive && !isWordPast ? 0.6 : 1,
                                                 textShadow: isWordActive ? '0 0 20px rgba(var(--md-sys-color-primary-rgb), 0.5)' : 'none'
                                             }}
                                            >
                                               {word.text}
                                            </span>
                                       </span>
                                   );
                               })}
                             </p>
                             {line.translation && (
                               <motion.p
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: isActive ? 0.8 : 0 }}
                                 className="text-xl font-medium text-secondary mt-3 block"
                               >
                                 {line.translation}
                               </motion.p>
                             )}
                        </motion.div>
                    );
                }

                // Standard Line Sync
                return (
                    <motion.div
                        key={i}
                        layout
                        onClick={() => onSeek(line.time)}
                        initial={{ opacity: 0.5, scale: 0.95 }}
                        animate={{
                            scale: isActive ? 1.05 : 0.95,
                            opacity: isActive ? 1 : isPast ? 0.3 : 0.15, // Higher contrast
                            filter: isActive ? 'blur(0px)' : 'blur(1px)',
                            color: isActive ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
                        }}
                        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                        className="cursor-pointer origin-left will-change-transform"
                    >
                         <p className={`font-black tracking-tight leading-tight ${
                            isLongLine 
                                ? 'text-2xl md:text-3xl lg:text-4xl'
                                : 'text-3xl md:text-4xl lg:text-5xl'
                         }`}>
                           {line.text}
                         </p>
                         {line.translation && (
                           <p className="text-xl font-medium text-secondary mt-3 opacity-80">
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`absolute inset-0 z-20 flex flex-col overflow-hidden ${
            isFullscreen
            ? 'bg-transparent'  /* Allow FullPlayer background to show */
            : 'bg-surface/30 backdrop-blur-md rounded-[32px] md:rounded-[40px]'
        }`}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 z-50">
         {/* Toggle View Mode (M3 Segmented Button) */}
         <div className="inline-flex h-10 items-center rounded-full border border-outline overflow-hidden">
             <button
               onClick={() => setViewMode('synced')}
               className={`flex h-full items-center px-5 text-label-large font-medium transition-all ${
                   viewMode === 'synced'
                   ? 'bg-secondary-container text-on-secondary-container'
                   : 'bg-transparent text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface'
               }`}
             >
               {viewMode === 'synced' && <md-icon class="material-symbols-rounded mr-2" style={{fontSize: '18px'}}>check</md-icon>}
               Synced
             </button>
             <button
               onClick={() => setViewMode('static')}
               className={`flex h-full items-center px-5 text-label-large font-medium transition-all ${
                   viewMode === 'static'
                   ? 'bg-secondary-container text-on-secondary-container'
                   : 'bg-transparent text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface'
               }`}
             >
               {viewMode === 'static' && <md-icon class="material-symbols-rounded mr-2" style={{fontSize: '18px'}}>check</md-icon>}
               Static
             </button>
         </div>

         <div className="flex gap-2">
            <button
              onClick={handleGenerateWordSync}
              className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors text-primary"
              title="Enhance Sync"
            >
              <md-icon class={`material-symbols-rounded ${loading ? 'animate-spin' : ''}`}>auto_awesome</md-icon>
            </button>

            {onToggleFullscreen && (
                <button
                onClick={onToggleFullscreen}
                className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors text-on-surface"
                >
                <md-icon class="material-symbols-rounded">{isFullscreen ? 'close_fullscreen' : 'open_in_full'}</md-icon>
                </button>
            )}
             {onClose && (
                <button
                onClick={onClose}
                className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors text-on-surface"
                >
                <md-icon class="material-symbols-rounded">close</md-icon>
                </button>
            )}
         </div>
      </div>

      {renderContent()}

    </motion.div>
  );
};

export default LyricsView;
