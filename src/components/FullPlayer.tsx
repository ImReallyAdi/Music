import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, ListMusic, Music } from 'lucide-react';
import { Track, PlayerState, RepeatMode } from '../types';
import QueueList from './QueueList';
import { dbService } from '../db';

// --- Animation Variants ---
const containerVariants = {
  hidden: { y: '100%' },
  visible: { 
    y: 0,
    transition: { 
      type: 'spring', 
      damping: 25, 
      stiffness: 200,
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  },
  exit: { 
    y: '100%',
    transition: { type: 'spring', damping: 25, stiffness: 200 }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const FullPlayer: React.FC<FullPlayerProps> = React.memo(({
  currentTrack, playerState, isPlayerOpen, onClose,
  togglePlay, nextTrack, prevTrack, setPlayerState,
  currentTime, duration, handleSeek, toggleShuffle,
  onRemoveTrack
}) => {
  const [showQueue, setShowQueue] = useState(false);
  const [tracks, setTracks] = useState<Record<string, Track>>({});
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Drag logic
  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [0, 300], [1, 0.5]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPlayerOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isPlayerOpen, onClose]);

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isPlayerOpen && (
        <motion.div
          key="full-player"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 150) onClose();
          }}
          style={{ y: dragY, opacity }}
          className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden touch-none"
        >
          {/* Background Layer */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <motion.img 
              key={currentTrack.coverArt}
              src={currentTrack.coverArt} 
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 0.4, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full object-cover blur-[80px]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
          </div>

          {/* Grabber / Close Button */}
          <div className="relative z-[110] flex flex-col items-center pt-2 pb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full h-14 flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="w-12 h-1.5 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors mb-4" />
              <div className="w-full px-8 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Now Playing</span>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); setShowQueue(!showQueue); }}
                  className={`p-2 rounded-full transition-all ${showQueue ? 'bg-white text-black' : 'text-white/60'}`}
                >
                  <ListMusic size={20} />
                </motion.button>
              </div>
            </motion.button>
          </div>

          <main className="relative z-10 flex-1 flex flex-col px-8 max-w-lg mx-auto w-full">
            <AnimatePresence mode="wait">
              {showQueue ? (
                <motion.div 
                  key="queue"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 overflow-hidden bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl mb-8"
                >
                  <QueueList
                    queue={playerState.queue}
                    currentTrackId={currentTrack.id}
                    tracks={tracks}
                    onReorder={(newQueue) => setPlayerState(p => ({ ...p, queue: newQueue }))}
                    onPlay={(id) => setPlayerState(p => ({ ...p, currentTrackId: id, isPlaying: true }))}
                    onRemove={onRemoveTrack}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="artwork-info"
                  variants={contentVariants}
                  className="flex-1 flex flex-col justify-center"
                >
                  {/* Artwork with dynamic shadow */}
                  <motion.div
                    animate={{ 
                      scale: playerState.isPlaying ? 1 : 0.9,
                      borderRadius: playerState.isPlaying ? "2rem" : "3rem"
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                    className="relative aspect-square w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden mb-12"
                  >
                    <img src={currentTrack.coverArt} className="w-full h-full object-cover" alt={currentTrack.title} />
                  </motion.div>

                  {/* Title & Artist */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex-1 min-w-0">
                      <motion.h1 layoutId="title" className="text-3xl font-bold text-white truncate leading-tight">
                        {currentTrack.title}
                      </motion.h1>
                      <motion.p layoutId="artist" className="text-xl text-white/50 truncate mt-1">
                        {currentTrack.artist}
                      </motion.p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1, color: "#ef4444" }}
                      whileTap={{ scale: 0.8 }}
                      className="ml-4 p-4 rounded-full bg-white/5 text-white/40"
                    >
                      <Heart size={26} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls Section */}
            <motion.div variants={contentVariants} className="pb-12">
              <ProgressBar 
                current={currentTime} 
                total={duration} 
                onSeek={handleSeek}
                isScrubbing={isScrubbing}
                setIsScrubbing={setIsScrubbing}
              />

              <div className="flex items-center justify-between mt-2">
                <motion.button 
                  whileTap={{ scale: 0.8 }}
                  onClick={toggleShuffle}
                  className={playerState.shuffle ? 'text-blue-400' : 'text-white/30'}
                >
                  <Shuffle size={22} />
                </motion.button>

                <div className="flex items-center gap-8">
                  <motion.button whileTap={{ scale: 0.8 }} onClick={prevTrack} className="text-white">
                    <SkipBack size={36} fill="currentColor" />
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
                    className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-xl"
                  >
                    {playerState.isPlaying ? <Pause size={36} fill="black" /> : <Play size={36} fill="black" className="ml-1" />}
                  </motion.button>

                  <motion.button whileTap={{ scale: 0.8 }} onClick={nextTrack} className="text-white">
                    <SkipForward size={36} fill="currentColor" />
                  </motion.button>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.8 }}
                  onClick={() => {/* cycle repeat logic */}}
                  className={playerState.repeat !== RepeatMode.OFF ? 'text-blue-400' : 'text-white/30'}
                >
                  <Repeat size={22} />
                </motion.button>
              </div>
            </motion.div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
