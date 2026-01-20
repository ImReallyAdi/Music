import React, { useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion';
import { Track } from '../types';
import { X, GripVertical, Disc, Music2 } from 'lucide-react';
import { cn } from '../utils/cn';

// --- Types ---
interface QueueListProps {
  queue: string[];
  currentTrackId: string | null;
  tracks: Record<string, Track>;
  onReorder: (newQueue: string[]) => void;
  onPlay: (trackId: string) => void;
  onRemove: (trackId: string) => void;
  onPlayNext?: (trackId: string) => void;
  onClose?: () => void;
}

interface QueueItemProps {
  track: Track;
  isCurrent?: boolean;
  isHistory?: boolean;
  canDrag?: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

// --- QueueItem ---
const QueueItem = memo(function QueueItem({
  track,
  isCurrent = false,
  isHistory = false,
  canDrag = false,
  onPlay,
  onRemove,
}: QueueItemProps) {
  const controls = useDragControls();

  const content = (
    <div
        className={cn(
            "flex items-center gap-4 p-3 w-full group transition-colors",
            isCurrent ? "bg-accent/10 border-l-2 border-accent" : "hover:bg-muted/50 border-l-2 border-transparent",
            isHistory && "opacity-50"
        )}
        onClick={onPlay}
    >
      {/* Drag Handle */}
      {canDrag && (
        <div
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              controls.start(e);
            }}
        >
          <GripVertical size={20} />
        </div>
      )}

      {/* Art */}
      <div className="relative w-12 h-12 overflow-hidden bg-muted flex items-center justify-center shrink-0">
        <img
            src={track.coverArt}
            alt={track.title}
            loading="lazy"
            className={cn("w-full h-full object-cover", isHistory && "grayscale")}
        />
        {isCurrent && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
               <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className={cn(
            "text-base font-bold font-display truncate leading-none uppercase tracking-tight",
            isCurrent ? "text-accent" : "text-foreground"
        )}>
          {track.title}
        </span>
        <span className="text-xs font-mono text-muted-foreground truncate uppercase tracking-wider">
          {track.artist}
        </span>
      </div>

      {/* Actions */}
      <button
        onClick={(e) => {
            e.stopPropagation();
            onRemove();
        }}
        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
      >
        <X size={18} />
      </button>
    </div>
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
        className="w-full relative border-b border-border/50 last:border-0"
      >
        {content}
      </Reorder.Item>
    );
  }

  return (
    <motion.div layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full border-b border-border/50 last:border-0">
      {content}
    </motion.div>
  );
});

QueueItem.displayName = 'QueueItem';

// --- QueueList ---
const QueueList: React.FC<QueueListProps> = ({
  queue,
  currentTrackId,
  tracks,
  onReorder,
  onPlay,
  onRemove,
  onPlayNext,
  onClose,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeTrackRef = useRef<HTMLDivElement | null>(null);

  // Split into history / current / upcoming
  const { history, current, upcoming, canReorder } = useMemo(() => {
    if (!queue || queue.length === 0) {
      return { history: [] as string[], current: null as string | null, upcoming: [] as string[], canReorder: false };
    }

    const currentIdx = currentTrackId ? queue.indexOf(currentTrackId) : -1;
    const splitIndex = currentIdx === -1 ? 0 : currentIdx;

    const historySlice = queue.slice(0, splitIndex);
    const currentId = queue[splitIndex] ?? null;
    const upcomingSlice = queue.slice(splitIndex + 1);
    const upcomingSet = new Set(upcomingSlice);

    return {
      history: historySlice,
      current: currentId,
      upcoming: upcomingSlice,
      // If duplicates present or shuffle is active, don't allow reordering
      canReorder: upcomingSet.size === upcomingSlice.length,
    };
  }, [queue, currentTrackId]);

  // Scroll to current track on change
  useEffect(() => {
    const t = setTimeout(() => {
      activeTrackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => clearTimeout(t);
  }, [currentTrackId]);

  const handleReorderUpcoming = useCallback(
    (newUpcoming: string[]) => {
      const base = [...history];
      if (current) base.push(current);
      const merged = [...base, ...newUpcoming].filter(Boolean);
      onReorder(merged as string[]);
    },
    [history, current, onReorder]
  );

  // Renderers
  const renderHistory = useMemo(() => {
    if (!history || history.length === 0) return null;
    return (
      <AnimatePresence initial={false}>
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
          <div className="flex items-center gap-3 px-4 py-2 opacity-60">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">History</span>
            <div className="h-px bg-border flex-1" />
          </div>
          <div>
            {history.map((trackId, idx) => {
              const t = tracks[trackId];
              if (!t) return null;
              return (
                <QueueItem
                  key={`${trackId}-hist-${idx}`}
                  track={t}
                  isHistory
                  onPlay={() => onPlay(trackId)}
                  onRemove={() => onRemove(trackId)}
                />
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }, [history, tracks, onPlay, onRemove]);

  const upcomingList = useMemo(() => {
    if (!upcoming || upcoming.length === 0) {
      return (
        <div className="py-12 flex flex-col items-center justify-center opacity-30 gap-4 text-muted-foreground">
          <Music2 size={32} />
          <p className="text-lg font-display uppercase tracking-tight">End of queue</p>
        </div>
      );
    }

    if (canReorder) {
      return (
        <Reorder.Group
          axis="y"
          values={upcoming}
          onReorder={handleReorderUpcoming}
          style={{ listStyle: 'none', padding: 0 }}
          className="flex flex-col"
        >
          {upcoming.map((trackId) => {
            const t = tracks[trackId];
            if (!t) return null;
            return (
              <QueueItem
                key={trackId}
                track={t}
                canDrag
                onPlay={() => onPlay(trackId)}
                onRemove={() => onRemove(trackId)}
              />
            );
          })}
        </Reorder.Group>
      );
    }

    // Static fallback
    return (
      <div className="flex flex-col">
        {upcoming.map((trackId, idx) => {
          const t = tracks[trackId];
          if (!t) return null;
          return (
            <QueueItem
              key={`${trackId}-${idx}`}
              track={t}
              onPlay={() => onPlay(trackId)}
              onRemove={() => onRemove(trackId)}
            />
          );
        })}
      </div>
    );
  }, [upcoming, tracks, canReorder, onPlay, onRemove, handleReorderUpcoming]);

  // --- Empty State ---
  if (!queue || queue.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background text-foreground">
        <div className="flex w-full justify-between items-center px-6 py-6 border-b border-border">
          <h3 className="text-3xl font-display font-black uppercase tracking-tighter">Queue</h3>
          {onClose && (
            <button onClick={onClose} className="hover:text-accent transition-colors">
                <X size={24} />
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <Disc size={64} className="text-muted-foreground opacity-20" />
          <div>
            <h4 className="text-xl font-bold font-display uppercase tracking-tight">Your queue is empty</h4>
            <p className="text-muted-foreground mt-2 font-mono text-sm">Add some tracks to start the vibe.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 shrink-0 border-b border-border z-30 bg-background">
        <div className="flex items-baseline gap-4">
          <h3 className="text-4xl font-display font-black uppercase tracking-tighter">Queue</h3>
          <span className="text-sm font-mono text-accent font-bold">{queue.length} tracks</span>
        </div>
        {onClose && (
            <button onClick={onClose} className="hover:text-accent transition-colors">
                <X size={24} />
            </button>
        )}
      </div>

      {/* Main Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-32">
        {renderHistory}

        {/* Current (Hero) */}
        {current && tracks[current] && (
          <div
            ref={activeTrackRef}
            className="sticky top-0 z-20 bg-background border-b border-border"
          >
            <div className="text-xs font-mono font-bold text-accent uppercase tracking-widest px-4 py-2 bg-muted/30">
              Now Playing
            </div>

            <QueueItem
                track={tracks[current]}
                isCurrent
                onPlay={() => {}}
                onRemove={() => onRemove(current)}
            />
          </div>
        )}

        {/* Upcoming */}
        <div className="relative mt-4">
          <div className="flex justify-between items-end mb-2 px-4">
            <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Next Up</span>
            {upcoming.length > 0 && (
              <button
                onClick={() => onReorder([...history, current ?? ''])}
                className="text-xs font-mono font-bold text-destructive hover:text-red-400 transition-colors uppercase tracking-wider"
              >
                Clear Queue
              </button>
            )}
          </div>

          <div className="w-full">{upcomingList}</div>
        </div>
      </div>
    </div>
  );
};

export default QueueList;
