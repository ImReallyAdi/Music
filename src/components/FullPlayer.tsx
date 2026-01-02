import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
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
  handleSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  toggleShuffle: () => void;
  onRemoveTrack: (trackId: string) => void;
}

const formatTime = (t: number) => {
  if (!t || isNaN(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
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
  const dragControls = useDragControls();
  const [showQueue, setShowQueue] = useState(false);
  const [tracks, setTracks] = useState<Record<string, Track>>({});

  const seekRef = useRef(currentTime);
  const volumeRef = useRef(playerState.volume);
  const isSeeking = useRef(false);
  const isVoluming = useRef(false);

  useEffect(() => {
    if (!isSeeking.current) seekRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    if (!isVoluming.current) volumeRef.current = playerState.volume;
  }, [playerState.volume]);

  useEffect(() => {
    if (!isPlayerOpen) return;
    dbService.getAllTracks().then(all => {
      const map: Record<string, Track> = {};
      all.forEach(t => (map[t.id] = t));
      setTracks(map);
    });
  }, [isPlayerOpen]);

  if (!currentTrack) return null;

  const toggleRepeat = () => {
    const modes: RepeatMode[] = ['OFF', 'ALL', 'ONE'];
    const next =
      modes[(modes.indexOf(playerState.repeat) + 1) % modes.length];
    setPlayerState(p => ({ ...p, repeat: next }));
    dbService.setSetting('repeat', next);
  };

  const durationSafe = Math.max(duration, 0.01);

  return (
    <AnimatePresence>
      {isPlayerOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          drag="y"
          dragControls={dragControls}
          dragConstraints={{ top: 0 }}
          dragElastic={0.1}
          onDragEnd={(_, info) => info.offset.y > 140 && onClose()}
          className="fixed inset-0 z-[999] bg-black flex flex-col touch-none"
        >
          {/* drag handle */}
          <div
            onPointerDown={e => dragControls.start(e)}
            className="h-14 flex items-center justify-center"
          >
            <div className="w-12 h-1.5 bg-white/30 rounded-full" />
          </div>

          <main className="flex-1 px-6 pb-8 flex flex-col gap-6">
            {/* artwork */}
            <img
              src={currentTrack.coverArt}
              className="w-full aspect-square rounded-3xl object-cover"
            />

            {/* title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white truncate">
                {currentTrack.title}
              </h1>
              <p className="text-white/50 truncate">
                {currentTrack.artist}
              </p>
            </div>

            {/* seek */}
            <div
              onPointerDown={e => e.stopPropagation()}
              className="flex flex-col gap-1"
            >
              <input
                type="range"
                min={0}
                max={durationSafe}
                step={0.01}
                value={seekRef.current}
                onPointerDown={() => (isSeeking.current = true)}
                onChange={e => (seekRef.current = Number(e.target.value))}
                onPointerUp={() => {
                  handleSeek(seekRef.current);
                  isSeeking.current = false;
                }}
                className="w-full touch-none"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>{formatTime(seekRef.current)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* volume */}
            <div
              className="flex items-center gap-3"
              onPointerDown={e => e.stopPropagation()}
            >
              <button
                onClick={() =>
                  onVolumeChange(volumeRef.current === 0 ? 1 : 0)
                }
              >
                {volumeRef.current === 0 ? <VolumeX /> : <Volume2 />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volumeRef.current}
                onPointerDown={() => (isVoluming.current = true)}
                onChange={e => {
                  volumeRef.current = Number(e.target.value);
                  onVolumeChange(volumeRef.current);
                }}
                onPointerUp={() => (isVoluming.current = false)}
                className="flex-1 touch-none"
              />
            </div>

            {/* controls */}
            <div className="flex items-center justify-between">
              <button onClick={toggleShuffle}>
                <Shuffle
                  className={
                    playerState.shuffle ? 'text-green-400' : 'text-white/40'
                  }
                />
              </button>

              <div className="flex items-center gap-6">
                <SkipBack onClick={prevTrack} />
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
                >
                  {playerState.isPlaying ? <Pause /> : <Play />}
                </button>
                <SkipForward onClick={nextTrack} />
              </div>

              <button onClick={toggleRepeat}>
                <Repeat
                  className={
                    playerState.repeat !== 'OFF'
                      ? 'text-green-400'
                      : 'text-white/40'
                  }
                />
              </button>
            </div>

            {/* queue */}
            <button
              onClick={() => setShowQueue(v => !v)}
              className="mx-auto bg-white/10 p-3 rounded-full"
            >
              {showQueue ? <ChevronDown /> : <ListMusic />}
            </button>

            {showQueue && (
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
            )}
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullPlayer;
