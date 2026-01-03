import { useEffect, useRef, useState } from 'react';
import { useMotionValue, MotionValue } from 'framer-motion';

export interface AudioAnalysis {
  bass: MotionValue<number>;
  mid: MotionValue<number>;
  treble: MotionValue<number>;
  beat: boolean; // Keep as boolean state for event-driven triggers
}

// Global map to store source nodes to prevent "can only be connected once" error
const sourceNodes = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
// Global audio context to prevent "max context" errors
let globalAudioContext: AudioContext | null = null;

export const getAudioContext = () => {
    if (!globalAudioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        globalAudioContext = new AudioContextClass();
        // Store in window for access from other hooks
        (window as any).audioContext = globalAudioContext;
    }
    return globalAudioContext;
};

export const resumeAudioContext = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        try {
            await ctx.resume();
        } catch (e) {
            console.error("Failed to resume AudioContext", e);
        }
    }
};

export const useAudioAnalyzer = (audioElement: HTMLAudioElement | null, isPlaying: boolean) => {
  const [beat, setBeat] = useState(false);

  // Use MotionValues to avoid React renders for continuous data
  const bass = useMotionValue(0);
  const mid = useMotionValue(0);
  const treble = useMotionValue(0);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>();
  const dataArrayRef = useRef<Uint8Array>();

  // Beat detection state
  const historyRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef(0);

  useEffect(() => {
    if (!audioElement) return;

    try {
        const audioCtx = getAudioContext();

        // Resume context if suspended (browser policy)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        let source = sourceNodes.get(audioElement);
        if (!source) {
            source = audioCtx.createMediaElementSource(audioElement);
            sourceNodes.set(audioElement, source);
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        // Connect: Source -> Analyser. Also connect source directly to destination
        // to avoid the analyser sitting inline and potentially interfering with playback.
        source.connect(analyser);
        try {
            source.connect(audioCtx.destination);
        } catch (e) {
            // Some browsers may throw if already connected; ignore.
        }

        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        // Resume the context if the page becomes visible again (helps PWA/background resume)
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible' && audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            try {
                source?.disconnect(analyser);
                analyser.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    } catch (e) {
        console.error("Audio Context Error:", e);
    }
  }, [audioElement]);

  useEffect(() => {
    if (!isPlaying || !analyserRef.current || !dataArrayRef.current) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return;
    }

    const analyze = () => {
        const analyser = analyserRef.current!;
        const dataArray = dataArrayRef.current!;

        analyser.getByteFrequencyData(dataArray);

        let bassSum = 0;
        let midSum = 0;
        let trebleSum = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const val = dataArray[i] / 255;
            if (i < 3) bassSum += val;
            else if (i < 24) midSum += val;
            else trebleSum += val;
        }

        const b = bassSum / 3;
        const m = midSum / 21;
        const t = trebleSum / (128 - 24);

        // Update MotionValues directly (no render)
        bass.set(b);
        mid.set(m);
        treble.set(t);

        // Beat Detection
        const energy = b;
        const history = historyRef.current;
        history.push(energy);
        if (history.length > 40) history.shift();

        const avgEnergy = history.reduce((acc, val) => acc + val, 0) / history.length;

        const now = performance.now();
        const isBeat = energy > avgEnergy * 1.4 && (now - lastBeatTimeRef.current > 300) && energy > 0.3;

        if (isBeat) {
            lastBeatTimeRef.current = now;
            setBeat(true);
            // Use requestAnimationFrame for beat reset to avoid state thrashing
            const resetId = setTimeout(() => setBeat(false), 100);
            return () => clearTimeout(resetId);
        }

        rafRef.current = requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, bass, mid, treble]);

  return { bass, mid, treble, beat };
};
