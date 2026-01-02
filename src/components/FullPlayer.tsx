import React, { useState, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useDragControls,
} from 'framer-motion';
import {
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  ListMusic,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Track, PlayerState, RepeatMode } from '../types';
import QueueList from './QueueList';
import { dbService } from '../db';

interface FullPlayerProps {
  currentTrack: Track | null;
  playerState: PlayerState;
  isPlayerOpen: boolean;
  onClose: () => void;
  togglePlay: () => void;
  playTrack: (id: string, options?: any) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  currentTime: number;
  duration: number;
  handleSeek: (time: number) => void; // Updated: number instead of event
  onVolumeChange: (volume: number) => void; // Added for direct control
  toggleShuffle: () => void;
  onRemoveTrack: (trackId: string) => void;
}

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return '0:00';
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const FullPlayer: React.FC<FullPlayerProps> = ({
  currentTrack,
  playerState,
  isPlayerOpen,
  onClose,
  togglePlay,
  playTrack,
  nextTrack,
  prevTrack,
  setPlayerState,
  currentTime,
  duration,
  handleSeek,
  onVolumeChange,
  toggleShuffle,
  onRemoveTrack,
}) => {
  const [showQueue, setShowQueue] = useState(false);
  const [tracks, setTracks] = useState<Record<string, Track>>({});
  
  // -- Seek State --
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const dragControls = useDragControls();
  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [0, 200], [1, 0]);

  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;

  useEffect(() => {
    dragY.set(0);
    if (!isPlayerOpen) setShowQueue(false);
  }, [isPlayerOpen, dragY]);

  // Sync external time only when the user isn't actively moving the slider
  useEffect(() => {
    if (!isScrubbing) {
      setScrubValue(currentTime);
    }
  }, [currentTime, isScrubbing]);

  useEffect(() => {
    if (!isPlayerOpen) return;
    (async () => {
      const all = await dbService.getAllTracks();
      const map: Record<string, Track> = {};
      all.forEach(t => (map[t.id] = t));
      setTracks(map);
    })();
  }, [isPlayerOpen]);

  if (!currentTrack) return null;

  const toggleRepeat = () => {
    const modes: RepeatMode[] = ['OFF', 'ALL', 'ONE'];
    const next = modes[(modes.indexOf(playerState.repeat) + 1) % modes.length];
    setPlayerState(p => ({ ...p, repeat: next }));
    dbService.setSetting('repeat', next);
  };

  // Direct numeric handlers
  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScrubValue(Number(e.target.value));
  };

  const handleScrubEnd = () => {
    handleSeek(scrubValue);
    // iOS Safari requires a tiny delay to allow the audio buffer to catch up
    // before we resume external state updates, preventing "jumps"
    setTimeout(() => setIsScrubbing(false), 100);
  };

  const toggleMute = () => {
    const newVolume = playerState.volume === 0 ? 0.8 : 0;
    onVolumeChange(newVolume);
  };

  return (
    <AnimatePresence>
      {isPlayerOpen && (
        <motion.div
          key="player"
          initial={{ y: windowHeight }}
          animate={{ y: 0 }}
          exit={{ y: windowHeight }}
          transition={{ type: 'spring', damping: 30, stiffness: 250 }}
          drag="y"
          dragControls={dragControls}
          dragListener={false} // Only drag via handle to prevent slider conflict
          dragConstraints={{ top: 0 }}
          dragElastic={0.1}
          style={{ opacity, y: dragY }}
          onDragEnd={(_, i) => {
            if (i.offset.y > 150 || i.velocity.y > 500) onClose();
            else dragY.set(0);
          }}
          className="fixed inset-0 z-[100] bg-black flex flex-col touch-none"
        >
          {/* Background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <motion.div
              key={currentTrack.coverArt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img
                src={currentTrack.coverArt}
                alt=""
                className="w-full h-full object-cover blur-[100px] scale-125"
              />
            </motion.div>
            <div className="absolute inset-0 bg-black/60" />
          </div>

          {/* Dedicated Drag Handle */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="h-16 flex items-center justify-center cursor-grab active:cursor-grabbing flex-shrink-0"
          >
            <div className="w-10 h-1.5 bg-white/20 rounded-full" />
          </div>

          <main className="flex-1 px-6 pb-10 flex flex-col landscape:flex-row landscape:items-center landscape:justify-center landscape:gap-12">
            
            {/* LEFT SIDE: Art or Queue */}
            <div className="flex-1 flex flex-col landscape:h-full landscape:justify-center landscape:w-1/2 landscape:max-w-lg">
              <AnimatePresence mode="wait">
                {!showQueue ? (
                  <motion.div
                    key="art-view"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex-1 flex items-center justify-center"
                  >
                    <img
                      src={currentTrack.coverArt}
                      className="w-full max-w-[80vw] aspect-square rounded-2xl shadow-2xl object-cover landscape:max-h-[60vh]"
                      alt={currentTrack.title}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="queue-view"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex-1 flex flex-col bg-white/5 rounded-3xl p-4 backdrop-blur-md overflow-hidden"
                  >
                    <QueueList
                      queue={playerState.queue}
                      currentTrackId={currentTrack.id}
                      tracks={tracks}
                      onPlay={id => playTrack(id, { fromQueue: true })}
                      onRemove={onRemoveTrack}
                      onPlayNext={id => playTrack(id, { immediate: false })}
                      onReorder={q => setPlayerState(p => ({ ...p, queue: q }))}
                      onClose={() => setShowQueue(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT SIDE: Controls */}
            <div className="flex flex-col landscape:w-1/2 landscape:max-w-md">
              {!showQueue && (
                <div className="mt-6 mb-2 landscape:text-left text-center">
                  <h1 className="text-2xl font-bold text-white truncate landscape:text-4xl">
                    {currentTrack.title}
                  </h1>
                  <p className="text-white/50 truncate text-lg landscape:text-xl">
                    {currentTrack.artist}
                  </p>
                </div>
              )}

              {/* Progress Slider */}
              <div className="mt-8">
                <div className="relative h-1.5 bg-white/10 rounded-full group">
                  <div 
                    className="absolute h-full bg-white rounded-full pointer-events-none"
                    style={{ width: `${(scrubValue / (duration || 1)) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={scrubValue}
                    onChange={handleScrubChange}
                    onPointerDown={() => setIsScrubbing(true)}
                    onPointerUp={handleScrubEnd}
                    className="absolute inset-0 opacity-0 w-full h-6 -top-2 cursor-pointer touch-none"
                  />
                </div>
                <div className="flex justify-between text-xs text-white/40 mt-3 font-mono">
                  <span>{formatTime(scrubValue)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume */}
              <div className="mt-8 flex items-center gap-4">
                <button onClick={toggleMute} className="text-white/60 hover:text-white">
                  {playerState.volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="flex-1 relative h-1 bg-white/10 rounded-full">
                  <div 
                    className="absolute h-full bg-white/60 rounded-full"
                    style={{ width: `${playerState.volume * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={playerState.volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-4 -top-1.5 opacity-0 cursor-pointer touch-none"
                  />
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-between mt-10">
                <button onClick={toggleShuffle} className="p-2">
                  <Shuffle size={20} className={playerState.shuffle ? 'text-green-400' : 'text-white/30'} />
                </button>

                <div className="flex items-center gap-8">
                  <button onClick={prevTrack} className="active:scale-90 transition-transform">
                    <SkipBack size={36} fill="white" />
                  </button>
                  <button 
                    onClick={togglePlay} 
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform"
                  >
                    {playerState.isPlaying ? <Pause fill="black" size={32} /> : <Play fill="black" size={32} className="ml-1" />}
                  </button>
                  <button onClick={nextTrack} className="active:scale-90 transition-transform">
                    <SkipForward size={36} fill="white" />
                  </button>
                </div>

                <button onClick={toggleRepeat} className="p-2 relative">
                  <Repeat size={20} className={playerState.repeat !== 'OFF' ? 'text-green-400' : 'text-white/30'} />
                  {playerState.repeat === 'ONE' && (
                    <span className="absolute top-1 right-1 text-[8px] bg-green-400 text-black font-bold px-0.5 rounded-sm">1</span>
                  )}
                </button>
              </div>

              <div className="flex justify-center mt-8">
                <button 
                  onClick={() => setShowQueue(!showQueue)}
                  className="p-3 bg-white/10 rounded-full hover:bg-white/20"
                >
                  {showQueue ? <ChevronDown /> : <ListMusic />}
                </button>
              </div>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullPlayer;
