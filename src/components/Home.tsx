import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Sparkles } from 'lucide-react';
import { Track } from '../types';

interface HomeProps {
  filteredTracks: Track[];
  playTrack: (id: string) => void;
  activeTab: string;
  isLoading?: boolean;
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
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 }
  },
  exit: { opacity: 0, scale: 0.9 }
};

// --- SKELETON LOADER ---
const SkeletonCard = () => (
  <div className="flex flex-col gap-4">
    <div className="aspect-square rounded-[24px] bg-surface-container-highest/40 relative overflow-hidden isolate">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
        <span className="text-on-surface-variant font-black text-xl tracking-[0.2em] -rotate-12 select-none blur-[1px]">
          imreallyadi
        </span>
      </div>
      {/* Shimmer */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface-on/10 to-transparent animate-[shimmer_1.5s_infinite] z-10" />
    </div>
    <div className="space-y-2 px-1">
      <div className="h-5 w-3/4 bg-surface-container-highest/60 rounded-full animate-pulse" />
      <div className="h-4 w-1/2 bg-surface-container-highest/40 rounded-full animate-pulse" />
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
    <div className="aspect-square rounded-[24px] bg-surface-container-high overflow-hidden relative shadow-sm transition-shadow duration-500 group-hover:shadow-lg">
      {track.coverArt ? (
        <motion.img 
          src={track.coverArt} 
          alt={track.title}
          className="w-full h-full object-cover"
          variants={{
            hover: { scale: 1.08 },
            tap: { scale: 1 }
          }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
          <Music className="w-16 h-16 text-primary/40" />
        </div>
      )}
      
      {/* Play Overlay (M3 Expressive FAB style) */}
      <motion.div 
        initial={{ opacity: 0 }}
        variants={{
          hover: { opacity: 1 },
          tap: { opacity: 1 }
        }}
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center"
      >
        <motion.div
          variants={{
            hover: { scale: 1, y: 0 },
            hidden: { scale: 0.5, y: 10 }
          }}
          className="w-14 h-14 bg-primary-container text-on-primary-container rounded-[18px] flex items-center justify-center shadow-elevation-3"
        >
          <Play className="w-6 h-6 fill-current ml-1" />
        </motion.div>
      </motion.div>
    </div>

    {/* Text Content */}
    <div className="px-1 flex flex-col">
      <h3 className="text-title-medium font-semibold text-on-surface truncate tracking-tight">
        {track.title}
      </h3>
      <p className="text-body-medium text-on-surface-variant truncate opacity-80 group-hover:opacity-100 transition-opacity">
        {track.artist}
      </p>
    </div>
  </motion.div>
));

TrackCard.displayName = 'TrackCard';

// --- MAIN COMPONENT ---
const Home: React.FC<HomeProps> = ({ filteredTracks, playTrack, activeTab, isLoading = false }) => {
  if (activeTab !== 'home') return null;

  return (
    <motion.div 
      key="home-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full overflow-y-auto pt-8 pb-32 px-6 scrollbar-hide"
    >
      {/* Expressive Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div className="space-y-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container text-label-medium font-medium mb-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Recommended</span>
            </motion.div>
            <h2 className="text-headline-large font-bold text-on-surface tracking-tight">
              Recent Heat
            </h2>
            <p className="text-body-large text-on-surface-variant max-w-md">
              Fresh tracks added to your library.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => filteredTracks[0] && playTrack(filteredTracks[0].id)}
            disabled={isLoading || filteredTracks.length === 0}
            className="h-14 px-8 rounded-full bg-primary text-on-primary text-title-medium font-medium shadow-elevation-2 hover:shadow-elevation-4 active:shadow-elevation-1 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-current" />
            Play All
          </motion.button>
        </header>

        {/* Content Grid */}
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
              {filteredTracks.slice(0, 15).map((track) => (
                <TrackCard 
                  key={track.id} 
                  track={track} 
                  onPlay={playTrack} 
                />
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {!isLoading && filteredTracks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60"
          >
            <div className="w-24 h-24 rounded-[32px] bg-surface-container-high flex items-center justify-center mb-4">
              <Music className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-title-large font-medium">No tracks found</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Home;
