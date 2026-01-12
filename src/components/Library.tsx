import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, PlayerState, Playlist } from '../types';
import { dbService } from '../db';
import Playlists from './Playlists';
import AddToPlaylistModal from './AddToPlaylistModal';
import { getOrFetchArtistImage } from '../utils/artistImage';
import { parseLrc } from '../utils/lyrics';
import { useToast } from './Toast';
import { LibraryCard } from './library/LibraryCard';
import { ArtistCard } from './library/ArtistCard';

import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/secondary-tab.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/switch/switch.js';
import '@material/web/slider/slider.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-tonal-button.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-tabs': any;
      'md-primary-tab': any;
      'md-secondary-tab': any;
      'md-switch': any;
      'md-slider': any;
      'md-list': any;
      'md-list-item': any;
      'md-icon': any;
      'md-icon-button': any;
      'md-chip-set': any;
      'md-filter-chip': any;
      'md-outlined-text-field': any;
      'md-filled-tonal-button': any;
    }
  }
}

// --- TYPES ---
type LibraryTab = 'Songs' | 'Favorites' | 'Albums' | 'Artists' | 'Playlists' | 'Settings';
type SortOption = 'added' | 'title' | 'artist';

interface LibraryProps {
  activeTab: string;
  libraryTab: LibraryTab;
  setLibraryTab: (tab: LibraryTab) => void;
  filteredTracks: Track[];
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  playTrack: (id: string, options?: any) => void;
  refreshLibrary: () => void;
  isLoading?: boolean;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// --- UTILS ---
const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// --- COMPONENTS ---

// Loading Skeleton
const LibrarySkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="flex flex-col gap-3">
         <div className="aspect-square bg-surface-container-highest rounded-[20px] animate-pulse" />
         <div className="h-4 w-3/4 bg-surface-container-highest rounded animate-pulse" />
         <div className="h-3 w-1/2 bg-surface-container-highest/60 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

// Settings Tab (Kept as List)
const SettingsTab = ({ playerState, setPlayerState }: { playerState: PlayerState, setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>> }) => {
    const [wordSyncEnabled, setWordSyncEnabled] = useState(false);

    useEffect(() => {
        dbService.getSetting<boolean>('wordSyncEnabled').then(val => setWordSyncEnabled(val || false));
    }, []);

    const handleWordSyncToggle = (enabled: boolean) => {
        setWordSyncEnabled(enabled);
        dbService.setSetting('wordSyncEnabled', enabled);
    };

    const ToggleRow = ({ label, subLabel, checked, onChange, children }: any) => (
        <div className="flex flex-col gap-2 py-2">
            <md-list-item
                type="button"
                style={{
                    borderRadius: '16px',
                    '--md-list-item-leading-space': '0'
                }}
            >
                 <div slot="headline" className="text-on-surface">{label}</div>
                 <div slot="supporting-text" className="text-on-surface-variant">{subLabel}</div>
                 <md-switch slot="end" selected={checked} onClick={(e: any) => {
                     onChange(!checked);
                 }}></md-switch>
            </md-list-item>

            {checked && children && (
                <div className="pl-4 pr-4 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col gap-6 p-1 max-w-2xl mx-auto w-full pb-32"
        >
            <section>
                <h2 className="text-label-large font-bold text-primary px-4 mb-2 uppercase tracking-wider">Playback</h2>
                <div className="bg-surface-container rounded-3xl overflow-hidden shadow-sm border border-outline-variant/10 p-2">
                    <ToggleRow 
                        label="Automix" 
                        subLabel="Smart transitions & AI blending" 
                        checked={playerState.automixEnabled} 
                        onChange={(val: boolean) => setPlayerState(p => ({ ...p, automixEnabled: val }))}
                    >
                        <div className="flex flex-col gap-3 pt-2">
                            <span className="text-body-small text-on-surface-variant">Transition Style</span>
                            <div className="flex gap-2">
                                {['classic', 'smart', 'shuffle'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setPlayerState(p => ({ ...p, automixMode: mode as any }))}
                                        className={`px-3 py-1.5 rounded-lg text-label-medium font-medium capitalize transition-all border ${
                                            playerState.automixMode === mode
                                            ? 'bg-primary-container text-on-primary-container border-primary-container'
                                            : 'bg-surface-container-high text-on-surface-variant border-transparent hover:border-outline-variant'
                                        }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </ToggleRow>

                    <div className="h-px bg-outline-variant/50 mx-4" />

                    <ToggleRow 
                        label="Crossfade" 
                        subLabel="Overlap songs for smoothness" 
                        checked={playerState.crossfadeEnabled} 
                        onChange={(val: boolean) => setPlayerState(p => ({ ...p, crossfadeEnabled: val }))}
                    >
                        <div className="flex flex-col gap-2 pt-1 px-2">
                            <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                                <span>Overlap Duration</span>
                                <span>{playerState.crossfadeDuration || 5}s</span>
                            </div>
                            <md-slider
                                min="1" max="12" step="1"
                                value={playerState.crossfadeDuration || 5}
                                labeled
                                onInput={(e: any) => setPlayerState(p => ({ ...p, crossfadeDuration: Number(e.target.value) }))}
                            ></md-slider>
                        </div>
                    </ToggleRow>

                    <div className="h-px bg-outline-variant/50 mx-4" />
                    
                    <ToggleRow 
                        label="Normalize Volume" 
                        subLabel="Consistent loudness across tracks"
                        checked={playerState.normalizationEnabled}
                        onChange={(val: boolean) => setPlayerState(p => ({ ...p, normalizationEnabled: val }))} 
                    />
                </div>
            </section>

            <section>
                <h2 className="text-label-large font-bold text-primary px-4 mb-2 uppercase tracking-wider">Experimental</h2>
                <div className="bg-surface-container rounded-3xl overflow-hidden shadow-sm border border-outline-variant/10 p-2">
                     <ToggleRow
                        label="Word-by-word Lyrics"
                        subLabel="Automatically estimate word timings for Karaoke mode"
                        checked={wordSyncEnabled}
                        onChange={handleWordSyncToggle}
                    />
                </div>
            </section>

            <section>
                <h2 className="text-label-large font-bold text-primary px-4 mb-2 uppercase tracking-wider">About</h2>
                <div className="bg-surface-container rounded-3xl p-6 text-center shadow-sm border border-outline-variant/10">
                    <p className="font-bold text-headline-small text-on-surface">Adi Music</p>
                    <p className="text-body-small text-on-surface-variant mt-1">v1.3.0 • Material Design 3 Expressive</p>
                </div>
            </section>
        </motion.div>
    );
};


// --- MAIN LIBRARY COMPONENT ---
const Library: React.FC<LibraryProps> = ({ 
  activeTab, libraryTab, setLibraryTab, filteredTracks, 
  playerState, setPlayerState, playTrack, refreshLibrary, isLoading = false, onFileUpload
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [playlists, setPlaylists] = useState<Record<string, Playlist>>({});
  const [tracksMap, setTracksMap] = useState<Record<string, Track>>({});
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedArtistKey, setSelectedArtistKey] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<{name: string, artist: string} | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('added');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [trackToAddId, setTrackToAddId] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    const load = async () => {
        const pl = await dbService.getAllPlaylists();
        const t = await dbService.getAllTracks();
        setPlaylists(pl.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}));
        setTracksMap(t.reduce((acc, tr) => ({ ...acc, [tr.id]: tr }), {}));
    };
    load();
  }, [libraryTab, refreshLibrary]);

  // Derived Data
  const artistsList = useMemo(() => {
    const map = new Map<string, { display: string; count: number; cover?: string }>();
    filteredTracks.forEach(t => {
        const artist = t.artist || 'Unknown Artist';
        const normalized = artist.trim().toLowerCase();
        const current = map.get(normalized);

        if (current) {
             map.set(normalized, {
                 display: current.display,
                 count: current.count + 1,
                 cover: current.cover || t.coverArt
             });
        } else {
             map.set(normalized, {
                 display: artist,
                 count: 1,
                 cover: t.coverArt
             });
        }
    });

    return Array.from(map.entries())
        .map(([key, data]) => ({
            key,
            name: data.display,
            count: data.count,
            cover: data.cover
        }))
        .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTracks, searchQuery]);

  // Derived: Albums
  const albumsList = useMemo(() => {
    const map = new Map<string, { title: string; artist: string; count: number; cover?: string }>();
    filteredTracks.forEach(t => {
        const album = t.album || 'Unknown Album';
        const artist = t.artist || 'Unknown Artist';
        const key = `${album.toLowerCase()}::${artist.toLowerCase()}`;

        if (map.has(key)) {
            const current = map.get(key)!;
            map.set(key, { ...current, count: current.count + 1 });
        } else {
            map.set(key, { title: album, artist: artist, count: 1, cover: t.coverArt });
        }
    });

    return Array.from(map.values())
        .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredTracks, searchQuery]);

  const sortedTracks = useMemo(() => {
      let base = [...filteredTracks];
      if (libraryTab === 'Favorites') {
          base = base.filter(t => t.isFavorite);
      }
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          base = base.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
      }

      return base.sort((a, b) => {
          if (sortOption === 'title') return a.title.localeCompare(b.title);
          if (sortOption === 'artist') return a.artist.localeCompare(b.artist);
          return b.addedAt - a.addedAt; // Default 'added'
      });
  }, [filteredTracks, sortOption, libraryTab, searchQuery]);

  // Handlers
  const handlePlayTrack = useCallback((id: string) => {
      let queue = sortedTracks.map(t => t.id);
      if (selectedArtistKey) {
          queue = sortedTracks
            .filter(t => (t.artist || 'Unknown Artist').trim().toLowerCase() === selectedArtistKey)
            .map(t => t.id);
      } else if (selectedAlbum) {
          queue = sortedTracks
             .filter(t => t.album === selectedAlbum.name && t.artist === selectedAlbum.artist)
             .map(t => t.id);
      }
      playTrack(id, { customQueue: queue });
  }, [playTrack, sortedTracks, selectedArtistKey, selectedAlbum]);

  const handleDelete = useCallback((id: string) => {
    if(confirm('Delete track permanently?')) {
       dbService.deleteTrack(id);
       refreshLibrary();
    }
  }, [refreshLibrary]);

  const openAddToPlaylist = useCallback((id: string) => {
      setTrackToAddId(id);
      setIsPlaylistModalOpen(true);
  }, []);

  const handlePlaylistSelect = async (playlistId: string) => {
      if (!trackToAddId) return;
      const playlist = playlists[playlistId];
      if (playlist.trackIds.includes(trackToAddId)) {
          alert("Track already in playlist");
          return;
      }
      const updatedPlaylist = { ...playlist, trackIds: [...playlist.trackIds, trackToAddId], updatedAt: Date.now() };
      await dbService.savePlaylist(updatedPlaylist);
      setPlaylists(prev => ({ ...prev, [playlistId]: updatedPlaylist }));
      setIsPlaylistModalOpen(false);
      setTrackToAddId(null);
  };

  const handleCreatePlaylist = async (name: string) => {
      if (!trackToAddId) return;
      const id = crypto.randomUUID();
      const newPlaylist: Playlist = {
          id, name, trackIds: [trackToAddId], createdAt: Date.now(), updatedAt: Date.now()
      };
      await dbService.savePlaylist(newPlaylist);
      setPlaylists(prev => ({ ...prev, [id]: newPlaylist }));
      setIsPlaylistModalOpen(false);
      setTrackToAddId(null);
  };

  const tracksToRender = useMemo(() => {
      if (selectedArtistKey) {
          return sortedTracks.filter(t => (t.artist || 'Unknown Artist').trim().toLowerCase() === selectedArtistKey);
      }
      if (selectedAlbum) {
          return sortedTracks.filter(t => t.album === selectedAlbum.name && t.artist === selectedAlbum.artist);
      }
      return sortedTracks;
  }, [sortedTracks, selectedArtistKey, selectedAlbum]);

  // Tabs
  const tabIndexMap: Record<string, number> = {
      'Songs': 0, 'Favorites': 1, 'Albums': 2, 'Artists': 3, 'Playlists': 4, 'Settings': 5
  };
  const tabKeys = Object.keys(tabIndexMap) as LibraryTab[];

  return (
    <>
        <div className="flex flex-col h-full px-4 md:px-8 max-w-7xl mx-auto w-full">
            {/* Header Area */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl pt-6 pb-4 -mx-4 px-4 md:-mx-8 md:px-8 transition-all border-b border-surface-variant/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h1 className="text-display-small font-black text-on-surface tracking-tight">Library</h1>

                    {/* Search & Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                         <md-outlined-text-field
                            placeholder={`Search ${libraryTab}...`}
                            value={searchQuery}
                            onInput={(e: any) => setSearchQuery(e.target.value)}
                            style={{ flex: 1, minWidth: '200px', '--md-outlined-text-field-container-shape': '28px' }}
                         >
                            <md-icon slot="leading-icon" class="material-symbols-rounded">search</md-icon>
                         </md-outlined-text-field>

                         {onFileUpload && (
                            <label className="cursor-pointer">
                                <md-filled-tonal-button onClick={() => fileInputRef.current?.click()}>
                                    <md-icon slot="icon" class="material-symbols-rounded">add</md-icon>
                                    Add
                                </md-filled-tonal-button>
                                <input ref={fileInputRef} type="file" multiple accept="audio/*,.zip" onChange={onFileUpload} className="hidden" />
                            </label>
                         )}

                         <md-icon-button onClick={() => setLibraryTab('Settings')}>
                             <md-icon class="material-symbols-rounded">settings</md-icon>
                         </md-icon-button>
                    </div>
                </div>

                {/* Tabs */}
                <md-tabs active-tab-index={tabIndexMap[libraryTab]}>
                    {tabKeys.map((tab) => (
                        <md-primary-tab
                            key={tab}
                            onClick={() => {
                                setLibraryTab(tab);
                                setSelectedArtist(null);
                                setSelectedArtistKey(null);
                                setSelectedAlbum(null);
                            }}
                            selected={libraryTab === tab}
                        >
                            {tab}
                            {tab === 'Favorites' && <md-icon slot="icon" class="material-symbols-rounded">favorite</md-icon>}
                        </md-primary-tab>
                    ))}
                </md-tabs>

                {/* Filters / Chips (only for Songs/Favorites/Artists) */}
                {['Songs', 'Favorites'].includes(libraryTab) && !selectedArtistKey && (
                     <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
                         <md-chip-set>
                            <md-filter-chip
                                label="Recently Added"
                                selected={sortOption === 'added'}
                                onClick={() => setSortOption('added')}
                            ></md-filter-chip>
                            <md-filter-chip
                                label="A-Z"
                                selected={sortOption === 'title'}
                                onClick={() => setSortOption('title')}
                            ></md-filter-chip>
                            <md-filter-chip
                                label="Artist"
                                selected={sortOption === 'artist'}
                                onClick={() => setSortOption('artist')}
                            ></md-filter-chip>
                         </md-chip-set>
                     </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex flex-col flex-1 min-h-0 w-full pb-32 mt-6">
                {isLoading ? (
                    <LibrarySkeleton />
                ) : (
                    <AnimatePresence mode="wait">

                        {/* VIEW: SONGS / FAVORITES (Grid of Cards) */}
                        {(libraryTab === 'Songs' || libraryTab === 'Favorites') && (
                            <motion.div 
                                key="songs-grid"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                            >
                                {tracksToRender.length > 0 ? (
                                    tracksToRender.map((track) => (
                                        <LibraryCard
                                            key={track.id}
                                            title={track.title}
                                            subtitle={track.artist}
                                            image={track.coverArt}
                                            active={playerState.currentTrackId === track.id}
                                            playing={playerState.isPlaying}
                                            onPlay={(e) => handlePlayTrack(track.id)}
                                            onClick={() => handlePlayTrack(track.id)} // Click plays for now
                                            actions={
                                                <>
                                                    <md-icon-button onClick={(e: any) => { e.stopPropagation(); openAddToPlaylist(track.id); }}>
                                                        <md-icon class="material-symbols-rounded">playlist_add</md-icon>
                                                    </md-icon-button>
                                                    <md-icon-button onClick={(e: any) => { e.stopPropagation(); handleDelete(track.id); }}>
                                                        <md-icon class="material-symbols-rounded">delete</md-icon>
                                                    </md-icon-button>
                                                </>
                                            }
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-on-surface-variant/40">
                                        <md-icon class="material-symbols-rounded" style={{ fontSize: '64px', opacity: 0.5 }}>{libraryTab === 'Favorites' ? 'favorite' : 'music_off'}</md-icon>
                                        <p className="mt-4">{libraryTab === 'Favorites' ? "No favorite tracks yet" : "Your library is empty"}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* VIEW: ARTISTS */}
                        {libraryTab === 'Artists' && (
                            selectedArtistKey ? (
                                <motion.div key="artist-detail" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <md-icon-button onClick={() => { setSelectedArtist(null); setSelectedArtistKey(null); }}>
                                            <md-icon class="material-symbols-rounded">arrow_back</md-icon>
                                        </md-icon-button>
                                        <h2 className="text-headline-medium font-bold">{selectedArtist}</h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {tracksToRender.map((track) => (
                                            <LibraryCard
                                                key={track.id}
                                                title={track.title}
                                                subtitle={track.artist}
                                                image={track.coverArt}
                                                active={playerState.currentTrackId === track.id}
                                                playing={playerState.isPlaying}
                                                onPlay={() => handlePlayTrack(track.id)}
                                                onClick={() => handlePlayTrack(track.id)}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="artists-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                                >
                                    {artistsList.map((artist) => (
                                        <ArtistCard
                                            key={artist.key}
                                            name={artist.name}
                                            subtitle={`${artist.count} ${artist.count === 1 ? 'song' : 'songs'}`}
                                            fallbackCover={artist.cover}
                                            onClick={() => { setSelectedArtist(artist.name); setSelectedArtistKey(artist.key); }}
                                        />
                                    ))}
                                </motion.div>
                            )
                        )}

                        {/* VIEW: PLAYLISTS */}
                        {libraryTab === 'Playlists' && (
                            <Playlists
                                playlists={playlists}
                                tracks={tracksMap}
                                playTrack={playTrack}
                                refreshLibrary={refreshLibrary}
                            />
                        )}

                        {/* VIEW: ALBUMS */}
                        {libraryTab === 'Albums' && (
                            selectedAlbum ? (
                                <motion.div key="album-detail" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <md-icon-button onClick={() => setSelectedAlbum(null)}>
                                            <md-icon class="material-symbols-rounded">arrow_back</md-icon>
                                        </md-icon-button>
                                        <div>
                                             <h2 className="text-headline-medium font-bold">{selectedAlbum.name}</h2>
                                             <p className="text-title-medium text-on-surface-variant">{selectedAlbum.artist}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {tracksToRender.map((track) => (
                                            <LibraryCard
                                                key={track.id}
                                                title={track.title}
                                                subtitle={formatDuration(track.duration)}
                                                image={track.coverArt}
                                                active={playerState.currentTrackId === track.id}
                                                playing={playerState.isPlaying}
                                                onPlay={() => handlePlayTrack(track.id)}
                                                onClick={() => handlePlayTrack(track.id)}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="albums-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                                >
                                    {albumsList.map((album) => (
                                        <LibraryCard
                                            key={`${album.title}-${album.artist}`}
                                            title={album.title}
                                            subtitle={album.artist}
                                            image={album.cover}
                                            fallbackIcon="album"
                                            onClick={() => setSelectedAlbum({ name: album.title, artist: album.artist })}
                                        />
                                    ))}
                                </motion.div>
                            )
                        )}

                        {/* VIEW: SETTINGS */}
                        {libraryTab === 'Settings' && (
                             <SettingsTab playerState={playerState} setPlayerState={setPlayerState} />
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>

        <AddToPlaylistModal
            isOpen={isPlaylistModalOpen}
            onClose={() => setIsPlaylistModalOpen(false)}
            playlists={Object.values(playlists)}
            onSelectPlaylist={handlePlaylistSelect}
            onCreatePlaylist={handleCreatePlaylist}
        />
    </>
  );
};

export default Library;
