import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, PlayCircle, Music } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';

export function Search() {
  const { library } = useLibrary();
  const { playTrack } = usePlayer();
  const [query, setQuery] = React.useState('');

  const results = React.useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return Object.values(library.tracks).filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    );
  }, [library.tracks, query]);

  return (
    <div className="p-6 md:p-10 space-y-8 h-full flex flex-col">
       <div className="relative group max-w-2xl mx-auto w-full">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant w-6 h-6 group-focus-within:text-primary transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to listen to?"
              className="w-full bg-surface-container-high rounded-full py-4 pl-16 pr-6 text-lg font-medium text-on-surface outline-none border-2 border-transparent focus:border-primary transition-all shadow-sm"
            />
       </div>

       <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
              {results.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto"
                  >
                      {results.map((track, i) => (
                          <motion.div
                            key={track.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => playTrack(track.id)}
                            className="flex items-center gap-4 p-4 rounded-3xl bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors"
                          >
                              <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {track.coverArt ? (
                                      <img src={track.coverArt} className="w-full h-full object-cover" alt="Cover" />
                                  ) : (
                                      <Music className="w-8 h-8 text-on-surface-variant opacity-50" />
                                  )}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-on-surface truncate">{track.title}</h4>
                                  <p className="text-sm font-medium text-on-surface-variant truncate">{track.artist}</p>
                              </div>
                              <PlayCircle className="w-10 h-10 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                      ))}
                  </motion.div>
              ) : (
                  query && (
                      <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
                          <p className="text-lg">No results found for "{query}"</p>
                      </div>
                  )
              )}
          </AnimatePresence>
       </div>
    </div>
  );
}
