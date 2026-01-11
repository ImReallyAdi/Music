import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from '../types';
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/icon/icon.js';
import '@material/web/elevation/elevation.js';

// Material Web Types
declare global {
  namespace JSX {
    interface IntrinsicElements {
        'md-filled-button': any;
        'md-filled-tonal-button': any;
        'md-elevation': any;
        'md-icon': any;
    }
  }
}

interface HomeProps {
  filteredTracks: Track[];
  playTrack: (id: string, options?: any) => void;
  activeTab: string;
  isLoading?: boolean;
}

// --- ANIMATION VARIANTS ---
const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const cardVariants: any = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 25, mass: 0.8 }
  },
  hover: { scale: 1.03, y: -5, transition: { type: "spring", stiffness: 400, damping: 20 } },
  tap: { scale: 0.96 }
};

// --- SKELETON LOADER ---
const SkeletonCard = () => (
  <div className="flex flex-col gap-4">
    <div className="aspect-square rounded-[24px] bg-surface-container-high relative overflow-hidden isolate">
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
    className="group cursor-pointer flex flex-col gap-4 relative"
    onClick={() => onPlay(track.id)}
  >
    {/* Image Container */}
    <div className="aspect-square rounded-[24px] bg-surface-container-highest overflow-hidden relative isolate">
      <md-elevation></md-elevation>
      {track.coverArt ? (
        <motion.img 
          src={track.coverArt} 
          alt={track.title}
          className="w-full h-full object-cover transition-transform duration-500 will-change-transform"
          variants={{
             hover: { scale: 1.05 }
          }}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-container-highest">
          <md-icon class="material-symbols-rounded text-on-surface-variant/50" style={{ fontSize: '48px' }}>music_note</md-icon>
        </div>
      )}
      
      {/* Play Overlay - Only visible on hover/focus */}
      <motion.div 
        initial={{ opacity: 0 }}
        variants={{
          hover: { opacity: 1 },
          tap: { opacity: 1 }
        }}
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center transition-opacity"
      >
        <motion.div
          variants={{
            hover: { scale: 1, opacity: 1 },
            hidden: { scale: 0.8, opacity: 0 }
          }}
          className="w-14 h-14 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-xl backdrop-blur-md"
        >
          <md-icon class="material-symbols-rounded" style={{ fontSize: '32px' }}>play_arrow</md-icon>
        </motion.div>
      </motion.div>
    </div>

    {/* Text Content */}
    <div className="px-1 flex flex-col gap-0.5">
      <h3 className="text-title-medium font-bold text-on-surface truncate leading-tight tracking-tight">
        {track.title}
      </h3>
      <p className="text-body-medium text-on-surface-variant font-medium truncate group-hover:text-primary transition-colors">
        {track.artist}
      </p>
    </div>
  </motion.div>
));

TrackCard.displayName = 'TrackCard';

// --- MAIN COMPONENT ---
const Home: React.FC<HomeProps> = ({ filteredTracks, playTrack, activeTab, isLoading = false }) => {
  
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

  return (
    <motion.div 
      key="home-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full overflow-y-auto pt-safe pb-40 px-6 scrollbar-hide"
    >
      <div className="max-w-[1400px] mx-auto space-y-16 py-8">

        {/* Expressive Header */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-large font-medium"
            >
              <md-icon class="material-symbols-rounded" style={{ fontSize: '18px' }}>auto_awesome</md-icon>
              <span>Discovery Mix</span>
            </motion.div>
            <h2 className="text-display-large font-bold text-on-surface">
              Fresh <br className="hidden md:block" /> Picks
            </h2>
            <p className="text-body-large text-on-surface-variant max-w-lg leading-relaxed pt-2">
              A curated selection from your library, served fresh every time you visit.
            </p>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <md-filled-tonal-button onClick={handleShufflePlay}>
                <md-icon slot="icon" class="material-symbols-rounded">shuffle</md-icon>
                Shuffle
            </md-filled-tonal-button>

            <md-filled-button onClick={() => randomMix[0] && playTrack(randomMix[0].id, { customQueue: randomMix.map(t => t.id) })}>
                <md-icon slot="icon" class="material-symbols-rounded">play_arrow</md-icon>
                Play
            </md-filled-button>
          </div>
        </header>

        {/* Recently Played Section */}
        {recentlyPlayed.length > 0 && (
            <section className="space-y-6">
                 <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 text-on-surface"
                >
                    <md-icon class="material-symbols-rounded text-primary">schedule</md-icon>
                    <h3 className="text-headline-medium">Recently Played</h3>
                </motion.div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10"
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
        <section className="space-y-6">
            <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 text-on-surface"
                >
                    <md-icon class="material-symbols-rounded text-tertiary">auto_awesome</md-icon>
                    <h3 className="text-headline-medium">Just For You</h3>
            </motion.div>
             <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10"
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
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Home;
