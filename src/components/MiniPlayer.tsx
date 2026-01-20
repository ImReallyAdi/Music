import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Track, PlayerState } from '../types';
import { Play, Pause, SkipForward, Music2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface MiniPlayerProps {
  currentTrack: Track | null;
  playerState: PlayerState;
  isPlayerOpen: boolean;
  onOpen: () => void;
  togglePlay: () => void;
  onNext?: () => void;
  progress?: number;
}

const MiniPlayer: React.FC<MiniPlayerProps> = React.memo(({ 
  currentTrack, 
  playerState, 
  onOpen, 
  togglePlay,
  onNext,
  progress = 0 
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [currentTrack?.id]);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlay();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNext) onNext();
  };

  if (!currentTrack) return null;

  return (
    <motion.div
      initial={{ y: 150, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 150, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.8 }}
      onClick={onOpen}
      className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-0 right-0 md:left-auto md:right-12 md:w-[400px]
                 h-[80px] bg-background border-t border-border md:border md:border-border md:rounded-none
                 flex items-center pl-4 pr-6 shadow-2xl z-[500] cursor-pointer
                 group hover:border-accent/50 transition-colors"
      layoutId="mini-player"
    >
      {/* Progress Bar at Top - Minimal */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-muted pointer-events-none">
         <motion.div
            className="h-full bg-accent"
            style={{ width: `${progress * 100}%` }}
         />
      </div>

      {/* Album Art */}
      <motion.div
        layoutId={`artwork-${currentTrack.id}`}
        className="relative w-12 h-12 overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center border border-border"
      >
        {!imgError && currentTrack.coverArt ? (
          <img
            src={currentTrack.coverArt}
            className="w-full h-full object-cover filter grayscale-[20%]"
            alt={currentTrack.title}
            onError={() => setImgError(true)}
          />
        ) : (
          <Music2 size={24} className="text-muted-foreground" />
        )}
      </motion.div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center px-4 gap-1">
        <motion.h4
           layoutId={`title-${currentTrack.id}`}
           className="text-base font-bold font-display text-foreground truncate leading-none uppercase tracking-tight"
        >
          {currentTrack.title}
        </motion.h4>
        <motion.p
           layoutId={`artist-${currentTrack.id}`}
           className="text-xs font-mono text-muted-foreground truncate leading-none uppercase tracking-wider"
        >
          {currentTrack.artist}
        </motion.p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
         <button
            onClick={handleTogglePlay}
            className="text-foreground hover:text-accent transition-colors"
         >
            {playerState.isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
         </button>

         {onNext && (
           <button
                onClick={handleNext}
                className="text-foreground hover:text-accent transition-colors"
           >
             <SkipForward size={24} />
           </button>
         )}
      </div>

    </motion.div>
  );
});

MiniPlayer.displayName = 'MiniPlayer';

export default MiniPlayer;
