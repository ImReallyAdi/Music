import React, { memo, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Ensure you have a types file or define Track locally if needed
import { Track } from '../types'; 

// Import Material Web Components
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/icon/icon.js';
import '@material/web/elevation/elevation.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/ripple/ripple.js';
import '@material/web/labs/card/elevated-card.js';

// --- TYPE DEFINITIONS ---
// Extending global JSX for custom elements (Material Web)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-filled-button': any;
      'md-filled-tonal-button': any;
      'md-elevation': any;
      'md-icon': any;
      'md-assist-chip': any;
      'md-ripple': any;
      'md-elevated-card': any;
    }
  }
}

interface HomeProps {
  filteredTracks: Track[];
  playTrack: (id: string, options?: any) => void;
  activeTab: string;
  isLoading?: boolean;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 30, mass: 1 }
  },
  hover: { y: -12, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 20 } },
  tap: { scale: 0.96 }
};

// --- SKELETON LOADER ---
const SkeletonCard = () => (
  <div className="flex flex-col gap-4">
    <div className="aspect-square rounded-[32px] bg-surface-container-high relative overflow-hidden isolate">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] z-10" />
    </div>
    <div className="space-y-2 px-1">
      <div className="h-5 w-3/4 bg-surface-container-high rounded-full animate-pulse" />
      <div className="h-4 w-1/2 bg-surface-container-high/50 rounded-full animate-pulse" />
    </div>
  </div>
);

// --- EXPRESSIVE TRACK CARD ---
const TrackCard = memo(({ track, onPlay }: { track: Track; onPlay: (id: string) => void }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    whileTap="tap"
    className="group cursor-pointer flex flex-col gap-3 relative"
    onClick={() => onPlay(track.id)}
  >
    {/* Image Container */}
    <md-elevated-card
        clickable
        class="aspect-square w-full relative overflow-hidden p-0"
        style={{ 
          '--md-elevated-card-container-shape': '32px', 
          '--md-elevated-card-container-color': 'var(--md-sys-color-surface-container-highest)' 
        }}
    >
      <div className="absolute inset-0 bg-surface-container-highest z-0" />

      {/* Artwork */}
      {track.coverArt ? (
        <motion.img 
          src={track.coverArt} 
          alt={track.title}
          className="w-full h-full object-cover z-10 relative"
          variants={{
             hover: { scale: 1.1 }
          }}
          transition={{ duration: 0.5 }}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-container-highest z-10 relative">
          <md-icon class="material-symbols-rounded text-on-surface-variant/50" style={{ fontSize: '48px' }}>music_note</md-icon>
        </div>
      )}
      
      {/* Play Overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center backdrop-blur-[2px]">
        <motion.div
          variants={{
            hover: { scale: 1, opacity: 1 },
            hidden: { scale: 0.8, opacity: 0 }
          }}
          className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-elevation-3"
        >
          <md-icon class="material-symbols-rounded" style={{ fontSize: '36px' }}>play_arrow</md-icon>
        </motion.div>
      </div>

      {/* Ripple Effect */}
      <md-ripple></md-ripple>
    </md-elevated-card>

    {/* Text Content */}
    <div className="px-1 flex flex-col gap-0.5">
      <h3 className="text-title-medium font-bold text-on-surface truncate leading-tight tracking-tight group-hover:text-primary transition-colors">
        {track.title}
      </h3>
      <p className="text-body-medium text-on-surface-variant font-medium truncate opacity-80">
        {track.artist}
      </p>
    </div>
  </motion.div>
));

TrackCard.displayName = 'TrackCard';

// --- MAIN COMPONENT ---
const Home: React.FC<HomeProps> = ({ filteredTracks, playTrack, activeTab, isLoading = false, onFileUpload }) => {
  // Use a single ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const randomMix = useMemo(() => {
    if (isLoading || !filteredTracks.length) return [];
    return [...filteredTracks]
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);
  }, [filteredTracks, isLoading]);

  const recentlyPlayed = useMemo(() => {
    if (isLoading || !filteredTracks.length) return [];
    return [...filteredTracks]
      .filter(t => t.lastPlayed)
      .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
      .slice(0, 10);
  }, [filteredTracks, isLoading]);

  const handleShufflePlay = () => {
    if (randomMix.length > 0) {
      const randomIndex = Math.floor(Math.random() * randomMix.length);
      playTrack(randomMix[randomIndex].id, { customQueue: randomMix.map(t => t.id) });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div 
      key="home-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full overflow-y-auto pt-safe pb-40 px-4 md:px-8 scrollbar-hide"
    >
      <div className="max-w-[1400px] mx-auto space-y-16 py-8">

        {/* Expressive Header */}
        <header className="relative w-full overflow-hidden rounded-[56px] bg-surface-container-low p-8 md:p-12 min-h-[400px] flex flex-col justify-end shadow-elevation-1 isolate">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-surface-container-low to-secondary/10 z-0" />

          {/* Blob-like Album Art Collage */}
           <div className="absolute top-0 right-0 w-full md:w-[60%] h-full opacity-60 z-0 pointer-events-none mix-blend-multiply dark:mix-blend-screen">
              {randomMix.slice(0, 3).map((track, i) => (
                  <motion.div
                    key={track.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1, duration: 1 }}
                    className="absolute shadow-xl"
                    style={{
                        top: i === 0 ? '-10%' : i === 1 ? '10%' : '40%',
                        right: i === 0 ? '10%' : i === 1 ? '-10%' : '15%',
                        width: 'clamp(200px, 40vw, 300px)',
                        height: 'clamp(200px, 40vw, 300px)',
                        borderRadius: i === 0 ? '40% 60% 70% 30% / 40% 50% 60% 50%' : i === 1 ? '60% 40% 30% 70% / 60% 30% 70% 40%' : '50%',
                        overflow: 'hidden',
                        zIndex: 3 - i,
                    }}
                  >
                      <img src={track.coverArt || ''} className="w-full h-full object-cover" alt="" />
                  </motion.div>
              ))}
           </div>

          <div className="relative z-10 flex flex-col gap-6 max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
               <h1 className="text-display-large font-black text-on-surface tracking-tighter leading-none">
                 Your <span className="text-primary italic">Mix</span>
               </h1>
               <p className="text-headline-small text-on-surface-variant mt-4 font-medium max-w-md">
                 Fresh tunes, curated just for you.
               </p>
            </motion.div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                className="flex flex-wrap items-center gap-6 mt-4"
            >
                <button
                    onClick={() => randomMix[0] && playTrack(randomMix[0].id, { customQueue: randomMix.map(t => t.id) })}
                    className="w-24 h-24 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-elevation-4 hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Play Your Mix"
                >
                    <md-icon class="material-symbols-rounded" style={{ fontSize: '48px' }}>play_arrow</md-icon>
                </button>

                <div className="flex flex-col gap-2">
                     <span className="text-label-large text-on-surface uppercase tracking-widest font-bold opacity-60">Start Listening</span>
                     <div className="flex items-center gap-4">
                        <div className="flex -space-x-4">
                            {randomMix.slice(0, 4).map((t, i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-surface-container-low overflow-hidden bg-surface-container-high">
                                    {t.coverArt && <img src={t.coverArt} className="w-full h-full object-cover" alt="" />}
                                </div>
                            ))}
                        </div>
                        {onFileUpload && (
                            <md-filled-tonal-button onClick={handleImportClick}>
                                <md-icon slot="icon" class="material-symbols-rounded">add</md-icon>
                                Add Music
                            </md-filled-tonal-button>
                        )}
                     </div>
                </div>
            </motion.div>
          </div>
        </header>

        {/* Recently Played Section */}
        {recentlyPlayed.length > 0 && (
            <section className="space-y-8">
                 <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 text-on-surface px-2"
                >
                  <div className="p-3 rounded-full bg-surface-container-high text-primary">
                      <md-icon class="material-symbols-rounded">schedule</md-icon>
                  </div>
                  <h3 className="text-headline-medium font-bold">Recently Played</h3>
                </motion.div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12"
                >
                      <AnimatePresence mode="popLayout">
                      {recentlyPlayed.map((track) => (
                        <TrackCard
                          key={`recent-${track.id}`}
                          track={track}
                          onPlay={(id) => playTrack(id, { customQueue: recentlyPlayed.map(t => t.id) })}
                        />
                      ))}
                    </AnimatePresence>
                </motion.div>
            </section>
        )}

        {/* Discovery Grid */}
        <section className="space-y-8">
            <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 text-on-surface px-2"
                >
                  <div className="p-3 rounded-full bg-surface-container-high text-tertiary">
                       <md-icon class="material-symbols-rounded">auto_awesome</md-icon>
                  </div>
                  <h3 className="text-headline-medium font-bold">Jump Back In</h3>
            </motion.div>
             <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12"
            >
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonCard key={`skel-${i}`} />
                ))
              ) : (
                <AnimatePresence mode="popLayout">
                  {randomMix.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      onPlay={(id) => playTrack(id, { customQueue: randomMix.map(t => t.id) })}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
        </section>

        {/* Empty State */}
        {!isLoading && filteredTracks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-on-surface-variant"
          >
            <div className="w-32 h-32 rounded-[32px] bg-surface-container-high flex items-center justify-center mb-6">
              <md-icon class="material-symbols-rounded" style={{ fontSize: '64px', opacity: 0.3 }}>music_off</md-icon>
            </div>
            <p className="text-headline-small font-bold text-on-surface">No tracks found</p>
            <p className="text-body-large mt-2">Import music to get started.</p>
            {onFileUpload && (
              /* Removed wrapping <label> and duplicate input */
              <div className="mt-6">
                 <md-filled-button onClick={handleImportClick}>
                    <md-icon slot="icon" class="material-symbols-rounded">upload_file</md-icon>
                    Import Tracks
                 </md-filled-button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Singleton Hidden File Input */}
      {onFileUpload && (
        <input 
          ref={fileInputRef} 
          type="file" 
          multiple 
          accept="audio/*,.zip" 
          onChange={onFileUpload} 
          className="hidden" 
        />
      )}
    </motion.div>
  );
};

export default Home;
