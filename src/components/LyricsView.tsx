import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fetchLyrics } from '../utils/lyrics';
import { Track, Lyrics } from '../types';
import { useToast } from './Toast';
import { Sparkles, Music2, Loader2 } from 'lucide-react';

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
    if (!lyrics || !lyrics.synced) return;

    const index = lyrics.lines.findIndex((line, i) => {
      const nextLine = lyrics.lines[i + 1];
      return line.time <= currentTime && (!nextLine || nextLine.time > currentTime);
    });

    if (index !== -1 && index !== activeLineIndex) {
      setActiveLineIndex(index);
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

  // Auto Scroll logic
  useEffect(() => {
    if (activeLineIndex !== -1 && scrollRef.current && !isUserScrolling) {
      const activeEl = scrollRef.current.children[activeLineIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLineIndex, isUserScrolling]);

  // Render Content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin mb-4 w-8 h-8 text-accent" />
          <p className="font-mono uppercase tracking-widest text-sm">Syncing...</p>
        </div>
      );
    }

    if (!lyrics || (lyrics.lines.length === 0 && !lyrics.plain)) {
       return (
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground px-8 text-center gap-6">
          <Music2 size={48} className="opacity-20" />
          <div className="space-y-2">
            <p className="text-2xl font-black font-display uppercase">No Lyrics Found</p>
            <p className="text-sm font-mono opacity-60">
              We couldn't find lyrics for this song.
            </p>
          </div>
        </div>
      );
    }

    if (!lyrics.synced && lyrics.plain) {
        return (
            <div className="w-full h-full overflow-y-auto px-8 py-12 text-center no-scrollbar mask-image-gradient">
                <p className="text-foreground whitespace-pre-wrap text-xl leading-relaxed font-serif">
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
        className="w-full h-full overflow-y-auto px-4 py-[50vh] no-scrollbar mask-image-gradient"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div ref={scrollRef} className="flex flex-col gap-12 text-left pl-4 pr-2 max-w-4xl mx-auto">
            {lyrics.lines.map((line, i) => {
                const isActive = i === activeLineIndex;
                const isPast = i < activeLineIndex;
                
                const wordCount = line.words ? line.words.length : line.text.split(' ').length;
                const isLongLine = wordCount > 10;
                
                // Word-level Sync Rendering
                if (lyrics.isWordSynced && line.words && line.words.length > 0) {
                      return (
                        <motion.div
                            key={i}
                            layout
                            onClick={() => onSeek(line.time)}
                            initial={{ opacity: 0.5 }}
                            animate={{
                                opacity: isActive ? 1 : isPast ? 0.2 : 0.4,
                                filter: isActive ? 'blur(0px)' : 'blur(1px)',
                            }}
                            transition={{ duration: 0.4 }}
                            className="cursor-pointer origin-left will-change-transform"
                        >
                             <p className={cn(
                                "font-black font-display leading-none flex flex-wrap gap-x-[0.35em] gap-y-2 uppercase tracking-tighter transition-all duration-500",
                                isLongLine ? 'text-3xl md:text-4xl' : 'text-5xl md:text-6xl',
                                isActive ? "text-accent" : "text-foreground"
                             )}>
                               {line.words.map((word, wIdx) => {
                                   const nextWordTime = word.endTime ?? line.words![wIdx + 1]?.time ?? Infinity;
                                   const isWordActive = isActive && currentTime >= word.time && currentTime < nextWordTime;

                                   return (
                                       <span 
                                         key={wIdx}
                                         className={cn(
                                             "relative inline-block transition-colors duration-150",
                                             isWordActive ? "text-foreground" : "text-inherit"
                                         )}
                                       >
                                           {word.text}
                                       </span>
                                   );
                               })}
                             </p>
                        </motion.div>
                    );
                }

                // Standard Line Sync
                return (
                    <motion.div
                        key={i}
                        layout
                        onClick={() => onSeek(line.time)}
                        initial={{ opacity: 0.5 }}
                        animate={{
                            opacity: isActive ? 1 : isPast ? 0.2 : 0.4,
                            filter: isActive ? 'blur(0px)' : 'blur(2px)',
                        }}
                        transition={{ duration: 0.4 }}
                        className="cursor-pointer origin-left will-change-transform"
                    >
                         <p className={cn(
                            "font-black font-display leading-none uppercase tracking-tighter transition-all duration-500",
                            isLongLine ? 'text-3xl md:text-4xl' : 'text-5xl md:text-6xl',
                            isActive ? "text-accent" : "text-foreground"
                         )}>
                           {line.text}
                         </p>
                         {line.translation && (
                           <p className="text-xl font-medium text-muted-foreground mt-2 font-serif italic">
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
        className="absolute inset-0 z-20 flex flex-col bg-background/90 backdrop-blur-xl rounded-t-3xl md:rounded-none overflow-hidden"
    >
      <div className="absolute top-6 right-6 z-50">
        <button
           onClick={handleGenerateWordSync}
           className="p-3 rounded-none border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
           title="Estimate Word Timing"
         >
           <Sparkles size={20} className={loading ? 'animate-spin text-accent' : ''} />
         </button>
      </div>
      {renderContent()}
    </motion.div>
  );
};

export default LyricsView;
