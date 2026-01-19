import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, Playlist } from '../types';
import { getYouTubeVideo, getYouTubePlaylist, extractVideoId, extractPlaylistId, YouTubeTrack } from '../utils/youtube';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';

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
      'md-circular-progress': any;
      'md-list': any;
      'md-list-item': any;
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
      className="space-y-6 h-full flex flex-col px-4 md:px-8 max-w-5xl mx-auto w-full pt-4"
    >
      {/* Search Bar - Sticky Header */}
      <div className="sticky top-0 z-20 pt-2 pb-4 bg-background/95 backdrop-blur-md -mx-4 px-4 md:-mx-8 md:px-8">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
            <h1 className="text-display-small font-black text-on-surface tracking-tight">Search</h1>

            {/* Material Text Field - Chunky */}
            <div className="relative">
                <md-outlined-text-field
                    label={isWebMode ? "Paste YouTube Link" : "Search Library"}
                    placeholder={isWebMode ? "Video or Playlist URL..." : "Songs, Artists, Albums"}
                    value={searchQuery}
                    onInput={handleInput}
                    ref={inputRef}
                    style={{ width: '100%', '--md-outlined-text-field-container-shape': '28px' }}
                >
                    <md-icon slot="leading-icon" class="material-symbols-rounded">
                        {isWebMode ? 'youtube_activity' : 'search'}
                    </md-icon>

                    {searchQuery && (
                        <md-icon-button slot="trailing-icon" onClick={handleClearSearch}>
                            <md-icon class="material-symbols-rounded">close</md-icon>
                        </md-icon-button>
                    )}
                </md-outlined-text-field>
            </div>

            {/* Mode Toggle Chips */}
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar justify-start">
                <md-filter-chip
                    label="Library"
                    selected={!isWebMode}
                    onClick={() => setIsWebMode(false)}
                />
                <md-filter-chip
                    label="YouTube Import"
                    selected={isWebMode}
                    onClick={() => setIsWebMode(true)}
                >
                     <md-icon slot="icon" class="material-symbols-rounded">cloud_download</md-icon>
                </md-filter-chip>
            </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 flex flex-col gap-2 pb-32 overflow-y-auto w-full max-w-3xl mx-auto">

        {/* Web Mode UI */}
        {isWebMode && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                 {!searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-on-surface-variant space-y-4 max-w-sm"
                    >
                        <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6 text-primary shadow-sm">
                            <md-icon class="material-symbols-rounded" style={{ fontSize: '48px' }}>youtube_activity</md-icon>
                        </div>
                        <h3 className="text-headline-small font-bold text-on-surface">Import from YouTube</h3>
                        <p className="text-body-large opacity-80">
                            Paste a link to a video or playlist to add it directly to your library.
                        </p>
                    </motion.div>
                 )}

                 {searchQuery && importStatus === 'idle' && (
                     <md-filled-button onClick={handleImport} style={{ '--md-filled-button-container-height': '56px' }}>
                         <md-icon slot="icon" class="material-symbols-rounded">download</md-icon>
                         Import Link
                     </md-filled-button>
                 )}

                {importStatus === 'loading' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-6 w-full max-w-md"
                    >
                        <md-circular-progress indeterminate style={{ '--md-circular-progress-size': '64px' }}></md-circular-progress>
                        <div className="text-body-large font-medium text-on-surface">{importMessage}</div>
                        {totalToImport > 0 && (
                            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
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
                        <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-2">
                            <md-icon class="material-symbols-rounded" style={{ fontSize: '40px' }}>check</md-icon>
                        </div>
                        <h3 className="text-headline-small font-bold text-on-surface">Success!</h3>
                        <p className="text-body-large text-on-surface-variant">{importMessage}</p>
                        <div className="mt-4">
                            <md-text-button onClick={() => {
                                    setSearchQuery('');
                                    setImportStatus('idle');
                                }}>
                                Import another link
                            </md-text-button>
                        </div>
                    </motion.div>
                )}

                {importStatus === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="w-20 h-20 rounded-full bg-error-container text-on-error-container flex items-center justify-center mb-2">
                            <md-icon class="material-symbols-rounded" style={{ fontSize: '40px' }}>error</md-icon>
                        </div>
                        <h3 className="text-headline-small font-bold text-on-surface">Oops!</h3>
                        <p className="text-body-large text-on-surface-variant">{importMessage}</p>
                         <div className="mt-4">
                            <md-text-button onClick={() => setImportStatus('idle')}>
                                Try again
                            </md-text-button>
                         </div>
                    </motion.div>
                )}
            </div>
        )}

        {/* Local Results */}
        {!isWebMode && (
            <AnimatePresence mode='popLayout'>
            <md-list class="bg-transparent">
            {filteredTracks.map(t => (
                <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={t.id}
                >
                    <md-list-item
                        type="button"
                        onClick={() => handleTrackClick(t.id)}
                        style={{ borderRadius: '16px', marginBottom: '8px', '--md-list-item-leading-image-shape': '12px' }}
                    >
                        {/* Cover Art */}
                        <div slot="start" className="w-12 h-12 bg-surface-container-highest rounded-[12px] flex items-center justify-center overflow-hidden border border-outline-variant/10">
                            {t.coverArt ? (
                            <img src={t.coverArt} alt={t.title} className="w-full h-full object-cover"/>
                            ) : (
                            <md-icon class="material-symbols-rounded text-on-surface-variant/50">music_note</md-icon>
                            )}
                        </div>

                        {/* Text Info */}
                        <div slot="headline" className="text-on-surface font-bold truncate flex items-center gap-2">
                             {t.title}
                             {t.source === 'youtube' && (
                                <span className="text-[10px] bg-error-container text-on-error-container px-1.5 py-0.5 rounded-md font-bold tracking-wide">WEB</span>
                             )}
                        </div>
                        <div slot="supporting-text" className="text-on-surface-variant truncate opacity-80">{t.artist}</div>
                    </md-list-item>
                </motion.div>
            ))}
            </md-list>
            </AnimatePresence>
        )}

        {/* Empty State */}
        {searchQuery && ((!isWebMode && filteredTracks.length === 0)) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60"
          >
            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
              <md-icon class="material-symbols-rounded" style={{ fontSize: '40px', opacity: 0.5 }}>album</md-icon>
            </div>
            <p className="text-title-large font-bold">No tracks found</p>
            <p className="text-body-medium">Try searching for a different artist or song</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Search;
