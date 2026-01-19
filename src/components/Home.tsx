import React, { memo, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from '../types';

// Import Material Web Components
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/icon/icon.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/ripple/ripple.js';
import '@material/web/iconbutton/filled-icon-button.js';

// --- TYPE DEFINITIONS ---
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-filled-button': any;
      'md-filled-tonal-button': any;
      'md-icon': any;
      'md-chip-set': any;
      'md-filter-chip': any;
      'md-ripple': any;
      'md-filled-icon-button': any;
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

type FilterType = 'All' | 'Favorites' | 'Recent' | 'Most Played';

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
    transition: { type: "spring", stiffness: 350, damping: 30 }
  },
  hover: { y: -8, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 20 } },
  tap: { scale: 0.98 }
};

// --- SKELETON LOADER ---
const SkeletonCard = () => (
  <div className="flex flex-col gap-3">
    <div className="aspect-square rounded-[28px] bg-surface-container-high relative overflow-hidden isolate">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-on-surface/5 to-transparent animate-[shimmer_1.5s_infinite] z-10" />
    </div>
    <div className="space-y-2 px-1">
      <div className="h-5 w-3/4 bg-surface-container-high rounded-full animate-pulse" />
      <div className="h-4 w-1/2 bg-surface-container-high/50 rounded-full animate-pulse" />
    </div>
  </div>
);

// --- HELPER FUNCTIONS ---
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

// --- COMPONENTS ---

// Expressive Track Card
const TrackCard = memo(({ track, onPlay }: { track: Track; onPlay: (id: string) => void }) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    whileTap="tap"
    className="group cursor-pointer flex flex-col gap-3"
    onClick={() => onPlay(track.id)}
  >
    <div className="relative aspect-square w-full overflow-hidden rounded-[28px] bg-surface-container-high shadow-elevation-1 group-hover:shadow-elevation-3 transition-shadow duration-300 isolate">
        {/* Background/Artwork */}
        {track.coverArt ? (
            <img
                src={track.coverArt}
                alt={track.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
            />
        ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container-highest text-on-surface-variant/40">
                <md-icon class="material-symbols-rounded" style={{ fontSize: '64px' }}>music_note</md-icon>
            </div>
        )}

        {/* Gradient Overlay for Text Readability (optional, mostly for bottom text if we had any inside) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play Button FAB */}
        <div className="absolute bottom-3 right-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <md-filled-icon-button
                 style={{ '--md-filled-icon-button-container-width': '48px', '--md-filled-icon-button-container-height': '48px', '--md-filled-icon-button-icon-size': '24px' }}
            >
                <md-icon class="material-symbols-rounded">play_arrow</md-icon>
            </md-filled-icon-button>
        </div>

        <md-ripple></md-ripple>
    </div>

    {/* Metadata */}
    <div className="px-1 space-y-0.5">
        <h3 className="text-title-medium font-bold text-on-surface truncate group-hover:text-primary transition-colors">
            {track.title}
        </h3>
        <p className="text-body-medium text-on-surface-variant truncate">
            {track.artist}
        </p>
    </div>
  </motion.div>
));

TrackCard.displayName = 'TrackCard';

// Featured "Hero" Card
const HeroCard = ({ title, subtitle, icon, onClick, buttonLabel = "Play" }: any) => (
    <div className="relative w-full overflow-hidden rounded-[40px] bg-surface-container-low p-6 md:p-10 shadow-elevation-1 min-h-[280px] flex flex-col justify-between group">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-container/30 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-tertiary-container/30 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high/50 backdrop-blur-md w-fit border border-outline-variant/20">
                <md-icon class="material-symbols-rounded filled text-primary">{icon}</md-icon>
                <span className="text-label-large font-bold text-on-surface-variant uppercase tracking-wider">{subtitle}</span>
            </div>
            <h2 className="text-display-small md:text-display-medium font-black text-on-surface mt-2 max-w-lg leading-tight">
                {title}
            </h2>
        </div>

        <div className="relative z-10 mt-8">
            <md-filled-button
                onClick={onClick}
                style={{ height: '56px', paddingLeft: '24px', paddingRight: '24px', fontSize: '16px' }}
            >
                <md-icon slot="icon" class="material-symbols-rounded">play_arrow</md-icon>
                {buttonLabel}
            </md-filled-button>
        </div>

        {/* Interactive Ripple */}
        <md-ripple></md-ripple>
    </div>
);

// --- MAIN HOME COMPONENT ---
const Home: React.FC<HomeProps> = ({ filteredTracks, playTrack, activeTab, isLoading = false, onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<FilterType>('All');

  // Derived Data
  const greeting = getGreeting();

  const displayTracks = useMemo(() => {
    let tracks = [...filteredTracks];

    switch (filter) {
        case 'Favorites':
            tracks = tracks.filter(t => t.isFavorite);
            break;
        case 'Recent':
            tracks = tracks.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).slice(0, 50);
            break;
        case 'Most Played':
            tracks = tracks.sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 50);
            break;
        default: // All or Random Mix logic for 'All' could be applied, but keeping it simple for now
            // If 'All', we might want to just show the default order or a mix
             break;
    }
    return tracks;
  }, [filteredTracks, filter]);

  // Featured Mix (Random for now)
  const discoveryMix = useMemo(() => {
    if (!filteredTracks.length) return [];
    return [...filteredTracks].sort(() => 0.5 - Math.random()).slice(0, 15);
  }, [filteredTracks]);

  const handleImportClick = () => fileInputRef.current?.click();

  const playDiscovery = () => {
    if (discoveryMix.length > 0) {
        playTrack(discoveryMix[0].id, { customQueue: discoveryMix.map(t => t.id) });
    }
  };

  return (
    <motion.div 
      key="home-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full overflow-y-auto pt-safe pb-40 px-4 md:px-6 scrollbar-hide"
    >
      <div className="max-w-[1600px] mx-auto space-y-10 py-6">

        {/* Top Bar: Greeting & Avatar */}
        <header className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-title-large font-bold shadow-sm">
                    A
                </div>
                <div className="flex flex-col">
                    <span className="text-body-medium text-on-surface-variant">Welcome back</span>
                    <h1 className="text-headline-small font-bold text-on-surface">{greeting}</h1>
                </div>
            </div>
            {onFileUpload && (
                <md-filled-tonal-button onClick={handleImportClick}>
                    <md-icon slot="icon" class="material-symbols-rounded">add</md-icon>
                    Add Music
                </md-filled-tonal-button>
            )}
        </header>

        {/* Featured Section */}
        {filteredTracks.length > 0 && (
            <section>
                <HeroCard
                    title="Your Weekly Discovery Mix"
                    subtitle="Made for You"
                    icon="auto_awesome"
                    onClick={playDiscovery}
                    buttonLabel="Listen Now"
                />
            </section>
        )}

        {/* Filter Chips */}
        <div className="sticky top-0 z-20 py-2 bg-background/95 backdrop-blur-sm -mx-4 px-4 md:mx-0 md:px-0">
            <md-chip-set>
                {(['All', 'Favorites', 'Recent', 'Most Played'] as FilterType[]).map((f) => (
                    <md-filter-chip
                        key={f}
                        label={f}
                        selected={filter === f}
                        onClick={() => setFilter(f)}
                    ></md-filter-chip>
                ))}
            </md-chip-set>
        </div>

        {/* Tracks Grid */}
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-headline-small font-bold text-on-surface">{filter} Tracks</h2>
                <span className="text-label-large text-on-surface-variant">
                    {isLoading ? 'Loading...' : `${displayTracks.length} tracks`}
                </span>
            </div>

            {isLoading ? (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <SkeletonCard key={`skel-${i}`} />
                    ))}
                 </div>
            ) : displayTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant/50">
                        <md-icon class="material-symbols-rounded" style={{ fontSize: '48px' }}>music_off</md-icon>
                    </div>
                    <div>
                        <p className="text-title-large font-bold text-on-surface">No tracks found</p>
                        <p className="text-body-medium text-on-surface-variant mt-1">Try changing the filter or add some music.</p>
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {displayTracks.slice(0, 100).map((track) => ( // Limit rendering for performance
                            <TrackCard
                                key={track.id}
                                track={track}
                                onPlay={(id) => playTrack(id, { customQueue: displayTracks.map(t => t.id) })}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </section>
      </div>

      {/* Hidden File Input */}
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
