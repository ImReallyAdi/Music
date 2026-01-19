import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Track, PlayerState } from '../types';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/progress/linear-progress.js';

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
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.8 }}
      onClick={onOpen}
      className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-3 right-3 md:left-auto md:right-6 md:w-[420px]
                 h-[76px] bg-surface-container-high/60 backdrop-blur-3xl saturate-200 rounded-[24px]
                 flex items-center pl-3 pr-3 shadow-elevation-4 z-[500] cursor-pointer
                 border border-white/10 overflow-hidden group hover:shadow-elevation-5 transition-all"
      layoutId="mini-player"
    >
      {/* Progress Bar at Bottom - Material Web */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
         <md-linear-progress
            value={progress}
            style={{
                '--md-linear-progress-track-height': '2px',
                '--md-linear-progress-active-indicator-height': '2px',
                '--md-linear-progress-track-color': 'transparent',
                '--md-sys-color-primary': 'var(--md-sys-color-primary)',
                width: '100%'
            }}
         ></md-linear-progress>
      </div>

      {/* Album Art */}
      <motion.div
        layoutId={`artwork-${currentTrack.id}`}
        className="relative w-[52px] h-[52px] rounded-[16px] overflow-hidden flex-shrink-0 shadow-md bg-surface-container-highest flex items-center justify-center border border-white/5"
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
      <div className="flex-1 min-w-0 flex flex-col justify-center px-4 gap-0.5">
        <motion.h4
           layoutId={`title-${currentTrack.id}`}
           className="text-title-medium font-bold text-on-surface truncate leading-tight tracking-tight"
        >
          {currentTrack.title}
        </motion.h4>
        <motion.p
           layoutId={`artist-${currentTrack.id}`}
           className="text-body-medium text-on-surface-variant truncate leading-tight opacity-80"
        >
          {currentTrack.artist}
        </motion.p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
         <md-icon-button onClick={handleTogglePlay} style={{ '--md-icon-button-icon-color': 'var(--md-sys-color-primary)', '--md-icon-button-icon-size': '32px' }}>
            <md-icon class="material-symbols-rounded filled">
                {playerState.isPlaying ? 'pause' : 'play_arrow'}
            </md-icon>
         </md-icon-button>

         {onNext && (
           <md-icon-button onClick={handleNext} style={{ '--md-icon-button-icon-size': '32px' }}>
             <md-icon class="material-symbols-rounded">skip_next</md-icon>
           </md-icon-button>
         )}
      </div>

    </motion.div>
  );
});

MiniPlayer.displayName = 'MiniPlayer';

export default MiniPlayer;
