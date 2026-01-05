import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, LyricLine } from '../types';
import { fetchLyrics } from '../utils/lyrics';
import { Loader2, AlertCircle, ChevronDown, Music2 } from 'lucide-react';

// --- Types ---
interface LyricsViewProps {
  track: Track;
  currentTime: number;
  onSeek: (time: number) => void;
  onClose: () => void;
  onTrackUpdate?: (track: Track) => void;
}

// --- Custom Hook for Data Fetching ---
const useLyricsFetcher = (track: Track, onTrackUpdate?: (track: Track) => void) => {
  const [state, setState] = useState({
    loading: false,
    error: false,
    lyrics: [] as LyricLine[],
    isWordSynced: false,
  });

  useEffect(() => {
    let isMounted = true;

    // Use cached lyrics if available
    if (track.lyrics && !track.lyrics.error && track.lyrics.lines.length > 0) {
      setState({
        loading: false,
        error: false,
        lyrics: track.lyrics.lines,
        isWordSynced: !!track.lyrics.isWordSynced,
      });
      return;
    }

    const load = async () => {
      setState(s => ({ ...s, loading: true, error: false }));
      try {
        const result = await fetchLyrics(track);
        if (isMounted) {
          if (result.error || result.lines.length === 0) {
            setState(s => ({ ...s, loading: false, error: true }));
          } else {
            setState({
              loading: false,
              error: false,
              lyrics: result.lines,
              isWordSynced: !!result.isWordSynced,
            });
            onTrackUpdate?.({ ...track, lyrics: result });
          }
        }
      } catch (err) {
        if (isMounted) setState(s => ({ ...s, loading: false, error: true }));
      }
    };

    load();
    return () => { isMounted = false; };
  }, [track.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
};

// --- Sub-Component for Individual Lines (Performance Optimization) ---
const LyricLineItem = React.memo(({ 
  line, 
  isActive, 
  isPast, 
  onSeek, 
  isWordSynced, 
  currentTime 
}: { 
  line: LyricLine; 
  isActive: boolean; 
  isPast: boolean; 
  onSeek: (t: number) => void; 
  isWordSynced: boolean;
  currentTime: number;
}) => {
  const lineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll trigger via ref
  useEffect(() => {
    if (isActive && lineRef.current) {
      lineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  return (
    <motion.div
      ref={lineRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isActive ? 1 : isPast ? 0.3 : 0.3,
        scale: isActive ? 1.05 : 0.95,
        filter: isActive ? 'blur(0px)' : 'blur(0.5px)',
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`
        cursor-pointer origin-center py-4 px-2 rounded-xl transition-colors
        ${isActive ? 'text-white font-bold text-2xl md:text-3xl' : 'text-white/80 font-medium text-xl hover:bg-white/5'}
      `}
      onClick={() => onSeek(line.time)}
    >
      {isWordSynced && line.words && isActive ? (
        <span className="flex flex-wrap justify-center gap-x-[0.25em] leading-tight">
          {line.words.map((word, idx) => {
            const isWordActive = currentTime >= word.time;
            return (
              <motion.span
                key={`${idx}-${word.text}`}
                animate={{
                  color: isWordActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                }}
                transition={{ duration: 0.15 }}
              >
                {word.text}
              </motion.span>
            );
          })}
        </span>
      ) : (
        <span className="leading-tight block">{line.text}</span>
      )}
    </motion.div>
  );
});
LyricLineItem.displayName = 'LyricLineItem';

// --- Main Component ---
const LyricsView: React.FC<LyricsViewProps> = ({
  track,
  currentTime,
  onSeek,
  onClose,
  onTrackUpdate,
}) => {
  const { loading, error, lyrics, isWordSynced } = useLyricsFetcher(track, onTrackUpdate);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction State
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userInteractedTimeout = useRef<NodeJS.Timeout | null>(null);

  // Optimized Active Line Calculation
  const activeLineIndex = useMemo(() => {
    if (!lyrics.length) return -1;
    // Find the last line that has a time less than or equal to current time
    // using findLastIndex is cleaner if supported, otherwise standard loop
    let index = lyrics.findIndex(line => line.time > currentTime);
    return index === -1 ? lyrics.length - 1 : Math.max(0, index - 1);
  }, [currentTime, lyrics]);

  // Handle Manual Scroll Detection
  const handleScrollInteraction = useCallback(() => {
    setIsUserScrolling(true);
    
    if (userInteractedTimeout.current) clearTimeout(userInteractedTimeout.current);
    
    // Optional: Auto-resume after 4 seconds of no activity? 
    // Commented out to prefer manual "Resume" button for better UX
    /*
    userInteractedTimeout.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4000);
    */
  }, []);

  const scrollToCurrent = () => {
    setIsUserScrolling(false);
    // The useEffect inside LyricLineItem will trigger the scroll
  };

  const handleSeek = (time: number) => {
    onSeek(time);
    setIsUserScrolling(false); // Snap back to sync on click
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-2xl">
        <Loader2 className="animate-spin w-10 h-10 text-white/50 mb-4" />
        <span className="text-white/50 font-medium animate-pulse">Syncing Lyrics...</span>
      </div>
    );
  }

  if (error || lyrics.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-2xl p-6">
        <div className="bg-white/5 p-6 rounded-full mb-4">
          <Music2 className="w-12 h-12 text-white/30" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Lyrics not available</h3>
        <p className="text-white/40 text-sm mb-6 text-center max-w-xs">
          We couldn't find synchronized lyrics for this track.
        </p>
        <button 
          onClick={onClose}
          className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform"
        >
          Close View
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black/80 backdrop-blur-2xl group">
      {/* Container with Masking for fade effect */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-auto no-scrollbar py-[50vh] px-6 text-center"
        style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)' }}
        onWheel={handleScrollInteraction}
        onTouchMove={handleScrollInteraction}
      >
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          {lyrics.map((line, index) => (
            // Only pass scroll logic to the active line if we aren't manually scrolling
            <LyricLineItem
              key={`${index}-${line.time}`}
              line={line}
              isActive={index === activeLineIndex}
              isPast={index < activeLineIndex}
              isWordSynced={isWordSynced}
              currentTime={currentTime}
              onSeek={handleSeek}
              // Prevent auto-scroll inside the item if user is scrolling
              {...(isUserScrolling ? { isActive: false } : {})} 
            />
          ))}
        </div>
      </div>

      {/* Floating Resume Button */}
      <AnimatePresence>
        {isUserScrolling && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToCurrent}
            className="absolute bottom-8 right-8 z-50 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-full font-medium text-sm transition-colors shadow-lg"
          >
            <ChevronDown className="w-4 h-4" />
            <span>Resume Sync</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LyricsView;
