import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, PlayerState } from '../types';

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
      className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-3 right-3 md:left-auto md:right-6 md:w-[420px] z-[500] cursor-pointer"
      layoutId="mini-player"
    >
      <mc-card variant="filled" style={{
          width: '100%',
          borderRadius: '20px',
          backgroundColor: 'rgba(28, 28, 30, 0.8)', // Keep the semi-transparent look or use surface-container
          backdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          overflow: 'hidden'
      } as any}>
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 pointer-events-none z-10">
             <motion.div
                className="h-full bg-primary rounded-r-full"
                style={{ width: `${progress * 100}%` }}
                transition={{ type: 'tween', ease: 'linear', duration: 0.2 }}
             />
          </div>

          <div className="flex items-center w-full p-2 pr-4">
              {/* Album Art */}
              <motion.div
                layoutId={`artwork-${currentTrack.id}`}
                className="relative w-[48px] h-[48px] rounded-[12px] overflow-hidden flex-shrink-0 shadow-lg"
              >
                {!imgError && currentTrack.coverArt ? (
                  <img
                    src={currentTrack.coverArt}
                    className="w-full h-full object-cover"
                    alt={currentTrack.title}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                    <mc-icon name="music_note" style={{ color: 'var(--md-sys-color-on-surface-variant)' } as any}></mc-icon>
                  </div>
                )}
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center px-3 gap-0.5">
                <motion.h4
                   layoutId={`title-${currentTrack.id}`}
                   className="text-[15px] font-semibold text-on-surface truncate leading-tight"
                >
                  {currentTrack.title}
                </motion.h4>
                <motion.p
                   layoutId={`artist-${currentTrack.id}`}
                   className="text-[13px] text-on-surface-variant truncate leading-tight font-medium"
                >
                  {currentTrack.artist}
                </motion.p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 z-20">
                 <mc-icon-button
                   variant="filled" // Or tonal to pop
                   size="small"
                   onClick={handleTogglePlay}
                 >
                    <mc-icon name={playerState.isPlaying ? 'pause' : 'play_arrow'}></mc-icon>
                 </mc-icon-button>

                 {onNext && (
                   <mc-icon-button
                     variant="standard"
                     size="small"
                     onClick={handleNext}
                   >
                     <mc-icon name="skip_next"></mc-icon>
                   </mc-icon-button>
                 )}
              </div>
          </div>
          <mc-ripple></mc-ripple>
      </mc-card>
    </motion.div>
  );
});

MiniPlayer.displayName = 'MiniPlayer';

export default MiniPlayer;
