import React, { useEffect, useRef, useMemo, memo } from 'react';
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion';
import { Track } from '../types';
import { Play, X, GripVertical, ArrowUpToLine, Trash2, ListMusic } from 'lucide-react';

interface QueueListProps {
  queue: string[];
  currentTrackId: string | null;
  tracks: Record<string, Track>;
  onReorder: (newQueue: string[]) => void;
  onPlay: (trackId: string) => void;
  onRemove: (trackId: string) => void;
  onPlayNext: (trackId: string) => void;
  onClose?: () => void;
}

interface QueueItemProps {
  track: Track;
  isCurrent: boolean;
  isHistory?: boolean;
  canDrag?: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onPlayNext?: () => void;
}

// 1. Memoized Item Component for Performance
const QueueItem = memo(({
  track,
  isCurrent,
  onPlay,
  onRemove,
  onPlayNext,
  isHistory,
  canDrag
}: QueueItemProps) => {
  const controls = useDragControls();

  const content = (
    <>
      {/* Drag Handle */}
      {canDrag ? (
        <div
          className="touch-none cursor-grab active:cursor-grabbing p-3 text-white/20 hover:text-white/80 transition-colors flex items-center justify-center"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical size={14} />
        </div>
      ) : (
        <div className="w-3" />
      )}

      {/* Album Art */}
      <div
        className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 cursor-pointer group-hover:opacity-80 transition-opacity"
        onClick={onPlay}
      >
        <img 
          src={track.coverArt} 
          className={`w-full h-full object-cover transition-all duration-300 ${isCurrent ? 'opacity-40 scale-105' : ''} ${isHistory ? 'grayscale opacity-50' : ''}`} 
          alt={track.title} 
        />
        {isCurrent && (
          <div className="absolute inset-0 flex items-center justify-center">
             {/* Simple EQ Animation */}
            <div className="flex gap-0.5 items-end h-3">
              <span className="w-0.5 bg-green-400 animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
              <span className="w-0.5 bg-green-400 animate-[pulse_0.8s_ease-in-out_infinite] h-[60%]" />
              <span className="w-0.5 bg-green-400 animate-[pulse_1s_ease-in-out_infinite] h-[80%]" />
            </div>
          </div>
        )}
        {/* Hover Play Overlay */}
        {!isCurrent && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Play size={16} className="text-white fill-white" />
          </div>
        )}
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer px-3" onClick={onPlay}>
        <h4 className={`text-sm font-medium truncate transition-colors ${isCurrent ? 'text-green-400' : isHistory ? 'text-white/40' : 'text-white/90'}`}>
          {track.title}
        </h4>
        <p className={`text-xs truncate transition-colors ${isCurrent ? 'text-green-400/60' : 'text-white/30'}`}>
          {track.artist}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-1 gap-1">
        {onPlayNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlayNext(); }}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-all transform hover:scale-110"
            title="Play Next"
          >
            <ArrowUpToLine size={15} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all transform hover:scale-110"
          title="Remove"
        >
          <X size={15} />
        </button>
      </div>
    </>
  );

  const containerClass = `relative flex items-center p-1.5 rounded-lg mb-1 transition-colors border ${
    isCurrent 
      ? 'bg-white/10 border-white/10 shadow-lg' 
      : isHistory 
        ? 'opacity-60 hover:bg-white/5 border-transparent' 
        : 'hover:bg-white/5 bg-black/20 border-white/5'
  } group select-none overflow-hidden`;

  if (canDrag) {
    return (
      <Reorder.Item
        value={track.id}
        id={track.id}
        className={containerClass}
        dragListener={false}
        dragControls={controls}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
      >
        {content}
      </Reorder.Item>
    );
  }

  return (
    <motion.div 
      className={containerClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout // Smooth layout shifts when items are removed
    >
      {content}
    </motion.div>
  );
});

const QueueList: React.FC<QueueListProps> = ({ 
  queue, 
  currentTrackId, 
  tracks, 
  onReorder, 
  onPlay, 
  onRemove, 
  onPlayNext, 
  onClose 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLDivElement>(null);

  // Memoize split logic to avoid calculation on every render
  const { history, current, upcoming, canReorder } = useMemo(() => {
    if (!queue || !queue.length) return { history: [], current: null, upcoming: [], canReorder: false };

    const currentIndex = queue.indexOf(currentTrackId || '');
    const splitIndex = currentIndex === -1 ? 0 : currentIndex;

    const historySlice = queue.slice(0, splitIndex);
    const upcomingSlice = queue.slice(splitIndex + 1);
    
    // Check duplicates
    const upcomingSet = new Set(upcomingSlice);
    const hasDuplicates = upcomingSet.size !== upcomingSlice.length;

    return {
      history: historySlice,
      current: queue[splitIndex],
      upcoming: upcomingSlice,
      canReorder: !hasDuplicates
    };
  }, [queue, currentTrackId]);

  // Scroll to current track on open
  useEffect(() => {
    if (activeTrackRef.current) {
      activeTrackRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []); 

  const handleReorderUpcoming = (newUpcoming: string[]) => {
    // Reconstruct full queue: History + Current + New Upcoming
    const newQueue = [...history, (current || ''), ...newUpcoming].filter(Boolean);
    onReorder(newQueue);
  };

  if (!queue || queue.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#111]">
        <div className="flex w-full justify-between items-center px-4 pt-4">
          <h3 className="text-lg font-bold text-white tracking-tight">Queue</h3>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={18} className="text-white/70" />
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-white/30 space-y-4">
          <div className="p-6 rounded-full bg-white/5 border border-white/5">
            <ListMusic size={40} className="ml-1 opacity-50" />
          </div>
          <div className="text-center">
             <p className="text-lg font-medium text-white/70">Queue is empty</p>
             <p className="text-xs mt-1">Add songs to get the party started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 shrink-0 bg-black/40 backdrop-blur-md z-30 border-b border-white/5">
        <div className="flex items-center gap-2">
           <ListMusic size={18} className="text-green-400" />
           <h3 className="text-lg font-bold text-white tracking-tight">Queue</h3>
           <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/50">{queue.length}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={18} className="text-white/70" />
          </button>
        )}
      </div>

      {/* Main Scrollable Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 no-scrollbar"
      >
        <div className="px-3 pb-24 pt-4">
          
          {/* HISTORY */}
          {history.length > 0 && (
            <div className="mb-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
               <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3 px-1">Previously Played</div>
               {history.map((trackId, i) => {
                 const track = tracks[trackId];
                 if (!track) return null;
                 return (
                   <QueueItem
                     key={`${trackId}-hist-${i}`}
                     track={track}
                     isCurrent={false}
                     isHistory={true}
                     onPlay={() => onPlay(trackId)}
                     onRemove={() => onRemove(trackId)}
                     onPlayNext={() => onPlayNext(trackId)}
                   />
                 );
               })}
            </div>
          )}

          {/* CURRENT TRACK */}
          {current && tracks[current] && (
            <div ref={activeTrackRef} className="my-6 sticky top-2 z-20">
              <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Now Playing
              </div>
              <div className="p-1 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-xl border border-white/10 shadow-2xl">
                 <QueueItem
                   track={tracks[current]}
                   isCurrent={true}
                   onPlay={() => {}} 
                   onRemove={() => onRemove(current)}
                 />
              </div>
            </div>
          )}

          {/* UPCOMING */}
          <div>
            <div className="flex justify-between items-end mb-3 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-10 py-3 border-b border-white/5">
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Next Up</span>
               {upcoming.length > 0 && (
                 <button 
                   onClick={() => onReorder([...history, (current || '')])}
                   className="text-[10px] font-medium text-white/30 hover:text-red-400 flex items-center gap-1 transition-colors uppercase tracking-wider px-2 py-1 rounded hover:bg-white/5"
                 >
                   <Trash2 size={10} /> Clear
                 </button>
               )}
            </div>

            {/* Warning for Duplicates */}
            {!canReorder && upcoming.length > 0 && (
              <div className="text-[10px] text-orange-300/70 px-3 py-2 mb-3 bg-orange-500/10 border border-orange-500/10 rounded-md flex items-center justify-center">
                Reordering disabled due to duplicate tracks
              </div>
            )}

            {canReorder ? (
              <Reorder.Group
                axis="y"
                values={upcoming}
                onReorder={handleReorderUpcoming}
                className="min-h-[50px] space-y-1"
              >
                {upcoming.map((trackId) => {
                  const track = tracks[trackId];
                  if (!track) return null;
                  return (
                    <QueueItem
                      key={trackId}
                      track={track}
                      isCurrent={false}
                      canDrag={true}
                      onPlay={() => onPlay(trackId)}
                      onRemove={() => onRemove(trackId)}
                      onPlayNext={() => onPlayNext(trackId)}
                    />
                  );
                })}
              </Reorder.Group>
            ) : (
              <div className="space-y-1">
                {upcoming.map((trackId, i) => {
                  const track = tracks[trackId];
                  if (!track) return null;
                  return (
                    <QueueItem
                      key={`${trackId}-${i}`}
                      track={track}
                      isCurrent={false}
                      onPlay={() => onPlay(trackId)}
                      onRemove={() => onRemove(trackId)}
                      onPlayNext={() => onPlayNext(trackId)}
                    />
                  );
                })}
              </div>
            )}

            {upcoming.length === 0 && (
               <div className="flex flex-col items-center justify-center py-12 opacity-20 gap-2">
                   <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent" />
                   <p className="text-xs font-mono">END OF LINE</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueList;
