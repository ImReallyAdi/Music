// src/utils/automix.ts
import { Track } from '../types';

// --- CONSTANTS ---
const CAMELOT_KEYS = [
  '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B',
  '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B'
];

type CamelotParts = { number: number; letter: 'A' | 'B' };

/**
 * Parses a key string (e.g., "11B") into parts.
 */
const parseKey = (key: string): CamelotParts | null => {
  const match = key.toUpperCase().match(/^(\d+)([AB])$/);
  if (!match) return null;
  return {
    number: parseInt(match[1], 10),
    letter: match[2] as 'A' | 'B'
  };
};

/**
 * Calculates the shortest distance between two numbers on a 1-12 clock.
 * e.g., Distance between 12 and 1 is 1.
 */
const getCircularDistance = (num1: number, num2: number): number => {
  const diff = Math.abs(num1 - num2);
  return Math.min(diff, 12 - diff);
};

/**
 * Returns a compatibility score (0-1) between two keys.
 * logic: https://mixedinkey.com/harmonic-mixing-guide/
 */
export const getKeyCompatibility = (key1?: string, key2?: string): number => {
  if (!key1 || !key2) return 0.5; // Unknown keys are neutral

  const k1 = parseKey(key1);
  const k2 = parseKey(key2);
  if (!k1 || !k2) return 0.5;

  // 1. Exact Match
  if (k1.number === k2.number && k1.letter === k2.letter) return 1.0;

  // 2. Relative Major/Minor (Same number, different letter) e.g. 8A <-> 8B
  if (k1.number === k2.number && k1.letter !== k2.letter) return 1.0;

  const dist = getCircularDistance(k1.number, k2.number);

  // 3. Perfect 4th/5th (Adjacent number, same letter) e.g. 8A <-> 9A
  if (dist === 1 && k1.letter === k2.letter) return 0.9;

  // 4. Energy Boost (Add 1 or 2 semitones / +7 or +2 on Camelot)
  // +1 number (dist 1) with key change is often used for modulation
  if (dist === 1 && k1.letter !== k2.letter) return 0.7;
  
  // "Energy Boost" usually implies jumping +2 numbers (e.g. 1A -> 3A)
  if (dist === 2 && k1.letter === k2.letter) return 0.6;

  // 5. Disharmonic
  return 0.1;
};

/**
 * Returns BPM compatibility score (0-1).
 * Handles wide bpm ranges using percentages and half/double time.
 */
export const getBpmCompatibility = (bpm1?: number, bpm2?: number): number => {
  if (!bpm1 || !bpm2) return 0.6; 

  const ratios = [1, 0.5, 2];
  let bestRatioDiff = Infinity;

  // Find the version of bpm2 (original, half, or double) closest to bpm1
  ratios.forEach(r => {
    const targetBpm = bpm2 * r;
    const diffPct = Math.abs((bpm1 - targetBpm) / bpm1);
    if (diffPct < bestRatioDiff) bestRatioDiff = diffPct;
  });

  // Linear drop-off based on percentage difference
  // < 1% diff = 1.0 score
  // > 15% diff = 0.0 score
  const threshold = 0.15; // 15%
  if (bestRatioDiff > threshold) return 0.1;

  // Map 0 -> 0.15 diff to 1.0 -> 0.0 score
  return 1.0 - (bestRatioDiff / threshold);
};

/**
 * Deterministic mock metadata generator.
 * Uses a string hash so the same ID always produces the same mock data.
 */
export const enrichTrackMetadata = (track: Track): Track => {
  if (track.bpm && track.key) return track;

  let hash = 0;
  for (let i = 0; i < track.id.length; i++) {
    hash = ((hash << 5) - hash) + track.id.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const mockBpm = 70 + (absHash % 110); 
  const mockKeyIndex = absHash % CAMELOT_KEYS.length;

  return {
    ...track,
    bpm: track.bpm || Math.round(mockBpm),
    key: track.key || CAMELOT_KEYS[mockKeyIndex],
    energy: track.energy // Don't overwrite if exists
  };
};

/**
 * Selects the best next track using weighted probability.
 * @param currentTrack The track currently playing
 * @param candidates List of available tracks
 * @param historyIds Optional array of recently played track IDs to avoid repeats
 */
export const getSmartNextTrack = (
  currentTrack: Track, 
  candidates: Track[],
  historyIds: string[] = []
): Track | null => {
  // Filter out recent history and self
  const pool = candidates.filter(c => 
    c.id !== currentTrack.id && !historyIds.includes(c.id)
  );

  if (pool.length === 0) return null;

  const current = enrichTrackMetadata(currentTrack);

  const scored = pool.map(c => {
    const candidate = enrichTrackMetadata(c);
    const keyScore = getKeyCompatibility(current.key, candidate.key);
    const bpmScore = getBpmCompatibility(current.bpm, candidate.bpm);
    
    // Weights: BPM is critical for beatmatching, Key for "vibe"
    // We add a tiny random jitter (0.05) so identical scores shuffle
    const totalScore = (keyScore * 0.3) + (bpmScore * 0.7) + (Math.random() * 0.05);
    
    return { track: c, score: totalScore };
  });

  // Sort descending
  scored.sort((a, b) => b.score - a.score);

  // Take top 5 or top 10% (whichever is smaller) to ensure quality
  const sliceSize = Math.max(1, Math.min(5, Math.floor(scored.length * 0.2)));
  const topCandidates = scored.slice(0, sliceSize);

  // Weighted Random Selection
  // Sum of scores in top pool
  const totalWeight = topCandidates.reduce((sum, item) => sum + item.score, 0);
  let randomVal = Math.random() * totalWeight;

  for (const item of topCandidates) {
    randomVal -= item.score;
    if (randomVal <= 0) {
      return item.track;
    }
  }

  return topCandidates[0].track;
};
