import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MoreVertical, Music, Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Share2 } from 'lucide-react';
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

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "0:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const FullPlayer: React.FC<FullPlayerProps> = ({
  currentTrack, playerState, isPlayerOpen, onClose, togglePlay, nextTrack, prevTrack, setPlayerState, currentTime, duration, handleSeek, themeColor
}) => {
  const progress = (currentTime / (duration || 1)) * 100;

  return (
    <AnimatePresence>
      {isPlayerOpen && currentTrack && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-black z-[100] flex flex-col safe-area-top safe-area-bottom overflow-hidden"
        >
          {/* Immersive Background */}
          <div className="absolute inset-0 z-0">
            {currentTrack.coverArt && (
              <motion.img 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                src={currentTrack.coverArt} 
                className="w-full h-full object-cover blur-[80px] scale-150"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
          </div>

          <div className="relative z-10 flex flex-col h-full p-6">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"
              >
                <ChevronDown className="text-white" />
              </motion.button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Playing From</span>
                <span className="text-sm text-white font-medium">Your Library</span>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                <MoreVertical className="w-5 h-5 text-white" />
              </motion.button>
            </header>

            {/* Album Art Container */}
            <div className="flex-1 flex items-center justify-center px-4">
              <motion.div
                animate={{ scale: playerState.isPlaying ? 1 : 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative aspect-square w-full max-w-[320px] rounded-[40px] shadow-2xl overflow-hidden ring-1 ring-white/20"
              >
                {currentTrack.coverArt ? (
                  <img src={currentTrack.coverArt} className="w-full h-full object-cover" alt={currentTrack.title} />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <Music className="w-20 h-20 text-white/20" />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Track Info */}
            <div className="mt-8 flex justify-between items-end">
              <div className="flex-1 min-w-0">
                <motion.h1 className="text-3xl font-bold text-white truncate">
                  {currentTrack.title}
                </motion.h1>
                <motion.p className="text-lg text-white/60 truncate">
                  {currentTrack.artist}
                </motion.p>
              </div>
              <motion.button 
                whileTap={{ scale: 0.8 }}
                className="mb-2 p-2"
              >
                <Heart className="w-7 h-7 text-white/80" />
              </motion.button>
            </div>

            {/* Progress Bar */}
            <div className="mt-8 group">
              <div className="relative h-6 flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute w-full h-1.5 opacity-0 cursor-pointer z-30"
                />
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <motion.div
                  className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20 pointer-events-none"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs font-medium text-white/40 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setPlayerState(p => ({ ...p, shuffle: !p.shuffle }))}
                className={`p-2 transition-colors ${playerState.shuffle ? 'text-primary' : 'text-white/40'}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-6">
                <motion.button whileTap={{ scale: 0.9 }} onClick={prevTrack} className="text-white">
                  <SkipBack className="w-8 h-8 fill-current" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePlay}
                  className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-xl"
                >
                  {playerState.isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Play className="w-8 h-8 fill-current translate-x-0.5" />
                  )}
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={nextTrack} className="text-white">
                  <SkipForward className="w-8 h-8 fill-current" />
                </motion.button>
              </div>

              <button
                onClick={() => setPlayerState(p => ({ ...p, repeat: p.repeat === RepeatMode.OFF ? RepeatMode.ALL : p.repeat === RepeatMode.ALL ? RepeatMode.ONE : RepeatMode.OFF }))}
                className={`p-2 relative transition-colors ${playerState.repeat !== RepeatMode.OFF ? 'text-primary' : 'text-white/40'}`}
              >
                <Repeat className="w-5 h-5" />
                {playerState.repeat === RepeatMode.ONE && (
                  <span className="absolute text-[8px] font-bold top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-0.5">1</span>
                )}
              </button>
            </div>

            {/* Footer Visualizer */}
            <div className="mt-auto pt-8 flex justify-center">
                <div className="bg-white/5 backdrop-blur-2xl px-8 py-3 rounded-3xl border border-white/10">
                    <Waveform isPlaying={playerState.isPlaying} />
                </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullPlayer;
