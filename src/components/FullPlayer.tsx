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
import Waveform from './Waveform';
import { ThemePalette } from '../utils/colors';
import { AudioAnalysis } from '../hooks/useAudioAnalyzer';
import '@material/web/slider/slider.js';
import '@material/web/iconbutton/filled-icon-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/iconbutton/filled-tonal-icon-button.js';
import '@material/web/icon/icon.js';

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
  analyzerData?: AudioAnalysis;
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

  // Memoize color values (Fallbacks to CSS vars if theme is missing, but mostly rely on theme for alpha ops)
  const colors = useMemo(() => ({
    primary: theme?.primary || '#FFB4AB',
    secondary: theme?.secondary || '#E7BDB8',
    background: theme?.background || '#201A19',
    surfaceContainer: theme?.surfaceContainer || '#272120'
  }), [theme]);

  // Beat Animations
  const beatScale = useSpring(1, { stiffness: 300, damping: 10 });
  const glowOpacity = useSpring(0, { stiffness: 200, damping: 20 });

  useEffect(() => {
      if (beat && isPlayerOpen) {
          beatScale.set(1.02); // Subtle Pop
          glowOpacity.set(0.4);
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
            {/* Blurry Art Background */}
            <motion.img
              key={currentTrack.coverArt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1 }}
              src={currentTrack.coverArt}
              className="w-full h-full object-cover blur-[100px] scale-150 brightness-50 saturate-200"
              alt=""
            />
             {/* Gradient Overlay using Theme Colors */}
             <motion.div
                animate={{
                    background: `
                        radial-gradient(circle at 10% 20%, ${colors.secondary}40 0%, transparent 50%),
                        radial-gradient(circle at 90% 10%, ${colors.tertiary}40 0%, transparent 50%),
                        linear-gradient(to bottom, transparent 0%, ${colors.background} 100%)
                    `
                }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 mix-blend-screen"
             />
            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
            />
          </div>

          {/* Drag Handle */}
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="h-14 w-full flex items-center justify-center cursor-grab active:cursor-grabbing z-20 shrink-0"
          >
            <div className="w-16 h-1.5 bg-on-surface-variant/20 rounded-full hover:bg-on-surface-variant/40 transition-colors backdrop-blur-md shadow-sm" />
          </div>

          <main className="flex-1 px-6 pb-8 flex flex-col landscape:flex-row items-center justify-center gap-8 landscape:gap-16 min-h-0 relative">
            
            {/* FULLSCREEN LYRICS OVERLAY */}
            <AnimatePresence>
                {isLyricsFullscreen && (
                    <motion.div
                        layoutId="lyrics-view-fs"
                        className="absolute inset-0 z-40 flex flex-col bg-surface/50 backdrop-blur-3xl"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
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
                            onClose={() => setIsLyricsFullscreen(false)}
                        />
                        {/* Gradient Fade for Bottom Controls */}
                        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-10" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA */}
            {/* Left: Artwork / Inline Lyrics / Queue */}
            <div className={`w-full max-w-[360px] landscape:max-w-[400px] aspect-square relative flex items-center justify-center shrink-0 ${isLyricsFullscreen ? 'opacity-0 pointer-events-none' : ''}`}>
              <AnimatePresence mode="wait">
                {showLyrics ? (
                  <motion.div
                     key="lyrics-inline"
                     layoutId="lyrics-view-inline"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="absolute inset-0 rounded-[40px] overflow-hidden bg-surface-container-high/50 backdrop-blur-xl border border-white/5 shadow-elevation-2"
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
                    className="absolute inset-0 bg-surface-container-high/80 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-elevation-2"
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
                    }}
                    style={{ scale: playerState.isPlaying ? beatScale : 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
                    className="relative w-full h-full shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] rounded-[48px] overflow-hidden bg-surface-container-highest"
                  >
                     <img
                      src={currentTrack.coverArt}
                      className="w-full h-full object-cover"
                      alt="Album Art"
                      loading="eager"
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

            {/* Right: Controls */}
            <div className="w-full max-w-[380px] flex flex-col justify-end gap-10 shrink-0 pb-4">
              
              {/* Metadata */}
              <div className="flex items-center justify-between gap-4">
                  <div className="text-left flex-1 min-w-0">
                    <motion.h1
                        className="text-headline-medium font-black leading-tight line-clamp-1 tracking-tight text-on-surface"
                        title={currentTrack.title}
                    >
                      {currentTrack.title}
                    </motion.h1>
                    <motion.p
                        className="text-title-medium line-clamp-1 mt-1 font-medium tracking-tight text-on-surface-variant"
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
                    style={{
                        '--md-icon-button-icon-color': currentTrack.isFavorite ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                        '--md-icon-button-icon-size': '28px'
                    }}
                  >
                     <md-icon class="material-symbols-rounded">
                        {currentTrack.isFavorite ? "favorite" : "favorite_border"}
                     </md-icon>
                  </md-icon-button>
              </div>

              {/* Progress Slider */}
              <div className={`w-full flex flex-col gap-0 transition-all duration-300 ${isLyricsFullscreen ? 'z-50' : ''}`}>
                 <div className="px-1 mb-[-4px] opacity-80 relative z-10 pointer-events-none">
                     <Waveform isPlaying={playerState.isPlaying} color="var(--md-sys-color-primary)" barCount={40} />
                 </div>
                 {/* Custom styling for expressiveness */}
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
                      '--md-slider-handle-color': 'var(--md-sys-color-primary)',
                      '--md-slider-handle-width': '20px',
                      '--md-slider-handle-height': '20px',
                      '--md-slider-active-track-color': 'var(--md-sys-color-primary)',
                      '--md-slider-inactive-track-color': 'var(--md-sys-color-surface-container-highest)',
                      '--md-slider-active-track-height': '12px',
                      '--md-slider-inactive-track-height': '12px',
                      '--md-slider-active-track-shape': '999px',
                      '--md-slider-inactive-track-shape': '999px',
                      '--md-slider-handle-shape': '8px',
                    }}
                 ></md-slider>

                <div className="flex justify-between text-label-medium font-bold font-mono tracking-wider opacity-60 px-1 text-on-surface-variant">
                  <span>{formatTime(displayValue)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className={`flex items-center justify-between px-2 transition-all duration-300 ${isLyricsFullscreen ? 'z-50' : ''}`}>
                <md-icon-button
                    onClick={toggleShuffle} 
                    toggle
                    selected={playerState.shuffle}
                    style={{
                        '--md-icon-button-icon-color': 'var(--md-sys-color-on-surface-variant)',
                        '--md-icon-button-selected-icon-color': 'var(--md-sys-color-primary)',
                        '--md-icon-button-icon-size': '24px'
                    }}
                >
                   <md-icon class="material-symbols-rounded">shuffle</md-icon>
                </md-icon-button>

                <div className="flex items-center gap-6">
                  <md-icon-button onClick={prevTrack} style={{ '--md-icon-size': '36px', '--md-icon-button-icon-color': 'var(--md-sys-color-on-surface)' }}>
                    <md-icon class="material-symbols-rounded">skip_previous</md-icon>
                  </md-icon-button>
                  
                  <div className="relative group isolate">
                      {/* Glow Effect */}
                      <div className="absolute inset-2 bg-primary blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-full" />
                      <md-filled-icon-button
                        onClick={togglePlay}
                        style={{
                            '--md-filled-icon-button-container-width': '80px',
                            '--md-filled-icon-button-container-height': '80px',
                            '--md-filled-icon-button-icon-size': '36px',
                            '--md-sys-color-primary': 'var(--md-sys-color-primary)',
                            '--md-sys-color-on-primary': 'var(--md-sys-color-on-primary)',
                            borderRadius: '28px',
                        }}
                      >
                        <md-icon class="material-symbols-rounded filled">
                            {playerState.isPlaying ? 'pause' : 'play_arrow'}
                        </md-icon>
                      </md-filled-icon-button>
                  </div>
                  
                  <md-icon-button onClick={nextTrack} style={{ '--md-icon-size': '36px', '--md-icon-button-icon-color': 'var(--md-sys-color-on-surface)' }}>
                     <md-icon class="material-symbols-rounded">skip_next</md-icon>
                  </md-icon-button>
                </div>

                <md-icon-button
                    onClick={toggleRepeat}
                    style={{
                        '--md-icon-button-icon-color': playerState.repeat !== 'OFF' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                        '--md-icon-button-icon-size': '24px'
                    }}
                >
                   <div className="relative">
                       <md-icon class="material-symbols-rounded">
                           {playerState.repeat === 'ONE' ? 'repeat_one' : 'repeat'}
                       </md-icon>
                   </div>
                </md-icon-button>
              </div>

              {/* Secondary Controls */}
              <div className="flex items-center justify-between mt-2 px-6 gap-6">
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
                        '--md-sys-color-secondary-container': showLyrics ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container-high)',
                        '--md-sys-color-on-secondary-container': showLyrics ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
                        '--md-icon-size': '24px'
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
                        '--md-sys-color-secondary-container': showQueue ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container-high)',
                        '--md-sys-color-on-secondary-container': showQueue ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
                        '--md-icon-size': '24px'
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
