import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, PlayerState } from '../types';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-icon-button': any;
      'md-icon': any;
    }
  }
}

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
      initial={{ y: 150, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 150, opacity: 0, scale: 0.9 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.8 }}
      onClick={onOpen}
      className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-3 right-3 md:left-auto md:right-6 md:w-[420px]
                 h-[64px] bg-surface-container/90 backdrop-blur-[32px] saturate-[180%] rounded-[20px]
                 flex items-center pl-2 pr-2 shadow-elevation-2 z-[500] cursor-pointer
                 border border-outline-variant/20 overflow-hidden group hover:shadow-elevation-3 transition-shadow"
      layoutId="mini-player"
    >
      {/* Subtle Progress Bar at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-surface-variant/20 pointer-events-none">
         <motion.div
            className="h-full bg-primary rounded-r-full"
            style={{ width: `${progress * 100}%` }}
            transition={{ type: 'tween', ease: 'linear', duration: 0.2 }}
         />
      </div>

      {/* Album Art */}
      <motion.div
        layoutId={`artwork-${currentTrack.id}`}
        className="relative w-[48px] h-[48px] rounded-[12px] overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-outline/10 bg-surface-variant flex items-center justify-center"
      >
        {!imgError && currentTrack.coverArt ? (
          <img
            src={currentTrack.coverArt}
            className="w-full h-full object-cover"
            alt={currentTrack.title}
            onError={() => setImgError(true)}
          />
        ) : (
          <md-icon class="material-symbols-rounded text-on-surface-variant/50">music_note</md-icon>
        )}
      </motion.div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center px-3 gap-0.5">
        <motion.h4
           layoutId={`title-${currentTrack.id}`}
           className="text-label-large font-bold text-on-surface truncate leading-tight tracking-tight"
        >
          {currentTrack.title}
        </motion.h4>
        <motion.p
           layoutId={`artist-${currentTrack.id}`}
           className="text-body-medium text-on-surface-variant truncate leading-tight"
        >
          {currentTrack.artist}
        </motion.p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
         <md-icon-button onClick={handleTogglePlay} style={{ '--md-icon-button-icon-color': 'var(--md-sys-color-primary)' }}>
            <md-icon class="material-symbols-rounded">
                {playerState.isPlaying ? 'pause' : 'play_arrow'}
            </md-icon>
         </md-icon-button>

         {onNext && (
           <md-icon-button onClick={handleNext}>
             <md-icon class="material-symbols-rounded">skip_next</md-icon>
           </md-icon-button>
         )}
      </div>

    </motion.div>
  );
});

MiniPlayer.displayName = 'MiniPlayer';

export default MiniPlayer;
