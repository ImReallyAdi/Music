import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, Play, Shuffle, ListFilter, Settings, Trash2, 
  PlusCircle, Loader2, X, Mic2, Users, ChevronLeft, 
  Disc, Heart, Check, Sparkles, Key, FileText, Pause
} from 'lucide-react';
import { Track, PlayerState, Playlist } from '../types';
import { dbService } from '../db';
import Playlists from './Playlists';
import AddToPlaylistModal from './AddToPlaylistModal';
import { getOrFetchArtistImage } from '../utils/artistImage';
import { parseLrc } from '../utils/lyrics';
import { useToast } from './Toast';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/secondary-tab.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/switch/switch.js';
import '@material/web/slider/slider.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-tabs': any;
      'md-primary-tab': any;
      'md-secondary-tab': any;
      'md-switch': any;
      'md-list': any;
      'md-list-item': any;
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
}

// --- UTILS ---
const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// --- COMPONENTS ---

const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-2 px-2 opacity-50">
    <div className="w-14 h-14 rounded-[12px] bg-surface-variant animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 bg-surface-variant rounded-full animate-pulse" />
      <div className="h-3 w-1/4 bg-surface-variant/50 rounded-full animate-pulse" />
    </div>
  </div>
);

// Optimized Artist Row
// Handles lazy loading of artist images
const ArtistRow = memo(({ artist, displayArtist, trackCount, coverArt, onClick }: {
    artist: string; displayArtist: string; trackCount: number; coverArt?: string; onClick: () => void;
}) => {
    const [image, setImage] = useState<string | undefined>(coverArt);

    useEffect(() => {
        let active = true;
        const load = async () => {
             const wikiImage = await getOrFetchArtistImage(displayArtist);
             if (active) {
                 if (wikiImage) {
                     setImage(wikiImage);
                 } else if (!image && coverArt) {
                     setImage(coverArt);
                 }
             }
        };
        load();
        return () => { active = false; };
    }, [displayArtist, coverArt]);

    return (
        <md-list-item
            type="button"
            onClick={onClick}
            headline={displayArtist}
            supportingText={`${trackCount} ${trackCount === 1 ? 'Song' : 'Songs'}`}
            style={{ cursor: 'pointer', '--md-list-item-leading-image-height': '56px', '--md-list-item-leading-image-width': '56px', '--md-list-item-leading-image-shape': '9999px' }}
        >
             <div slot="start" className="w-14 h-14 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center relative">
                {image ? (
                    <img src={image} alt={displayArtist} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <Users className="w-6 h-6 text-on-surface-variant/50" />
                )}
            </div>
            <md-icon slot="end"><ChevronLeft className="rotate-180" /></md-icon>
        </md-list-item>
    );
});
ArtistRow.displayName = 'ArtistRow';

// Optimized Track Row using Material Web List Item
const TrackRow = memo(({ 
  track, index, onPlay, isPlaying, isCurrentTrack, onDelete, onAddToPlaylist, onUploadLyrics 
}: { 
  track: Track; 
  index: number; 
  onPlay: (id: string) => void;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onDelete: (id: string) => void;
  onAddToPlaylist: (id: string) => void;
  onUploadLyrics: (id: string) => void;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.2 }}
        >
            <md-list-item
                type="button"
                onClick={() => onPlay(track.id)}
                headline={track.title}
                supportingText={track.artist}
                trailingSupportingText={formatDuration(track.duration)}
                style={{
                    cursor: 'pointer',
                    '--md-list-item-leading-image-height': '56px',
                    '--md-list-item-leading-image-width': '56px',
                    '--md-list-item-leading-image-shape': '12px',
                    backgroundColor: isCurrentTrack ? 'var(--md-sys-color-surface-container-high)' : 'transparent'
                }}
            >
                {/* Thumbnail */}
                <div slot="start" className="relative w-14 h-14 rounded-[12px] overflow-hidden bg-surface-variant flex items-center justify-center">
                    {track.coverArt ? (
                        <img 
                            src={track.coverArt} 
                            alt={track.title}
                            className={`w-full h-full object-cover transition-opacity ${isCurrentTrack && isPlaying ? 'opacity-40' : 'opacity-100'}`} 
                            loading="lazy" 
                        />
                    ) : (
                        <Music className={`w-6 h-6 ${isCurrentTrack ? 'text-primary' : 'text-on-surface-variant/40'}`} />
                    )}

                    {/* Overlay Icon */}
                     {isCurrentTrack && (
                         <div className="absolute inset-0 flex items-center justify-center">
                              {isPlaying ? (
                                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                              ) : (
                                  <Pause className="w-6 h-6 text-primary" fill="currentColor" />
                              )}
                         </div>
                     )}
                </div>

                {/* Actions */}
                <div slot="end" className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <md-icon-button onClick={() => onUploadLyrics(track.id)}>
                        <md-icon><FileText size={20} /></md-icon>
                    </md-icon-button>
                     <md-icon-button onClick={() => onAddToPlaylist(track.id)}>
                        <md-icon><PlusCircle size={20} /></md-icon>
                    </md-icon-button>
                     <md-icon-button onClick={() => onDelete(track.id)}>
                        <md-icon><Trash2 size={20} /></md-icon>
                    </md-icon-button>
                </div>
            </md-list-item>
        </motion.div>
    );
});
TrackRow.displayName = 'TrackRow';


// --- SETTINGS COMPONENT ---
const ToggleRow = ({ label, subLabel, checked, onChange, children }: any) => (
    <div className="flex flex-col gap-2 py-2">
        <md-list-item
            type="button"
            headline={label}
            supportingText={subLabel}
            // non-interactive because the switch handles it
        >
             <md-switch slot="end" selected={checked} onClick={(e: any) => {
                 // Prevent bubbling if needed, though list item isn't handling click here
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

const SettingsTab = ({ playerState, setPlayerState }: { playerState: PlayerState, setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>> }) => {
    const [wordSyncEnabled, setWordSyncEnabled] = useState(false);

    useEffect(() => {
        dbService.getSetting<boolean>('wordSyncEnabled').then(val => setWordSyncEnabled(val || false));
    }, []);

    const handleWordSyncToggle = (enabled: boolean) => {
        setWordSyncEnabled(enabled);
        dbService.setSetting('wordSyncEnabled', enabled);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col gap-6 p-1 max-w-2xl mx-auto w-full"
        >
            <section>
                <h2 className="text-label-large font-bold text-primary px-4 mb-2">Playback</h2>
                <div className="bg-surface-container rounded-3xl overflow-hidden">
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
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                                            playerState.automixMode === mode
                                            ? 'bg-primary-container text-on-primary-container'
                                            : 'bg-surface-container-high text-on-surface-variant'
                                        }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </ToggleRow>

                    <div className="h-px bg-outline-variant mx-4" />

                    <ToggleRow 
                        label="Crossfade" 
                        subLabel="Overlap songs for smoothness" 
                        checked={playerState.crossfadeEnabled} 
                        onChange={(val: boolean) => setPlayerState(p => ({ ...p, crossfadeEnabled: val }))}
                    >
                        <div className="flex flex-col gap-2 pt-1 px-2">
                            <div className="flex justify-between text-xs text-on-surface-variant">
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

                    <div className="h-px bg-outline-variant mx-4" />
                    
                    <ToggleRow 
                        label="Normalize Volume" 
                        subLabel="Consistent loudness across tracks"
                        checked={playerState.normalizationEnabled}
                        onChange={(val: boolean) => setPlayerState(p => ({ ...p, normalizationEnabled: val }))} 
                    />
                </div>
            </section>

            <section>
                <h2 className="text-label-large font-bold text-primary px-4 mb-2">Experimental</h2>
                <div className="bg-surface-container rounded-3xl overflow-hidden">
                     <ToggleRow
                        label="Word-by-word Lyrics"
                        subLabel="Automatically estimate word timings for Karaoke mode"
                        checked={wordSyncEnabled}
                        onChange={handleWordSyncToggle}
                    />
                </div>
            </section>

            <section>
                <h2 className="text-label-large font-bold text-primary px-4 mb-2">About</h2>
                <div className="bg-surface-container rounded-3xl p-5 text-center">
                    <p className="font-bold text-on-surface">Adi Music</p>
                    <p className="text-xs text-on-surface-variant mt-1">v1.2.0 • Material Design 3</p>
                </div>
            </section>
        </motion.div>
    );
};


// --- MAIN LIBRARY COMPONENT ---
const Library: React.FC<LibraryProps> = ({ 
  activeTab, libraryTab, setLibraryTab, filteredTracks, 
  playerState, setPlayerState, playTrack, refreshLibrary, isLoading = false 
}) => {
  const { addToast } = useToast();
  
  // State
  const [playlists, setPlaylists] = useState<Record<string, Playlist>>({});
  const [tracksMap, setTracksMap] = useState<Record<string, Track>>({});
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedArtistKey, setSelectedArtistKey] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('added');
  
  // Modal State
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [trackToAddId, setTrackToAddId] = useState<string | null>(null);

  // Lyrics Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lyricTrackId, setLyricTrackId] = useState<string | null>(null);

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

  // Derived: Artists
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
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTracks]);

  // Derived: Sorted Tracks
  const sortedTracks = useMemo(() => {
      let base = [...filteredTracks];
      if (libraryTab === 'Favorites') {
          base = base.filter(t => t.isFavorite);
      }

      return base.sort((a, b) => {
          if (sortOption === 'title') return a.title.localeCompare(b.title);
          if (sortOption === 'artist') return a.artist.localeCompare(b.artist);
          return b.addedAt - a.addedAt; // Default 'added'
      });
  }, [filteredTracks, sortOption, libraryTab]);

  // Handlers (Memoized)
  const handlePlayTrack = useCallback((id: string) => {
      let queue = sortedTracks.map(t => t.id);
      if (selectedArtistKey) {
          queue = sortedTracks
            .filter(t => (t.artist || 'Unknown Artist').trim().toLowerCase() === selectedArtistKey)
            .map(t => t.id);
      }
      playTrack(id, { customQueue: queue });
  }, [playTrack, sortedTracks, selectedArtistKey]);

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

  const handleUploadLyrics = useCallback((id: string) => {
      setLyricTrackId(id);
      fileInputRef.current?.click();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !lyricTrackId) return;

      try {
          const text = await file.text();
          const parsed = parseLrc(text);
          const track = tracksMap[lyricTrackId];
          
          if (track) {
              const updatedTrack = { ...track, lyrics: parsed };
              await dbService.saveTrack(updatedTrack);
              refreshLibrary();
              addToast("Lyrics updated successfully", "success");
          }
      } catch (err) {
          console.error("Failed to parse/save lyrics:", err);
          addToast("Failed to process lyrics file", "error");
      } finally {
          setLyricTrackId(null);
          if (fileInputRef.current) {
              fileInputRef.current.value = '';
          }
      }
  };

  const handleShuffleAll = () => {
     if (sortedTracks.length > 0) {
        const randomId = sortedTracks[Math.floor(Math.random() * sortedTracks.length)].id;
        playTrack(randomId, { customQueue: sortedTracks.map(t => t.id) });
     }
  };

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

  // View Helpers
  const tracksToRender = selectedArtistKey
    ? sortedTracks.filter(t => (t.artist || 'Unknown Artist').trim().toLowerCase() === selectedArtistKey)
    : sortedTracks;

  // Tabs handling
  const tabIndexMap: Record<string, number> = {
      'Songs': 0, 'Favorites': 1, 'Albums': 2, 'Artists': 3, 'Playlists': 4, 'Settings': 5
  };
  const tabKeys = Object.keys(tabIndexMap) as LibraryTab[];

  return (
    <>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".lrc,.txt" 
            onChange={handleFileSelect} 
        />

        <div className="flex flex-col h-full px-4 md:px-8 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md pt-6 pb-2 -mx-4 px-4 md:-mx-8 md:px-8 transition-all">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-display-small font-bold text-on-surface tracking-tight">Library</h1>
                    <md-icon-button onClick={() => setLibraryTab('Settings')}>
                        <md-icon><Settings /></md-icon>
                    </md-icon-button>
                </div>

                <md-tabs activeTabIndex={tabIndexMap[libraryTab]}>
                    {tabKeys.map((tab) => (
                        <md-primary-tab
                            key={tab}
                            onClick={() => { setLibraryTab(tab); setSelectedArtist(null); setSelectedArtistKey(null); }}
                            selected={libraryTab === tab}
                        >
                            {tab}
                            {tab === 'Favorites' && <md-icon slot="icon"><Heart size={16}/></md-icon>}
                        </md-primary-tab>
                    ))}
                </md-tabs>
            </div>

            {/* Content Area */}
            <div className="flex flex-col flex-1 min-h-0 w-full pb-20 mt-4">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                    <AnimatePresence mode="wait">
                        {/* VIEW: SONGS OR FAVORITES */}
                        {(libraryTab === 'Songs' || libraryTab === 'Favorites') && (
                            <motion.div 
                                key="songs-list"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col gap-1 w-full"
                            >
                                {/* Shuffle Button */}
                                {!selectedArtistKey && (
                                    <div className="mb-4">
                                        <md-list-item type="button" onClick={handleShuffleAll} style={{ backgroundColor: 'var(--md-sys-color-primary-container)', borderRadius: '16px' }}>
                                            <div slot="headline" className="font-bold text-on-primary-container">Shuffle All Tracks</div>
                                            <md-icon slot="start" className="text-on-primary-container"><Shuffle /></md-icon>
                                        </md-list-item>
                                    </div>
                                )}

                                <md-list>
                                {tracksToRender.length > 0 ? (
                                    tracksToRender.map((track, i) => (
                                        <TrackRow
                                            key={track.id}
                                            track={track}
                                            index={i}
                                            onPlay={handlePlayTrack}
                                            isPlaying={playerState.isPlaying}
                                            isCurrentTrack={playerState.currentTrackId === track.id}
                                            onDelete={handleDelete}
                                            onAddToPlaylist={openAddToPlaylist}
                                            onUploadLyrics={handleUploadLyrics}
                                        />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/40">
                                        {libraryTab === 'Favorites' ? <Heart className="w-16 h-16 mb-4 opacity-50 stroke-1" /> : <Music className="w-16 h-16 mb-4 opacity-50 stroke-1" />}
                                        <p>{libraryTab === 'Favorites' ? "No favorite tracks yet" : "Your library is empty"}</p>
                                    </div>
                                )}
                                </md-list>
                            </motion.div>
                        )}

                        {/* VIEW: ARTISTS */}
                        {libraryTab === 'Artists' && (
                            selectedArtistKey ? (
                                <motion.div key="artist-detail" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                    <div className="flex items-center gap-4 mb-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-2">
                                        <md-icon-button onClick={() => { setSelectedArtist(null); setSelectedArtistKey(null); }}>
                                            <md-icon><ChevronLeft /></md-icon>
                                        </md-icon-button>
                                        <h2 className="text-headline-small font-bold">{selectedArtist}</h2>
                                    </div>
                                    <md-list>
                                        {tracksToRender.map((track, i) => (
                                            <TrackRow
                                                key={track.id}
                                                track={track}
                                                index={i}
                                                onPlay={handlePlayTrack}
                                                isPlaying={playerState.isPlaying}
                                                isCurrentTrack={playerState.currentTrackId === track.id}
                                                onDelete={handleDelete}
                                                onAddToPlaylist={openAddToPlaylist}
                                                onUploadLyrics={handleUploadLyrics}
                                            />
                                        ))}
                                    </md-list>
                                </motion.div>
                            ) : (
                                <motion.div key="artists-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-0">
                                    <md-list>
                                    {artistsList.map((artist) => (
                                        <ArtistRow
                                            key={artist.key}
                                            artist={artist.key}
                                            displayArtist={artist.name}
                                            trackCount={artist.count}
                                            coverArt={artist.cover}
                                            onClick={() => { setSelectedArtist(artist.name); setSelectedArtistKey(artist.key); }}
                                        />
                                    ))}
                                    </md-list>
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
