import React, { memo, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from '../types'; 
import { Play, Shuffle, Upload, Clock, Sparkles, Music2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { cn } from '../utils/cn';

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
    <div className="aspect-square bg-muted relative overflow-hidden isolate">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] z-10" />
    </div>
    <div className="space-y-2 px-1">
      <div className="h-5 w-3/4 bg-muted animate-pulse" />
      <div className="h-4 w-1/2 bg-muted/50 animate-pulse" />
    </div>
  </div>
);

// --- BOLD TRACK CARD ---
const TrackCard = memo(({ track, onPlay }: { track: Track; onPlay: (id: string) => void }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    whileTap="tap"
    className="group cursor-pointer flex flex-col gap-4 relative"
    onClick={() => onPlay(track.id)}
  >
    {/* Image Container */}
    <div className="aspect-square w-full relative overflow-hidden bg-muted border border-transparent group-hover:border-accent/50 transition-colors duration-300">
      {/* Artwork */}
      {track.coverArt ? (
        <motion.img 
          src={track.coverArt} 
          alt={track.title}
          className="w-full h-full object-cover z-10 relative filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
          variants={{
             hover: { scale: 1.05 }
          }}
          transition={{ duration: 0.5 }}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted z-10 relative">
          <Music2 className="text-muted-foreground opacity-50 w-12 h-12" />
        </div>
      )}
      
      {/* Play Overlay - Minimal */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
        <div className="w-16 h-16 bg-accent text-accent-foreground flex items-center justify-center">
          <Play className="w-8 h-8 fill-current" />
        </div>
      </div>
    </div>

    {/* Text Content */}
    <div className="flex flex-col gap-1">
      <h3 className="text-lg font-bold font-display leading-tight truncate group-hover:text-accent transition-colors">
        {track.title}
      </h3>
      <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider truncate">
        {track.artist}
      </p>
    </div>
  </motion.div>
));

TrackCard.displayName = 'TrackCard';

// --- MAIN COMPONENT ---
const Home: React.FC<HomeProps> = ({ filteredTracks, playTrack, activeTab, isLoading = false, onFileUpload }) => {
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
      className="w-full min-h-full pt-12 pb-40"
    >
      <div className="space-y-32">

        {/* Hero Section */}
        <header className="flex flex-col gap-12 relative">
          <div className="space-y-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <span className="text-accent font-mono uppercase tracking-widest text-sm font-bold">
                  // Discovery Mix
              </span>
            </motion.div>

            <div>
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-black font-display tracking-tighter leading-[0.9] text-foreground uppercase">
                  Fresh <br/>
                  <span className="text-muted-foreground">Picks</span>
                </h1>
                <div className="h-2 w-32 bg-accent mt-8" />
                <p className="text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed pt-8 font-serif italic">
                  "A curated selection from your library, served fresh every time you visit."
                </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 relative z-10 items-center">
            <Button
                variant="primary"
                size="lg"
                onClick={() => randomMix[0] && playTrack(randomMix[0].id, { customQueue: randomMix.map(t => t.id) })}
            >
                <Play className="mr-2 h-5 w-5" />
                Play All
            </Button>

            <Button
                variant="ghost"
                size="lg"
                onClick={handleShufflePlay}
            >
                <Shuffle className="mr-2 h-5 w-5" />
                Shuffle
            </Button>

            {onFileUpload && (
              <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleImportClick}
              >
                <Upload className="mr-2 h-5 w-5" />
                Add Music
              </Button>
            )}
          </div>
        </header>

        {/* Recently Played Section */}
        {recentlyPlayed.length > 0 && (
            <section className="space-y-12">
                 <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between border-b border-border pb-6"
                >
                  <h3 className="text-4xl md:text-5xl font-bold font-display tracking-tight uppercase">Recently Played</h3>
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </motion.div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-16"
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
        <section className="space-y-12">
            <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between border-b border-border pb-6"
                >
                   <h3 className="text-4xl md:text-5xl font-bold font-display tracking-tight uppercase">Jump Back In</h3>
                   <Sparkles className="w-8 h-8 text-accent" />
            </motion.div>
             <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-16"
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
            className="flex flex-col items-center justify-center py-32 text-muted-foreground border border-dashed border-border p-12"
          >
            <div className="w-24 h-24 bg-muted flex items-center justify-center mb-6">
              <Music2 className="w-12 h-12 opacity-50" />
            </div>
            <p className="text-2xl font-bold text-foreground font-display uppercase tracking-tight">No tracks found</p>
            <p className="text-lg mt-2 font-serif italic">"Silence is golden, but music is better."</p>
            {onFileUpload && (
              <div className="mt-8">
                 <Button onClick={handleImportClick} variant="primary">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Tracks
                 </Button>
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
