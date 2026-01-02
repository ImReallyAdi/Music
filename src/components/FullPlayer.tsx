import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useDragControls } from 'framer-motion';
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
  handleSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  toggleShuffle: () => void;
  onRemoveTrack: (trackId: string) => void;
  themeColor?: string;
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
  themeColor,
}) => {
  const [showQueue, setShowQueue] = useState(false);
  const [tracks, setTracks] = useState<Record<string, Track>>({});

  // --- SEEK ---
  const [scrubbing, setScrubbing] = useState(false);
  const scrubRef = useRef(0);

  // --- VOLUME ---
  const [volumeScrub, setVolumeScrub] = useState(false);
  const volumeRef = useRef(playerState.volume);

  // --- DRAG ---
  const dragControls = useDragControls();
  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [0, 200], [1, 0]);

  const windowHeight =
    typeof window !== 'undefined' ? window.innerHeight : 800;

  useEffect(() => {
    if (!isPlayerOpen) return;
    dragY.set(0);
  }, [isPlayerOpen, dragY]);

  useEffect(() => {
    if (!scrubbing) scrubRef.current = currentTime;
  }, [currentTime, scrubbing]);

  useEffect(() => {
    if (!volumeScrub) volumeRef.current = playerState.volume;
  }, [playerState.volume, volumeScrub]);

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

  // --- SEEK HANDLERS ---
  const onSeekStart = () => setScrubbing(true);

  const onSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    scrubRef.current = Number(e.target.value);
  };

  useEffect(() => {
    if (!scrubbing) return;
    const up = () => {
      handleSeek(scrubRef.current);
      setScrubbing(false);
    };
    window.addEventListener('pointerup', up, { once: true });
    return () => window.removeEventListener('pointerup', up);
  }, [scrubbing, handleSeek]);

  // --- VOLUME HANDLERS ---
  const onVolumeStart = () => setVolumeScrub(true);

  const onVolumeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    volumeRef.current = v;
    onVolumeChange(v);
  };

  useEffect(() => {
    if (!volumeScrub) return;
    const up = () => {
      onVolumeChange(volumeRef.current);
      setVolumeScrub(false);
    };
    window.addEventListener('pointerup', up, { once: true });
    return () => window.removeEventListener('pointerup', up);
  }, [volumeScrub, onVolumeChange]);

  const safeDuration = Math.max(duration, 0.01);
  const seekValue = scrubbing ? scrubRef.current : currentTime;
  const volumeValue = volumeScrub ? volumeRef.current : playerState.volume;

  return (
    <AnimatePresence>
      {isPlayerOpen && (
        <motion.div
          initial={{ y: windowHeight }}
          animate={{ y: 0 }}
          exit={{ y: windowHeight }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          drag="y"
          dragControls={dragControls}
          dragConstraints={{ top: 0 }}
          dragElastic={0.08}
          style={{ opacity }}
          onDrag={(_, i) => dragY.set(i.offset.y)}
          onDragEnd={(_, i) => i.offset.y > 150 ? onClose() : dragY.set(0)}
          className="fixed inset-0 z-[600] bg-black flex flex-col"
        >
          {/* drag handle */}
          <div
            onPointerDown={e => dragControls.start(e)}
            className="h-14 flex items-center justify-center"
          >
            <div className="w-12 h-1.5 bg-white/30 rounded-full" />
          </div>

          <main className="flex-1 px-6 pb-10 flex flex-col gap-6">
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
            <div onPointerDown={e => e.stopPropagation()}>
              <input
                type="range"
                min={0}
                max={safeDuration}
                step={0.01}
                value={seekValue}
                onPointerDown={onSeekStart}
                onChange={onSeekChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>{formatTime(seekValue)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* volume */}
            <div className="flex items-center gap-3">
              <button onClick={() => onVolumeChange(volumeValue === 0 ? 1 : 0)}>
                {volumeValue === 0 ? <VolumeX /> : <Volume2 />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volumeValue}
                onPointerDown={onVolumeStart}
                onChange={onVolumeInput}
                className="flex-1"
              />
            </div>

            {/* controls */}
            <div className="flex items-center justify-between">
              <Shuffle
                onClick={toggleShuffle}
                className={playerState.shuffle ? 'text-green-400' : 'text-white/40'}
              />

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

              <Repeat
                onClick={toggleRepeat}
                className={playerState.repeat !== 'OFF' ? 'text-green-400' : 'text-white/40'}
              />
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
