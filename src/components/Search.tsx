import React, { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Search as SearchIcon, X, Disc } from 'lucide-react';
import { Track } from '../types';

interface SearchProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredTracks: Track[];
  // Updated signature to accept options
  playTrack: (id: string, options?: { customQueue: string[] }) => void; // fixes with old lmao
}

const Search: React.FC<SearchProps> = ({ 
  activeTab, 
  searchQuery, 
  setSearchQuery, 
  filteredTracks, 
  playTrack 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when tab becomes active
  useEffect(() => {
    if (activeTab === 'search') {
      inputRef.current?.focus();
    }
  }, [activeTab]);

  // Handle Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      inputRef.current?.blur();
    }
  };

  // Optimize click handler to prevent array recreation in the loop
  const handleTrackClick = useCallback((trackId: string) => {
    const queue = filteredTracks.map(t => t.id);
    playTrack(trackId, { customQueue: queue });
  }, [filteredTracks, playTrack]);

  return (
    <motion.div 
      key="search" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-6 pt-2 h-full flex flex-col"
    >
      {/* Search Bar - Sticky Header */}
      <div className="sticky top-0 z-20 pt-2 pb-4 bg-surface/95 backdrop-blur-md">
        <div className="relative group rounded-full bg-surface-container-high focus-within:bg-surface-container-highest transition-colors flex items-center h-14 px-4 shadow-sm ring-1 ring-white/5">
          <SearchIcon className="text-surface-on-variant w-6 h-6 mr-3 transition-colors group-focus-within:text-primary" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find your frequency..."
            className="flex-1 bg-transparent text-body-large text-surface-on placeholder:text-surface-on-variant/50 outline-none"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }} 
                className="p-2 text-surface-on-variant hover:text-surface-on hover:bg-surface-container-highest/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 flex flex-col gap-2 pb-24">
        <AnimatePresence mode='popLayout'>
          {filteredTracks.map(t => (
            <motion.div
              layout // Enables smooth position transitions when filtering
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={t.id}
              whileTap={{ scale: 0.98, backgroundColor: 'var(--surface-container-highest)' }}
              onClick={() => handleTrackClick(t.id)}
              className="group flex items-center gap-4 p-2 pr-4 rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              {/* Cover Art */}
              <div className="w-14 h-14 bg-surface-container-highest rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm relative">
                {t.coverArt ? (
                  <img src={t.coverArt} alt={t.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                ) : (
                  <Music className="w-6 h-6 text-surface-on-variant/50" />
                )}
                {/* Play Overlay on Hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="bg-surface-on text-surface-inverse p-1.5 rounded-full">
                      <Music className="w-4 h-4" />
                   </div>
                </div>
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-body-large font-medium text-surface-on truncate group-hover:text-primary transition-colors">
                  {t.title}
                </h4>
                <p className="text-body-medium text-surface-on-variant truncate">
                  {t.artist}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {searchQuery && filteredTracks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-surface-on-variant/60"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
              <Disc className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-body-large font-medium">No tracks found</p>
            <p className="text-body-small">Try searching for a different artist or song</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Search;
