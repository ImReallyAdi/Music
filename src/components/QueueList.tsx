import React, { useEffect, useRef, useMemo, memo } from 'react';
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion';
import { Track } from '../types';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';

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
}

// --- Components ---

const QueueItem = memo(({
  track,
  isCurrent,
  onPlay,
  onRemove,
  isHistory,
  canDrag,
}: QueueItemProps) => {
  const controls = useDragControls();

  // Content for the list item
  const ListItemContent = (
      // @ts-ignore - md-list-item is a custom element
      <md-list-item
        type="button"
        headline={track.title}
        supporting-text={track.artist}
        onClick={onPlay}
        class="w-full"
        style={{
            cursor: 'pointer',
            '--md-list-item-leading-image-height': '56px',
            '--md-list-item-leading-image-width': '56px',
            '--md-list-item-leading-image-shape': '16px',
            '--md-list-item-headline-color': isCurrent ? 'var(--md-sys-color-primary)' : 'inherit',
            '--md-list-item-supporting-text-color': isCurrent ? 'var(--md-sys-color-primary)' : 'inherit',
            backgroundColor: isCurrent ? 'var(--md-sys-color-surface-container-high)' : 'transparent',
            borderRadius: '24px',
            marginBottom: '8px',
            opacity: isHistory ? 0.6 : 1,
            width: '100%'
        }}
      >
        <div slot="start" className="flex items-center gap-3">
            {/* Drag Handle */}
            {canDrag && (
                <div
                    className="cursor-grab active:cursor-grabbing text-on-surface-variant opacity-60 hover:opacity-100 p-2 -ml-3 touch-none"
                    style={{ touchAction: 'none' }} // Critical for mobile drag
                    onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent playing song when clicking handle
                        controls.start(e);
                    }}
                >
                    <md-icon className="material-symbols-rounded">drag_indicator</md-icon>
                </div>
            )}

            {/* Artwork */}
            <div className="relative w-14 h-14 rounded-[16px] overflow-hidden bg-surface-variant flex items-center justify-center border border-white/5 shrink-0">
                <img
                    src={track.coverArt}
                    alt={track.title}
                    className={`w-full h-full object-cover ${isHistory ? 'grayscale' : ''}`}
                />
                {isCurrent && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex gap-1 items-end h-4 pb-1">
                            {[0.6, 0.8, 1.0].map((d, i) => (
                                <motion.span
                                    key={i}
                                    animate={{ height: ["20%", "100%", "20%"] }}
                                    transition={{ duration: d, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-1 bg-primary rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Actions */}
        <div slot="end" className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
             {/* @ts-ignore */}
             <md-icon-button onClick={onRemove} title="Remove">
                 <md-icon className="material-symbols-rounded">close</md-icon>
             </md-icon-button>
        </div>
      </md-list-item>
  );

  if (canDrag) {
    return (
      <Reorder.Item
        value={track.id}
        id={track.id}
        dragListener={false}
        dragControls={controls}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        style={{ listStyle: 'none' }}
        className="w-full relative" // Added width full
      >
        {ListItemContent}
      </Reorder.Item>
    );
  }

  return (
    <motion.div 
        layout="position" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="w-full"
    >
        {ListItemContent}
    </motion.div>
  );
});

const QueueList: React.FC<QueueListProps> = ({ 
  queue, 
  currentTrackId, 
  tracks, 
  onReorder, 
  onPlay, 
  onRemove
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLDivElement>(null);

  const { history, current, upcoming, canReorder } = useMemo(() => {
    if (!queue || !queue.length) return { history: [], current: null, upcoming: [], canReorder: false };
    
    const currentIndex = queue.indexOf(currentTrackId || '');
    // If track not found, assume it's at start or handle gracefully
    const splitIndex = currentIndex === -1 ? 0 : currentIndex;
    
    const upcomingSlice = queue.slice(splitIndex + 1);
    const upcomingSet = new Set(upcomingSlice);
    
    return {
      history: queue.slice(0, splitIndex),
      current: queue[splitIndex],
      upcoming: upcomingSlice,
      // Prevent reorder if there are duplicate IDs in the upcoming list
      canReorder: upcomingSet.size === upcomingSlice.length
    };
  }, [queue, currentTrackId]);

  useEffect(() => {
    // Slight delay to allow layout to settle before scrolling
    const timer = setTimeout(() => {
      activeTrackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => clearTimeout(timer);
  }, [currentTrackId]); // Re-run when track changes

  const handleReorderUpcoming = (newUpcoming: string[]) => {
    onReorder([...history, (current || ''), ...newUpcoming].filter(Boolean));
  };

  // --- Empty State ---
  if (!queue || queue.length === 0) {
    return (
      <div className="flex flex-col h-full bg-surface text-on-surface">
        <div className="flex w-full justify-between items-center px-6 pt-6">
          <h3 className="text-headline-medium font-bold">Queue</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-32 h-32 rounded-[32px] bg-surface-container-high flex items-center justify-center">
             <md-icon className="material-symbols-rounded text-on-surface-variant/50" style={{fontSize: '64px'}}>album</md-icon>
          </div>
          <div>
            <h4 className="text-headline-small font-medium">Your queue is empty</h4>
            <p className="text-body-large text-on-surface-variant mt-2">Add some tracks to start the vibe.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-surface text-on-surface">
      
      {/* --- Header --- */}
      <div className="flex items-center justify-between px-6 py-6 shrink-0 bg-surface/95 backdrop-blur-xl z-30">
        <div className="flex items-baseline gap-3">
           <h3 className="text-headline-medium font-bold">Queue</h3>
           <span className="text-title-medium text-on-surface-variant font-medium">{queue.length} tracks</span>
        </div>
      </div>

      {/* --- Main Scroll Area --- */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-4 pb-32">
        
        {/* History Section */}
        <AnimatePresence initial={false}>
          {history.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 mb-2"
            >
              <div className="flex items-center gap-3 px-2 mb-4 opacity-60">
                 <span className="text-label-medium font-bold uppercase tracking-widest text-on-surface-variant">History</span>
                 <div className="h-px bg-outline-variant flex-1 opacity-50" />
              </div>
              {/* @ts-ignore */}
              <md-list class="bg-transparent">
                {history.map((trackId, i) => tracks[trackId] && (
                    <QueueItem
                      key={`${trackId}-hist-${i}`}
                      track={tracks[trackId]}
                      isCurrent={false}
                      isHistory={true}
                      onPlay={() => onPlay(trackId)}
                      onRemove={() => onRemove(trackId)}
                    />
                ))}
              </md-list>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Track (Hero Section) */}
        {current && tracks[current] && (
          <div ref={activeTrackRef} className="my-6 sticky top-0 z-20 pt-4 -mx-4 px-4 pb-6 bg-surface/95 backdrop-blur-md shadow-sm rounded-b-[32px] ring-1 ring-white/5">
             <div className="text-label-medium font-bold text-primary uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
               Now Playing
             </div>
             
             <div className="relative">
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
        <div className="relative mt-4">
          <div className="flex justify-between items-end mb-4 px-2">
             <span className="text-label-medium font-bold text-on-surface-variant uppercase tracking-widest">Next Up</span>
             {upcoming.length > 0 && (
               <button 
                 onClick={() => onReorder([...history, (current || '')])}
                 className="flex items-center gap-1 text-label-small font-bold text-error hover:text-error-container transition-colors uppercase tracking-wider"
               >
                 Clear Queue
               </button>
             )}
          </div>

          {!canReorder && upcoming.length > 0 && (
             <div className="mx-2 mb-4 p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-xs font-medium">
               <span>⚠️ Shuffle active or duplicates present. Reordering disabled.</span>
             </div>
          )}

          {/* FIXED: Removed md-list wrapper for Reorder group to avoid invalid DOM nesting (UL inside Custom Element) */}
          <div className="w-full">
            {canReorder ? (
                <Reorder.Group 
                    axis="y" 
                    values={upcoming} 
                    onReorder={handleReorderUpcoming} 
                    style={{ listStyle: 'none', padding: 0 }}
                    className="flex flex-col gap-1"
                >
                {upcoming.map((trackId) => tracks[trackId] && (
                    <QueueItem
                        key={trackId}
                        track={tracks[trackId]}
                        isCurrent={false}
                        canDrag={true}
                        onPlay={() => onPlay(trackId)}
                        onRemove={() => onRemove(trackId)}
                    />
                ))}
                </Reorder.Group>
            ) : (
                // Static list fallback
                <div className="flex flex-col gap-1">
                    {upcoming.map((trackId, i) => tracks[trackId] && (
                        <QueueItem
                        key={`${trackId}-${i}`}
                        track={tracks[trackId]}
                        isCurrent={false}
                        onPlay={() => onPlay(trackId)}
                        onRemove={() => onRemove(trackId)}
                        />
                    ))}
                </div>
            )}
          </div>

          {upcoming.length === 0 && (
             <div className="py-12 flex flex-col items-center justify-center opacity-30 gap-4 text-on-surface-variant">
                 <md-icon className="material-symbols-rounded text-on-surface-variant/50" style={{fontSize: '32px'}}>queue_music</md-icon>
                 <p className="text-body-large font-medium">End of queue</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueList;
