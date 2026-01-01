import React from 'react';
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
    <AnimatePresence mode="wait">
      {isPlayerOpen && currentTrack && (
        <motion.div
          key="full-player-overlay" // CRITICAL: Added key for AnimatePresence
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
          className="fixed inset-0 bg-black z-[100] flex flex-col safe-area-top safe-area-bottom overflow-hidden"
        >
          {/* Dynamic Background */}
          <div className="absolute inset-0 z-0">
            {currentTrack.coverArt && (
              <motion.img 
                key={currentTrack.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                src={currentTrack.coverArt} 
                className="w-full h-full object-cover blur-[100px] scale-150"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
          </div>

          <div className="relative z-10 flex flex-col h-full p-8 md:px-12">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
              <button onClick={onClose} className="p-2 -ml-2 text-white/80 hover:text-white transition-colors">
                <ChevronDown size={32} />
              </button>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-0.5">Playing From</p>
                <p className="text-sm text-white font-semibold">Your Library</p>
              </div>
              <button className="p-2 -mr-2 text-white/80 hover:text-white transition-colors">
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
                className="relative aspect-square w-full max-w-[340px] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
              >
                {currentTrack.coverArt ? (
                  <img src={currentTrack.coverArt} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                    <Music className="w-20 h-20 text-white/10" />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Track Metadata */}
            <div className="mt-10 flex justify-between items-end">
              <div className="flex-1 min-w-0 pr-6">
                <h1 className="text-3xl font-bold text-white truncate mb-1">{currentTrack.title}</h1>
                <p className="text-xl text-white/60 truncate">{currentTrack.artist}</p>
              </div>
              <button className="p-2 text-white/80 hover:text-white transition-colors">
                <Heart size={28} />
              </button>
            </div>

            {/* Seek Bar */}
            <div className="mt-8">
              <div className="relative h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute h-full bg-white" 
                  style={{ width: `${progress}%` }} 
                />
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
              </div>
              <div className="flex justify-between mt-3 text-xs font-medium text-white/40 tabular-nums tracking-wider">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="mt-8 mb-4 flex items-center justify-between">
              <button
                onClick={() => setPlayerState(p => ({ ...p, shuffle: !p.shuffle }))}
                className={playerState.shuffle ? "text-blue-400" : "text-white/40"}
              >
                <Shuffle size={20} />
              </button>

              <div className="flex items-center gap-8">
                <button onClick={prevTrack} className="text-white hover:scale-110 active:scale-90 transition-transform">
                  <SkipBack size={40} fill="currentColor" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-lg"
                >
                  {playerState.isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={nextTrack} className="text-white hover:scale-110 active:scale-90 transition-transform">
                  <SkipForward size={40} fill="currentColor" />
                </button>
              </div>

              <button
                onClick={() => setPlayerState(p => ({ ...p, repeat: p.repeat === RepeatMode.OFF ? RepeatMode.ALL : p.repeat === RepeatMode.ALL ? RepeatMode.ONE : RepeatMode.OFF }))}
                className={playerState.repeat !== RepeatMode.OFF ? "text-blue-400 relative" : "text-white/40 relative"}
              >
                <Repeat size={20} />
                {playerState.repeat === RepeatMode.ONE && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
              </button>
            </div>

            {/* Visualizer Footer */}
            <div className="mt-auto pt-4 flex justify-center">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-10 py-4 rounded-3xl">
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
