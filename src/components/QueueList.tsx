import React, { useEffect, useRef } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { Track } from '../types';
import { Play, X, GripVertical, ArrowUpToLine, Trash2 } from 'lucide-react';

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

const QueueItem = ({
  track,
  isCurrent,
  onPlay,
  onRemove,
  onPlayNext,
  isHistory,
  canDrag
}: {
  track: Track;
  isCurrent: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onPlayNext?: () => void;
  isHistory?: boolean;
  canDrag?: boolean;
}) => {
  const controls = useDragControls();

  const content = (
    <>
      {canDrag ? (
        <div
          className="touch-none cursor-grab active:cursor-grabbing p-3 text-white/30 hover:text-white flex items-center justify-center"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical size={16} />
        </div>
      ) : (
        <div className="w-2" /> // Spacer
      )}

      <div
        className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 cursor-pointer group-hover:opacity-80 transition-opacity"
        onClick={onPlay}
      >
          <img src={track.coverArt} className={`w-full h-full object-cover ${isCurrent ? 'opacity-50' : ''} ${isHistory ? 'grayscale opacity-60' : ''}`} alt={track.title} />
          {isCurrent && (
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
             </div>
          )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer px-2" onClick={onPlay}>
        <h4 className={`text-sm font-medium truncate ${isCurrent ? 'text-green-400' : isHistory ? 'text-white/40' : 'text-white/90'}`}>
          {track.title}
        </h4>
        <p className={`text-xs truncate ${isCurrent ? 'text-green-400/70' : 'text-white/40'}`}>
          {track.artist}
        </p>
      </div>

      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
        {onPlayNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlayNext(); }}
            className="p-2 text-white/30 hover:text-white rounded-full hover:bg-white/10"
            title="Play Next"
          >
            <ArrowUpToLine size={16} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-2 text-white/30 hover:text-red-400 rounded-full hover:bg-white/10"
          title="Remove"
        >
          <X size={16} />
        </button>
      </div>
    </>
  );

  const containerClass = `flex items-center gap-1 p-1 rounded-lg mb-1 transition-colors ${
      isCurrent ? 'bg-white/10 ring-1 ring-white/10' : 
      isHistory ? 'hover:bg-white/5 opacity-70' : 
      'hover:bg-white/10 bg-black/20 border border-white/5'
  } group select-none`;

  if (canDrag) {
    return (
      <Reorder.Item
        value={track.id}
        id={track.id}
        className={containerClass}
        dragListener={false}
        dragControls={controls}
      >
        {content}
      </Reorder.Item>
    );
  }

  return (
    <div className={containerClass}>
      {content}
    </div>
  );
};

const QueueList: React.FC<QueueListProps> = ({ queue, currentTrackId, tracks, onReorder, onPlay, onRemove, onPlayNext, onClose }) => {
  const historyRef = useRef<HTMLDivElement>(null);

  if (!queue || queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30">
         {/* Close Header */}
        <div className="flex w-full justify-between items-center px-6 pt-6 mb-4 absolute top-0">
          <h3 className="text-xl font-bold text-white">Queue</h3>
          {onClose && (
            <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md">
              <X size={20} className="text-white" />
            </button>
          )}
        </div>
        <div className="p-8 rounded-full bg-white/5 mb-4">
             <Play size={40} className="ml-1 opacity-50" />
        </div>
        <p className="text-lg font-medium">Queue is empty</p>
        <p className="text-sm opacity-50 mt-1">Play something to get started</p>
      </div>
    );
  }

  // Calculate split
  const currentIndex = queue.indexOf(currentTrackId || '');
  // If current not in queue (shouldn't happen often), assume start
  const splitIndex = currentIndex === -1 ? 0 : currentIndex;

  const history = queue.slice(0, splitIndex);
  const current = queue[splitIndex]; // string id
  const upcoming = queue.slice(splitIndex + 1);

  // Check for duplicate tracks in upcoming to prevent Reorder crash
  const upcomingSet = new Set(upcoming);
  const hasDuplicates = upcomingSet.size !== upcoming.length;
  // If duplicates exist, disable reordering to avoid React keys conflict / Reorder crash
  const canReorder = !hasDuplicates;

  // Handlers
  const handleReorderUpcoming = (newUpcoming: string[]) => {
    const newQueue = [...history, current, ...newUpcoming];
    onReorder(newQueue);
  };

  const handlePlayNext = (trackId: string) => {
    onPlayNext(trackId);
  };
  
  const handleClearUpcoming = () => {
      // Keep history and current, clear upcoming
      onReorder([...history, current]);
  };

  // Scroll history to bottom on mount so we see the most recent history
  useEffect(() => {
    if (historyRef.current) {
        historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, []); // Only on mount

  return (
    <div className="h-full flex flex-col relative bg-black/20">
       {/* Header with Close */}
       <div className="flex items-center justify-between p-4 shrink-0 backdrop-blur-md bg-black/10 z-30">
        <h3 className="text-xl font-bold text-white tracking-tight">Queue</h3>
        {onClose && (
            <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <X size={20} className="text-white" />
            </button>
        )}
      </div>

      {/* History Section (Scrollable) */}
      <div
        ref={historyRef}
        className="flex-1 overflow-y-auto min-h-0 px-4 no-scrollbar mask-image-fade-top"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex flex-col justify-end min-h-full pb-4">
            {history.length > 0 && (
                <div className="text-xs font-bold text-white/20 uppercase tracking-widest mb-3 px-1 mt-8 text-center">History</div>
            )}
            {history.map((trackId, i) => {
                const track = tracks[trackId];
                if (!track) return null;
                return (
                    <QueueItem
                        key={`${trackId}-${i}`}
                        track={track}
                        isCurrent={false}
                        isHistory={true}
                        onPlay={() => onPlay(trackId)}
                        onRemove={() => onRemove(trackId)}
                        onPlayNext={() => handlePlayNext(trackId)}
                    />
                );
            })}
        </div>
      </div>

      {/* Current Track (Fixed/Sticky Center) */}
      <div className="shrink-0 z-20 my-2 px-3">
         {current && tracks[current] ? (
             <div className="shadow-2xl shadow-black/50 rounded-xl overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 ring-1 ring-white/5">
                 <div className="px-3 py-1.5 flex justify-between items-center bg-white/5 border-b border-white/5">
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Now Playing</span>
                    {/* Visualizer bars placeholder or just pulse */}
                    <div className="flex gap-0.5 h-2 items-end">
                        <div className="w-0.5 bg-green-500/50 h-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                        <div className="w-0.5 bg-green-500/50 h-[60%] animate-[pulse_0.8s_ease-in-out_infinite]" />
                        <div className="w-0.5 bg-green-500/50 h-[80%] animate-[pulse_0.5s_ease-in-out_infinite]" />
                    </div>
                 </div>
                 <div className="p-1">
                     <QueueItem
                        track={tracks[current]}
                        isCurrent={true}
                        onPlay={() => {}} 
                        onRemove={() => onRemove(current)}
                     />
                 </div>
             </div>
         ) : null}
      </div>

      {/* Upcoming Section (Scrollable & Reorderable) */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 no-scrollbar pb-24">
         <div className="sticky top-0 z-10 flex justify-between items-end mb-3 pt-4 pb-2 bg-gradient-to-b from-black/0 via-black/0 to-transparent">
             {upcoming.length > 0 && (
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Up Next</div>
             )}
             {upcoming.length > 0 && (
                 <button 
                    onClick={handleClearUpcoming}
                    className="text-[10px] font-medium text-white/40 hover:text-red-400 flex items-center gap-1 transition-colors uppercase tracking-wider px-2 py-1 rounded-md hover:bg-white/5"
                 >
                     <Trash2 size={10} /> Clear
                 </button>
             )}
         </div>

         {canReorder ? (
            <Reorder.Group
                axis="y"
                values={upcoming}
                onReorder={handleReorderUpcoming}
                className="min-h-[50px]"
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
                            onPlayNext={() => handlePlayNext(trackId)}
                        />
                    );
                })}
            </Reorder.Group>
         ) : (
            <div className="min-h-[50px]">
                {!canReorder && upcoming.length > 0 && (
                    <div className="text-[10px] text-white/30 px-2 mb-2 italic border border-white/5 rounded p-2 bg-white/5">
                        Note: Reordering is disabled because the queue contains duplicate tracks.
                    </div>
                )}
                {upcoming.map((trackId, i) => {
                    const track = tracks[trackId];
                    if (!track) return null;
                    return (
                        <QueueItem
                            key={`${trackId}-${i}`}
                            track={track}
                            isCurrent={false}
                            canDrag={false} // Disable drag for duplicates
                            onPlay={() => onPlay(trackId)}
                            onRemove={() => onRemove(trackId)}
                            onPlayNext={() => handlePlayNext(trackId)}
                        />
                    );
                })}
            </div>
         )}

         {upcoming.length === 0 && (
             <div className="flex flex-col items-center justify-center py-12 opacity-30 gap-2">
                 <div className="w-12 h-0.5 bg-white/50 rounded-full" />
                 <p className="text-sm font-medium">End of queue</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default QueueList;
