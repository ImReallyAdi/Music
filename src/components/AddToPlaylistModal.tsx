import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Playlist } from '../types';
import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/icon/icon.js';

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
  const dialogRef = useRef<any>(null);

  // Sync open state and handle close events
  useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const handleClose = () => {
          onClose();
          // Also close isCreating state reset
          setIsCreating(false);
          setNewPlaylistName('');
      };

      // When isOpen becomes true, we ensure it's open.
      // Note: we use the property 'open' or method 'show()' / 'close()'.
      // md-dialog has an 'open' property.
      if (isOpen && !dialog.open) {
          dialog.show();
      } else if (!isOpen && dialog.open) {
          dialog.close();
      }

      // Attach listener for when the dialog closes itself (scrim, escape)
      dialog.addEventListener('close', handleClose);
      return () => {
          dialog.removeEventListener('close', handleClose);
      };
  }, [isOpen, onClose]);

  // We should NOT pass `open` prop directly if we are managing it imperatively via ref to avoid conflicts,
  // or we can pass it but ensure the listener handles the sync back.
  // Passing `open={isOpen}` is fine as long as `onClose` updates `isOpen`.

  return (
    <md-dialog ref={dialogRef}>
        <div slot="headline">Add to Playlist</div>
        <form slot="content" id="playlist-form" method="dialog">
             <div className="flex flex-col gap-2 min-w-[300px]">
                <md-list>
                    <md-list-item
                        type="button"
                        onClick={() => setIsCreating(!isCreating)}
                    >
                         <div slot="headline" className="text-primary font-bold">New Playlist</div>
                         <md-icon slot="start" class="material-symbols-rounded text-primary">add</md-icon>
                    </md-list-item>

                    {isCreating && (
                        <div className="p-2 flex gap-2 items-center">
                            <md-outlined-text-field
                                placeholder="Name"
                                value={newPlaylistName}
                                onInput={(e: any) => setNewPlaylistName(e.target.value)}
                                style={{ flex: 1 }}
                            ></md-outlined-text-field>
                            <md-filled-button
                                onClick={(e: any) => {
                                    e.preventDefault();
                                    e.stopPropagation(); // prevent closing dialog
                                    if(newPlaylistName.trim()) {
                                        onCreatePlaylist(newPlaylistName);
                                        setNewPlaylistName('');
                                        setIsCreating(false);
                                    }
                                }}
                            >Create</md-filled-button>
                        </div>
                    )}

                    {playlists.map(playlist => (
                        <md-list-item
                            key={playlist.id}
                            type="button"
                            headline={playlist.name}
                            supportingText={`${playlist.trackIds.length} tracks`}
                            onClick={() => onSelectPlaylist(playlist.id)}
                        >
                             <div slot="start" className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-xs font-bold">
                                {playlist.trackIds.length}
                             </div>
                        </md-list-item>
                    ))}
                </md-list>
             </div>
        </form>
        <div slot="actions">
            <md-text-button onClick={() => dialogRef.current?.close()}>Cancel</md-text-button>
        </div>
    </md-dialog>
  );
};

export default AddToPlaylistModal;
