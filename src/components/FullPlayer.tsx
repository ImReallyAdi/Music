import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
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
  Mic2,
  Heart,
  Youtube,
  X,
  Volume2
} from 'lucide-react';
import { Track, PlayerState, RepeatMode } from '../types';
import { dbService } from '../db';
import QueueList from './QueueList';
import LyricsView from './LyricsView';
import { ThemePalette } from '../utils/colors';
import { AudioAnalysis } from '../hooks/useAudioAnalyzer';
import { PixelButton, PixelCard, PixelSlider, PixelArtFrame, PixelBadge } from './PixelComponents';

// Helper to format time (mm:ss)
const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- PROPS INTERFACE ---
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
  startScrub?: () => void;
  scrub?: (time: number) => void;
  endScrub?: () => void;
  onVolumeChange?: (volume: number) => void;
  toggleShuffle: () => void;
  onRemoveTrack?: (id: string) => void;
  onTrackUpdate?: (track: Track) => void;
  theme: ThemePalette | null;
  themeColor?: string;
  analyzerData?: AudioAnalysis;
}

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
  startScrub,
  endScrub,
  toggleShuffle,
  onRemoveTrack,
  onTrackUpdate,
  theme,
  analyzerData
}) => {
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [tracks, setTracks] = useState<Record<string, Track>>({});

  // Local state for the slider
  const [localScrubValue, setLocalScrubValue] = useState<number | null>(null);
  const isScrubbing = localScrubValue !== null;

  const { beat } = analyzerData || { beat: false };

  // Memoize colors
  const colors = useMemo(() => ({
    primary: theme?.primary || '#ff4d4d',
    secondary: theme?.secondary || '#a1a1aa',
    muted: theme?.muted || '#71717a',
    background: theme?.background || '#18181b'
  }), [theme]);

  const safeDuration = Math.max(duration, 0.01);
  const isSeekable = duration > 0 && !isNaN(duration);
  const dragControls = useDragControls();

  const displayValue = isScrubbing ? localScrubValue : currentTime;

  // --- SCRUBBING HANDLERS ---
  const handleScrubStart = () => {
      if (startScrub) startScrub();
  };

  const handleScrubChange = (val: number) => {
      if (!isSeekable && currentTrack?.source !== 'youtube') return;
      setLocalScrubValue(val);
  };

  const handleScrubEnd = () => {
      if (localScrubValue !== null) {
          handleSeek(localScrubValue);
      }
      setLocalScrubValue(null);
      if (endScrub) endScrub();
  };

  useEffect(() => {
    if (!isPlayerOpen) return;
    let isMounted = true;
    (async () => {
      try {
        const all = await dbService.getAllTracks();
        if (isMounted) {
          const map: Record<string, Track> = {};
          all.forEach(t => (map[t.id] = t));
          setTracks(map);
        }
      } catch (error) {
        console.error("Failed to load tracks:", error);
      }
    })();
    return () => { isMounted = false; };
  }, [isPlayerOpen]);

  const toggleRepeat = useCallback(() => {
    const modes: RepeatMode[] = ['OFF', 'ALL', 'ONE'];
    const next = modes[(modes.indexOf(playerState.repeat) + 1) % modes.length];
    setPlayerState(p => ({ ...p, repeat: next }));
    dbService.setSetting('repeat', next);
  }, [playerState.repeat, setPlayerState]);

  const handleReorder = useCallback((newQueue: string[]) => {
    setPlayerState(prev => ({ ...prev, queue: newQueue }));
  }, [setPlayerState]);

  const handleQueuePlayNext = useCallback((trackId: string) => {
    setPlayerState(prev => {
      const q = [...prev.queue];
      const existingIdx = q.indexOf(trackId);
      if (existingIdx !== -1) {
        q.splice(existingIdx, 1);
      }
      let newCurrentIdx = q.indexOf(prev.currentTrackId || '');
      if (newCurrentIdx === -1) newCurrentIdx = 0;
      q.splice(newCurrentIdx + 1, 0, trackId);
      return { ...prev, queue: q };
    });
  }, [setPlayerState]);

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isPlayerOpen && (
        <motion.div
          key="player"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }} // Slower, more mechanical slide
          className="fixed inset-0 z-[100] flex flex-col touch-none overflow-hidden bg-zinc-900 pt-safe pb-safe"
        >
          {/* Pattern Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
               style={{
                   backgroundImage: 'radial-gradient(#555 1px, transparent 1px)',
                   backgroundSize: '20px 20px'
               }}
          />

          {/* Header / Drag Handle */}
          <div 
            className="relative h-16 w-full flex items-center justify-between px-6 z-20 shrink-0 border-b-2 border-black bg-zinc-800 shadow-[0_4px_0_0_rgba(0,0,0,0.3)]"
            onPointerDown={(e) => dragControls.start(e)}
          >
             <button onClick={onClose} className="p-2 hover:bg-white/10 rounded active:translate-y-1 transition-transform">
                <ChevronDown size={28} strokeWidth={2.5} />
             </button>

             <div className="font-pixel-header text-sm text-zinc-400 tracking-widest uppercase">
                 Now Playing
             </div>

             <div className="w-10" /> {/* Spacer */}
          </div>

          <main className="flex-1 px-6 pb-8 flex flex-col landscape:flex-row items-center justify-center gap-8 landscape:gap-12 min-h-0 overflow-y-auto landscape:overflow-hidden no-scrollbar">
            
            {/* Left: Artwork / Visuals */}
            <div className="w-full max-w-[340px] landscape:max-w-[400px] aspect-square relative flex items-center justify-center shrink-0 mt-4 md:mt-0">
              <AnimatePresence mode="wait">
                {showLyrics ? (
                  <PixelCard className="absolute inset-0 bg-zinc-900 p-2 overflow-hidden">
                     <LyricsView
                       track={currentTrack}
                       currentTime={currentTime}
                       onSeek={handleSeek}
                       onClose={() => setShowLyrics(false)}
                       onTrackUpdate={onTrackUpdate}
                       lyricOffset={playerState.lyricOffset}
                       setLyricOffset={(o) => setPlayerState(p => ({...p, lyricOffset: o}))}
                     />
                  </PixelCard>
                ) : showQueue ? (
                  <PixelCard className="absolute inset-0 bg-zinc-900 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-3 border-b-2 border-black bg-zinc-800">
                        <span className="font-pixel font-bold">QUEUE</span>
                        <button onClick={() => setShowQueue(false)}><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <QueueList
                        queue={playerState.queue}
                        currentTrackId={playerState.currentTrackId}
                        tracks={tracks}
                        onReorder={handleReorder}
                        onPlay={(id) => playTrack(id, { fromQueue: true })}
                        onRemove={onRemoveTrack || (() => {})}
                        onPlayNext={handleQueuePlayNext}
                        onClose={() => setShowQueue(false)}
                        />
                    </div>
                  </PixelCard>
                ) : (
                  <motion.div
                    key="art"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="relative w-full h-full"
                  >
                     <PixelArtFrame src={currentTrack.coverArt || ''} className="w-full h-full" />

                     {/* Beat Effect Overlay */}
                     {beat && playerState.isPlaying && (
                         <div className="absolute inset-0 border-4 border-white opacity-50 pointer-events-none mix-blend-overlay" />
                     )}

                     {currentTrack.source === 'youtube' && (
                        <div className="absolute top-2 right-2">
                             <PixelBadge color="#ff0000">WEB</PixelBadge>
                        </div>
                     )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Info & Controls */}
            <div className="w-full max-w-[360px] flex flex-col justify-center gap-6 shrink-0 pb-8 md:pb-0">
              
              {/* Info Block */}
              <div className="flex items-center justify-between bg-zinc-800 p-4 border-2 border-black shadow-[4px_4px_0_0_#000]">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="overflow-hidden">
                        <motion.h1
                            className="text-xl md:text-2xl font-pixel-header leading-tight truncate text-white"
                            title={currentTrack.title}
                        >
                        {currentTrack.title}
                        </motion.h1>
                    </div>
                    <p className="text-base font-pixel text-zinc-400 truncate mt-1">
                      {currentTrack.artist}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                        dbService.toggleFavorite(currentTrack.id).then(updatedTrack => {
                            if (updatedTrack && onTrackUpdate) onTrackUpdate(updatedTrack);
                        });
                    }}
                    className={`p-2 transition-transform active:scale-90 ${currentTrack.isFavorite ? 'text-red-500' : 'text-zinc-600'}`}
                  >
                     <Heart size={24} fill={currentTrack.isFavorite ? "currentColor" : "none"} strokeWidth={3} />
                  </button>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                 <PixelSlider
                    value={displayValue}
                    min={0}
                    max={safeDuration}
                    step={0.1}
                    color={colors.primary}
                    height={24}
                    onChange={handleScrubChange}
                    onScrubStart={handleScrubStart}
                    onScrubEnd={handleScrubEnd}
                    disabled={!isSeekable && currentTrack.source !== 'youtube'}
                 />
                 <div className="flex justify-between text-sm font-pixel text-zinc-500 px-1">
                    <span>{formatTime(displayValue)}</span>
                    <span>{formatTime(duration)}</span>
                 </div>
              </div>

              {/* Main Controls */}
              <div className="grid grid-cols-5 gap-4 items-center justify-items-center">

                <PixelButton
                    variant="ghost"
                    square
                    onClick={toggleShuffle} 
                    className={playerState.shuffle ? "text-primary" : "text-zinc-600"}
                >
                    <Shuffle size={20} />
                    {playerState.shuffle && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary border border-black" />}
                </PixelButton>

                <PixelButton variant="secondary" square onClick={prevTrack} className="w-12 h-12">
                   <SkipBack size={24} fill="currentColor" />
                </PixelButton>

                <PixelButton
                    variant="primary"
                    square
                    onClick={togglePlay}
                    className="w-16 h-16 border-4"
                    style={{ backgroundColor: colors.primary, color: '#fff' }}
                >
                    {playerState.isPlaying ? (
                        <Pause size={32} fill="currentColor" />
                    ) : (
                        <Play size={32} fill="currentColor" />
                    )}
                </PixelButton>

                <PixelButton variant="secondary" square onClick={nextTrack} className="w-12 h-12">
                   <SkipForward size={24} fill="currentColor" />
                </PixelButton>

                <PixelButton
                    variant="ghost"
                    square
                    onClick={toggleRepeat}
                    className={playerState.repeat !== 'OFF' ? "text-primary" : "text-zinc-600"}
                >
                    <Repeat size={20} />
                    {playerState.repeat === 'ONE' && (
                        <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] px-1 border border-white">1</span>
                    )}
                </PixelButton>

              </div>

              {/* Volume Slider */}
              {onVolumeChange && (
                  <div className="flex items-center gap-3 px-2">
                      <Volume2 size={20} className="text-zinc-500" />
                      <div className="flex-1">
                          <PixelSlider
                              value={playerState.volume * 100}
                              min={0}
                              max={100}
                              step={1}
                              height={16}
                              color={colors.secondary}
                              onChange={(val) => onVolumeChange(val / 100)}
                          />
                      </div>
                  </div>
              )}

              {/* Toggles */}
              <div className="flex gap-4">
                 <PixelButton
                    variant={showLyrics ? "primary" : "secondary"}
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => {
                        setShowLyrics(!showLyrics);
                        if (!showLyrics) setShowQueue(false);
                    }}
                 >
                    <Mic2 size={16} /> <span className="text-xs">LYRICS</span>
                 </PixelButton>

                 <PixelButton
                    variant={showQueue ? "primary" : "secondary"}
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => {
                        setShowQueue(!showQueue);
                        if (!showQueue) setShowLyrics(false);
                    }}
                 >
                    <ListMusic size={16} /> <span className="text-xs">QUEUE</span>
                 </PixelButton>
              </div>

            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullPlayer;
