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
import '@material/web/fab/fab.js';

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
  hover: { y: -8, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 20 } },
  tap: { scale: 0.98 }
};

// --- SKELETON LOADER ---
const SkeletonCard = () => (
  <div className="flex flex-col gap-4">
    <div className="aspect-square rounded-[28px] bg-surface-container-high relative overflow-hidden isolate">
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
    {/* Image Container with Organic Feel */}
    <div className="relative aspect-square w-full">
        <md-elevated-card
            clickable
            class="w-full h-full p-0 overflow-hidden"
            style={{
            '--md-elevated-card-container-shape': '28px',
            '--md-elevated-card-container-color': 'var(--md-sys-color-surface-container-high)'
            }}
        >
        <div className="absolute inset-0 bg-surface-container-highest z-0" />

        {/* Artwork */}
        {track.coverArt ? (
            <motion.img
            src={track.coverArt}
            alt={track.title}
            className="w-full h-full object-cover z-10 relative"
            loading="lazy"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container-highest z-10 relative">
            <md-icon class="material-symbols-rounded text-on-surface-variant/50" style={{ fontSize: '48px' }}>music_note</md-icon>
            </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
        <md-ripple></md-ripple>
        </md-elevated-card>

        {/* Floating Play Button on Card (Bottom Right) */}
        <div className="absolute bottom-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
             <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-2xl shadow-elevation-3 flex items-center justify-center pointer-events-none">
                 <md-icon class="material-symbols-rounded filled">play_arrow</md-icon>
             </div>
        </div>
    </div>

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

  const handlePlayAll = () => {
      if (randomMix[0]) {
          playTrack(randomMix[0].id, { customQueue: randomMix.map(t => t.id) });
      }
  }

  // Header Cover Art (First track of mix or placeholder)
  const headerArt = randomMix[0]?.coverArt;

  return (
    <motion.div 
      key="home-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full overflow-y-auto pt-safe pb-40 px-4 md:px-8 scrollbar-hide"
    >
      <div className="max-w-[1400px] mx-auto space-y-12 py-8">

        {/* --- HERO SECTION --- */}
        <section className="relative overflow-hidden rounded-[48px] bg-surface-container-low p-8 md:p-12 min-h-[360px] flex flex-col justify-between">
             {/* Dynamic Background Mesh */}
             <div className="absolute inset-0 z-0">
                 <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 blur-[100px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                 <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-tertiary/20 blur-[80px] rounded-full mix-blend-screen" />
                 <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-secondary/10 blur-[60px] rounded-full mix-blend-screen" />
             </div>

             {/* Content */}
             <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 h-full">

                 <div className="flex flex-col gap-6 max-w-2xl">
                     <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 backdrop-blur-md border border-outline-variant/20 w-fit">
                         <md-icon class="material-symbols-rounded filled text-primary" style={{ fontSize: '18px' }}>sparkles</md-icon>
                         <span className="text-label-large text-on-surface font-bold uppercase tracking-wide">Personalized</span>
                     </div>

                     <div>
                        <h1 className="text-display-medium md:text-display-large font-black text-on-surface tracking-tight leading-[1.1]">
                            Your <span className="text-primary">Mix</span>,<br/>
                            Ready to Play.
                        </h1>
                        <p className="text-headline-small text-on-surface-variant mt-4 max-w-lg font-medium opacity-80">
                            A dynamic selection of tracks tailored to your listening habits.
                        </p>
                     </div>
                 </div>

                 {/* Organic Blob Artwork & FAB */}
                 <div className="relative self-end md:self-center shrink-0">
                      <div className="relative w-48 h-48 md:w-64 md:h-64">
                          {/* Blob Shape */}
                           <motion.div
                              className="absolute inset-0 bg-surface-container-highest overflow-hidden shadow-elevation-2"
                              style={{
                                  borderRadius: '42% 58% 70% 30% / 45% 45% 55% 55%',
                                  backgroundImage: headerArt ? `url(${headerArt})` : undefined,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center'
                              }}
                              animate={{
                                  borderRadius: [
                                      '42% 58% 70% 30% / 45% 45% 55% 55%',
                                      '58% 42% 30% 70% / 55% 55% 45% 45%',
                                      '42% 58% 70% 30% / 45% 45% 55% 55%'
                                  ]
                              }}
                              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                           >
                              {!headerArt && (
                                  <div className="w-full h-full flex items-center justify-center bg-primary-container text-on-primary-container">
                                      <md-icon class="material-symbols-rounded" style={{ fontSize: '64px' }}>music_note</md-icon>
                                  </div>
                              )}
                           </motion.div>

                           {/* Floating Play FAB */}
                           <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={handlePlayAll}
                              className="absolute -bottom-4 -right-4 w-20 h-20 bg-primary text-on-primary rounded-[28px] shadow-elevation-3 flex items-center justify-center z-20 cursor-pointer border-4 border-surface"
                           >
                               <md-icon class="material-symbols-rounded filled" style={{ fontSize: '40px' }}>play_arrow</md-icon>
                           </motion.button>
                      </div>
                 </div>
             </div>
        </section>

        {/* --- ACTION BAR --- */}
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {onFileUpload && (
                <md-filled-tonal-button onClick={handleImportClick} class="shrink-0 h-12">
                    <md-icon slot="icon" class="material-symbols-rounded">add</md-icon>
                    Add Music
                </md-filled-tonal-button>
            )}
            <md-filled-tonal-button onClick={handleShufflePlay} class="shrink-0 h-12">
                <md-icon slot="icon" class="material-symbols-rounded">shuffle</md-icon>
                Shuffle All
            </md-filled-tonal-button>
        </div>

        {/* --- RECENTLY PLAYED --- */}
        {recentlyPlayed.length > 0 && (
            <section className="space-y-6">
                 <div className="flex items-center justify-between px-2">
                     <h3 className="text-headline-medium font-bold text-on-surface">Jump Back In</h3>
                     <md-icon-button class="text-on-surface-variant">
                         <md-icon class="material-symbols-rounded">arrow_forward</md-icon>
                     </md-icon-button>
                 </div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8"
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

        {/* --- DISCOVERY --- */}
        <section className="space-y-6">
             <div className="flex items-center px-2 gap-3">
                 <h3 className="text-headline-medium font-bold text-on-surface">Discovery</h3>
                 <div className="h-px bg-surface-variant flex-1 ml-4 opacity-50" />
             </div>

             <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8"
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
            className="flex flex-col items-center justify-center py-20 text-on-surface-variant text-center"
          >
            <div className="w-40 h-40 rounded-[48px] bg-surface-container-low flex items-center justify-center mb-8 shadow-inner">
               <md-icon class="material-symbols-rounded text-primary opacity-50" style={{ fontSize: '64px' }}>music_off</md-icon>
            </div>
            <h2 className="text-headline-small font-bold text-on-surface">It's quiet here...</h2>
            <p className="text-body-large mt-2 max-w-xs mx-auto">Import some tracks to bring this place to life.</p>
            {onFileUpload && (
              <div className="mt-8">
                 <md-filled-button onClick={handleImportClick} class="h-12">
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
