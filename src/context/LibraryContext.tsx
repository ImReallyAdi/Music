import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dbService } from '../db';
import { Track, Playlist, LibraryState } from '../types';
import JSZip from 'jszip';

interface LibraryContextType {
  library: LibraryState;
  loading: { active: boolean; progress: number; message: string };
  refreshLibrary: () => Promise<void>;
  importFiles: (files: FileList) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [library, setLibrary] = useState<LibraryState>({ tracks: {}, playlists: {} });
  const [loading, setLoading] = useState<{ active: boolean, progress: number, message: string }>({ active: false, progress: 0, message: '' });

  const refreshLibrary = useCallback(async () => {
    const tracksArr = await dbService.getAllTracks();
    const playlistsArr = await dbService.getAllPlaylists();
    setLibrary({
      tracks: tracksArr.reduce((acc, t) => ({ ...acc, [t.id]: t }), {}),
      playlists: playlistsArr.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
    });
  }, []);

  useEffect(() => {
    dbService.init().then(refreshLibrary);
  }, [refreshLibrary]);

  const importFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setLoading({ active: true, progress: 0, message: 'Warming up the deck...' });

    try {
      const fileList = Array.from(files);
      for (let fIdx = 0; fIdx < fileList.length; fIdx++) {
        const file = fileList[fIdx];
        if (file.name.toLowerCase().endsWith('.zip')) {
          setLoading(l => ({ ...l, message: `Extracting ${file.name}...` }));
          const zip = await JSZip.loadAsync(file);
          const entries = Object.values(zip.files).filter(f => !f.dir && f.name.match(/\.(mp3|wav|flac|m4a|ogg)$/i));

          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const blob = await entry.async('blob');
            const id = crypto.randomUUID();
            await dbService.saveTrack({
              id,
              title: entry.name.split('/').pop()!.replace(/\.[^/.]+$/, ""),
              artist: 'Local Vibe',
              album: 'Zip Import',
              duration: 0,
              addedAt: Date.now()
            }, blob);
            setLoading(l => ({ ...l, progress: ((fIdx / fileList.length) * 100) + (((i + 1) / entries.length) * (100 / fileList.length)) }));
          }
        } else {
          const id = crypto.randomUUID();
          await dbService.saveTrack({
            id,
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: 'Local Vibe',
            album: 'Local Upload',
            duration: 0,
            addedAt: Date.now()
          }, file);
        }
        setLoading(l => ({ ...l, progress: ((fIdx + 1) / fileList.length) * 100 }));
      }
      await refreshLibrary();
    } catch (err) {
      console.error("Critical upload error:", err);
      alert("Failed to process files. Ensure they are valid audio or ZIP archives.");
    } finally {
      setLoading({ active: false, progress: 0, message: '' });
    }
  };

  const deleteTrack = async (id: string) => {
      await dbService.deleteTrack(id);
      await refreshLibrary();
  }

  return (
    <LibraryContext.Provider value={{
      library,
      loading,
      refreshLibrary,
      importFiles,
      deleteTrack
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
