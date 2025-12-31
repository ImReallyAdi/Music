import React from 'react';
import { motion } from 'framer-motion';
import { Play, Music } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';

export function Home() {
  const { library } = useLibrary();
  const { playTrack } = usePlayer();

  const recentTracks = Object.values(library.tracks).sort((a, b) => b.addedAt - a.addedAt).slice(0, 8);

  const greeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
  };

  return (
    <div className="p-6 md:p-10 pb-32 space-y-12">
       <section>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-on-surface mb-8 tracking-tight"
          >
              {greeting()}
          </motion.h1>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentTracks.map((track, i) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => playTrack(track.id)}
                    className="group bg-surface-container rounded-[24px] p-4 cursor-pointer hover:shadow-xl transition-all"
                  >
                      <div className="aspect-square rounded-[16px] bg-surface-variant mb-4 overflow-hidden relative shadow-inner">
                          {track.coverArt ? (
                              <img src={track.coverArt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                  <Music className="w-12 h-12 opacity-30" />
                              </div>
                          )}
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-12 h-12 fill-white text-white drop-shadow-lg" />
                          </div>
                      </div>
                      <h3 className="font-bold text-lg text-on-surface truncate">{track.title}</h3>
                      <p className="text-sm font-medium text-on-surface-variant truncate">{track.artist}</p>
                  </motion.div>
              ))}
          </div>
       </section>

       <section className="bg-primary-container rounded-[40px] p-8 md:p-12 relative overflow-hidden">
           <div className="relative z-10">
               <h2 className="text-3xl font-black text-on-primary-container mb-4">Your Mix</h2>
               <p className="text-on-primary-container/70 text-lg mb-8 max-w-md">A blend of your recently added tracks and favorites, curated just for you.</p>
               <button className="px-8 py-3 bg-on-primary-container text-primary-container rounded-full font-bold hover:opacity-90 transition-opacity">
                   Play Mix
               </button>
           </div>
           <Music className="absolute -right-10 -bottom-10 w-64 h-64 text-on-primary-container opacity-5 rotate-12" />
       </section>
    </div>
  );
}
