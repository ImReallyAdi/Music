import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, Playlist } from '../types';
import { dbService } from '../db';
import { parseTrackMetadata } from '../utils/metadata';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/labs/card/elevated-card.js';
import '@material/web/ripple/ripple.js';

interface SearchProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredTracks: Track[];
  playTrack: (id: string, options?: { customQueue: string[] }) => void;
  libraryTracks: Record<string, Track>;
  playlists: Playlist[];
  refreshLibrary: () => void;
}

const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const Search: React.FC<SearchProps> = ({ 
  activeTab, 
  searchQuery, 
  setSearchQuery, 
  filteredTracks, 
  playTrack,
  playlists,
  refreshLibrary
}) => {
  const inputRef = useRef<any>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  // Auto-focus input when tab becomes active
  useEffect(() => {
    if (activeTab === 'search') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    // @ts-ignore
    setSearchQuery(e.target.value);
    setImportStatus('idle');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setImportStatus('idle');
    setImportMessage('');
    inputRef.current?.focus();
  };

  const isUrl = useMemo(() => isValidUrl(searchQuery), [searchQuery]);

  // Derived Results
  const matchedPlaylists = useMemo(() => {
      if (!searchQuery || isUrl) return [];
      const lower = searchQuery.toLowerCase();
      return playlists.filter(p => p.name.toLowerCase().includes(lower));
  }, [searchQuery, playlists, isUrl]);

  const handleTrackClick = useCallback((trackId: string) => {
    const queue = filteredTracks.map(t => t.id);
    playTrack(trackId, { customQueue: queue });
  }, [filteredTracks, playTrack]);

  const handleImport = async () => {
    if (!isUrl) return;

    setImportStatus('loading');
    setImportMessage('Fetching audio...');

    try {
        const existing = await dbService.findTrackByUrl(searchQuery);
        if (existing) {
             setImportStatus('error');
             setImportMessage('Track already in library.');
             return;
        }

        const response = await fetch(searchQuery);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

        const blob = await response.blob();
        if (!blob.type.startsWith('audio/')) {
             console.warn("Imported file might not be audio:", blob.type);
             // Proceed anyway but warn? Or maybe it's octet-stream.
        }

        setImportMessage('Parsing metadata...');

        const filename = searchQuery.split('/').pop()?.split('?')[0] || 'Unknown Track';
        const metadata = await parseTrackMetadata(blob, decodeURIComponent(filename));

        const newTrack: Track = {
            id: crypto.randomUUID(),
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            duration: metadata.duration,
            coverArt: metadata.coverArt,
            addedAt: Date.now(),
            source: 'url',
            externalUrl: searchQuery,
            playCount: 0
        };

        await dbService.saveTrack(newTrack, blob);
        refreshLibrary();

        setImportStatus('success');
        setImportMessage(`Added "${newTrack.title}" to library!`);

    } catch (error) {
        console.error("Import failed:", error);
        setImportStatus('error');
        setImportMessage('Failed to import. Ensure the URL is a direct audio link and supports CORS.');
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
      <div className="sticky top-0 z-20 pt-2 pb-4 bg-background/95 backdrop-blur-md -mx-4 px-4 md:-mx-8 md:px-8 transition-colors">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
            <h1 className="text-display-small font-black text-on-surface tracking-tight">Search</h1>

            <div className="relative">
                <md-outlined-text-field
                    label={isUrl ? "Import URL" : "Search Library"}
                    placeholder="Songs, Artists, Albums or Audio URL"
                    value={searchQuery}
                    onInput={handleInput}
                    ref={inputRef}
                    style={{ width: '100%', '--md-outlined-text-field-container-shape': 'var(--md-sys-shape-corner-extra-large)' }}
                >
                    <md-icon slot="leading-icon" class="material-symbols-rounded">
                        {isUrl ? 'link' : 'search'}
                    </md-icon>

                    {searchQuery && (
                        <md-icon-button slot="trailing-icon" onClick={handleClearSearch}>
                            <md-icon class="material-symbols-rounded">close</md-icon>
                        </md-icon-button>
                    )}
                </md-outlined-text-field>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-32 w-full max-w-3xl mx-auto">

        {/* IMPORT UI */}
        {isUrl && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                 <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-6 w-full max-w-md bg-surface-container-low p-8 rounded-[32px] border border-outline-variant/10 shadow-sm"
                 >
                    <div className="w-20 h-20 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                        <md-icon class="material-symbols-rounded" style={{ fontSize: '40px' }}>cloud_download</md-icon>
                    </div>

                    <div>
                        <h3 className="text-headline-small font-bold text-on-surface">Import Audio</h3>
                        <p className="text-body-medium text-on-surface-variant mt-2 break-all line-clamp-2">
                            {searchQuery}
                        </p>
                    </div>

                    {importStatus === 'idle' && (
                        <md-filled-button onClick={handleImport} style={{ width: '100%', height: '56px' }}>
                             <md-icon slot="icon" class="material-symbols-rounded">download</md-icon>
                             Import to Library
                        </md-filled-button>
                    )}

                    {importStatus === 'loading' && (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <md-circular-progress indeterminate></md-circular-progress>
                            <span className="text-label-large text-primary animate-pulse">{importMessage}</span>
                        </div>
                    )}

                    {importStatus === 'success' && (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="text-primary font-bold flex items-center gap-2 bg-primary-container px-4 py-2 rounded-full">
                                <md-icon class="material-symbols-rounded">check</md-icon>
                                <span>Success</span>
                            </div>
                            <p className="text-body-medium">{importMessage}</p>
                            <md-text-button onClick={handleClearSearch}>
                                Search Library
                            </md-text-button>
                        </div>
                    )}

                    {importStatus === 'error' && (
                        <div className="flex flex-col items-center gap-4 w-full">
                             <div className="text-error font-bold flex items-center gap-2 bg-error-container px-4 py-2 rounded-full">
                                <md-icon class="material-symbols-rounded">error</md-icon>
                                <span>Error</span>
                            </div>
                            <p className="text-body-medium text-error">{importMessage}</p>
                            <md-text-button onClick={() => setImportStatus('idle')}>Try Again</md-text-button>
                        </div>
                    )}
                 </motion.div>
            </div>
        )}

        {/* LOCAL RESULTS */}
        {!isUrl && searchQuery && (
            <AnimatePresence mode="popLayout">
                {/* Playlists */}
                {matchedPlaylists.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
                        <h3 className="text-title-medium font-bold text-on-surface px-4 mb-4">Playlists</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-2">
                            {matchedPlaylists.map(p => (
                                <div key={p.id} className="relative group cursor-pointer">
                                     <md-elevated-card
                                        clickable
                                        class="aspect-square relative overflow-hidden"
                                        style={{ '--md-elevated-card-container-shape': 'var(--md-sys-shape-corner-large)' }}
                                     >
                                         <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center text-on-surface-variant/50">
                                            <md-icon class="material-symbols-rounded" style={{ fontSize: '48px' }}>queue_music</md-icon>
                                         </div>
                                         <md-ripple></md-ripple>
                                     </md-elevated-card>
                                     <div className="mt-2 px-1">
                                        <p className="font-bold text-on-surface truncate">{p.name}</p>
                                        <p className="text-xs text-on-surface-variant">{p.trackIds.length} tracks</p>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Songs */}
                {filteredTracks.length > 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                         <h3 className="text-title-medium font-bold text-on-surface px-4 mb-2">Songs</h3>
                         <md-list class="bg-transparent">
                            {filteredTracks.map(t => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={t.id}
                                >
                                    <md-list-item
                                        type="button"
                                        onClick={() => handleTrackClick(t.id)}
                                        style={{ borderRadius: '16px', marginBottom: '8px', '--md-list-item-leading-image-shape': '12px' }}
                                    >
                                        <div slot="start" className="w-12 h-12 bg-surface-container-highest rounded-[12px] flex items-center justify-center overflow-hidden border border-outline-variant/10">
                                            {t.coverArt ? (
                                            <img src={t.coverArt} alt={t.title} className="w-full h-full object-cover"/>
                                            ) : (
                                            <md-icon class="material-symbols-rounded text-on-surface-variant/50">music_note</md-icon>
                                            )}
                                        </div>

                                        <div slot="headline" className="text-on-surface font-bold truncate">
                                            {t.title}
                                        </div>
                                        <div slot="supporting-text" className="text-on-surface-variant truncate opacity-80">{t.artist}</div>

                                        {t.source === 'url' && (
                                            <div slot="end">
                                                <md-icon class="material-symbols-rounded text-on-surface-variant opacity-50" style={{ fontSize: '18px' }}>link</md-icon>
                                            </div>
                                        )}
                                    </md-list-item>
                                </motion.div>
                            ))}
                        </md-list>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60">
                        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                        <md-icon class="material-symbols-rounded" style={{ fontSize: '40px', opacity: 0.5 }}>search_off</md-icon>
                        </div>
                        <p className="text-title-large font-bold">No tracks found</p>
                        <p className="text-body-medium">Try searching for a different artist or song</p>
                    </div>
                )}
            </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default Search;
