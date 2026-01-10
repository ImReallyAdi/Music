import React, { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Sparkles, Shuffle, Clock, User, Heart, Zap, Coffee, Moon, Flame } from 'lucide-react';
import { Track } from '../types';

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
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 25, mass: 0.8 }
  },
  hover: { scale: 1.03, y: -5, transition: { type: "spring", stiffness: 400, damping: 20 } },
  tap: { scale: 0.96 }
};

// --- HELPERS ---
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

// --- SKELETON LOADER ---
const SkeletonCard = () => (
  <div className="flex flex-col gap-3">
    <div className="aspect-square rounded-[24px] bg-zinc-800/50 relative overflow-hidden isolate">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] z-10" />
    </div>
    <div className="space-y-2 px-1">
      <div className="h-4 w-3/4 bg-zinc-800/50 rounded-full animate-pulse" />
      <div className="h-3 w-1/2 bg-zinc-800/30 rounded-full animate-pulse" />
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
    <div className="aspect-square rounded-[24px] bg-zinc-900 overflow-hidden relative shadow-lg ring-1 ring-white/5 isolate">
      {track.coverArt ? (
        <motion.img 
          src={track.coverArt} 
          alt={track.title}
          className="w-full h-full object-cover transition-transform duration-700 will-change-transform group-hover:scale-110"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
          <Music className="w-12 h-12 text-zinc-700" />
        </div>
      )}
      
      {/* Play Overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
         <div className="w-12 h-12 bg-white/90 text-black rounded-full flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
         </div>
      </div>
    </div>

    {/* Text Content */}
    <div className="px-1 flex flex-col gap-0.5">
      <h3 className="text-[15px] font-bold text-white truncate leading-tight">
        {track.title}
      </h3>
      <p className="text-[13px] text-zinc-400 font-medium truncate group-hover:text-primary transition-colors">
        {track.artist}
      </p>
    </div>
  </motion.div>
));

TrackCard.displayName = 'TrackCard';

// --- MAIN COMPONENT ---
const Home: React.FC<HomeProps> = ({ filteredTracks, playTrack, activeTab, isLoading = false }) => {
  const [activeFilter, setActiveFilter] = useState('All');

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

  const featuredTrack = randomMix[0];

  const handleShufflePlay = () => {
    if (randomMix.length > 0) {
      const randomIndex = Math.floor(Math.random() * randomMix.length);
      playTrack(randomMix[randomIndex].id, { customQueue: randomMix.map(t => t.id) });
    }
  };

  const filters = [
    { label: 'All', icon: null },
    { label: 'Relax', icon: Coffee },
    { label: 'Energize', icon: Zap },
    { label: 'Focus', icon: Moon },
    { label: 'Workout', icon: Flame },
  ];

  return (
    <motion.div 
      key="home-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full overflow-y-auto pt-safe pb-40 px-4 md:px-8 scrollbar-hide bg-cinematic"
    >
      <div className="max-w-7xl mx-auto space-y-10 py-6">

        {/* Top Bar: Greeting & Avatar */}
        <header className="flex items-center justify-between">
            <div className="flex flex-col">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {getGreeting()}, <span className="text-primary">Samantha</span>
                </h1>
                <p className="text-zinc-400 text-sm font-medium mt-1">Ready to play?</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden relative cursor-pointer hover:border-primary transition-colors">
                 <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                     <User size={24} />
                 </div>
                 {/* Placeholder for avatar image */}
                 {/* <img src="..." /> */}
            </div>
        </header>

        {/* Filter Chips */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {filters.map((f) => (
                <button
                    key={f.label}
                    onClick={() => setActiveFilter(f.label)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                        activeFilter === f.label
                        ? 'bg-primary text-black shadow-[0_0_20px_-5px_rgba(163,230,53,0.5)]'
                        : 'bg-zinc-900/50 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                    {f.icon && <f.icon size={14} />}
                    {f.label}
                </button>
            ))}
        </div>

        {/* Featured Card */}
        {featuredTrack && (
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full aspect-[2/1] md:aspect-[3/1] rounded-[40px] overflow-hidden group cursor-pointer shadow-2xl"
                onClick={() => playTrack(featuredTrack.id, { customQueue: randomMix.map(t => t.id) })}
            >
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={featuredTrack.coverArt}
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                        alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end items-start gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-widest text-white mb-2">
                            <Sparkles size={12} className="text-primary" />
                            <span>Featured Playlist</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white max-w-lg leading-tight">
                            Discovery Mix
                        </h2>
                        <p className="text-zinc-300 font-medium text-lg line-clamp-2 max-w-md">
                            A curated selection of {randomMix.length} tracks based on your listening habits.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                        <button className="h-14 w-14 rounded-full bg-primary text-black flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_30px_-5px_rgba(163,230,53,0.6)]">
                            <Play size={24} fill="currentColor" className="ml-1" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleShufflePlay(); }}
                            className="h-14 px-6 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors font-semibold text-white flex items-center gap-2"
                        >
                            <Shuffle size={18} />
                            Shuffle
                        </button>
                    </div>
                </div>
            </motion.section>
        )}

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
            <section className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Recently Played</h3>
                    <button className="text-sm font-semibold text-primary hover:text-white transition-colors">See All</button>
                 </div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10"
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

        {/* Daily Mixes (Random for now) */}
        <section className="space-y-6">
            <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-white">Made For You</h3>
            </div>
             <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10"
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-zinc-500"
          >
            <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mb-6 ring-1 ring-white/10">
              <Music className="w-10 h-10 opacity-30" />
            </div>
            <p className="text-xl font-bold text-white">No tracks found</p>
            <p className="text-base mt-2 text-zinc-400">Import music to get started.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Home;
