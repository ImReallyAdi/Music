import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Music } from 'lucide-react';
import { Track, PlayerState } from '../types';
import { PixelCard, PixelButton, PixelBadge } from './PixelComponents';

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
    <AnimatePresence>
        <motion.div
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 150, opacity: 0 }}
        onClick={onOpen}
        className="fixed bottom-[calc(70px+env(safe-area-inset-bottom))] left-2 right-2 md:left-auto md:right-6 md:w-[400px] z-[500] cursor-pointer"
        layoutId="mini-player"
        >
        <PixelCard className="h-[72px] flex items-center p-2 gap-3 bg-[#e4e4e7]">
            {/* Progress Bar (Top Border essentially, or internal) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-300 border-b-2 border-black">
                <div
                    className="h-full bg-[#ff4d4d]"
                    style={{ width: `${progress * 100}%` }}
                />
            </div>

            {/* Album Art */}
            <div className="relative w-[48px] h-[48px] shrink-0 border-2 border-black shadow-[2px_2px_0_0_#000]">
            {!imgError && currentTrack.coverArt ? (
                <img
                src={currentTrack.coverArt}
                className="w-full h-full object-cover pixelated"
                alt={currentTrack.title}
                onError={() => setImgError(true)}
                />
            ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <Music className="w-6 h-6 text-zinc-500" />
                </div>
            )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 mt-1">
            <h4 className="text-sm font-pixel font-bold text-black truncate leading-tight uppercase">
                {currentTrack.title}
            </h4>
            <p className="text-xs font-pixel text-zinc-600 truncate leading-tight">
                {currentTrack.artist}
            </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <PixelButton
                    variant="primary"
                    size="icon"
                    onClick={handleTogglePlay}
                    className="w-10 h-10 bg-white"
                >
                    {playerState.isPlaying ? (
                    <Pause size={16} fill="currentColor" />
                    ) : (
                    <Play size={16} fill="currentColor" />
                    )}
                </PixelButton>

                {onNext && (
                    <PixelButton
                        variant="ghost"
                        size="icon"
                        onClick={handleNext}
                        className="w-10 h-10 text-black hover:bg-black/5 border-2 border-transparent hover:border-black/10"
                    >
                    <SkipForward size={20} fill="currentColor" />
                    </PixelButton>
                )}
            </div>
        </PixelCard>
        </motion.div>
    </AnimatePresence>
  );
});

MiniPlayer.displayName = 'MiniPlayer';

export default MiniPlayer;
