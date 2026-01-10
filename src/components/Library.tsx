import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, Play, Shuffle, ListFilter, Settings, Trash2, 
  PlusCircle, Loader2, X, Mic2, Users, ChevronLeft, 
  Disc, Heart, Check, Sparkles, Key, FileText, Download, ListMusic
} from 'lucide-react';
import { Track, PlayerState, Playlist } from '../types';
import { dbService } from '../db';
import Playlists from './Playlists';
import AddToPlaylistModal from './AddToPlaylistModal';
import { getOrFetchArtistImage } from '../utils/artistImage';
import { parseLrc } from '../utils/lyrics';
import { useToast } from './Toast';

// --- TYPES ---
type LibraryTab = 'All' | 'Playlists' | 'Liked Songs' | 'Artists' | 'Albums' | 'Settings';
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
        // If we don't have a coverArt (album art fallback), or we want to try to get a better artist image
        // Actually, let's prioritize the Artist Image from Wikipedia if available, otherwise fallback to coverArt

        const load = async () => {
             const wikiImage = await getOrFetchArtistImage(displayArtist);
             if (active) {
                 if (wikiImage) {
                     setImage(wikiImage);
                 } else if (!image && coverArt) {
                     // Fallback to what was passed (album art)
                     setImage(coverArt);
                 }
             }
        };
        load();
        return () => { active = false; };
    }, [displayArtist, coverArt]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="flex items-center gap-4 p-2 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors group"
        >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 shadow-sm relative ring-2 ring-white/5">
                {image ? (
                    <img src={image} alt={displayArtist} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        <Users className="w-6 h-6 text-zinc-600" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate text-white">{displayArtist}</h3>
                <p className="text-sm text-zinc-400">{trackCount} {trackCount === 1 ? 'Song' : 'Songs'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-5 h-5 fill-current text-primary ml-0.5" />
            </div>
        </motion.div>
    );
});
ArtistRow.displayName = 'ArtistRow';

// Optimized Track Row
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
            className={`group relative flex items-center gap-4 p-2 rounded-2xl transition-all cursor-pointer border border-transparent ${
                isCurrentTrack 
                ? 'bg-primary/10 border-primary/5 shadow-[0_0_15px_-5px_rgba(163,230,53,0.1)]'
                : 'hover:bg-white/5'
            }`}
            onClick={() => onPlay(track.id)}
        >
            {/* Thumbnail */}
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 group/thumb">
                <div className={`w-full h-full rounded-[14px] overflow-hidden shadow-sm transition-all ${
                    isCurrentTrack ? 'ring-2 ring-primary/30' : 'bg-zinc-800'
                }`}>
                    {track.coverArt ? (
                        <img 
                            src={track.coverArt} 
                            alt={track.title}
                            className={`w-full h-full object-cover transition-opacity ${isCurrentTrack && isPlaying ? 'opacity-40' : 'opacity-100'}`} 
                            loading="lazy" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                            <Music className={`w-6 h-6 ${isCurrentTrack ? 'text-primary' : 'text-zinc-600'}`} />
                        </div>
                    )}
                </div>
                
                {/* Overlay Icon - Always visible on hover for easier play */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                    isCurrentTrack && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 bg-black/20 rounded-[14px] backdrop-blur-[1px]'
                }`}>
                    {isCurrentTrack && isPlaying ? (
                         <div className="flex gap-0.5 items-end h-4 pb-1">
                            <motion.div animate={{ height: [4, 12, 6, 14, 8] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-primary rounded-full" />
                            <motion.div animate={{ height: [10, 4, 14, 6, 10] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-primary rounded-full" />
                            <motion.div animate={{ height: [6, 14, 8, 4, 12] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-primary rounded-full" />
                         </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg transform scale-90 group-hover/thumb:scale-100 transition-transform">
                             <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <h3 className={`text-[15px] font-semibold truncate ${isCurrentTrack ? 'text-primary' : 'text-zinc-100'}`}>
                    {track.title}
                </h3>
                <div className="flex items-center gap-2 text-[13px] text-zinc-400 truncate">
                    <span className="truncate group-hover:text-zinc-200 transition-colors">{track.artist}</span>
                </div>
            </div>

            {/* Play Button (Right Side - Requested) */}
            <button
                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isCurrentTrack && isPlaying ? 'text-primary' : 'text-zinc-400 hover:text-white'}`}
                onClick={(e) => { e.stopPropagation(); onPlay(track.id); }}
            >
               {isCurrentTrack && isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onUploadLyrics(track.id); }}
                    className="p-2 rounded-full text-zinc-500 hover:bg-white/10 hover:text-primary transition-all"
                    title="Upload Lyrics (.lrc)"
                >
                    <FileText className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onAddToPlaylist(track.id); }}
                    className="p-2 rounded-full text-zinc-500 hover:bg-white/10 hover:text-primary transition-all"
                    title="Add to Playlist"
                >
                    <PlusCircle className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(track.id); }}
                    className="p-2 rounded-full text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                    title="Delete Track"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
});
TrackRow.displayName = 'TrackRow';


// --- SETTINGS COMPONENT ---
const ToggleRow = ({ label, subLabel, checked, onChange, children }: any) => (
    <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-base font-medium text-white">{label}</span>
                {subLabel && <span className="text-xs text-zinc-400">{subLabel}</span>}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
        </div>
        {checked && children && (
            <div className="mt-2 pl-2 border-l-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
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
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Playback</h2>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col gap-4">
                    <ToggleRow 
                        label="Automix" 
                        subLabel="Smart transitions & AI blending" 
                        checked={playerState.automixEnabled} 
                        onChange={(val: boolean) => setPlayerState(p => ({ ...p, automixEnabled: val }))}
                    >
                        <div className="flex flex-col gap-3 pt-2">
                            <span className="text-xs font-medium text-zinc-300">Transition Style</span>
                            <div className="grid grid-cols-3 gap-2">
                                {['classic', 'smart', 'shuffle'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setPlayerState(p => ({ ...p, automixMode: mode as any }))}
                                        className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all border ${
                                            playerState.automixMode === mode
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'
                                        }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </ToggleRow>

                    <div className="h-px bg-white/10" />

                    <ToggleRow 
                        label="Crossfade" 
                        subLabel="Overlap songs for smoothness" 
                        checked={playerState.crossfadeEnabled} 
                        onChange={(val: boolean) => setPlayerState(p => ({ ...p, crossfadeEnabled: val }))}
                    >
                        <div className="flex flex-col gap-2 pt-1">
                            <div className="flex justify-between text-xs text-zinc-400">
                                <span>Overlap</span>
                                <span>{playerState.crossfadeDuration || 5}s</span>
                            </div>
                            <input
                                type="range" min="1" max="12" step="1"
                                value={playerState.crossfadeDuration || 5}
                                onChange={(e) => setPlayerState(p => ({ ...p, crossfadeDuration: Number(e.target.value) }))}
                                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    </ToggleRow>

                    <div className="h-px bg-white/10" />
                    
                    <ToggleRow 
                        label="Normalize Volume" 
                        subLabel="Consistent loudness across tracks"
                        checked={playerState.normalizationEnabled}
                        onChange={(val: boolean) => setPlayerState(p => ({ ...p, normalizationEnabled: val }))} 
                    />
                </div>
            </section>

            <section>
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Experimental</h2>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col gap-4">
                     <ToggleRow
                        label="Word-by-word Lyrics"
                        subLabel="Automatically estimate word timings for Karaoke mode"
                        checked={wordSyncEnabled}
                        onChange={handleWordSyncToggle}
                    />
                </div>
            </section>

            <section>
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">About</h2>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-5 text-center">
                    <p className="font-bold text-white">Adi Music</p>
                    <p className="text-xs text-zinc-500 mt-1">v1.2.0 • Build 2024</p>
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
  const [selectedArtistKey, setSelectedArtistKey] = useState<string | null>(null); // New: Store normalized key
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
  // Optimization: Merging logic
  const artistsList = useMemo(() => {
    // Key: Normalized Name (lower cased)
    // Value: { display: string, count: number, cover: string }
    const map = new Map<string, { display: string; count: number; cover?: string }>();

    filteredTracks.forEach(t => {
        const artist = t.artist || 'Unknown Artist';
        const normalized = artist.trim().toLowerCase();

        const current = map.get(normalized);

        if (current) {
             map.set(normalized, {
                 display: current.display, // Keep the first display name encountered, or logic to find best?
                 count: current.count + 1,
                 cover: current.cover || t.coverArt
             });
        } else {
             map.set(normalized, {
                 display: artist, // Use this casing as the display name
                 count: 1,
                 cover: t.coverArt
             });
        }
    });

    return Array.from(map.entries())
        .map(([key, data]) => ({
            key, // normalized key for filtering
            name: data.display,
            count: data.count,
            cover: data.cover
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTracks]);

  // Derived: Sorted Tracks
  const sortedTracks = useMemo(() => {
      let base = [...filteredTracks];
      if (libraryTab === 'Liked Songs') {
          base = base.filter(t => t.isFavorite);
      }

      return base.sort((a, b) => {
          if (sortOption === 'title') return a.title.localeCompare(b.title);
          if (sortOption === 'artist') return a.artist.localeCompare(b.artist);
          return b.addedAt - a.addedAt; // Default 'added'
      });
  }, [filteredTracks, sortOption, libraryTab]);

  // Handlers (Memoized for performance)
  const handlePlayTrack = useCallback((id: string) => {
      // Create the queue based on current view
      let queue = sortedTracks.map(t => t.id);

      // If we are in artist view, filter by normalized key
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
          // Reset file input
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

  // Tabs Configuration
  const tabs = [
      { id: 'All', icon: Music, label: 'All' },
      { id: 'Playlists', icon: ListMusic, label: 'Playlists' },
      { id: 'Liked Songs', icon: Heart, label: 'Liked' },
      { id: 'Artists', icon: Users, label: 'Artists' },
      { id: 'Albums', icon: Disc, label: 'Albums' } // Kept Albums for completeness
  ];

  return (
    <>
        {/* Hidden File Input for Lyrics */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".lrc,.txt" 
            onChange={handleFileSelect} 
        />

        <div className="flex flex-col h-full px-4 md:px-8 max-w-5xl mx-auto w-full">
            {/* Header & Tabs */}
            <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md pt-6 pb-2 -mx-4 px-4 md:-mx-8 md:px-8 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Library</h1>
                    <button 
                        onClick={() => setLibraryTab('Settings')}
                        className={`p-2.5 rounded-full transition-all duration-300 ${libraryTab === 'Settings' ? 'bg-primary text-black rotate-90' : 'hover:bg-white/10 text-white'}`}
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setLibraryTab(tab.id as LibraryTab); setSelectedArtist(null); setSelectedArtistKey(null); }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                        libraryTab === tab.id
                            ? 'bg-primary text-black border-primary'
                            : 'bg-zinc-800/50 text-zinc-400 border-transparent hover:bg-zinc-800 hover:text-white'
                        }`}
                    >
                        <tab.icon size={16} fill={libraryTab === tab.id && (tab.id === 'Liked Songs' || tab.id === 'Playlists') ? 'currentColor' : 'none'} />
                        {tab.label}
                    </button>
                    ))}
                </div>
            </div>

            {/* Controls Row (Songs & Liked Songs View) */}
            {(libraryTab === 'All' || libraryTab === 'Liked Songs') && !selectedArtistKey && (
                <div className="flex items-center gap-3 my-4 animate-in slide-in-from-top-2 fade-in duration-300">
                    <button 
                        onClick={handleShuffleAll}
                        disabled={sortedTracks.length === 0}
                        className="flex-1 h-12 rounded-2xl bg-primary text-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Shuffle className="w-5 h-5" />
                        <span>Shuffle Library</span>
                    </button>

                    <div className="relative group">
                        <button className="h-12 w-12 rounded-2xl bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors">
                            <ListFilter className="w-5 h-5" />
                        </button>
                        {/* Hover Menu */}
                        <div className="absolute right-0 top-12 pt-2 w-48 hidden group-hover:block z-30">
                            <div className="bg-zinc-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1.5 flex flex-col gap-0.5 backdrop-blur-xl">
                                {[
                                    { label: 'Recently Added', val: 'added' },
                                    { label: 'Title (A-Z)', val: 'title' },
                                    { label: 'Artist (A-Z)', val: 'artist' }
                                ].map((opt) => (
                                    <button
                                        key={opt.val}
                                        onClick={() => setSortOption(opt.val as SortOption)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group/item ${
                                            sortOption === opt.val ? 'bg-primary/10 text-primary' : 'text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {opt.label}
                                        {sortOption === opt.val && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex flex-col flex-1 min-h-0 w-full pb-20">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                    <AnimatePresence mode="wait">
                        {/* VIEW: SONGS OR FAVORITES */}
                        {(libraryTab === 'All' || libraryTab === 'Liked Songs') && (
                            <motion.div 
                                key="songs-list"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col gap-1 w-full"
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
                                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                                        {libraryTab === 'Liked Songs' ? <Heart className="w-16 h-16 mb-4 opacity-50 stroke-1" /> : <Music className="w-16 h-16 mb-4 opacity-50 stroke-1" />}
                                        <p>{libraryTab === 'Liked Songs' ? "No favorite tracks yet" : "Your library is empty"}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* VIEW: ARTISTS */}
                        {libraryTab === 'Artists' && (
                            selectedArtistKey ? (
                                <motion.div key="artist-detail" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                    <div className="flex items-center gap-4 mb-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-2">
                                        <button onClick={() => { setSelectedArtist(null); setSelectedArtistKey(null); }} className="p-2 -ml-2 rounded-full hover:bg-white/10">
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
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
                                <motion.div key="artists-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
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
