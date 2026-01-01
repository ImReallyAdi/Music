import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Music, SkipForward } from 'lucide-react';
import { Track, PlayerState } from '../types';

interface MiniPlayerProps {
  currentTrack: Track | null;
  playerState: PlayerState;
  isPlayerOpen: boolean;
  onOpen: () => void;
  togglePlay: () => void;
  onNext?: () => void; // Added for better UX
  progress?: number;   // Added for visual feedback (0-100)
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ 
  currentTrack, 
  playerState, 
  isPlayerOpen, 
  onOpen, 
  togglePlay,
  onNext,
  progress = 0 
}) => {
  return (
    <AnimatePresence>
      {currentTrack && !isPlayerOpen && (
        <motion.div
          layoutId="player-container"
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={onOpen}
          className="fixed bottom-[96px] left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[400px] h-[72px] 
                     bg-secondary-container/90 backdrop-blur-md border border-white/10 
                     rounded-2xl flex items-center px-3 pr-4 gap-3 shadow-xl z-[60] cursor-pointer group overflow-hidden"
          role="button"
          aria-label="Expand player"
        >
          {/* Progress Bar Background */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-on-secondary-container/10">
            <motion.div 
              className="h-full bg-primary" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.5 }}
            />
          </div>

          {/* Album Art */}
          <div className="w-12 h-12 rounded-lg bg-surface-variant overflow-hidden flex-shrink-0 relative shadow-sm border border-white/5">
            {currentTrack.coverArt ? (
              <img 
                src={currentTrack.coverArt} 
                alt={currentTrack.title}
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-variant">
                 <Music className="w-5 h-5 text-on-surface-variant/50" />
              </div>
            )}
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <h4 className="text-title-medium text-on-secondary-container font-semibold truncate">
              {currentTrack.title}
            </h4>
            <p className="text-body-small text-on-secondary-container/70 truncate text-xs">
              {currentTrack.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-10 h-10 rounded-full bg-on-secondary-container text-secondary-container flex items-center justify-center 
                         hover:scale-105 active:scale-95 transition-all shadow-sm hover:bg-opacity-90"
              aria-label={playerState.isPlaying ? "Pause" : "Play"}
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            {onNext && (
              <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="w-8 h-8 rounded-full text-on-secondary-container/80 hover:bg-on-secondary-container/10 
                           flex items-center justify-center transition-colors active:scale-95"
                aria-label="Next track"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniPlayer;
