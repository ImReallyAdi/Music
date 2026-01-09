import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Playlist } from '../types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  onSelectPlaylist: (playlistId: string) => void;
  onCreatePlaylist: (name: string) => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  playlists,
  onSelectPlaylist,
  onCreatePlaylist
}) => {
  const [newPlaylistName, setNewPlaylistName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-sm z-10"
        >
          <mc-card variant="elevated" style={{ padding: '24px', borderRadius: '28px' } as any}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-on-surface">Add to Playlist</h3>
                <mc-icon-button onClick={onClose}>
                  <mc-icon name="close"></mc-icon>
                </mc-icon-button>
              </div>

              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                <div onClick={() => setIsCreating(!isCreating)}>
                     <mc-button variant="standard" style={{ width: '100%', justifyContent: 'flex-start' } as any}>
                        <mc-icon slot="icon" name="add"></mc-icon>
                        New Playlist
                     </mc-button>
                </div>

                <AnimatePresence>
                    {isCreating && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-4"
                        >
                            <div className="flex gap-2 items-center">
                                <mc-text-field
                                    placeholder="Playlist Name"
                                    value={newPlaylistName}
                                    type="text"
                                    oninput={(e: any) => setNewPlaylistName(e.target.value)}
                                    style={{ flex: 1 } as any}
                                ></mc-text-field>
                                <mc-button
                                    onClick={() => {
                                        if(newPlaylistName.trim()) {
                                            onCreatePlaylist(newPlaylistName);
                                            setNewPlaylistName('');
                                            setIsCreating(false);
                                        }
                                    }}
                                    variant="filled"
                                >
                                    Create
                                </mc-button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {playlists.length === 0 && !isCreating && (
                    <p className="text-center text-on-surface-variant py-4 text-sm">No playlists found</p>
                )}

                {playlists.map(playlist => (
                  <div key={playlist.id} onClick={() => onSelectPlaylist(playlist.id)} className="cursor-pointer">
                      <mc-list-item>
                          <div slot="headline">{playlist.name}</div>
                          <div slot="supporting-text">{playlist.trackIds.length} tracks</div>
                          <mc-icon slot="start" name="queue_music"></mc-icon>
                      </mc-list-item>
                  </div>
                ))}
              </div>
          </mc-card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddToPlaylistModal;
