import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Music, Loader2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';

export function Library() {
  const { library, deleteTrack } = useLibrary();
  const { playTrack, player } = usePlayer();
  const [tab, setTab] = React.useState<'Songs' | 'Playlists'>('Songs');

  const tracks = Object.values(library.tracks).sort((a, b) => b.addedAt - a.addedAt);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
         {['Songs', 'Playlists'].map((t) => (
             <button
                key={t}
                onClick={() => setTab(t as any)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${tab === t ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}
             >
                 {t}
             </button>
         ))}
      </div>

      {tab === 'Songs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {tracks.length === 0 && (
               <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                   <Music className="w-16 h-16 mb-4" />
                   <p className="text-lg font-medium">No songs yet</p>
               </div>
           )}
           {tracks.map((track, i) => (
             <TrackItem key={track.id} track={track} index={i} playTrack={playTrack} isPlaying={player.currentTrackId === track.id && player.isPlaying} isCurrent={player.currentTrackId === track.id} deleteTrack={deleteTrack} />
           ))}
        </div>
      )}

      {tab === 'Playlists' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="aspect-square rounded-3xl bg-surface-variant border-2 border-dashed border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors">
                  <span className="font-medium text-on-surface-variant">New Playlist</span>
              </div>
          </div>
      )}
    </div>
  );
}

function TrackItem({ track, index, playTrack, isPlaying, isCurrent, deleteTrack }: { track: Track, index: number, playTrack: (id: string) => void, isPlaying: boolean, isCurrent: boolean, deleteTrack: (id: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-colors group relative ${isCurrent ? 'bg-secondary-container' : 'hover:bg-surface-container-high'}`}
            onClick={() => playTrack(track.id)}
        >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden relative flex-shrink-0 ${isCurrent ? 'bg-on-secondary-container' : 'bg-surface-variant'}`}>
                 {track.coverArt ? (
                     <img src={track.coverArt} className="w-full h-full object-cover" alt="Cover" />
                 ) : (
                     <Music className={`w-6 h-6 ${isCurrent ? 'text-secondary-container' : 'text-on-surface-variant'}`} />
                 )}
                 {isCurrent && isPlaying && (
                     <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                         <Loader2 className="w-6 h-6 text-white animate-spin" />
                     </div>
                 )}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className={`text-base font-semibold truncate ${isCurrent ? 'text-on-secondary-container' : 'text-on-surface'}`}>{track.title}</h4>
                <p className={`text-sm truncate ${isCurrent ? 'text-on-secondary-container/70' : 'text-on-surface-variant'}`}>{track.artist}</p>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); deleteTrack(track.id); }}
                className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-container hover:text-on-error-container rounded-full"
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </motion.div>
    );
}
