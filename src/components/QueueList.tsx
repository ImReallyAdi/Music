import React, { useEffect, useRef, useMemo, memo } from 'react';
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion';
import { Track } from '../types';
import { Play, X, GripVertical, ArrowUpToLine, Trash2, ListMusic, Disc3 } from 'lucide-react';

// --- Types ---
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
  index?: number;
  onPlay: () => void;
  onRemove: () => void;
  onPlayNext?: () => void;
}

// --- Animation Variants ---
const listVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

// --- Components ---

const QueueItem = memo(({
  track,
  isCurrent,
  onPlay,
  onRemove,
  onPlayNext,
  isHistory,
  canDrag,
}: QueueItemProps) => {
  const controls = useDragControls();

  // MD3 Dynamic Styling
  const containerClass = `
    group relative flex items-center p-3 rounded-2xl mb-2 transition-all duration-300
    ${isCurrent 
      ? 'bg-primary-container/20 border border-primary-500/30 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.3)]' 
      : isHistory 
        ? 'opacity-50 hover:opacity-100 hover:bg-white/5' 
        : 'bg-zinc-800/40 hover:bg-zinc-800 hover:shadow-md border border-white/5'
    }
  `;

  const content = (
    <>
      {/* --- Drag Handle (MD3 Touch Target) --- */}
      {canDrag ? (
        <div
          className="touch-none cursor-grab active:cursor-grabbing p-2 mr-1 text-zinc-500 hover:text-zinc-200 transition-colors rounded-full hover:bg-white/10"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical size={18} />
        </div>
      ) : (
        // Spacer for alignment if not draggable
        !isCurrent && <div className="w-2" />
      )}

      {/* --- Artwork --- */}
      <div 
        className={`relative rounded-xl overflow-hidden flex-shrink-0 cursor-pointer shadow-sm group-hover:shadow-lg transition-all duration-300
          ${isCurrent ? 'w-14 h-14 shadow-primary-500/20' : 'w-11 h-11'}
        `}
        onClick={onPlay}
      >
        <img 
          src={track.coverArt} 
          className={`w-full h-full object-cover transition-transform duration-500 ${isCurrent ? 'scale-100' : 'group-hover:scale-110'} ${isHistory ? 'grayscale' : ''}`} 
          alt={track.title} 
        />
        
        {/* Play Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isCurrent ? (
             <div className="flex gap-1 items-end h-4 pb-1">
               {[0.6, 0.8, 1.0, 0.7].map((d, i) => (
                 <motion.span 
                   key={i}
                   animate={{ height: ["20%", "100%", "20%"] }}
                   transition={{ duration: d, repeat: Infinity, ease: "easeInOut" }}
                   className="w-1 bg-white rounded-full"
                 />
               ))}
             </div>
          ) : (
            <Play size={18} className="fill-white text-white drop-shadow-md" />
          )}
        </div>
      </div>

      {/* --- Text Info --- */}
      <div className="flex-1 min-w-0 px-4 flex flex-col justify-center cursor-pointer" onClick={onPlay}>
        <h4 className={`font-semibold truncate leading-tight mb-0.5 ${isCurrent ? 'text-lg text-primary-200' : 'text-sm text-zinc-100'}`}>
          {track.title}
        </h4>
        <p className={`text-xs truncate font-medium ${isCurrent ? 'text-primary-200/70' : 'text-zinc-400'}`}>
          {track.artist}
        </p>
      </div>

      {/* --- Actions (Visible on Hover / Always for Current) --- */}
      <div className={`flex items-center gap-1 transition-all duration-200 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {onPlayNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlayNext(); }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Play Next"
          >
            <ArrowUpToLine size={18} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-2 text-zinc-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-colors"
          title="Remove"
        >
          <X size={18} />
        </button>
      </div>
    </>
  );

  if (canDrag) {
    return (
      <Reorder.Item
        value={track.id}
        id={track.id}
        className={containerClass}
        dragListener={false}
        dragControls={controls}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, scale: 0.95, height: 0 }}
        variants={itemVariants}
        whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: "0px 10px 20px rgba(0,0,0,0.5)" }}
      >
        {content}
      </Reorder.Item>
    );
  }

  return (
    <motion.div 
      layout
      className={containerClass}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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

  const { history, current, upcoming, canReorder } = useMemo(() => {
    if (!queue || !queue.length) return { history: [], current: null, upcoming: [], canReorder: false };
    const currentIndex = queue.indexOf(currentTrackId || '');
    const splitIndex = currentIndex === -1 ? 0 : currentIndex;
    const upcomingSlice = queue.slice(splitIndex + 1);
    
    // Check duplicates to safely enable reordering
    const upcomingSet = new Set(upcomingSlice);
    
    return {
      history: queue.slice(0, splitIndex),
      current: queue[splitIndex],
      upcoming: upcomingSlice,
      canReorder: upcomingSet.size === upcomingSlice.length // Only reorder if unique
    };
  }, [queue, currentTrackId]);

  useEffect(() => {
    setTimeout(() => {
      activeTrackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []); 

  const handleReorderUpcoming = (newUpcoming: string[]) => {
    onReorder([...history, (current || ''), ...newUpcoming].filter(Boolean));
  };

  // --- Empty State ---
  if (!queue || queue.length === 0) {
    return (
      <div className="flex flex-col h-full bg-zinc-950 text-white">
        {/* Header */}
        <div className="flex w-full justify-between items-center px-6 pt-6">
          <h3 className="text-2xl font-bold tracking-tight">Queue</h3>
          {onClose && (
            <button onClick={onClose} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* Empty Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-full bg-zinc-900 flex items-center justify-center relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 animate-pulse" />
             <Disc3 size={64} className="text-zinc-700" />
          </motion.div>
          <div>
            <h4 className="text-xl font-medium text-zinc-200">Your queue is empty</h4>
            <p className="text-zinc-500 mt-2 text-sm">Add some tracks to start the vibe.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-zinc-950 text-white font-sans selection:bg-indigo-500/30">
      
      {/* --- Glass Header --- */}
      <div className="flex items-center justify-between px-6 py-5 shrink-0 bg-zinc-950/80 backdrop-blur-xl z-30 border-b border-white/5">
        <div className="flex items-baseline gap-3">
           <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Queue</h3>
           <span className="text-sm font-medium text-zinc-500">{queue.length} tracks</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 hover:rotate-90 rounded-full transition-all duration-300">
            <X size={20} className="text-zinc-300" />
          </button>
        )}
      </div>

      {/* --- Main Scroll Area --- */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar px-4 pb-32">
        
        {/* History Section */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 mb-2"
            >
              <div className="flex items-center gap-3 px-2 mb-3 opacity-60">
                 <div className="h-px bg-white/20 flex-1" />
                 <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">History</span>
                 <div className="h-px bg-white/20 flex-1" />
              </div>
              <div className="space-y-1">
                {history.map((trackId, i) => tracks[trackId] && (
                    <QueueItem
                      key={`${trackId}-hist-${i}`}
                      track={tracks[trackId]}
                      isCurrent={false}
                      isHistory={true}
                      onPlay={() => onPlay(trackId)}
                      onRemove={() => onRemove(trackId)}
                      onPlayNext={() => onPlayNext(trackId)}
                    />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Track (Hero Section) */}
        {current && tracks[current] && (
          <div ref={activeTrackRef} className="my-8 sticky top-0 z-20 pt-2 -mx-2 px-2 pb-4 bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-transparent backdrop-blur-sm">
             <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
               Now Playing
             </div>
             
             {/* Background Glow Effect */}
             <div className="relative">
               <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-3xl blur-xl opacity-40 animate-pulse" />
               <QueueItem
                 track={tracks[current]}
                 isCurrent={true}
                 onPlay={() => {}} 
                 onRemove={() => onRemove(current)}
               />
             </div>
          </div>
        )}

        {/* Upcoming Section */}
        <div className="relative">
          <div className="flex justify-between items-end mb-4 px-2">
             <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Next Up</span>
             {upcoming.length > 0 && (
               <button 
                 onClick={() => onReorder([...history, (current || '')])}
                 className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
               >
                 <Trash2 size={12} className="text-zinc-500 group-hover:text-red-400 transition-colors" />
                 <span className="text-[10px] font-bold text-zinc-500 group-hover:text-red-400 uppercase tracking-wider">Clear Queue</span>
               </button>
             )}
          </div>

          {/* Duplicate Warning */}
          {!canReorder && upcoming.length > 0 && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
               className="mx-1 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2 text-amber-200/80 text-xs"
             >
               <span>⚠️ Shuffle active or duplicates present. Reordering disabled.</span>
             </motion.div>
          )}

          {canReorder ? (
            <Reorder.Group axis="y" values={upcoming} onReorder={handleReorderUpcoming} className="space-y-1">
              {upcoming.map((trackId) => tracks[trackId] && (
                <QueueItem
                  key={trackId}
                  track={tracks[trackId]}
                  isCurrent={false}
                  canDrag={true}
                  onPlay={() => onPlay(trackId)}
                  onRemove={() => onRemove(trackId)}
                  onPlayNext={() => onPlayNext(trackId)}
                />
              ))}
            </Reorder.Group>
          ) : (
            <div className="space-y-1">
              {upcoming.map((trackId, i) => tracks[trackId] && (
                <QueueItem
                  key={`${trackId}-${i}`}
                  track={tracks[trackId]}
                  isCurrent={false}
                  onPlay={() => onPlay(trackId)}
                  onRemove={() => onRemove(trackId)}
                  onPlayNext={() => onPlayNext(trackId)}
                />
              ))}
            </div>
          )}

          {upcoming.length === 0 && (
             <div className="py-12 flex flex-col items-center justify-center opacity-30 gap-4">
                 <ListMusic size={32} />
                 <p className="text-sm font-medium">End of queue</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueList;
