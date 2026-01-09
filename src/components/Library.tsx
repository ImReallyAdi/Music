import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, Play, Shuffle, ListFilter, Settings, Trash2, 
  PlusCircle, Loader2, X, Mic2, Users, ChevronLeft, 
  Disc, Heart, Check, Sparkles, Key, FileText
} from 'lucide-react';
import { Track, PlayerState, Playlist } from '../types';
import { dbService } from '../db';
import Playlists from './Playlists';
import AddToPlaylistModal from './AddToPlaylistModal';
import { getOrFetchArtistImage } from '../utils/artistImage';
import { parseLrc } from '../utils/lyrics';
import { useToast } from './Toast';

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

const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-2 px-2 opacity-50">
    <div className="w-14 h-14 rounded-lg bg-surface-variant animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 bg-surface-variant rounded-full animate-pulse" />
      <div className="h-3 w-1/4 bg-surface-variant/50 rounded-full animate-pulse" />
    </div>
  </div>
);

const ArtistRow = memo(({ artist, displayArtist, trackCount, coverArt, onClick }: {
    artist: string; displayArtist: string; trackCount: number; coverArt?: string; onClick: () => void;
}) => {
    const [image, setImage] = useState<string | undefined>(coverArt);

    useEffect(() => {
        let active = true;
        const load = async () => {
             const wikiImage = await getOrFetchArtistImage(displayArtist);
             if (active) {
                 if (wikiImage) setImage(wikiImage);
                 else if (!image && coverArt) setImage(coverArt);
             }
        };
        load();
        return () => { active = false; };
    }, [displayArtist, coverArt]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className="mb-2"
        >
            <mc-card variant="filled" style={{ width: '100%', cursor: 'pointer', backgroundColor: 'var(--md-sys-color-surface-container)' } as any}>
                <div className="flex items-center p-3 gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-variant flex-shrink-0 relative">
                        {image ? (
                            <img src={image} alt={displayArtist} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-variant-dim">
                                <mc-icon name="group" style={{ color: 'var(--md-sys-color-on-surface-variant)' } as any}></mc-icon>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate text-on-surface">{displayArtist}</h3>
                        <p className="text-sm text-on-surface-variant">{trackCount} {trackCount === 1 ? 'Song' : 'Songs'}</p>
                    </div>
                    <mc-icon name="navigate_next" style={{ color: 'var(--md-sys-color-on-surface-variant)' } as any}></mc-icon>
                </div>
                <mc-ripple></mc-ripple>
            </mc-card>
        </motion.div>
    );
});
ArtistRow.displayName = 'ArtistRow';

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
            className="mb-1"
        >
            <mc-card
                variant={isCurrentTrack ? "filled" : "filled"} // Always filled for consistency but change color
                style={{
                    width: '100%',
                    cursor: 'pointer',
                    backgroundColor: isCurrentTrack ? 'var(--md-sys-color-primary-container)' : 'transparent',
                    boxShadow: 'none' // Flat list look
                } as any}
                onClick={() => onPlay(track.id)}
            >
                <div className="flex items-center p-2 gap-3">
                     {/* Thumbnail */}
                    <div className="relative w-12 h-12 flex-shrink-0">
                        <div className="w-full h-full rounded-lg overflow-hidden bg-surface-variant">
                            {track.coverArt ? (
                                <img
                                    src={track.coverArt}
                                    alt={track.title}
                                    className={`w-full h-full object-cover ${isCurrentTrack && isPlaying ? 'opacity-40' : 'opacity-100'}`}
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <mc-icon name="music_note"></mc-icon>
                                </div>
                            )}
                        </div>
                        {isCurrentTrack && isPlaying && (
                             <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-on-primary-container animate-spin" />
                             </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className={`text-base font-medium truncate ${isCurrentTrack ? 'text-on-primary-container' : 'text-on-surface'}`}>
                            {track.title}
                        </h3>
                        <p className={`text-sm truncate ${isCurrentTrack ? 'text-on-primary-container' : 'text-on-surface-variant'}`} style={{ opacity: 0.8 }}>
                            {track.artist}
                        </p>
                    </div>

                    <div className="hidden sm:block text-xs font-mono text-on-surface-variant mr-2">
                        {formatDuration(track.duration)}
                    </div>

                    {/* Menu Trigger (using standard dropdown or just buttons for now) */}
                    <div className="flex gap-0">
                         <mc-icon-button onClick={(e: any) => { e.stopPropagation(); onUploadLyrics(track.id); }} size="small">
                            <mc-icon name="description" style={{ fontSize: '20px' } as any}></mc-icon>
                         </mc-icon-button>
                         <mc-icon-button onClick={(e: any) => { e.stopPropagation(); onAddToPlaylist(track.id); }} size="small">
                            <mc-icon name="playlist_add" style={{ fontSize: '20px' } as any}></mc-icon>
                         </mc-icon-button>
                         <mc-icon-button onClick={(e: any) => { e.stopPropagation(); onDelete(track.id); }} size="small">
                             <mc-icon name="delete" style={{ fontSize: '20px' } as any}></mc-icon>
                         </mc-icon-button>
                    </div>
                </div>
                <mc-ripple></mc-ripple>
            </mc-card>
        </motion.div>
    );
});
TrackRow.displayName = 'TrackRow';

const ToggleRow = ({ label, subLabel, checked, onChange, children }: any) => (
    <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-base font-medium text-on-surface">{label}</span>
                {subLabel && <span className="text-xs text-on-surface-variant">{subLabel}</span>}
            </div>
            <mc-switch checked={checked} onclick={() => onChange(!checked)}></mc-switch>
        </div>
        {checked && children && (
            <div className="mt-2 pl-2 border-l-2 border-primary/20">
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
            className="flex flex-col gap-6 p-4 max-w-2xl mx-auto w-full"
        >
             <mc-card variant="outlined" style={{ padding: '16px', backgroundColor: 'transparent' } as any}>
                <h2 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Playback</h2>
                <ToggleRow
                    label="Automix"
                    subLabel="Smart transitions & AI blending"
                    checked={playerState.automixEnabled}
                    onChange={(val: boolean) => setPlayerState(p => ({ ...p, automixEnabled: val }))}
                >
                     {/* Inline controls for mode selection can be improved with mc-chips or similar if available */}
                     <div className="flex gap-2 mt-2">
                        {['classic', 'smart', 'shuffle'].map((mode) => (
                            <mc-button
                                key={mode}
                                variant={playerState.automixMode === mode ? 'filled' : 'outlined'}
                                size="small"
                                onClick={() => setPlayerState(p => ({ ...p, automixMode: mode as any }))}
                            >
                                {mode}
                            </mc-button>
                        ))}
                     </div>
                </ToggleRow>

                <div className="h-px bg-outline/20 my-2" />

                <ToggleRow
                    label="Crossfade"
                    subLabel="Overlap songs"
                    checked={playerState.crossfadeEnabled}
                    onChange={(val: boolean) => setPlayerState(p => ({ ...p, crossfadeEnabled: val }))}
                >
                     <div className="pt-2 px-1">
                        <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                            <span>Duration: {playerState.crossfadeDuration || 5}s</span>
                        </div>
                        <mc-slider
                            min={1} max={12} step={1}
                            value={playerState.crossfadeDuration || 5}
                            onchange={(e: any) => setPlayerState(p => ({ ...p, crossfadeDuration: Number(e.target.value) }))}
                        ></mc-slider>
                     </div>
                </ToggleRow>

                <div className="h-px bg-outline/20 my-2" />

                <ToggleRow
                    label="Normalize Volume"
                    subLabel="Consistent loudness"
                    checked={playerState.normalizationEnabled}
                    onChange={(val: boolean) => setPlayerState(p => ({ ...p, normalizationEnabled: val }))}
                />
            </mc-card>

            <mc-card variant="outlined" style={{ padding: '16px', backgroundColor: 'transparent' } as any}>
                <h2 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Experimental</h2>
                <ToggleRow
                    label="Word-by-word Lyrics"
                    subLabel="Auto-generate timestamps"
                    checked={wordSyncEnabled}
                    onChange={handleWordSyncToggle}
                />
            </mc-card>
        </motion.div>
    );
};

const Library: React.FC<LibraryProps> = ({ 
  activeTab, libraryTab, setLibraryTab, filteredTracks, 
  playerState, setPlayerState, playTrack, refreshLibrary, isLoading = false 
}) => {
  const { addToast } = useToast();
  
  const [playlists, setPlaylists] = useState<Record<string, Playlist>>({});
  const [tracksMap, setTracksMap] = useState<Record<string, Track>>({});
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedArtistKey, setSelectedArtistKey] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('added');
  
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [trackToAddId, setTrackToAddId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lyricTrackId, setLyricTrackId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
        const pl = await dbService.getAllPlaylists();
        const t = await dbService.getAllTracks();
        setPlaylists(pl.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}));
        setTracksMap(t.reduce((acc, tr) => ({ ...acc, [tr.id]: tr }), {}));
    };
    load();
  }, [libraryTab, refreshLibrary]);

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
        .map(([key, data]) => ({ key, name: data.display, count: data.count, cover: data.cover }))
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTracks]);

  const sortedTracks = useMemo(() => {
      let base = [...filteredTracks];
      if (libraryTab === 'Favorites') base = base.filter(t => t.isFavorite);
      return base.sort((a, b) => {
          if (sortOption === 'title') return a.title.localeCompare(b.title);
          if (sortOption === 'artist') return a.artist.localeCompare(b.artist);
          return b.addedAt - a.addedAt;
      });
  }, [filteredTracks, sortOption, libraryTab]);

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
          if (fileInputRef.current) fileInputRef.current.value = '';
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

  const tracksToRender = selectedArtistKey
    ? sortedTracks.filter(t => (t.artist || 'Unknown Artist').trim().toLowerCase() === selectedArtistKey)
    : sortedTracks;

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
            {/* Header & Tabs */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-6 pb-2 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-on-surface tracking-tight">Library</h1>
                    <mc-icon-button onClick={() => setLibraryTab('Settings')}>
                        <mc-icon name="settings"></mc-icon>
                    </mc-icon-button>
                </div>

                <mc-tabs onchange={(e: any) => {
                    const idx = e.target.activeTabIndex;
                    const tabs: LibraryTab[] = ['Songs', 'Favorites', 'Albums', 'Artists', 'Playlists'];
                    if (tabs[idx]) {
                        setLibraryTab(tabs[idx]);
                        setSelectedArtist(null);
                        setSelectedArtistKey(null);
                    }
                }}>
                    <mc-tab label="Songs" active={libraryTab === 'Songs'}></mc-tab>
                    <mc-tab label="Favorites" active={libraryTab === 'Favorites'}></mc-tab>
                    <mc-tab label="Albums" active={libraryTab === 'Albums'}></mc-tab>
                    <mc-tab label="Artists" active={libraryTab === 'Artists'}></mc-tab>
                    <mc-tab label="Playlists" active={libraryTab === 'Playlists'}></mc-tab>
                </mc-tabs>
            </div>

            {/* Controls */}
            {(libraryTab === 'Songs' || libraryTab === 'Favorites') && !selectedArtistKey && (
                <div className="flex items-center gap-3 my-4">
                    <mc-button
                        variant="filled"
                        onClick={handleShuffleAll}
                        disabled={sortedTracks.length === 0}
                        style={{ flex: 1 } as any}
                    >
                        <mc-icon slot="icon" name="shuffle"></mc-icon>
                        Shuffle Library
                    </mc-button>
                    {/* Simplified Sort for now */}
                    <mc-icon-button onClick={() => setSortOption(sortOption === 'title' ? 'added' : 'title')}>
                         <mc-icon name="sort_by_alpha"></mc-icon>
                    </mc-icon-button>
                </div>
            )}

            {/* Content Area */}
            <div className="flex flex-col flex-1 min-h-0 w-full pb-24">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                    <AnimatePresence mode="wait">
                        {(libraryTab === 'Songs' || libraryTab === 'Favorites') && (
                            <motion.div 
                                key="songs-list"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col w-full"
                            >
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
                                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                        <mc-icon name={libraryTab === 'Favorites' ? "favorite" : "music_off"} style={{ fontSize: '64px' } as any}></mc-icon>
                                        <p className="mt-4">{libraryTab === 'Favorites' ? "No favorites yet" : "Library empty"}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {libraryTab === 'Artists' && (
                            selectedArtistKey ? (
                                <motion.div key="artist-detail" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                    <div className="flex items-center gap-4 mb-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-2">
                                        <mc-icon-button onClick={() => { setSelectedArtist(null); setSelectedArtistKey(null); }}>
                                            <mc-icon name="arrow_back"></mc-icon>
                                        </mc-icon-button>
                                        <h2 className="text-2xl font-bold">{selectedArtist}</h2>
                                    </div>
                                    <div className="flex flex-col gap-1">
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
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="artists-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-1">
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
                                </motion.div>
                            )
                        )}

                        {libraryTab === 'Playlists' && (
                            <Playlists
                                playlists={playlists}
                                tracks={tracksMap}
                                playTrack={playTrack}
                                refreshLibrary={refreshLibrary}
                            />
                        )}

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
