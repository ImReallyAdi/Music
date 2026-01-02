import { useState, useRef, useEffect, useCallback } from 'react';
import { dbService } from '../db';
import { Track, PlayerState, RepeatMode } from '../types';

export const useAudioPlayer = (
  libraryTracks: Record<string, Track>,
  updateMediaSession: (track: Track) => void
) => {
  // --- STATE ---
  const [player, setPlayer] = useState<PlayerState>({
    currentTrackId: null,
    isPlaying: false,
    queue: [],
    originalQueue: [],
    history: [],
    shuffle: false,
    repeat: RepeatMode.OFF,
    volume: 1,
    crossfadeEnabled: false,
    crossfadeDuration: 5,
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- AUDIO ARCHITECTURE (SINGLE OWNER) ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextTrackBlobRef = useRef<{ id: string; blob: Blob } | null>(null);

  const saveState = useCallback((state: PlayerState) => {
    dbService.setSetting('playerState', state);
  }, []);

  const shuffleArray = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = 'auto';
      a.playsInline = true;
      audioRef.current = a;
    }

    // Load persisted state
    dbService.getSetting<PlayerState>('playerState').then(saved => {
      if (saved) {
        setPlayer(prev => ({
           ...prev,
           ...saved,
           isPlaying: false
        }));
        
        // Restore volume
        if (audioRef.current && saved.volume !== undefined) {
             audioRef.current.volume = Math.max(0, Math.min(1, saved.volume));
        }

        // Restore last track
        if (saved.currentTrackId) {
             dbService.getAudioBlob(saved.currentTrackId).then(blob => {
                 if (blob && audioRef.current) {
                     const url = URL.createObjectURL(blob);
                     audioRef.current.src = url;
                     audioRef.current.currentTime = 0;
                 }
             });
        }
      }
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Save state on change
  useEffect(() => {
    saveState(player);
  }, [player, saveState]);


  // --- CORE LOGIC ---

  const playTrack = useCallback(async (trackId: string, options: {
    immediate?: boolean;
    fromQueue?: boolean;
    customQueue?: string[];
    preloadedBlob?: Blob;
  } = {}) => {
    const { immediate = true, fromQueue = false, customQueue, preloadedBlob } = options;
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setPlayer(prev => {
        let newQueue = prev.queue;
        let newOriginalQueue = prev.originalQueue;

        if (customQueue) {
          newQueue = [...customQueue];
          newOriginalQueue = [...customQueue];
          if (prev.shuffle) {
             const others = customQueue.filter(id => id !== trackId);
             newQueue = [trackId, ...shuffleArray(others)];
          }
        } else if (!fromQueue) {
             if (prev.queue.length === 0) {
                 newQueue = [trackId];
                 newOriginalQueue = [trackId];
             } else {
                 const filteredQueue = prev.queue.filter(id => id !== trackId);
                 let newCurrentIdx = filteredQueue.indexOf(prev.currentTrackId || '');
                 if (newCurrentIdx === -1) newCurrentIdx = 0;

                 if (prev.currentTrackId === trackId) {
                      newQueue = [trackId, trackId, ...filteredQueue];
                 } else {
                      const q = [...filteredQueue];
                      q.splice(newCurrentIdx + 1, 0, trackId);
                      newQueue = q;
                 }

                 if (!prev.originalQueue.includes(trackId)) {
                     newOriginalQueue = [...prev.originalQueue, trackId];
                 }
             }
        }

        if (immediate) {
             const track = libraryTracks[trackId];
             if (track) updateMediaSession(track);
        }

        return {
          ...prev,
          currentTrackId: trackId,
          queue: newQueue,
          originalQueue: newOriginalQueue,
          isPlaying: true
        };
      });

      if (immediate) {
        let audioBlob = preloadedBlob;
        if (!audioBlob) {
          audioBlob = await dbService.getAudioBlob(trackId);
        }

        if (!audioBlob) {
          console.error(`Audio blob not found for ${trackId}`);
          return;
        }

        const url = URL.createObjectURL(audioBlob);
        audio.src = url;
        audio.currentTime = 0;
        await audio.play();
      }

    } catch (e) {
      console.error("Playback error", e);
      setPlayer(p => ({ ...p, isPlaying: false }));
    }
  }, [libraryTracks, updateMediaSession]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (player.isPlaying) {
        audio.pause();
        setPlayer(p => ({ ...p, isPlaying: false }));
    } else {
        audio.play().catch(console.error);
        setPlayer(p => ({ ...p, isPlaying: true }));
    }
  }, [player.isPlaying]);

  const nextTrack = useCallback(() => {
     const currentIndex = player.queue.indexOf(player.currentTrackId || '');
     let nextId: string | null = null;

     if (currentIndex >= 0 && currentIndex < player.queue.length - 1) {
         nextId = player.queue[currentIndex + 1];
     } else if (player.repeat === RepeatMode.ALL && player.queue.length > 0) {
         nextId = player.queue[0];
     }

     if (nextId) {
         const preloaded = nextTrackBlobRef.current?.id === nextId ? nextTrackBlobRef.current.blob : undefined;
         playTrack(nextId, { immediate: true, fromQueue: true, preloadedBlob: preloaded });
     }
  }, [player.queue, player.currentTrackId, player.repeat, playTrack]);

  const prevTrack = useCallback(() => {
      const audio = audioRef.current;
      if (audio && audio.currentTime > 3) {
          audio.currentTime = 0;
          return;
      }
      
      const currentIndex = player.queue.indexOf(player.currentTrackId || '');
      if (currentIndex > 0) {
          playTrack(player.queue[currentIndex - 1], { immediate: true, fromQueue: true });
      } else if (player.repeat === RepeatMode.ALL && player.queue.length > 0) {
          playTrack(player.queue[player.queue.length - 1], { immediate: true, fromQueue: true });
      }
  }, [player.queue, player.currentTrackId, player.repeat, playTrack]);

  const handleSeek = useCallback((time: number) => {
      const audio = audioRef.current;
      if (audio) {
          const d = audio.duration;
          const validDuration = !isNaN(d) && isFinite(d) ? d : 0;
          const t = Math.max(0, Math.min(time, validDuration));

          audio.currentTime = t;
          setCurrentTime(t);
      }
  }, []);

  const setVolume = useCallback((volume: number) => {
      const v = Math.max(0, Math.min(1, volume));
      if (audioRef.current) {
          audioRef.current.volume = v;
      }
      setPlayer(p => ({ ...p, volume: v }));
  }, []);

  const toggleShuffle = useCallback(() => {
      setPlayer(prev => {
          const isShuffling = !prev.shuffle;
          let newQueue = [...prev.queue];

          if (isShuffling) {
              const currentId = prev.currentTrackId;
              const others = prev.originalQueue.filter(id => id !== currentId);
              const shuffledOthers = shuffleArray(others);
              if (currentId) {
                  newQueue = [currentId, ...shuffledOthers];
              } else {
                  newQueue = shuffledOthers;
              }
          } else {
              newQueue = [...prev.originalQueue];
          }

          dbService.setSetting('shuffle', isShuffling);
          return { ...prev, shuffle: isShuffling, queue: newQueue };
      });
  }, []);

  // --- EVENT LISTENERS ---
  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const onTimeUpdate = () => {
         setCurrentTime(audio.currentTime);
      };

      const onDurationChange = () => {
         const d = audio.duration;
         setDuration(!isNaN(d) && isFinite(d) ? d : 0);
      };
      
      const onEnded = () => {
           if (player.repeat === RepeatMode.ONE) {
               audio.currentTime = 0;
               audio.play();
           } else {
               nextTrack();
           }
      };

      const onPause = () => setPlayer(p => ({ ...p, isPlaying: false }));
      const onPlay = () => setPlayer(p => ({ ...p, isPlaying: true }));

      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('loadedmetadata', onDurationChange);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('play', onPlay);

      return () => {
          audio.removeEventListener('timeupdate', onTimeUpdate);
          audio.removeEventListener('loadedmetadata', onDurationChange);
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('pause', onPause);
          audio.removeEventListener('play', onPlay);
      };
  }, [nextTrack, player.repeat]);

  // --- PRELOAD NEXT TRACK ---
  useEffect(() => {
      const currentIndex = player.queue.indexOf(player.currentTrackId || '');
      let nextId: string | null = null;

      if (currentIndex >= 0 && currentIndex < player.queue.length - 1) {
          nextId = player.queue[currentIndex + 1];
      } else if (player.repeat === RepeatMode.ALL && player.queue.length > 0) {
          nextId = player.queue[0];
      }

      if (nextTrackBlobRef.current?.id === nextId) return;

      if (nextId) {
          dbService.getAudioBlob(nextId).then(blob => {
              if (blob) {
                  nextTrackBlobRef.current = { id: nextId, blob };
              }
          });
      } else {
          nextTrackBlobRef.current = null;
      }
  }, [player.currentTrackId, player.queue, player.repeat]);

  // --- MEDIA SESSION ---
  useEffect(() => {
      if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', togglePlay);
          navigator.mediaSession.setActionHandler('pause', togglePlay);
          navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
          navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
          navigator.mediaSession.setActionHandler('seekto', (details) => {
              if (details.seekTime !== undefined) handleSeek(details.seekTime);
          });
      }
  }, [togglePlay, prevTrack, nextTrack, handleSeek]);

  return {
    player,
    setPlayer,
    currentTime,
    duration,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    handleSeek,
    setVolume,
    toggleShuffle
  };
};
