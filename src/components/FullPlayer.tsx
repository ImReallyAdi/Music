import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useDragControls,
  useSpring
} from 'framer-motion';
import { Track, PlayerState, RepeatMode } from '../types';
import { dbService } from '../db';
import QueueList from './QueueList';
import LyricsView from './LyricsView';
import { ThemePalette } from '../utils/colors';
import { AudioAnalysis } from '../hooks/useAudioAnalyzer';
import '@material/web/slider/slider.js';
import '@material/web/iconbutton/filled-icon-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/iconbutton/filled-tonal-icon-button.js';
import '@material/web/icon/icon.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-slider': any;
      'md-filled-icon-button': any;
      'md-filled-tonal-icon-button': any;
      'md-icon-button': any;
      'md-icon': any;
    }
  }
}

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
  allTracks: Record<string, Track>;
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
  analyzerData?: AudioAnalysis; // Accept data from prop
}

const FullPlayer: React.FC<FullPlayerProps> = ({
  currentTrack,
  playerState,
  allTracks,
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
  const [isLyricsFullscreen, setIsLyricsFullscreen] = useState(false);

  // Local state for the slider to ensure immediate feedback
  const [localScrubValue, setLocalScrubValue] = useState<number | null>(null);
  const isScrubbing = localScrubValue !== null;

  const { beat } = analyzerData || { beat: false };

  // Memoize color values
  const colors = useMemo(() => ({
    primary: theme?.primary || 'var(--md-sys-color-primary)',
    secondary: theme?.secondary || 'var(--md-sys-color-secondary)',
    muted: 'var(--md-sys-color-on-surface-variant)', // Force high contrast muted
    background: theme?.background || 'var(--md-sys-color-background)'
  }), [theme]);

  // Beat Animations
  const beatScale = useSpring(1, { stiffness: 300, damping: 10 });
  const glowOpacity = useSpring(0, { stiffness: 200, damping: 20 });

  useEffect(() => {
      if (beat && isPlayerOpen) {
          beatScale.set(1.03); // Pop
          glowOpacity.set(0.6); // Flash
          setTimeout(() => {
              beatScale.set(1);
              glowOpacity.set(0);
          }, 100);
      }
  }, [beat, beatScale, glowOpacity, isPlayerOpen]);

  const safeDuration = Math.max(duration, 0.01);
  const dragControls = useDragControls();
  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [0, 200], [1, 0]);

  // Display value
  const displayValue = isScrubbing ? localScrubValue : currentTime;

  // --- SCRUBBING HANDLERS ---
  const handleScrubStart = () => {
      if (startScrub) startScrub();
  };

  const handleScrubInput = (e: Event) => {
      // @ts-ignore
      const value = e.target.value as number;
      setLocalScrubValue(value);
  };

  const handleScrubEnd = (e: Event) => {
      // @ts-ignore
      const value = e.target.value as number;
      handleSeek(value);
      setLocalScrubValue(null);
      if (endScrub) endScrub();
  };

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
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0 }}
          dragElastic={0.05}
          style={{ opacity, y: dragY, background: colors.background, willChange: 'transform, opacity' }}
          onDragEnd={(_, i) => {
            if (i.offset.y > 100 || i.velocity.y > 500) onClose();
            else dragY.set(0);
          }}
          className="fixed inset-0 z-[100] flex flex-col touch-none overflow-hidden pt-safe pb-safe"
        >
          {/* Dynamic Background */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
             <motion.div
                animate={{ background: `linear-gradient(to bottom, ${colors.primary}20, ${colors.background} 90%)` }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
             />
            <motion.img
              key={currentTrack.coverArt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1 }}
              src={currentTrack.coverArt}
              className="w-full h-full object-cover blur-[100px] scale-125 brightness-50"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
          </div>

          {/* Drag Handle */}
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="h-14 w-full flex items-center justify-center cursor-grab active:cursor-grabbing z-20 shrink-0"
          >
            <div className="w-16 h-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors backdrop-blur-md shadow-sm" />
          </div>

          <main className="flex-1 px-6 pb-8 flex flex-col landscape:flex-row items-center justify-center gap-8 landscape:gap-16 min-h-0 relative">
            
            {/* FULLSCREEN LYRICS */}
            <AnimatePresence>
                {isLyricsFullscreen && (
                    <motion.div
                        layoutId="lyrics-view"
                        className="fixed inset-0 z-50 flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <LyricsView
                            track={currentTrack}
                            currentTime={currentTime}
                            onSeek={handleSeek}
                            onTrackUpdate={onTrackUpdate}
                            lyricOffset={playerState.lyricOffset}
                            setLyricOffset={(o) => setPlayerState(p => ({...p, lyricOffset: o}))}
                            isFullscreen={true}
                            onToggleFullscreen={() => setIsLyricsFullscreen(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left: Artwork / Inline Lyrics */}
            <div className="w-full max-w-[360px] landscape:max-w-[400px] aspect-square relative flex items-center justify-center shrink-0">
              <AnimatePresence mode="wait">
                {!isLyricsFullscreen && showLyrics ? (
                  <motion.div
                     key="lyrics"
                     layoutId="lyrics-view"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="absolute inset-0 rounded-[40px] overflow-hidden bg-black/20 backdrop-blur-md border border-white/5"
                     onPointerDown={(e) => e.stopPropagation()}
                  >
                     <LyricsView
                       track={currentTrack}
                       currentTime={currentTime}
                       onSeek={handleSeek}
                       onClose={() => setShowLyrics(false)}
                       onTrackUpdate={onTrackUpdate}
                       lyricOffset={playerState.lyricOffset}
                       setLyricOffset={(o) => setPlayerState(p => ({...p, lyricOffset: o}))}
                       isFullscreen={false}
                       onToggleFullscreen={() => setIsLyricsFullscreen(true)}
                     />
                  </motion.div>
                ) : showQueue ? (
                  <motion.div
                    key="queue"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-xl rounded-[40px] border border-white/10 overflow-hidden flex flex-col"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <QueueList
                      queue={playerState.queue}
                      currentTrackId={playerState.currentTrackId}
                      tracks={allTracks}
                      onReorder={handleReorder}
                      onPlay={(id) => playTrack(id, { fromQueue: true })}
                      onRemove={onRemoveTrack || (() => {})}
                      onPlayNext={handleQueuePlayNext}
                      onClose={() => setShowQueue(false)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="art"
                    layoutId="albumArt"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                        opacity: 1,
                        scale: playerState.isPlaying ? 1 : 0.95,
                        rotate: playerState.isPlaying ? 0 : 0
                    }}
                    style={{ scale: playerState.isPlaying ? beatScale : 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
                    className="relative w-full h-full shadow-[0_24px_64px_rgba(0,0,0,0.6)] rounded-[40px] overflow-hidden bg-surface-container-high ring-1 ring-white/10"
                  >
                     <img
                      src={currentTrack.coverArt}
                      className="w-full h-full object-cover"
                      alt="Album Art"
                    />

                    {/* Beat Glow Flash */}
                    <motion.div
                        style={{ opacity: glowOpacity, background: colors.primary }}
                        className="absolute inset-0 mix-blend-overlay pointer-events-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Info & Controls */}
            <div className="w-full max-w-[380px] flex flex-col justify-end gap-10 shrink-0 pb-4">
              
              {/* Text Info & Favorite */}
              <div className="flex items-center justify-between gap-4">
                  <div className="text-left flex-1 min-w-0">
                    <motion.h1
                        animate={{ color: '#ffffff' }}
                        className="text-headline-large font-black leading-tight line-clamp-1 tracking-tight drop-shadow-md"
                        title={currentTrack.title}
                    >
                      {currentTrack.title}
                    </motion.h1>
                    <motion.p
                        animate={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        className="text-title-large line-clamp-1 mt-1 font-medium tracking-tight"
                        title={currentTrack.artist}
                    >
                      {currentTrack.artist}
                    </motion.p>
                  </div>

                  <md-icon-button
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        dbService.toggleFavorite(currentTrack.id).then(updatedTrack => {
                            if (updatedTrack && onTrackUpdate) {
                                onTrackUpdate(updatedTrack);
                            }
                        });
                    }}
                    style={{ '--md-icon-button-icon-color': currentTrack.isFavorite ? colors.primary : 'rgba(255,255,255,0.7)', '--md-icon-button-icon-size': '32px' }}
                  >
                     <md-icon class="material-symbols-rounded">
                        {currentTrack.isFavorite ? "favorite" : "favorite_border"}
                     </md-icon>
                  </md-icon-button>
              </div>

              {/* Material Progress Slider */}
              <div className="w-full flex flex-col gap-2">
                 <md-slider
                    min="0"
                    max={safeDuration}
                    value={displayValue}
                    step="0.1"

                    onInput={handleScrubInput}
                    onChange={handleScrubEnd}
                    onPointerDown={handleScrubStart}
                    style={{
                      width: '100%',
                      '--md-slider-handle-color': colors.primary,
                      '--md-slider-handle-width': '20px',
                      '--md-slider-handle-height': '20px',
                      '--md-slider-active-track-color': colors.primary,
                      '--md-slider-inactive-track-color': 'rgba(255,255,255,0.2)',
                      '--md-slider-active-track-height': '6px',
                      '--md-slider-inactive-track-height': '6px'
                    }}
                 ></md-slider>

                <div className="flex justify-between text-label-medium font-bold font-mono tracking-wider opacity-80 px-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span>{formatTime(displayValue)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-between px-2">
                <md-icon-button
                    onClick={toggleShuffle} 
                    toggle
                    selected={playerState.shuffle}
                    style={{
                        '--md-icon-button-icon-color': 'rgba(255,255,255,0.6)',
                        '--md-icon-button-selected-icon-color': colors.primary,
                        '--md-icon-button-icon-size': '28px'
                    }}
                >
                   <md-icon class="material-symbols-rounded">shuffle</md-icon>
                </md-icon-button>

                <div className="flex items-center gap-8">
                  <md-icon-button onClick={prevTrack} style={{ '--md-icon-size': '42px', '--md-icon-button-icon-color': '#ffffff' }}>
                    <md-icon class="material-symbols-rounded">skip_previous</md-icon>
                  </md-icon-button>
                  
                  <md-filled-icon-button
                    onClick={togglePlay}
                    style={{
                        '--md-filled-icon-button-container-width': '84px',
                        '--md-filled-icon-button-container-height': '84px',
                        '--md-filled-icon-button-icon-size': '42px',
                        '--md-sys-color-primary': '#ffffff',
                        '--md-sys-color-on-primary': '#000000', // High contrast play button
                        borderRadius: '28px'
                    }}
                  >
                    <md-icon class="material-symbols-rounded">
                        {playerState.isPlaying ? 'pause' : 'play_arrow'}
                    </md-icon>
                  </md-filled-icon-button>
                  
                  <md-icon-button onClick={nextTrack} style={{ '--md-icon-size': '42px', '--md-icon-button-icon-color': '#ffffff' }}>
                     <md-icon class="material-symbols-rounded">skip_next</md-icon>
                  </md-icon-button>
                </div>

                <md-icon-button
                    onClick={toggleRepeat}
                    style={{
                        '--md-icon-button-icon-color': playerState.repeat !== 'OFF' ? colors.primary : 'rgba(255,255,255,0.6)',
                        '--md-icon-button-icon-size': '28px'
                    }}
                >
                   <div className="relative">
                       <md-icon class="material-symbols-rounded">
                           {playerState.repeat === 'ONE' ? 'repeat_one' : 'repeat'}
                       </md-icon>
                   </div>
                </md-icon-button>
              </div>

              {/* Bottom Row (Queue & Lyrics) */}
              <div className="flex items-center justify-between mt-4 px-6 gap-6">
                 <md-filled-tonal-icon-button
                    onClick={() => {
                        setShowLyrics(!showLyrics);
                        if (!showLyrics) setShowQueue(false);
                    }}
                    toggle
                    selected={showLyrics}
                    style={{
                        width: '100%',
                        height: '56px',
                        borderRadius: '20px',
                        '--md-sys-color-secondary-container': showLyrics ? colors.primary : 'rgba(255,255,255,0.1)',
                        '--md-sys-color-on-secondary-container': showLyrics ? 'var(--md-sys-color-surface)' : '#ffffff',
                        '--md-icon-size': '28px'
                    }}
                 >
                    <md-icon class="material-symbols-rounded">lyrics</md-icon>
                 </md-filled-tonal-icon-button>

                 <md-filled-tonal-icon-button
                    onClick={() => {
                        setShowQueue(!showQueue);
                        if (!showQueue) setShowLyrics(false);
                    }}
                    toggle
                    selected={showQueue}
                    style={{
                        width: '100%',
                        height: '56px',
                        borderRadius: '20px',
                        '--md-sys-color-secondary-container': showQueue ? colors.primary : 'rgba(255,255,255,0.1)',
                        '--md-sys-color-on-secondary-container': showQueue ? 'var(--md-sys-color-surface)' : '#ffffff',
                        '--md-icon-size': '28px'
                    }}
                 >
                    <md-icon class="material-symbols-rounded">
                        {showQueue ? 'expand_more' : 'queue_music'}
                    </md-icon>
                 </md-filled-tonal-icon-button>
              </div>

            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullPlayer;