import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Search as SearchIcon, X, Disc, Youtube, Download, AlertCircle, Loader2, Check } from 'lucide-react';
import { Track, Playlist } from '../types';
import { getYouTubeVideo, getYouTubePlaylist, extractVideoId, extractPlaylistId, YouTubeTrack } from '../utils/youtube';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/chips/filter-chip.js';

// Declare Material Web Components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-outlined-text-field': any;
      'md-filled-button': any;
      'md-text-button': any;
      'md-icon-button': any;
      'md-icon': any;
      'md-filter-chip': any;
    }
  }
}

interface SearchProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredTracks: Track[];
  playTrack: (id: string, options?: { customQueue: string[] }) => void;
  onAddWebTrack?: (url: string, metadata?: YouTubeTrack) => void;

  libraryTracks: Record<string, Track>;
  playlists: Playlist[];
  onAddYouTubeTrack: (track: YouTubeTrack) => void;
  onAddYouTubeToPlaylist: (playlistId: string, track: YouTubeTrack) => void;
  onCreatePlaylist: (name: string) => void;
}

const Search: React.FC<SearchProps> = ({ 
  activeTab, 
  searchQuery, 
  setSearchQuery, 
  filteredTracks, 
  playTrack,
  libraryTracks,
  onAddYouTubeTrack
}) => {
  const inputRef = useRef<any>(null); // Use any for web component ref
  const [isWebMode, setIsWebMode] = useState(false);

  // Import State
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [totalToImport, setTotalToImport] = useState(0);

  // Auto-focus input when tab becomes active
  useEffect(() => {
    if (activeTab === 'search') {
      // Material Text Field exposes focus() method
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  // Handle Search Input Change
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    // @ts-ignore
    setSearchQuery(e.target.value);
  };

  // Handle Clear
  const handleClearSearch = () => {
    setSearchQuery('');
    setImportStatus('idle');
    setImportMessage('');
    inputRef.current?.focus();
  };

  // Optimize click handler to prevent array recreation in the loop
  const handleTrackClick = useCallback((trackId: string) => {
    const queue = filteredTracks.map(t => t.id);
    playTrack(trackId, { customQueue: queue });
  }, [filteredTracks, playTrack]);

  const handleImport = async () => {
    if (!searchQuery) return;

    setImportStatus('loading');
    setImportMessage('Analyzing link...');
    setImportedCount(0);
    setTotalToImport(0);

    try {
        const playlistId = extractPlaylistId(searchQuery);
        const videoId = extractVideoId(searchQuery);
        const isExplicitPlaylist = searchQuery.includes('/playlist');

        if (playlistId && (isExplicitPlaylist || !videoId)) {
            setImportMessage('Fetching playlist info...');
            const tracks = await getYouTubePlaylist(searchQuery);

            if (tracks.length === 0) {
                setImportStatus('error');
                setImportMessage('No tracks found or playlist is private.');
                return;
            }

            setTotalToImport(tracks.length);
            setImportMessage(`Importing 0/${tracks.length} tracks...`);

            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                const exists = Object.values(libraryTracks).some(t => t.source === 'youtube' && t.externalUrl === track.url);
                if (!exists) {
                    onAddYouTubeTrack(track);
                }
                setImportedCount(i + 1);
                setImportMessage(`Importing ${i + 1}/${tracks.length} tracks...`);
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            setImportStatus('success');
            setImportMessage(`Successfully imported ${tracks.length} tracks!`);

        } else if (videoId) {
            setImportMessage('Fetching video info...');
            const track = await getYouTubeVideo(searchQuery);

            if (!track) {
                setImportStatus('error');
                setImportMessage('Video not found or is private.');
                return;
            }

            const exists = Object.values(libraryTracks).some(t => t.source === 'youtube' && t.externalUrl === track.url);
            if (exists) {
                setImportStatus('error');
                setImportMessage('Track already in library.');
                return;
            }

            onAddYouTubeTrack(track);
            setImportStatus('success');
            setImportMessage(`Added "${track.title}" to library!`);

        } else {
            setImportStatus('error');
            setImportMessage('Invalid YouTube URL.');
        }
    } catch (error) {
        console.error("Import failed:", error);
        setImportStatus('error');
        setImportMessage('Failed to import. Please check your internet connection.');
    }
  };

  return (
    <motion.div 
      key="search" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-6 pt-2 h-full flex flex-col px-4"
    >
      {/* Search Bar - Sticky Header */}
      <div className="sticky top-0 z-20 pt-2 pb-2 bg-surface">
        <div className="flex flex-col gap-4">

            {/* Material Text Field */}
            <md-outlined-text-field
                label={isWebMode ? "Paste YouTube Link" : "Search Library"}
                placeholder={isWebMode ? "Video or Playlist URL..." : "Songs, Artists, Albums"}
                value={searchQuery}
                onInput={handleInput}
                ref={inputRef}
                style={{ width: '100%' }}
            >
                 <md-icon slot="leading-icon">
                    {isWebMode ? <Youtube size={20} /> : <SearchIcon size={20} />}
                 </md-icon>

                 {searchQuery && (
                    <md-icon-button slot="trailing-icon" onClick={handleClearSearch}>
                        <md-icon><X size={20} /></md-icon>
                    </md-icon-button>
                 )}
            </md-outlined-text-field>

            {/* Mode Toggle Chips */}
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <md-filter-chip
                    label="Library"
                    selected={!isWebMode}
                    onClick={() => setIsWebMode(false)}
                />
                <md-filter-chip
                    label="YouTube Import"
                    selected={isWebMode}
                    onClick={() => setIsWebMode(true)}
                />
            </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 flex flex-col gap-2 pb-24 overflow-y-auto">

        {/* Web Mode UI */}
        {isWebMode && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                 {!searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-surface-on-variant space-y-4 max-w-sm"
                    >
                        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6 text-primary">
                            <Youtube className="w-10 h-10" />
                        </div>
                        <h3 className="text-title-medium font-bold text-surface-on">Import from YouTube</h3>
                        <p className="text-body-medium">
                            Paste a link to a video or playlist to add it directly to your library.
                        </p>
                    </motion.div>
                 )}

                 {searchQuery && importStatus === 'idle' && (
                     <md-filled-button onClick={handleImport}>
                         <div slot="icon"><Download size={18} /></div>
                         Import Link
                     </md-filled-button>
                 )}

                {importStatus === 'loading' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4 w-full"
                    >
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <div className="text-body-large font-medium text-surface-on">{importMessage}</div>
                        {totalToImport > 0 && (
                            <div className="w-64 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(importedCount / totalToImport) * 100}%` }}
                                    transition={{ type: "spring", stiffness: 50 }}
                                />
                            </div>
                        )}
                    </motion.div>
                )}

                {importStatus === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                            <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-title-medium font-bold text-surface-on">Success!</h3>
                        <p className="text-body-medium text-surface-on-variant">{importMessage}</p>
                        <md-text-button onClick={() => {
                                setSearchQuery('');
                                setImportStatus('idle');
                            }}>
                            Import another link
                        </md-text-button>
                    </motion.div>
                )}

                {importStatus === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-title-medium font-bold text-surface-on">Oops!</h3>
                        <p className="text-body-medium text-surface-on-variant">{importMessage}</p>
                         <md-text-button onClick={() => setImportStatus('idle')}>
                            Try again
                        </md-text-button>
                    </motion.div>
                )}
            </div>
        )}

        {/* Local Results */}
        {!isWebMode && (
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
                className="group flex items-center gap-4 p-2 pr-4 rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors active:scale-[0.98]"
                >
                {/* Cover Art */}
                <div className="w-14 h-14 bg-surface-container-highest rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm relative elevation-1">
                    {t.coverArt ? (
                    <img src={t.coverArt} alt={t.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                    ) : (
                    <Music className="w-6 h-6 text-surface-on-variant/50" />
                    )}
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-body-large font-medium text-surface-on truncate group-hover:text-primary transition-colors flex items-center gap-2">
                    {t.title}
                    {t.source === 'youtube' && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">WEB</span>
                    )}
                    </h4>
                    <p className="text-body-medium text-surface-on-variant truncate">
                    {t.artist}
                    </p>
                </div>
                </motion.div>
            ))}
            </AnimatePresence>
        )}

        {/* Empty State */}
        {searchQuery && ((!isWebMode && filteredTracks.length === 0)) && (
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
