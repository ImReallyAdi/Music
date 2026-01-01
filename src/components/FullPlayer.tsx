import React, { useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  ChevronDown,
  ListMusic,
  MessageSquareQuote,
  Heart,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  MoreHorizontal
} from 'lucide-react';
import { Track, PlayerState, RepeatMode } from '../types';

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

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/* ---------------- Professional Progress Bar ---------------- */

const ProgressBar = ({ 
  currentTime, 
  duration, 
  handleSeek, 
  themeColor 
}: { 
  currentTime: number; 
  duration: number; 
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  themeColor: string; 
}) => {
  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  return (
    <div className="group relative h-4 w-full flex items-center cursor-pointer select-none">
      {/* Background Track */}
      <div className="absolute h-1 w-full rounded-full bg-white/20 overflow-hidden backdrop-blur-sm">
        {/* Active Fill */}
        <div 
          style={{ width: `${progressPercent}%`, backgroundColor: themeColor }}
          className="h-full transition-all duration-100 ease-linear"
        />
      </div>

      {/* Hover/Active Thumb (only visible when interacting or hovering) */}
      <div 
        style={{ left: `${progressPercent}%` }}
        className="absolute h-3 w-3 -ml-1.5 rounded-full bg-white shadow-md scale-0 group-hover:scale-100 transition-transform duration-200"
      />

      {/* Invisible Input for Interaction */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
    </div>
  );
};

/* ---------------- Full Player Component ---------------- */

const FullPlayer: React.FC<FullPlayerProps> = ({
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
  themeColor = '#ffffff'
}) => {
  
  // Handle swipe down to close
  const onDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isPlayerOpen && currentTrack && (
        <motion.div
          key="player-modal"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 1 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.2 }} // Resistance when pulling up
          onDragEnd={onDragEnd}
          className="fixed inset-0 z-50 flex flex-col bg-black text-white overflow-hidden"
        >
          {/* --- Dynamic Background --- */}
          <div className="absolute inset-0 z-0">
             {/* Blurred Image Layer */}
             <motion.div 
                className="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-125 transition-all duration-1000"
                style={{ backgroundImage: `url(${currentTrack.coverArt})` }}
             />
             {/* Gradient Overlay for Readability */}
             <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#121212]/80 to-[#121212]" />
          </div>

          {/* --- Content Container --- */}
          <div className="relative z-10 flex flex-col h-full px-6 pb-8 pt-2 safe-area-inset-top">
            
            {/* Header */}
            <header className="flex items-center justify-between h-16 shrink-0">
              <button 
                onClick={onClose}
                className="p-2 -ml-2 rounded-full active:bg-white/10 transition-colors"
              >
                <ChevronDown className="text-white/80" size={28} />
              </button>
              
              <div className="flex flex-col items-center">
                 {/* Drag Handle Indicator */}
                 <div className="w-8 h-1 bg-white/20 rounded-full mb-1" />
                 <span className="text-xs font-semibold tracking-widest text-white/50 uppercase">Now Playing</span>
              </div>

              <button className="p-2 -mr-2 rounded-full active:bg-white/10 transition-colors">
                <MoreHorizontal className="text-white/80" size={24} />
              </button>
            </header>

            {/* Main Visual */}
            <div className="flex-1 flex items-center justify-center py-6 min-h-0">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-[350px] aspect-square"
              >
                <img 
                  src={currentTrack.coverArt} 
                  alt="Album Art"
                  className="w-full h-full object-cover rounded-[24px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] border border-white/5"
                />
              </motion.div>
            </div>

            {/* Track Info */}
            <div className="flex items-end justify-between mb-6 shrink-0">
              <div className="flex-1 mr-4 overflow-hidden">
                <motion.h2 
                  layout 
                  className="text-2xl font-bold text-white truncate leading-tight"
                >
                  {currentTrack.title}
                </motion.h2>
                <motion.p 
                  layout 
                  className="text-lg text-white/60 truncate font-medium mt-1"
                >
                  {currentTrack.artist}
                </motion.p>
              </div>
              <button className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors active:scale-95">
                 <Heart className="text-white/60" size={24} />
              </button>
            </div>

            {/* Progress Section */}
            <div className="mb-8 shrink-0">
              <ProgressBar 
                currentTime={currentTime} 
                duration={duration} 
                handleSeek={handleSeek}
                themeColor={themeColor}
              />
              <div className="flex justify-between mt-2 text-xs font-medium text-white/40 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between mb-8 shrink-0 px-2">
              <button 
                onClick={() => setPlayerState(p => ({ ...p, shuffle: !p.shuffle }))}
                className={`p-2 rounded-full transition-colors ${playerState.shuffle ? 'text-white' : 'text-white/30'}`}
              >
                <Shuffle size={20} />
              </button>

              <button 
                onClick={prevTrack}
                className="p-4 rounded-full text-white hover:bg-white/5 active:scale-95 transition-all"
              >
                <SkipBack size={32} fill="currentColor" />
              </button>

              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                style={{ backgroundColor: themeColor }}
                className="w-20 h-20 rounded-full flex items-center justify-center text-black shadow-lg shadow-white/5 hover:scale-105 transition-transform"
              >
                {playerState.isPlaying ? (
                  <Pause size={36} fill="currentColor" />
                ) : (
                  <Play size={36} fill="currentColor" className="ml-1" />
                )}
              </motion.button>

              <button 
                onClick={nextTrack}
                className="p-4 rounded-full text-white hover:bg-white/5 active:scale-95 transition-all"
              >
                <SkipForward size={32} fill="currentColor" />
              </button>

              <button 
                onClick={() => setPlayerState(p => ({ 
                  ...p, 
                  repeat: p.repeat === RepeatMode.OFF ? RepeatMode.ALL : p.repeat === RepeatMode.ALL ? RepeatMode.ONE : RepeatMode.OFF 
                }))}
                className={`p-2 rounded-full transition-colors relative ${playerState.repeat !== RepeatMode.OFF ? 'text-white' : 'text-white/30'}`}
              >
                <Repeat size={20} />
                {playerState.repeat === RepeatMode.ONE && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-current rounded-full" />
                )}
              </button>
            </div>

            {/* Footer Actions */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
               <button className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
                  <MessageSquareQuote size={20} className="text-white/70" />
                  <span className="text-sm font-medium text-white/90">Lyrics</span>
               </button>
               <button className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
                  <ListMusic size={20} className="text-white/70" />
                  <span className="text-sm font-medium text-white/90">Up Next</span>
               </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullPlayer;
