import React, { useEffect, useRef, useMemo, memo } from 'react';
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion';
import { Track } from '../types';
import { Play, X, GripVertical, ArrowUpToLine, Trash2, ListMusic, Disc3, Pause } from 'lucide-react';
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
  onPlayNext?: () => void;
}

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

  // Using Material Web List Item
  // We wrap it in Reorder.Item if drag is enabled

  const ListItemContent = (
      <md-list-item
        type="button"
        headline={track.title}
        supportingText={track.artist}
        onClick={onPlay}
        style={{
            cursor: 'pointer',
            '--md-list-item-leading-image-height': '48px',
            '--md-list-item-leading-image-width': '48px',
            '--md-list-item-leading-image-shape': '8px',
            '--md-list-item-container-color': isCurrent ? 'var(--md-sys-color-primary-container)' : 'transparent',
            '--md-list-item-label-text-color': isCurrent ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
            '--md-list-item-supporting-text-color': isCurrent ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
            borderRadius: '12px',
            marginBottom: '4px',
            opacity: isHistory ? 0.5 : 1
        }}
      >
        {/* Drag Handle */}
        {canDrag && (
            <div slot="start" className="pr-3 cursor-grab active:cursor-grabbing text-on-surface-variant" onPointerDown={(e) => controls.start(e)}>
                 <GripVertical size={20} />
            </div>
        )}

        {/* Artwork */}
        <div slot="start" className="relative w-12 h-12 rounded-[8px] overflow-hidden bg-surface-variant flex items-center justify-center">
            <img
                src={track.coverArt}
                alt={track.title}
                className={`w-full h-full object-cover ${isHistory ? 'grayscale' : ''}`}
            />
            {isCurrent && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                   <div className="flex gap-0.5 items-end h-3 pb-1">
                        {[0.6, 0.8, 1.0].map((d, i) => (
                            <motion.span
                                key={i}
                                animate={{ height: ["20%", "100%", "20%"] }}
                                transition={{ duration: d, repeat: Infinity, ease: "easeInOut" }}
                                className="w-1 bg-white rounded-full"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Actions */}
        <div slot="end" className="flex items-center" onClick={(e) => e.stopPropagation()}>
             {!isCurrent && onPlayNext && (
                <md-icon-button onClick={onPlayNext} title="Play Next">
                    <md-icon><ArrowUpToLine size={20} /></md-icon>
                </md-icon-button>
             )}
             <md-icon-button onClick={onRemove} title="Remove">
                 <md-icon><X size={20} /></md-icon>
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
      >
        {ListItemContent}
      </Reorder.Item>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
    const upcomingSet = new Set(upcomingSlice);
    
    return {
      history: queue.slice(0, splitIndex),
      current: queue[splitIndex],
      upcoming: upcomingSlice,
      canReorder: upcomingSet.size === upcomingSlice.length
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
      <div className="flex flex-col h-full bg-surface text-on-surface">
        <div className="flex w-full justify-between items-center px-4 pt-4">
          <h3 className="text-headline-small font-bold">Queue</h3>
          {onClose && (
            <md-icon-button onClick={onClose}>
              <md-icon><X /></md-icon>
            </md-icon-button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-32 h-32 rounded-full bg-surface-variant flex items-center justify-center">
             <Disc3 size={64} className="text-on-surface-variant/50" />
          </div>
          <div>
            <h4 className="text-title-large font-medium">Your queue is empty</h4>
            <p className="text-body-medium text-on-surface-variant mt-2">Add some tracks to start the vibe.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-surface text-on-surface">
      
      {/* --- Header --- */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0 bg-surface/90 backdrop-blur-xl z-30 border-b border-outline-variant/20">
        <div className="flex items-baseline gap-3">
           <h3 className="text-headline-small font-bold">Queue</h3>
           <span className="text-body-small text-on-surface-variant">{queue.length} tracks</span>
        </div>
        {onClose && (
          <md-icon-button onClick={onClose}>
            <md-icon><X /></md-icon>
          </md-icon-button>
        )}
      </div>

      {/* --- Main Scroll Area --- */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-2 pb-32">
        
        {/* History Section */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 mb-2"
            >
              <div className="flex items-center gap-3 px-4 mb-2 opacity-60">
                 <span className="text-label-small font-bold uppercase tracking-widest text-on-surface-variant">History</span>
                 <div className="h-px bg-outline-variant flex-1" />
              </div>
              <md-list>
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
              </md-list>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Track (Hero Section) */}
        {current && tracks[current] && (
          <div ref={activeTrackRef} className="my-6 sticky top-0 z-20 pt-2 -mx-2 px-2 pb-4 bg-surface/95 backdrop-blur-sm shadow-sm rounded-b-3xl">
             <div className="text-label-small font-bold text-primary uppercase tracking-widest mb-3 px-4 flex items-center gap-2">
               Now Playing
             </div>
             
             <div className="relative px-2">
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
          <div className="flex justify-between items-end mb-2 px-4">
             <span className="text-label-small font-bold text-on-surface-variant uppercase tracking-widest">Next Up</span>
             {upcoming.length > 0 && (
               <button 
                 onClick={() => onReorder([...history, (current || '')])}
                 className="flex items-center gap-1 text-xs font-medium text-error hover:text-error-container transition-colors"
               >
                 Clear
               </button>
             )}
          </div>

          {!canReorder && upcoming.length > 0 && (
             <div className="mx-2 mb-4 p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-xs">
               <span>⚠️ Shuffle active or duplicates present. Reordering disabled.</span>
             </div>
          )}

          <md-list>
          {canReorder ? (
            <Reorder.Group axis="y" values={upcoming} onReorder={handleReorderUpcoming} style={{ listStyle: 'none', padding: 0 }}>
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
            <div>
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
          </md-list>

          {upcoming.length === 0 && (
             <div className="py-12 flex flex-col items-center justify-center opacity-30 gap-4 text-on-surface-variant">
                 <ListMusic size={32} />
                 <p className="text-body-medium font-medium">End of queue</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueList;
