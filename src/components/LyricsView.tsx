import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, LyricLine, LyricWord } from '../types';
import { fetchLyrics } from '../utils/lyrics';
import { Loader2, AlertCircle } from 'lucide-react';

interface LyricsViewProps {
  track: Track;
  currentTime: number;
  onSeek: (time: number) => void;
  onClose: () => void;
  onTrackUpdate?: (track: Track) => void;
}

const LyricsView: React.FC<LyricsViewProps> = ({
  track,
  currentTime,
  onSeek,
  onClose,
  onTrackUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isWordSynced, setIsWordSynced] = useState(false);
  
  // Ref for auto-scrolling
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  
  // Smart scrolling: Pause auto-scroll when user interacts
  const isAutoScrolling = useRef(true);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadLyrics = async () => {
      // If we already have valid lyrics for this track, use them
      if (track.lyrics && !track.lyrics.error && track.lyrics.lines.length > 0) {
        setLyrics(track.lyrics.lines);
        setIsWordSynced(!!track.lyrics.isWordSynced);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);
      
      try {
        const result = await fetchLyrics(track);
        if (isMounted) {
          if (result.error || result.lines.length === 0) {
            setError(true);
          } else {
            setLyrics(result.lines);
            setIsWordSynced(!!result.isWordSynced);
            // Notify parent to update track with new lyrics if successful
            if (onTrackUpdate) {
                onTrackUpdate({ ...track, lyrics: result });
            }
          }
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadLyrics();
    
    return () => { isMounted = false; };
  }, [track.id]); // Re-fetch only when track ID changes

  // Determine current line index
  const activeLineIndex = useMemo(() => {
    // Find the last line that has started
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [currentTime, lyrics]);

  // Handle auto-scroll
  useEffect(() => {
    if (activeLineIndex !== -1 && isAutoScrolling.current && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  const handleUserScroll = () => {
    isAutoScrolling.current = false;
    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    
    userScrollTimeout.current = setTimeout(() => {
      isAutoScrolling.current = true;
    }, 3000);
  };

  const handleLineClick = (time: number) => {
    onSeek(time);
    // Resume auto-scroll immediately on manual seek
    isAutoScrolling.current = true;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-4 bg-black/60 backdrop-blur-xl">
        <Loader2 className="animate-spin w-8 h-8" />
        <span className="text-sm font-medium tracking-wide">Loading Lyrics...</span>
      </div>
    );
  }

  if (error || lyrics.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-4 bg-black/60 backdrop-blur-xl p-8 text-center">
        <AlertCircle className="w-10 h-10 opacity-50" />
        <span className="text-lg font-medium">No lyrics found</span>
        <button 
            onClick={onClose}
            className="mt-4 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm text-white"
        >
            Close
        </button>
      </div>
    );
  }

  return (
    <div 
        ref={containerRef}
        className="w-full h-full overflow-y-auto no-scrollbar py-[50vh] px-4 md:px-8 bg-black/60 backdrop-blur-xl text-center"
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        onPointerDown={(e) => e.stopPropagation()} // Allow scrolling, prevent drag-to-close
    >
      <div className="flex flex-col gap-6 md:gap-8 max-w-2xl mx-auto">
        {lyrics.map((line, index) => {
          const isActive = index === activeLineIndex;
          const isPast = index < activeLineIndex;

          return (
            <motion.div
              key={index}
              ref={isActive ? activeLineRef : null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isActive ? 1 : isPast ? 0.4 : 0.4,
                scale: isActive ? 1.05 : 1,
                y: 0,
                filter: isActive ? 'blur(0px)' : 'blur(0.5px)'
              }}
              className={`
                cursor-pointer transition-all duration-300 ease-out origin-center
                ${isActive ? 'font-bold text-white text-2xl md:text-3xl lg:text-4xl my-4' : 'font-medium text-white/80 text-lg md:text-xl lg:text-2xl hover:opacity-80 hover:scale-105'}
              `}
              onClick={() => handleLineClick(line.time)}
            >
                {isWordSynced && line.words && isActive ? (
                    // Word-by-word highlighting for active line
                    <span className="flex flex-wrap justify-center gap-[0.2em] leading-tight">
                        {line.words.map((word, wIdx) => {
                            // Word is active if currentTime is past its start time but before next word
                            // Actually simple check: has it started?
                            const isWordActive = currentTime >= word.time;
                            
                            // To be more precise, we could check if it is the *current* word.
                            // But usually highlighting everything played so far in the line is good style (karaoke style).
                            // Or we can highlight only the current word. 
                            // Apple Music style: highlight passed words.
                            
                            return (
                                <motion.span
                                    key={wIdx}
                                    animate={{ 
                                        opacity: isWordActive ? 1 : 0.4,
                                        color: isWordActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                    }}
                                    transition={{ duration: 0.1 }}
                                >
                                    {word.text}
                                </motion.span>
                            );
                        })}
                    </span>
                ) : (
                    // Standard line rendering
                    <span className="leading-tight block">
                        {line.text}
                    </span>
                )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LyricsView;
