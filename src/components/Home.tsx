import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Sparkles, Shuffle, Clock } from 'lucide-react';
import { Track } from '../types';

interface HomeProps {
  filteredTracks: Track[];
  playTrack: (id: string, options?: any) => void;
  activeTab: string;
  isLoading?: boolean;
}

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

const SkeletonCard = () => (
  <div className="flex flex-col gap-4">
    <div className="aspect-square rounded-[24px] bg-surface-variant relative overflow-hidden isolate animate-pulse" />
    <div className="space-y-2 px-1">
      <div className="h-5 w-3/4 bg-surface-variant rounded-full animate-pulse" />
      <div className="h-4 w-1/2 bg-surface-variant/50 rounded-full animate-pulse" />
    </div>
  </div>
);

const TrackCard = memo(({ track, onPlay }: { track: Track; onPlay: (id: string) => void }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    whileTap="tap"
    className="group cursor-pointer relative"
    onClick={() => onPlay(track.id)}
  >
     <mc-card
        variant="elevated"
        style={{
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        } as any}
     >
        <div className="aspect-square w-full relative">
            {track.coverArt ? (
                <img
                src={track.coverArt}
                alt={track.title}
                className="w-full h-full object-cover"
                loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-variant">
                    <mc-icon name="music_note" style={{ fontSize: '48px', opacity: 0.5 } as any}></mc-icon>
                </div>
            )}
             {/* Play Overlay */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg">
                    <mc-icon name="play_arrow" style={{ fontSize: '32px' } as any}></mc-icon>
                </div>
            </div>
        </div>

        <div className="p-4 flex flex-col gap-1">
            <h3 className="text-base font-bold text-on-surface truncate leading-tight">
                {track.title}
            </h3>
            <p className="text-sm text-on-surface-variant font-medium truncate">
                {track.artist}
            </p>
        </div>
        <mc-ripple></mc-ripple>
     </mc-card>
  </motion.div>
));

TrackCard.displayName = 'TrackCard';

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
      <div className="max-w-[1400px] mx-auto space-y-12 py-8">

        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-8">
          <div className="space-y-3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest"
            >
              <mc-icon name="auto_awesome" style={{ fontSize: '16px' } as any}></mc-icon>
              <span>Discovery Mix</span>
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-bold text-on-background tracking-tighter leading-[0.9]">
              Fresh <br className="hidden md:block" /> Picks
            </h2>
            <p className="text-xl text-on-surface-variant max-w-lg font-medium leading-relaxed pt-2">
              Curated for you.
            </p>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <mc-button
                variant="tonal"
                onClick={handleShufflePlay}
                disabled={isLoading || filteredTracks.length === 0}
                style={{ height: '56px', borderRadius: '28px', paddingLeft: '24px', paddingRight: '24px', fontSize: '16px' } as any}
            >
                <mc-icon slot="icon" name="shuffle"></mc-icon>
                Shuffle
            </mc-button>

            <mc-button
                variant="filled"
                onClick={() => randomMix[0] && playTrack(randomMix[0].id, { customQueue: randomMix.map(t => t.id) })}
                disabled={isLoading || filteredTracks.length === 0}
                style={{ height: '56px', borderRadius: '28px', paddingLeft: '32px', paddingRight: '32px', fontSize: '18px' } as any}
            >
                <mc-icon slot="icon" name="play_arrow"></mc-icon>
                Play
            </mc-button>
          </div>
        </header>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
            <section className="space-y-6">
                 <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 text-on-surface"
                >
                    <mc-icon name="history" style={{ color: 'var(--md-sys-color-primary)' } as any}></mc-icon>
                    <h3 className="text-2xl font-bold">Recently Played</h3>
                </motion.div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8"
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
                    <mc-icon name="explore" style={{ color: 'var(--md-sys-color-secondary)' } as any}></mc-icon>
                    <h3 className="text-2xl font-bold">Just For You</h3>
            </motion.div>
             <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8"
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
            <div className="w-32 h-32 rounded-[40px] bg-surface-variant flex items-center justify-center mb-6">
                <mc-icon name="library_music" style={{ fontSize: '64px', opacity: 0.5 } as any}></mc-icon>
            </div>
            <p className="text-2xl font-bold text-on-surface">No tracks found</p>
            <p className="text-lg mt-2 opacity-70">Import music to get started.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Home;
