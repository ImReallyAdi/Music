import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play } from 'lucide-react';
import { Track } from '../types';

interface HomeProps {
  filteredTracks: Track[];
  playTrack: (id: string) => void;
  activeTab: string;
  isLoading?: boolean; // Added loading state
}

// --- M3 EXPRESSIVE SKELETON ---
const SkeletonCard = () => (
  <div className="flex flex-col gap-4 animate-pulse">
    {/* Album Art Skeleton */}
    <div className="aspect-square rounded-[28px] bg-surface-container-highest/50 flex items-center justify-center relative overflow-hidden">
      {/* "imreallyadi" Watermark as requested */}
      <span className="text-surface-on-variant/20 font-bold text-lg tracking-widest -rotate-12 select-none">
        imreallyadi
      </span>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-surface-on/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
    
    {/* Text Lines */}
    <div className="px-2 space-y-2.5">
      <div className="h-5 w-3/4 bg-surface-container-highest/50 rounded-full" />
      <div className="h-4 w-1/2 bg-surface-container-highest/30 rounded-full" />
    </div>
  </div>
);

// --- M3 EXPRESSIVE TRACK CARD ---
const TrackCard = memo(({ track, index, onPlay }: { track: Track; index: number; onPlay: (id: string) => void }) => (
  <motion.div
    layout
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ 
      delay: index * 0.04, 
      type: "spring", 
      stiffness: 300, 
      damping: 25 
    }}
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.96 }}
    onClick={() => onPlay(track.id)}
    className="group cursor-pointer flex flex-col gap-3"
  >
    <div className="aspect-square rounded-[28px] bg-surface-container-high overflow-hidden relative shadow-elevation-1 group-hover:shadow-elevation-3 transition-all duration-500">
      {track.coverArt ? (
        <img 
          src={track.coverArt} 
          alt={track.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          loading="lazy" 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-container-highest">
          <Music className="w-12 h-12 text-surface-on-variant/50" />
        </div>
      )}
      
      {/* Expressive Circular Reveal Overlay */}
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          className="bg-primary-container text-primary-on-container rounded-[20px] p-4 shadow-xl"
        >
          <Play className="w-7 h-7 fill-current ml-0.5" />
        </motion.div>
      </div>
    </div>

    <div className="px-1">
      <h3 className="text-title-medium font-bold text-surface-on truncate leading-tight">{track.title}</h3>
      <p className="text-body-medium text-surface-on-variant truncate mt-0.5">{track.artist}</p>
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
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }} // Material Emphasized Easing
      className="space-y-8 pt-6 pb-24 px-2"
    >
      {/* Expressive Header */}
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-10">
        <div>
          <h2 className="text-display-small text-surface-on font-medium tracking-tight">Recent Heat</h2>
          <p className="text-title-small text-surface-on-variant mt-1">Fresh from your library</p>
        </div>
        
        <button
          onClick={() => filteredTracks[0] && playTrack(filteredTracks[0].id)}
          disabled={isLoading || filteredTracks.length === 0}
          className="h-12 px-8 rounded-full bg-primary text-on-primary text-label-large font-medium shadow-sm hover:shadow-md hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
        >
          Play All
        </button>
      </header>

      {/* Grid Content */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
        {isLoading ? (
          // Render 10 Skeletons
          Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={`skel-${i}`} />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTracks.slice(0, 15).map((track, i) => (
              <TrackCard 
                key={track.id} 
                track={track} 
                index={i} 
                onPlay={playTrack} 
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {!isLoading && filteredTracks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-surface-variant opacity-60">
          <Music className="w-20 h-20 mb-4 stroke-[1.5]" />
          <p className="text-title-medium">No tracks found</p>
        </div>
      )}
    </motion.div>
  );
};

export default Home;
