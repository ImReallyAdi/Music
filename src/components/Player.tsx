import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronDown, MoreVertical, SkipBack, SkipForward, Shuffle, Repeat, ListMusic, Volume2, Share2, Heart, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { RepeatMode } from '../types';

interface PlayerProps {
  isPlayerOpen: boolean;
  setIsPlayerOpen: (open: boolean) => void;
}

const Waveform = ({ isPlaying }: { isPlaying: boolean }) => (
  <div className="flex items-end gap-1.5 h-16 px-10">
    {[...Array(24)].map((_, i) => (
      <motion.div
        key={i}
        animate={isPlaying ? {
          height: [12, Math.random() * 48 + 12, 12],
          opacity: [0.3, 0.8, 0.3]
        } : { height: 8, opacity: 0.2 }}
        transition={{
          duration: 0.5 + Math.random() * 0.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-2 bg-current rounded-full"
      />
    ))}
  </div>
);

export function Player({ isPlayerOpen, setIsPlayerOpen }: PlayerProps) {
  const { player, currentTrack, togglePlay, nextTrack, prevTrack, currentTime, duration, seek, setShuffle, setRepeat, themeColor } = usePlayer();

  if (!currentTrack) return null;

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Mini Player */}
      <AnimatePresence>
        {!isPlayerOpen && currentTrack && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setIsPlayerOpen(true)}
            className="fixed bottom-[85px] md:bottom-6 left-4 right-4 md:left-28 md:right-6 bg-surface-container-high rounded-xl p-3 flex items-center gap-4 shadow-lg z-[50] cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-lg bg-surface-variant overflow-hidden flex-shrink-0 relative">
              {currentTrack.coverArt ? (
                <img src={currentTrack.coverArt} className="w-full h-full object-cover" alt="Cover" />
              ) : (
                <Music className="w-full h-full p-3 text-on-surface-variant" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base truncate text-on-surface">{currentTrack.title}</h4>
              <p className="text-sm text-on-surface-variant truncate">{currentTrack.artist}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-state-layer transition-colors"
            >
              {player.isPlaying ? <Pause className="w-6 h-6 fill-current text-on-surface" /> : <Play className="w-6 h-6 fill-current text-on-surface" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Player */}
      <AnimatePresence>
        {isPlayerOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 bg-surface z-[100] flex flex-col md:flex-row safe-area-top overflow-hidden"
          >
             <div className="absolute inset-0 -z-10 opacity-[0.2]" style={{ background: `radial-gradient(circle at center, ${themeColor}, transparent 70%)` }} />

            {/* Header (Mobile only) */}
            <div className="md:hidden flex justify-between items-center p-4 pt-8">
               <button onClick={() => setIsPlayerOpen(false)} className="p-2"><ChevronDown className="w-8 h-8 text-on-surface" /></button>
               <span className="text-sm font-medium text-on-surface-variant">Now Playing</span>
               <button className="p-2"><MoreVertical className="w-6 h-6 text-on-surface" /></button>
            </div>

            {/* Layout for iPad/Desktop: Split view */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-8 gap-12 w-full max-w-7xl mx-auto h-full">

                {/* Artwork Section */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
                    <motion.div
                        className="w-full max-w-md aspect-square rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden bg-surface-variant relative"
                        layoutId="artwork-full"
                    >
                         {currentTrack.coverArt ? (
                            <img src={currentTrack.coverArt} className="w-full h-full object-cover" alt="Cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                <Music className="w-1/3 h-1/3 opacity-20" />
                            </div>
                         )}
                         <div className="absolute bottom-8 inset-x-0 flex justify-center text-white/60"><Waveform isPlaying={player.isPlaying} /></div>
                    </motion.div>
                </div>

                {/* Controls Section */}
                <div className="w-full md:w-1/2 flex flex-col justify-center max-w-md">
                     {/* Title & Artist */}
                     <div className="mb-8 md:mb-12">
                         <div className="flex justify-between items-start">
                             <div className="min-w-0 pr-4">
                                 <h2 className="text-3xl md:text-5xl font-bold text-on-surface leading-tight truncate">{currentTrack.title}</h2>
                                 <p className="text-xl md:text-2xl font-medium text-on-surface-variant mt-2 truncate">{currentTrack.artist}</p>
                             </div>
                             <button className="p-3 bg-secondary-container rounded-full text-on-secondary-container"><Heart className="w-6 h-6" /></button>
                         </div>
                     </div>

                     {/* Progress Bar */}
                     <div className="mb-8 md:mb-12">
                        <div className="relative h-2 group cursor-pointer" onClick={(e) => {
                             const rect = e.currentTarget.getBoundingClientRect();
                             const percent = (e.clientX - rect.left) / rect.width;
                             seek(percent * duration);
                        }}>
                             <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-surface-variant rounded-full"></div>
                             <div
                                className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-primary rounded-full"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                             ></div>
                             <div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 8px)` }}
                             ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs font-medium text-on-surface-variant tracking-wide">
                             <span>{formatTime(currentTime)}</span>
                             <span>{formatTime(duration)}</span>
                        </div>
                     </div>

                     {/* Playback Controls */}
                     <div className="flex items-center justify-between mb-12">
                          <button onClick={() => setShuffle(!player.shuffle)} className={`p-3 rounded-full transition-colors ${player.shuffle ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
                              <Shuffle className="w-6 h-6" />
                          </button>

                          <div className="flex items-center gap-6 md:gap-8">
                               <button onClick={prevTrack} className="p-2 text-on-surface hover:text-primary transition-colors"><SkipBack className="w-8 h-8 fill-current" /></button>
                               <button onClick={togglePlay} className="w-20 h-20 rounded-[28px] bg-primary-container text-on-primary-container flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg">
                                   {player.isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                               </button>
                               <button onClick={nextTrack} className="p-2 text-on-surface hover:text-primary transition-colors"><SkipForward className="w-8 h-8 fill-current" /></button>
                          </div>

                          <button onClick={() => setRepeat(player.repeat === RepeatMode.OFF ? RepeatMode.ALL : player.repeat === RepeatMode.ALL ? RepeatMode.ONE : RepeatMode.OFF)} className={`p-3 rounded-full transition-colors ${player.repeat !== RepeatMode.OFF ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
                              <Repeat className="w-6 h-6" />
                              {player.repeat === RepeatMode.ONE && <span className="absolute text-[8px] font-bold">1</span>}
                          </button>
                     </div>

                     {/* Footer Actions */}
                     <div className="flex justify-between px-8 text-on-surface-variant">
                          <button className="flex flex-col items-center gap-1 hover:text-on-surface transition-colors"><ListMusic className="w-6 h-6" /><span className="text-[10px] font-medium uppercase tracking-wider">Queue</span></button>
                          <button className="flex flex-col items-center gap-1 hover:text-on-surface transition-colors"><Volume2 className="w-6 h-6" /><span className="text-[10px] font-medium uppercase tracking-wider">Device</span></button>
                          <button className="flex flex-col items-center gap-1 hover:text-on-surface transition-colors"><Share2 className="w-6 h-6" /><span className="text-[10px] font-medium uppercase tracking-wider">Share</span></button>
                     </div>
                </div>

                {/* Close Button for Desktop */}
                <button onClick={() => setIsPlayerOpen(false)} className="hidden md:block absolute top-8 right-8 p-4 bg-surface-variant/50 rounded-full hover:bg-surface-variant transition-colors">
                     <ChevronDown className="w-8 h-8 text-on-surface" />
                </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
