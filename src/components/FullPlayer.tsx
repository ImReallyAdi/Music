import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MoreVertical, Music, Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat } from 'lucide-react';
import { Track, PlayerState, RepeatMode } from '../types';
import Waveform from './Waveform';

interface FullPlayerProps {
  currentTrack: Track | null;
  playerState: PlayerState;
  isPlayerOpen: boolean;
  onClose: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  currentTime: number;
  duration: number;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  themeColor: string;
}

const formatTime = (time: number): string => {
  if (!time || isNaN(time)) return "0:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const FullPlayer: React.FC<FullPlayerProps> = React.memo(({
  currentTrack, 
  playerState, 
  isPlayerOpen, 
  onClose, 
  togglePlay, 
  nextTrack, 
  prevTrack, 
  setPlayerState, 
  currentTime, 
  duration, 
  handleSeek, 
  themeColor
}) => {
  // Memoize computed values
  const progress = useMemo(() => 
    (currentTime / (duration || 1)) * 100, 
    [currentTime, duration]
  );
  
  const formattedCurrentTime = useMemo(() => formatTime(currentTime), [currentTime]);
  const formattedDuration = useMemo(() => formatTime(duration), [duration]);

  // Memoize callbacks to prevent recreation
  const toggleShuffle = useCallback(() => {
    setPlayerState(p => ({ ...p, shuffle: !p.shuffle }));
  }, [setPlayerState]);

  const cycleRepeat = useCallback(() => {
    setPlayerState(p => ({ 
      ...p, 
      repeat: p.repeat === RepeatMode.OFF 
        ? RepeatMode.ALL 
        : p.repeat === RepeatMode.ALL 
        ? RepeatMode.ONE 
        : RepeatMode.OFF 
    }));
  }, [setPlayerState]);

  // Early return if not open
  if (!isPlayerOpen || !currentTrack) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="full-player-overlay"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
        className="fixed inset-0 bg-black z-[100] flex flex-col safe-area-top safe-area-bottom overflow-hidden"
        role="dialog"
        aria-label="Full screen player"
        aria-modal="true"
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          {currentTrack.coverArt && (
            <motion.img 
              key={currentTrack.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 0.3 }}
              src={currentTrack.coverArt}
              alt=""
              className="w-full h-full object-cover blur-[100px] scale-150"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-8 md:px-12">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <button 
              onClick={onClose} 
              className="p-2 -ml-2 text-white/80 hover:text-white transition-colors"
              aria-label="Close full screen player"
            >
              <ChevronDown size={32} />
            </button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-0.5">
                Playing From
              </p>
              <p className="text-sm text-white font-semibold">Your Library</p>
            </div>
            <button 
              className="p-2 -mr-2 text-white/80 hover:text-white transition-colors"
              aria-label="More options"
            >
              <MoreVertical size={24} />
            </button>
          </header>

          {/* Artwork Section */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: playerState.isPlaying ? 1 : 0.9,
                rotate: playerState.isPlaying ? 0 : -1 
              }}
              transition={{ duration: 0.3 }}
              className="relative aspect-square w-full max-w-[340px] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
            >
              {currentTrack.coverArt ? (
                <img 
                  src={currentTrack.coverArt} 
                  className="w-full h-full object-cover" 
                  alt={`${currentTrack.title} album art`}
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                  <Music className="w-20 h-20 text-white/10" aria-hidden="true" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Track Metadata */}
          <div className="mt-10 flex justify-between items-end gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white truncate mb-1">
                {currentTrack.title}
              </h1>
              <p className="text-xl text-white/60 truncate">
                {currentTrack.artist}
              </p>
            </div>
            <button 
              className="p-2 text-white/80 hover:text-white transition-colors flex-shrink-0"
              aria-label="Like song"
            >
              <Heart size={28} />
            </button>
          </div>

          {/* Seek Bar */}
          <div className="mt-8">
            <div className="relative h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="absolute h-full bg-white rounded-full" 
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                aria-label="Seek track position"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
                aria-valuetext={`${formattedCurrentTime} of ${formattedDuration}`}
              />
            </div>
            <div className="flex justify-between mt-3 text-xs font-medium text-white/40 tabular-nums tracking-wider">
              <time>{formattedCurrentTime}</time>
              <time>{formattedDuration}</time>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="mt-8 mb-4 flex items-center justify-between">
            <button
              onClick={toggleShuffle}
              className={`transition-colors ${playerState.shuffle ? "text-blue-400" : "text-white/40"}`}
              aria-label={playerState.shuffle ? "Shuffle on" : "Shuffle off"}
              aria-pressed={playerState.shuffle}
            >
              <Shuffle size={20} />
            </button>

            <div className="flex items-center gap-8">
              <button 
                onClick={prevTrack} 
                className="text-white hover:scale-110 active:scale-90 transition-transform"
                aria-label="Previous track"
              >
                <SkipBack size={40} fill="currentColor" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-lg"
                aria-label={playerState.isPlaying ? "Pause" : "Play"}
              >
                {playerState.isPlaying ? (
                  <Pause size={36} fill="currentColor" />
                ) : (
                  <Play size={36} fill="currentColor" className="ml-1" />
                )}
              </button>
              <button 
                onClick={nextTrack} 
                className="text-white hover:scale-110 active:scale-90 transition-transform"
                aria-label="Next track"
              >
                <SkipForward size={40} fill="currentColor" />
              </button>
            </div>

            <button
              onClick={cycleRepeat}
              className={`transition-colors relative ${
                playerState.repeat !== RepeatMode.OFF ? "text-blue-400" : "text-white/40"
              }`}
              aria-label={
                playerState.repeat === RepeatMode.OFF 
                  ? "Repeat off" 
                  : playerState.repeat === RepeatMode.ALL 
                  ? "Repeat all" 
                  : "Repeat one"
              }
              aria-pressed={playerState.repeat !== RepeatMode.OFF}
            >
              <Repeat size={20} />
              {playerState.repeat === RepeatMode.ONE && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold" aria-hidden="true">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Visualizer Footer */}
          <div className="mt-auto pt-4 flex justify-center">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-3xl min-w-[200px]">
              <Waveform 
                isPlaying={playerState.isPlaying} 
                color={themeColor || "#FFFFFF"} 
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

FullPlayer.displayName = 'FullPlayer';

export default FullPlayer;
