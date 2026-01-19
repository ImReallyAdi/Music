import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Playlist, Track } from '../types';
import { dbService } from '../db';
import { LibraryCard } from './library/LibraryCard';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/textfield/outlined-text-field.js';

interface PlaylistsProps {
  playlists: Record<string, Playlist>;
  tracks: Record<string, Track>;
  playTrack: (trackId: string, options?: { customQueue?: string[] }) => void;
  refreshLibrary: () => void;
}

// --- Helper: Format Time ---
const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- Helper Component: Dynamic Playlist Cover Art ---
const PlaylistCover = ({ playlist, tracks }: { playlist: Playlist; tracks: Record<string, Track> }) => {
  const covers = useMemo(() => {
    return playlist.trackIds
      .map(id => tracks[id]?.coverArt)
      .filter(Boolean)
      .slice(0, 4);
  }, [playlist.trackIds, tracks]);

  if (covers.length === 0) {
    return (
      <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/20">
        <md-icon style={{ fontSize: '48px' }}>music_note</md-icon>
      </div>
    );
  }

  if (covers.length >= 4) {
    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2">
        {covers.map((src, i) => (
          <img key={i} src={src} className="w-full h-full object-cover" alt="" />
        ))}
      </div>
    );
  }

  return <img src={covers[0]} className="w-full h-full object-cover" alt="Playlist cover" />;
};

// --- Sub-Component: Playlist Track Item (Reorderable) ---
const PlaylistTrackItem = ({
  item,
  track,
  index,
  onRemove,
  onPlay
}: {
  item: { key: string, trackId: string };
  track: Track;
  index: number;
  onRemove: () => void;
  onPlay: () => void;
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      id={item.key} // Unique key for reorder
      dragListener={false}
      dragControls={controls}
      style={{ listStyle: 'none' }}
    >
      <md-list-item
          type="button"
          style={{ cursor: 'pointer', '--md-list-item-leading-image-shape': '8px' }}
          onClick={() => onPlay()}
      >
          <div slot="headline" className="text-on-surface font-medium">{track.title}</div>
          <div slot="supporting-text" className="text-on-surface-variant">{track.artist}</div>
          <div slot="trailing-supporting-text" className="text-on-surface-variant/80 text-xs">{formatTime(track.duration)}</div>

          {/* Drag Handle */}
          <div slot="start" onPointerDown={(e) => controls.start(e)} className="pr-3 cursor-grab active:cursor-grabbing text-on-surface-variant">
             <md-icon class="material-symbols-rounded" style={{ fontSize: '20px' }}>drag_indicator</md-icon>
          </div>

          <div slot="start" className="w-12 h-12 rounded-lg overflow-hidden bg-surface-variant flex items-center justify-center">
             {track.coverArt ? <img src={track.coverArt} className="w-full h-full object-cover" /> : <md-icon class="material-symbols-rounded text-on-surface-variant">music_note</md-icon>}
          </div>

          <md-icon-button slot="end" onClick={(e: any) => { e.stopPropagation(); onRemove(); }}>
             <md-icon>delete</md-icon>
          </md-icon-button>
      </md-list-item>
    </Reorder.Item>
  );
};


// --- Sub-Component: Detailed Playlist View ---
const PlaylistDetail = ({ 
  playlist, 
  tracks, 
  playTrack, 
  onBack, 
  refreshLibrary 
}: { 
  playlist: Playlist; 
  tracks: Record<string, Track>; 
  playTrack: (id: string, opts?: any) => void; 
  onBack: () => void;
  refreshLibrary: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [editDesc, setEditDesc] = useState(playlist.description || '');
  const [items, setItems] = useState<{key: string, trackId: string}[]>([]);

  useEffect(() => {
    setItems(playlist.trackIds.map((id) => ({ key: `${id}-${crypto.randomUUID()}`, trackId: id })));
    setEditName(playlist.name);
    setEditDesc(playlist.description || '');
  }, [playlist]);

  const handleSaveDetails = async () => {
    const updated = { ...playlist, name: editName, description: editDesc, updatedAt: Date.now() };
    await dbService.savePlaylist(updated);
    setIsEditing(false);
    refreshLibrary();
  };

  const handleReorder = async (newItems: {key: string, trackId: string}[]) => {
    setItems(newItems);
    const newTrackIds = newItems.map(i => i.trackId);
    const updated = { ...playlist, trackIds: newTrackIds, updatedAt: Date.now() };
    await dbService.savePlaylist(updated);
    refreshLibrary();
  };

  const handleRemoveTrack = async (indexToRemove: number) => {
    const newItems = [...items];
    newItems.splice(indexToRemove, 1);
    setItems(newItems);
    const newTrackIds = newItems.map(i => i.trackId);
    const updated = { ...playlist, trackIds: newTrackIds, updatedAt: Date.now() };
    await dbService.savePlaylist(updated);
    refreshLibrary();
  };

  const handlePlay = (shuffle = false) => {
    if (items.length === 0) return;
    let queue = items.map(i => i.trackId);
    if (shuffle) {
      queue = queue.sort(() => Math.random() - 0.5);
    }
    playTrack(queue[0], { customQueue: queue });
  };

  const totalDuration = items.reduce((acc, item) => acc + (tracks[item.trackId]?.duration || 0), 0);
  const formattedDuration = useMemo(() => {
     const hrs = Math.floor(totalDuration / 3600);
     const mins = Math.floor((totalDuration % 3600) / 60);
     if (hrs > 0) return `${hrs}h ${mins}m`;
     return `${mins}m`;
  }, [totalDuration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-surface rounded-3xl min-h-[50vh] pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-8 p-1">
        {/* Big Cover Art */}
        <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl mx-auto md:mx-0 bg-surface-variant">
          <PlaylistCover playlist={playlist} tracks={tracks} />
        </div>

        {/* Info & Actions */}
        <div className="flex flex-col justify-end items-center md:items-start flex-1 gap-4 min-w-0 w-full">
          <div className="w-full text-center md:text-left">
            <button onClick={onBack} className="text-on-surface-variant hover:text-on-surface flex items-center justify-center md:justify-start gap-2 mb-4 transition-colors">
              <md-icon class="material-symbols-rounded" style={{ fontSize: '20px' }}>arrow_back</md-icon> Back to Playlists
            </button>

            {isEditing ? (
                <div className="space-y-4 w-full max-w-lg">
                    <md-outlined-text-field
                        label="Name"
                        value={editName}
                        onInput={(e: any) => setEditName(e.target.value)}
                        style={{ width: '100%' }}
                    ></md-outlined-text-field>
                    <md-outlined-text-field
                        label="Description"
                        value={editDesc}
                        onInput={(e: any) => setEditDesc(e.target.value)}
                        style={{ width: '100%' }}
                    ></md-outlined-text-field>

                    <div className="flex gap-2 justify-center md:justify-start pt-2">
                        <md-filled-button onClick={handleSaveDetails}>
                            <md-icon slot="icon" class="material-symbols-rounded">save</md-icon>
                            Save
                        </md-filled-button>
                        <md-filled-tonal-button onClick={() => { setIsEditing(false); setEditName(playlist.name); setEditDesc(playlist.description || ''); }}>
                            Cancel
                        </md-filled-tonal-button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="group relative inline-block">
                        <h1 className="text-display-small font-black text-on-surface mb-2 break-words">{playlist.name}</h1>
                        <md-icon-button
                            onClick={() => setIsEditing(true)}
                            className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <md-icon>edit</md-icon>
                        </md-icon-button>
                    </div>
                    {playlist.description && (
                        <p className="text-body-large text-on-surface-variant mb-2 max-w-2xl">{playlist.description}</p>
                    )}
                    <p className="text-on-surface-variant/50 font-medium flex items-center justify-center md:justify-start gap-2 text-sm md:text-base mt-2">
                      <span>{items.length} tracks</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><md-icon class="material-symbols-rounded" style={{ fontSize: '14px' }}>schedule</md-icon> {formattedDuration}</span>
                    </p>
                </>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <md-filled-button onClick={() => handlePlay(false)} disabled={items.length === 0 ? true : undefined}>
                <md-icon slot="icon" class="material-symbols-rounded">play_arrow</md-icon>
                Play
            </md-filled-button>
            <md-filled-tonal-button onClick={() => handlePlay(true)} disabled={items.length === 0 ? true : undefined}>
                <md-icon slot="icon" class="material-symbols-rounded">shuffle</md-icon>
                Shuffle
            </md-filled-tonal-button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1">
        {items.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant/40 bg-surface-container rounded-3xl border border-dashed border-outline-variant">
                <md-icon class="material-symbols-rounded mx-auto mb-4 opacity-50" style={{ fontSize: '48px' }}>music_note</md-icon>
                <p className="text-lg font-medium">This playlist is empty.</p>
                <p className="text-sm">Add songs from your library to get started.</p>
            </div>
        ) : (
            <md-list>
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} style={{ listStyle: 'none', padding: 0 }}>
                {items.map((item, index) => {
                    const track = tracks[item.trackId];
                    if (!track) return null;

                    return (
                        <PlaylistTrackItem
                            key={item.key}
                            item={item}
                            track={track}
                            index={index}
                            onRemove={() => handleRemoveTrack(index)}
                            onPlay={() => playTrack(item.trackId, { customQueue: items.map(i => i.trackId) })}
                        />
                    );
                })}
            </Reorder.Group>
            </md-list>
        )}
      </div>
    </motion.div>
  );
};


// --- Main Component ---
const Playlists: React.FC<PlaylistsProps> = ({ playlists, tracks, playTrack, refreshLibrary }) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const id = crypto.randomUUID();
    const newPlaylist: Playlist = {
      id,
      name: newPlaylistName,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.savePlaylist(newPlaylist);
    setNewPlaylistName('');
    setIsCreating(false);
    refreshLibrary();
  };

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents opening the playlist
    if (confirm('Are you sure you want to delete this playlist? This cannot be undone.')) {
        await dbService.deletePlaylist(id);
        if (selectedPlaylistId === id) setSelectedPlaylistId(null);
        refreshLibrary();
    }
  };

  const selectedPlaylist = selectedPlaylistId ? playlists[selectedPlaylistId] : null;

  const filteredPlaylists = useMemo(() => {
    return Object.values(playlists)
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [playlists, searchQuery]);

  // Handle playing a playlist directly from the card (Play button)
  const handlePlayPlaylist = (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.trackIds.length > 0) {
        playTrack(playlist.trackIds[0], { customQueue: playlist.trackIds });
    }
  };

  return (
    <div className="w-full pb-32">
      <AnimatePresence mode="wait">
        
        {/* VIEW: Playlist List */}
        {!selectedPlaylist ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex gap-3 w-full md:w-auto items-center flex-1">
                  <md-outlined-text-field
                      placeholder="Search playlists..."
                      value={searchQuery}
                      onInput={(e: any) => setSearchQuery(e.target.value)}
                      style={{ flex: 1 }}
                  >
                      <md-icon slot="leading-icon">search</md-icon>
                  </md-outlined-text-field>

                  <md-filled-button onClick={() => setIsCreating(true)}>
                      <md-icon slot="icon">add</md-icon>
                      New
                  </md-filled-button>
              </div>
            </div>

            {/* Creation Input */}
            <AnimatePresence>
              {isCreating && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-surface-container rounded-2xl p-4 flex gap-3 items-center mb-6">
                    <md-outlined-text-field
                        placeholder="Playlist Name"
                        value={newPlaylistName}
                        onInput={(e: any) => setNewPlaylistName(e.target.value)}
                        style={{ flex: 1 }}
                    ></md-outlined-text-field>
                    <md-filled-button onClick={handleCreatePlaylist}>Create</md-filled-button>
                    <md-filled-tonal-button onClick={() => setIsCreating(false)}>Cancel</md-filled-tonal-button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredPlaylists.map(playlist => (
                  <LibraryCard
                    key={playlist.id} 
                    title={playlist.name}
                    subtitle={`${playlist.trackIds.length} tracks`}
                    customImage={<PlaylistCover playlist={playlist} tracks={tracks} />}
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                    onPlay={(e) => handlePlayPlaylist(playlist, e)}
                    actions={
                        <md-icon-button onClick={(e: any) => handleDeletePlaylist(playlist.id, e)}>
                            <md-icon>delete</md-icon>
                        </md-icon-button>
                    }
                  />
              ))}
            </div>
          </motion.div>
        ) : (
          /* VIEW: Playlist Details */
          <PlaylistDetail 
            key="detail"
            playlist={selectedPlaylist}
            tracks={tracks}
            playTrack={playTrack}
            refreshLibrary={refreshLibrary}
            onBack={() => setSelectedPlaylistId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Playlists;
