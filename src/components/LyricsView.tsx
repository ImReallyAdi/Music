import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLyrics } from '../utils/lyrics';
import { Track, Lyrics, LyricLine as LyricLineType, LyricWord } from '../types';
import { Loader2, Music2, AlertCircle } from 'lucide-react';

// --- Components ---

/**
 * Individual Word Component for granular "Karaoke" animation.
 * We interpolate the fill based on the current time relative to the word's duration.
 */
const KaraokeWord = ({ 
    word, 
    nextWordTime, 
    currentTime, 
    isActiveLine 
}: { 
    word: LyricWord; 
    nextWordTime: number; 
    currentTime: number; 
    isActiveLine: boolean;
}) => {
    // If this line isn't active, we don't need expensive calcs.
    if (!isActiveLine) {
        // If line is past, word is full white. If future, word is dimmed.
        const isPast = currentTime > word.time;
        return <span className={isPast ? "text-white" : "text-white/30"}>{word.text}</span>;
    }

    // Calculate progress (0 to 1) for this specific word
    const duration = nextWordTime - word.time;
    // Safety check for zero duration or weird data
    const safeDuration = duration > 0 ? duration : 0.5; 
    const progress = Math.min(Math.max((currentTime - word.time) / safeDuration, 0), 1);

    // If word is completely done
    if (progress === 1) return <span className="text-white">{word.text}</span>;
    // If word hasn't started
    if (progress === 0) return <span className="text-white/30">{word.text}</span>;

    // Render the "filling" effect using background-clip
    return (
        <span className="relative inline-block">
            {/* Background (Inactive Color) */}
            <span className="text-white/30 select-none absolute inset-0" aria-hidden="true">
                {word.text}
            </span>
            {/* Foreground (Active Color) - Clipped */}
            <span 
                className="text-white relative z-10 block overflow-hidden"
                style={{ width: `${progress * 100}%`, whiteSpace: 'pre' }}
            >
                {word.text}
            </span>
        </span>
    );
};

/**
 * Memoized Line Component to prevent re-rendering the whole list.
 */
const LyricLineItem = React.memo(({ 
    line, 
    index, 
    isActive, 
    isPast, 
    currentTime, 
    onSeek 
}: { 
    line: LyricLineType; 
    index: number; 
    isActive: boolean; 
    isPast: boolean; 
    currentTime: number; 
    onSeek: (t: number) => void;
}) => {
    const isWordSynced = line.words && line.words.length > 0;

    return (
        <motion.div
            layout // Smooth layout transitions if spacing changes
            onClick={() => onSeek(line.time)}
            initial={false}
            animate={{
                scale: isActive ? 1.05 : 1,
                opacity: isActive ? 1 : isPast ? 0.5 : 0.3,
                filter: isActive ? 'blur(0px)' : 'blur(1px)',
                y: isActive ? 0 : 0
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`
                cursor-pointer origin-left py-3 px-6 rounded-xl transition-colors duration-300
                ${isActive ? 'bg-white/5' : 'hover:bg-white/5'}
            `}
        >
            <div className={`text-2xl md:text-3xl font-bold leading-relaxed flex flex-wrap gap-x-[0.25em] ${isActive ? 'drop-shadow-lg' : ''}`}>
                {isWordSynced ? (
                    line.words!.map((word, wIdx) => {
                        // Determine the end time of this word (start of next word, or end of line estimate)
                        const nextWord = line.words![wIdx + 1];
                        // If it's the last word, give it a hypothetical duration (e.g. 1 sec or until next line)
                        // Ideally we'd pass the next line time, but 0.5s is a decent default for "trailing"
                        const nextTime = nextWord ? nextWord.time : (word.time + 1.5); 
                        
                        return (
                            <KaraokeWord
                                key={wIdx}
                                word={word}
                                nextWordTime={nextTime}
                                currentTime={currentTime}
                                isActiveLine={isActive}
                            />
                        );
                    })
                ) : (
                   <span>{line.text}</span>
                )}
            </div>
        </motion.div>
    );
});

// --- Main Container ---

interface LyricsViewProps {
    track: Track;
    currentTime: number;
    onSeek: (time: number) => void;
    onTrackUpdate?: (track: Track) => void;
    onClose?: () => void;
}

const LyricsView: React.FC<LyricsViewProps> = ({ track, currentTime, onSeek, onTrackUpdate }) => {
    const [lyrics, setLyrics] = useState<Lyrics | null>(track.lyrics || null);
    const [loading, setLoading] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    const [isUserScrolling, setIsUserScrolling] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);

    // 1. Logic: Fetching
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (track.lyrics && !track.lyrics.error) {
                setLyrics(track.lyrics);
            } else {
                setLoading(true);
                setLyrics(null);
            }

            try {
                const data = await fetchLyrics(track);
                if (mounted && data) {
                    // Deep compare could go here, but reference check is fast
                    if (JSON.stringify(data) !== JSON.stringify(track.lyrics)) {
                        setLyrics(data);
                        if (onTrackUpdate && !data.error) onTrackUpdate({ ...track, lyrics: data });
                    }
                }
            } catch (e) {
                console.warn("Lyrics fetch error", e);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [track.id]);

    // 2. Logic: Syncing
    useEffect(() => {
        if (!lyrics?.synced) return;
        
        // Binary search is overkill for lyrics (<100 lines), findIndex is fine
        // We find the *last* line that has started
        const index = lyrics.lines.findIndex((line, i) => {
            const nextLine = lyrics.lines[i + 1];
            return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });

        if (index !== -1 && index !== activeLineIndex) {
            setActiveLineIndex(index);
        }
    }, [currentTime, lyrics]);

    // 3. Logic: Scrolling
    // Smooth scroll active element into view unless user is interacting
    useEffect(() => {
        if (activeLineIndex !== -1 && scrollRef.current && !isUserScrolling) {
            const children = scrollRef.current.children;
            if (children[activeLineIndex]) {
                children[activeLineIndex].scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'center'
                });
            }
        }
    }, [activeLineIndex, isUserScrolling]);

    const handleInteraction = useCallback(() => {
        setIsUserScrolling(true);
        if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
        userScrollTimeout.current = setTimeout(() => setIsUserScrolling(false), 2500);
    }, []);


    // --- Renderers ---

    if (loading) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                <Loader2 className="animate-spin text-white/50 mb-3" size={32} />
                <span className="text-white/50 text-sm font-medium tracking-widest uppercase">Syncing Lyrics</span>
            </div>
        );
    }

    if (!lyrics || (lyrics.lines.length === 0 && !lyrics.plain)) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-8 text-center">
                <Music2 className="text-white/20 mb-4" size={64} />
                <h3 className="text-white/90 font-bold text-xl mb-1">Instrumental</h3>
                <p className="text-white/40 text-sm">Or lyrics not available for this track.</p>
            </div>
        );
    }

    // Plain Text Fallback
    if (!lyrics.synced && lyrics.plain) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md overflow-y-auto p-8"
            >
                <p className="text-white/80 whitespace-pre-wrap text-lg leading-loose font-medium text-center max-w-2xl mx-auto">
                    {lyrics.plain}
                </p>
            </motion.div>
        );
    }

    // Synced View
    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col bg-black/60 backdrop-blur-xl"
        >
            {/* Gradient Masks */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black via-black/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none" />

            <div 
                ref={containerRef}
                onWheel={handleInteraction}
                onTouchMove={handleInteraction}
                className="w-full h-full overflow-y-auto no-scrollbar scroll-smooth"
            >
                <div 
                    ref={scrollRef} 
                    className="flex flex-col gap-6 py-[50vh] max-w-4xl mx-auto"
                >
                    {lyrics.lines.map((line, i) => (
                        <LyricLineItem
                            key={i}
                            index={i}
                            line={line}
                            isActive={i === activeLineIndex}
                            isPast={i < activeLineIndex}
                            currentTime={currentTime}
                            onSeek={onSeek}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default LyricsView;
