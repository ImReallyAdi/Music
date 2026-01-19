import React, { useEffect, useRef, useMemo, memo, useCallback } from 'react';
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

  const listItemStyle: React.CSSProperties = {
    cursor: 'pointer',
    '--md-list-item-leading-image-height': '56px',
    '--md-list-item-leading-image-width': '56px',
    '--md-list-item-leading-image-shape': '16px',

    backgroundColor: isCurrent ? 'var(--md-sys-color-surface-container-high)' : 'transparent',
    borderRadius: 24,
    marginBottom: 8,
    opacity: isHistory ? 0.6 : 1,
    width: '100%',
  } as React.CSSProperties;

  // @ts-ignore - Custom Element
  const listItem = (
    // @ts-ignore
    <md-list-item
      type="button"
      onClick={onPlay}
      className="w-full"
      style={listItemStyle}
      aria-current={isCurrent ? 'true' : undefined}
    >
      <div slot="headline" className={`truncate text-body-large font-medium ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>
        {track.title}
      </div>
      <div slot="supporting-text" className={`truncate text-body-medium ${isCurrent ? 'text-primary' : 'text-on-surface-variant'}`}>
        {track.artist}
      </div>
      <div slot="start" className="flex items-center gap-3">
        {canDrag && (
          <div
            className="cursor-grab active:cursor-grabbing text-on-surface-variant opacity-60 hover:opacity-100 p-2 -ml-3 touch-none"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              controls.start(e);
            }}
          >
            <md-icon className="material-symbols-rounded">drag_indicator</md-icon>
          </div>
        )}

        <div className="relative w-14 h-14 rounded-[16px] overflow-hidden bg-surface-variant flex items-center justify-center border border-white/5 shrink-0">
          <img
            src={track.coverArt}
            alt={track.title}
            loading="lazy"
            className={`w-full h-full object-cover ${isHistory ? 'grayscale' : ''}`}
          />
          {isCurrent && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex gap-1 items-end h-4 pb-1">
                {[0.6, 0.8, 1.0].map((d, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: ['20%', '100%', '20%'] }}
                    transition={{ duration: d, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-1 bg-primary rounded-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div slot="end" className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
        {/* @ts-ignore */}
        <md-icon-button 
            onClick={(e: any) => { 
                e.stopPropagation(); 
                onRemove(); 
            }} 
            title="Remove"
        >
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
        className="w-full relative"
      >
        {listItem}
      </Reorder.Item>
    );
  }

  return (
    <motion.div layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
      {listItem}
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
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 mb-2">
          <div className="flex items-center gap-3 px-2 mb-4 opacity-60">
            <span className="text-label-medium font-bold uppercase tracking-widest text-on-surface-variant">History</span>
            <div className="h-px bg-outline-variant flex-1 opacity-50" />
          </div>

          {/* @ts-ignore */}
          <md-list className="bg-transparent">
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
          </md-list>
        </motion.div>
      </AnimatePresence>
    );
  }, [history, tracks, onPlay, onRemove]);

  const upcomingList = useMemo(() => {
    if (!upcoming || upcoming.length === 0) {
      return (
        <div className="py-12 flex flex-col items-center justify-center opacity-30 gap-4 text-on-surface-variant">
          <md-icon className="material-symbols-rounded text-on-surface-variant/50" style={{ fontSize: 32 }}>
            queue_music
          </md-icon>
          <p className="text-body-large font-medium">End of queue</p>
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
          className="flex flex-col gap-1"
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
      <div className="flex flex-col gap-1">
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
      <div className="flex flex-col h-full bg-transparent text-on-surface">
        <div className="flex w-full justify-between items-center px-6 pt-6">
          <h3 className="text-headline-medium font-bold text-on-surface">Queue</h3>
          {onClose && (
            // @ts-ignore
            <md-icon-button onClick={onClose}>
                <md-icon class="material-symbols-rounded text-on-surface">close</md-icon>
            </md-icon-button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-32 h-32 rounded-[32px] bg-surface-container-high/50 flex items-center justify-center">
            <md-icon className="material-symbols-rounded text-on-surface-variant/50" style={{ fontSize: 64 }}>
              album
            </md-icon>
          </div>
          <div>
            <h4 className="text-headline-small font-medium text-on-surface">Your queue is empty</h4>
            <p className="text-body-large text-on-surface-variant mt-2">Add some tracks to start the vibe.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-transparent text-on-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 shrink-0 bg-surface/20 backdrop-blur-md z-30 border-b border-white/5">
        <div className="flex items-baseline gap-3">
          <h3 className="text-headline-medium font-bold text-on-surface">Queue</h3>
          <span className="text-title-medium text-on-surface-variant font-medium">{queue.length} tracks</span>
        </div>
        {onClose && (
            // @ts-ignore
            <md-icon-button onClick={onClose}>
                <md-icon class="material-symbols-rounded text-on-surface">close</md-icon>
            </md-icon-button>
        )}
      </div>

      {/* Main Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-4 pb-32">
        {renderHistory}

        {/* Current (Hero) */}
        {current && tracks[current] && (
          <div
            ref={activeTrackRef}
            className="my-6 sticky top-0 z-20 pt-4 -mx-4 px-4 pb-6 bg-surface/20 backdrop-blur-md shadow-sm rounded-b-[32px] ring-1 ring-white/5"
          >
            <div className="text-label-medium font-bold text-primary uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
              Now Playing
            </div>

            <div className="relative">
              <QueueItem
                track={tracks[current]}
                isCurrent
                onPlay={() => {}}
                onRemove={() => onRemove(current)}
              />
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div className="relative mt-4">
          <div className="flex justify-between items-end mb-4 px-2">
            <span className="text-label-medium font-bold text-on-surface-variant uppercase tracking-widest">Next Up</span>
            {upcoming.length > 0 && (
              <button
                onClick={() => onReorder([...history, current ?? ''])}
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

          <div className="w-full">{upcomingList}</div>
        </div>
      </div>
    </div>
  );
};

export default QueueList;
