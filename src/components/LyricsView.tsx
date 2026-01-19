import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  const [lyrics, setLyrics] = useState<Lyrics | null>(track.lyrics || null);
  const [loading, setLoading] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Apply offset to current time for sync logic
  const currentTime = rawCurrentTime + (lyricOffset / 1000);

  const { addToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } else if (index === -1) {
      setActiveLineIndex(-1);
    }
  }, [currentTime, lyrics]); // intentionally omit activeLineIndex to avoid loops

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

  // Keyboard Support (left/right to seek)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = e.key === 'ArrowLeft' ? -5 : 5;
        onSeek(Math.max(0, rawCurrentTime + delta));
      }
    };
    const node = containerRef.current ?? window;
    node.addEventListener('keydown', handleKey as any);
    return () => node.removeEventListener('keydown', handleKey as any);
  }, [rawCurrentTime, onSeek]);

  // Derived state: lines count & word progress for current active word
  const lineCount = lyrics?.lines?.length ?? 0;
  const activeWordInfo = useMemo(() => {
    if (!lyrics || !lyrics.synced || activeLineIndex === -1) return null;
    const line = lyrics.lines[activeLineIndex];
    if (!lyrics.isWordSynced || !line.words || line.words.length === 0) return null;

    const wIndex = line.words.findIndex((w, i) => {
      const nextW = line.words[i + 1];
      const nextTime = nextW?.time ?? w.endTime ?? Infinity;
      return w.time <= currentTime && currentTime < nextTime;
    });

    const idx = wIndex === -1 ? Math.max(0, line.words.length - 1) : wIndex;
    const word = line.words[idx];
    const nextWordTime = word.endTime ?? line.words[idx + 1]?.time ?? (word.time + 0.5);
    const start = word.time;
    const end = nextWordTime;
    const progress = clamp((currentTime - start) / Math.max(0.001, end - start), 0, 1);

    return { index: idx, progress, word, lineIndex: activeLineIndex };
  }, [lyrics, activeLineIndex, currentTime]);

  // Renderers
  const renderLoadingOverlay = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 z-40 pointer-events-none">
      <md-icon class="material-symbols-rounded animate-spin mb-3 text-primary" style={{fontSize: '36px'}}>progress_activity</md-icon>
      <p className="font-medium tracking-wide text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">Syncing lyrics...</p>
    </div>
  );

  const renderSkeleton = () => (
    <div className="w-full h-full px-8 py-12 flex flex-col items-center gap-6">
      <div className="w-3/4 h-6 rounded-full bg-white/8 animate-pulse" />
      <div className="w-5/6 h-8 rounded bg-white/6 animate-pulse" />
      <div className="w-2/3 h-8 rounded bg-white/6 animate-pulse" />
      <div className="mt-6 w-full max-w-2xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-full h-8 rounded bg-white/6 animate-pulse" />
        ))}
      </div>
    </div>
  );

  const renderEmpty = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-white/50 px-8 text-center">
      <md-icon class="material-symbols-rounded mb-6 opacity-40" style={{fontSize: '56px'}}>lyrics</md-icon>
      <p className="text-xl font-bold mb-2">No Lyrics Found</p>
      <p className="text-sm opacity-60 max-w-[300px]">
        We couldn't find time-synced lyrics for this track. Try AI Sync or check the original source.
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
      transition={{ duration: 0.28 }}
      className={`absolute inset-0 z-20 flex flex-col overflow-hidden rounded-[40px] ${
        isFullscreen ? 'bg-black/30 backdrop-blur-xl' : 'bg-black/40 backdrop-blur-md border border-white/5'
      }`}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-5 flex items-center justify-between gap-3 pointer-events-none bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3 pointer-events-auto min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm text-white/80 font-semibold truncate max-w-[240px]">{track.title}</p>
              <p className="text-sm text-white/50 truncate max-w-[160px]">— {track.artist}</p>
            </div>
            <p className="text-xs text-white/40 mt-0.5 truncate max-w-[380px]">Lyrics</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {onToggleFullscreen && (
            <md-icon-button
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              style={{ '--md-icon-button-icon-size': '22px', backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <md-icon class="material-symbols-rounded">
                {isFullscreen ? 'close_fullscreen' : 'open_in_full'}
              </md-icon>
            </md-icon-button>
          )}

          <md-icon-button
            onClick={handleGenerateWordSync}
            title="AI Word-Level Sync"
            disabled={loading}
            style={{ '--md-icon-button-icon-size': '20px', backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <md-icon class={`material-symbols-rounded ${loading ? 'animate-spin' : 'text-primary'}`}>
              {loading ? 'sync' : 'auto_awesome'}
            </md-icon>
          </md-icon-button>

          {onClose && (
            <md-icon-button
              onClick={onClose}
              title="Close"
              style={{ '--md-icon-button-icon-size': '22px', backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <md-icon class="material-symbols-rounded">close</md-icon>
            </md-icon-button>
          )}
        </div>
      </div>

      {/* Loading overlay skeleton */}
      {loading && renderLoadingOverlay()}

      {/* Content decisions */}
      {!loading && (!lyrics || (lyrics.lines.length === 0 && !lyrics.plain)) && renderEmpty()}

      {!loading && lyrics && !lyrics.synced && lyrics.plain && renderPlainLyrics()}

      {/* Synced lyrics */}
      {!loading && lyrics && lyrics.synced && (
        <div
          ref={containerRef}
          tabIndex={0}
          onWheel={handleUserScroll}
          onTouchMove={handleUserScroll}
          onScroll={handleUserScroll}
          role="region"
          aria-label="Lyrics"
          className="w-full h-full overflow-y-auto px-6 no-scrollbar focus:outline-none"
          style={{
            scrollBehavior: isUserScrolling ? 'auto' : 'smooth',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)'
          }}
        >
          <div className="relative max-w-4xl mx-auto py-[48vh]">
            {/* gentle mask overlay for top/bottom */}
            <div className="absolute inset-x-0 top-0 h-28 pointer-events-none bg-gradient-to-b from-black/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none bg-gradient-to-t from-black/60 to-transparent" />

            <div ref={scrollRef} className="flex flex-col gap-8 text-left px-4">
              {lyrics.lines.map((line, i) => {
                const isActive = i === activeLineIndex;
                const isPast = i < activeLineIndex;

                const wordCount = line.words ? line.words.length : line.text.split(' ').length;
                const isLongLine = wordCount > 10;

                // Word Level Rendering
                if (lyrics.isWordSynced && line.words && line.words.length > 0) {
                  return (
                    <motion.div
                      key={i}
                      layout
                      onClick={() => onSeek(line.time - (lyricOffset / 1000))}
                      initial={{ opacity: 0.6 }}
                      animate={{
                        scale: isActive ? 1 : 0.98,
                        opacity: isActive ? 1 : isPast ? 0.28 : 0.36,
                        filter: isActive ? 'blur(0px)' : 'blur(0.8px)'
                      }}
                      transition={{ duration: 0.32 }}
                      className="cursor-pointer origin-left group relative"
                      role="listitem"
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <p
                        className={`font-extrabold leading-tight flex flex-wrap gap-x-[0.35em] gap-y-1 transition-all duration-200 ${
                          isLongLine ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'
                        }`}
                      >
                        {line.words.map((word, wIdx) => {
                          // Determine word active state based on strict timing
                          const nextWordTime = word.endTime ?? line.words![wIdx + 1]?.time ?? Infinity;
                          const isWordActive = isActive && currentTime >= word.time && currentTime < nextWordTime;
                          const isWordPast = isActive && currentTime >= nextWordTime;

                          const baseColor = isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)';
                          const fadedColor = 'rgba(255,255,255,0.32)';

                          // active word progress (for subtle underline / emphasis)
                          const progress =
                            isWordActive && activeWordInfo && activeWordInfo.index === wIdx
                              ? activeWordInfo.progress
                              : isWordPast
                              ? 1
                              : 0;

                          return (
                            <span
                              key={wIdx}
                              className="relative inline-block transition-transform duration-150"
                              style={{
                                transform: isWordActive ? 'scale(1.06) translateY(-2px)' : 'scale(1)',
                                color: isWordActive || isWordPast ? baseColor : fadedColor,
                                fontWeight: isWordActive ? 800 : 700
                              }}
                            >
                              {/* word text */}
                              <span>{word.text}</span>

                              {/* subtle progress bar under active word */}
                              {isWordActive && (
                                <span
                                  aria-hidden
                                  className="absolute left-0 right-0 bottom-0 h-[2px] rounded"
                                  style={{
                                    background: 'linear-gradient(90deg,#ffffff,#a7f3d0)',
                                    transformOrigin: 'left',
                                    transform: `scaleX(${clamp(progress, 0, 1)})`,
                                    opacity: 0.95
                                  }}
                                />
                              )}
                            </span>
                          );
                        })}
                      </p>

                      {line.translation && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{
                            opacity: isActive ? 0.86 : 0,
                            height: isActive ? 'auto' : 0
                          }}
                          className="text-lg md:text-xl font-medium text-primary mt-2 block overflow-hidden"
                        >
                          {line.translation}
                        </motion.p>
                      )}

                      {/* active-line accent */}
                      {isActive && (
                        <div
                          className="absolute left-0 -translate-x-6 top-1/2 -translate-y-1/2 w-1 h-10 rounded-full bg-gradient-to-b from-primary to-transparent opacity-90 pointer-events-none"
                          aria-hidden
                        />
                      )}
                    </motion.div>
                  );
                }

                // Line Level Rendering
                return (
                  <motion.div
                    key={i}
                    layout
                    onClick={() => onSeek(line.time - (lyricOffset / 1000))}
                    animate={{
                      scale: isActive ? 1 : 0.96,
                      opacity: isActive ? 1 : isPast ? 0.3 : 0.38,
                      filter: isActive ? 'blur(0px)' : 'blur(1px)',
                      x: isActive ? 0 : -6
                    }}
                    transition={{ duration: 0.38, ease: "easeOut" }}
                    className={`cursor-pointer origin-left transition-colors duration-250 ${isActive ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
                    role="listitem"
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <p className={`font-bold leading-tight ${isLongLine ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'}`}>
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

            {/* footer hint / autoscroll indicator */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-8 bg-black/50 text-white/80 text-xs px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none">
              {isUserScrolling ? 'Autoscroll paused — returning soon' : `${lineCount} lines`}
            </div>
          </div>
        </div>
      )}

      {/* Show skeleton in place when loading and no prior lyrics */}
      {loading && !lyrics && (
        <div className="absolute inset-0 z-10">
          {renderSkeleton()}
        </div>
      )}
    </motion.div>
  );
};

export default LyricsView;
