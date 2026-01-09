import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Search as SearchIcon, X, Disc, Youtube, Download, AlertCircle, Loader2, Check } from 'lucide-react';
import { Track, Playlist } from '../types';
import { getYouTubeVideo, getYouTubePlaylist, extractVideoId, extractPlaylistId, YouTubeTrack } from '../utils/youtube';

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
  const inputRef = useRef<HTMLInputElement>(null); // Kept for logic, but UI will use mc-text-field
  const [isWebMode, setIsWebMode] = useState(false);

  // Import State
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [totalToImport, setTotalToImport] = useState(0);

  // Auto-focus logic might need adjustment for custom element
  useEffect(() => {
    if (activeTab === 'search') {
      // Try to focus the native input inside the shadow DOM if possible or just the element
      // inputRef.current?.focus();
      // With mc-text-field, we might need a ref to the custom element
      const el = document.querySelector('mc-text-field') as HTMLElement;
      if (el) el.focus();
    }
  }, [activeTab]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setImportStatus('idle');
    setImportMessage('');
  };

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
      className="space-y-4 pt-2 h-full flex flex-col"
    >
      {/* Search Bar */}
      <div className="sticky top-0 z-20 pt-2 pb-2 bg-background/95 backdrop-blur-md px-4">
        <mc-text-field
          label={isWebMode ? "Paste YouTube Link" : "Search Library"}
          value={searchQuery}
          type="text"
          oninput={(e: any) => setSearchQuery(e.target.value)}
          onkeydown={(e: any) => handleKeyDown(e)}
          icon={isWebMode ? "link" : "search"} // Trailing icon
          style={{ width: '100%' } as any}
        >
            {/* Slot for leading icon if supported or utilize built-in props */}
        </mc-text-field>

        <div className="flex justify-end mt-2">
            <mc-button
                variant="standard"
                size="small"
                onClick={() => {
                    setIsWebMode(!isWebMode);
                    setSearchQuery('');
                    setImportStatus('idle');
                    setImportMessage('');
                }}
            >
                {isWebMode ? 'Local Search' : 'YouTube Import'}
            </mc-button>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 flex flex-col gap-2 pb-24 px-4">
        {/* Web Mode UI */}
        {isWebMode && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                 {!searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-on-surface-variant space-y-4 max-w-sm"
                    >
                        <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center mx-auto mb-6">
                            <mc-icon name="cloud_download" style={{ fontSize: '40px', color: 'var(--md-sys-color-on-secondary-container)' } as any}></mc-icon>
                        </div>
                        <h3 className="text-xl font-bold text-on-surface">Import from YouTube</h3>
                        <p className="text-sm opacity-70">
                            Paste a link to a video or playlist.
                        </p>
                    </motion.div>
                 )}

                 {searchQuery && importStatus === 'idle' && (
                     <mc-button
                        variant="filled"
                        onClick={handleImport}
                     >
                         <mc-icon slot="icon" name="download"></mc-icon>
                         Import Link
                     </mc-button>
                 )}

                {importStatus === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <div className="text-lg font-medium text-on-surface">{importMessage}</div>
                    </div>
                )}

                {importStatus === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                            <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-on-surface">Success!</h3>
                        <p className="text-sm text-on-surface-variant">{importMessage}</p>
                        <mc-button
                            variant="standard"
                            onClick={() => {
                                setSearchQuery('');
                                setImportStatus('idle');
                            }}
                        >
                            Import another
                        </mc-button>
                    </div>
                )}

                {importStatus === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-on-surface">Oops!</h3>
                        <p className="text-sm text-on-surface-variant">{importMessage}</p>
                         <mc-button
                            variant="standard"
                            onClick={() => setImportStatus('idle')}
                        >
                            Try again
                        </mc-button>
                    </div>
                )}
            </div>
        )}

        {/* Local Results */}
        {!isWebMode && (
            <AnimatePresence mode='popLayout'>
            {filteredTracks.map(t => (
                <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={t.id}
                onClick={() => handleTrackClick(t.id)}
                className="mb-1"
                >
                    <mc-card variant="filled" style={{ width: '100%', cursor: 'pointer', backgroundColor: 'var(--md-sys-color-surface-container)' } as any}>
                        <div className="flex items-center p-3 gap-4">
                            <div className="w-12 h-12 rounded-lg bg-surface-variant overflow-hidden relative flex-shrink-0">
                                {t.coverArt ? (
                                    <img src={t.coverArt} alt={t.title} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="flex items-center justify-center h-full w-full">
                                        <mc-icon name="music_note" style={{ color: 'var(--md-sys-color-on-surface-variant)' } as any}></mc-icon>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-base font-medium text-on-surface truncate flex items-center gap-2">
                                    {t.title}
                                    {t.source === 'youtube' && (
                                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">WEB</span>
                                    )}
                                </h4>
                                <p className="text-sm text-on-surface-variant truncate">
                                    {t.artist}
                                </p>
                            </div>
                        </div>
                        <mc-ripple></mc-ripple>
                    </mc-card>
                </motion.div>
            ))}
            </AnimatePresence>
        )}

        {/* Empty State */}
        {searchQuery && ((!isWebMode && filteredTracks.length === 0)) && (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <mc-icon name="album" style={{ fontSize: '64px', opacity: 0.5 } as any}></mc-icon>
            <p className="text-lg font-medium mt-4">No tracks found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Search;
