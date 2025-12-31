import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home as HomeIcon, 
  Library as LibraryIcon, 
  Search as SearchIcon, 
  Plus, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  ChevronDown,
  Heart,
  MoreVertical,
  Music,
  Trash2,
  ListMusic,
  Share2,
  Loader2,
  FileArchive,
  Volume2,
  PlusCircle,
  PlayCircle,
  MoreHorizontal
} from 'lucide-react';
import JSZip from 'jszip';
import { dbService } from './db';
import { Track, Playlist, RepeatMode, PlayerState, LibraryState } from './types';
import { extractPrimaryColor } from './utils/color';

type LibraryTab = 'Songs' | 'Albums' | 'Artists' | 'Playlists';

// --- UI Components ---

const LoadingOverlay = ({ progress, message }: { progress: number, message: string }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] glass-dark flex flex-col items-center justify-center p-10 text-white"
  >
    <motion.div 
      animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="mb-12 p-10 rounded-[60px] bg-white/10 shadow-2xl"
    >
      <Music className="w-24 h-24 text-[#EADDFF]" strokeWidth={1} />
    </motion.div>
    <h2 className="text-4xl font-black mb-3 tracking-tighter">Vibe Syncing...</h2>
    <p className="text-white/40 font-bold mb-10 text-center max-w-sm text-lg">{message || "Preparing your collection..."}</p>
    <div className="w-full max-w-md h-4 bg-white/5 rounded-full overflow-hidden mb-4 p-1">
      <motion.div 
        className="h-full bg-[#EADDFF] rounded-full shadow-[0_0_20px_rgba(234,221,255,0.4)]" 
        initial={{ width: 0 }} 
        animate={{ width: `${progress}%` }} 
      />
    </div>
    <span className="text-2xl font-black opacity-90 tabular-nums">{Math.round(progress)}%</span>
  </motion.div>
);

const Waveform = ({ isPlaying }: { isPlaying: boolean }) => (
  <div className="flex items-end gap-1.5 h-16 px-10">
    {[...Array(24)].map((_, i) => (
      <motion.div
        key={i}
        animate={isPlaying ? {
          height: [12, Math.random() * 48 + 12, 12],
          opacity: [0.3, 0.8, 0.3]
        } : { height: 8, opacity: 0.2 }}
        transition={{
          duration: 0.5 + Math.random() * 0.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-2 bg-current rounded-full"
      />
    ))}
  </div>
);

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'library', icon: LibraryIcon, label: 'Library' },
    { id: 'search', icon: SearchIcon, label: 'Search' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[110px] bg-white/90 backdrop-blur-3xl border-t border-black/[0.02] flex items-center justify-around px-8 z-[60] pb-safe">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center gap-2 group relative w-1/4 h-full"
          >
            <div className="relative h-12 w-20 flex items-center justify-center">
              {isActive && (
                <motion.div layoutId="nav-pill" className="absolute inset-0 bg-[#EADDFF] rounded-[30px]" transition={{ type: 'spring', damping: 20, stiffness: 200 }} />
              )}
              <Icon className={`w-8 h-8 relative z-10 transition-colors ${isActive ? 'text-[#21005D]' : 'text-[#49454F]'}`} strokeWidth={isActive ? 3 : 2} />
            </div>
            <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'text-[#21005D]' : 'text-[#49454F] opacity-40'}`}>
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
};

// --- Main Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('Songs');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [library, setLibrary] = useState<LibraryState>({ tracks: {}, playlists: {} });
  const [player, setPlayer] = useState<PlayerState>({
    currentTrackId: null,
    isPlaying: false,
    queue: [],
    history: [],
    shuffle: false,
    repeat: RepeatMode.OFF,
    volume: 1,
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [themeColor, setThemeColor] = useState('#6750A4');
  const [loading, setLoading] = useState<{ active: boolean, progress: number, message: string }>({ active: false, progress: 0, message: '' });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const refreshLibrary = useCallback(async () => {
    const tracksArr = await dbService.getAllTracks();
    const playlistsArr = await dbService.getAllPlaylists();
    setLibrary({
      tracks: tracksArr.reduce((acc, t) => ({ ...acc, [t.id]: t }), {}),
      playlists: playlistsArr.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
    });
  }, []);

  const updateMediaSession = useCallback((track: Track) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: track.coverArt ? [{ src: track.coverArt }] : [
          { src: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=512&h=512&fit=crop', sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    }
  }, []);

  const playTrack = async (trackId: string, customQueue?: string[]) => {
    const audioBlob = await dbService.getAudioBlob(trackId);
    if (!audioBlob || !audioRef.current) return;

    const url = URL.createObjectURL(audioBlob);
    audioRef.current.src = url;
    audioRef.current.play().catch(e => console.warn("Background playback requires user interaction first.", e));
    
    const track = library.tracks[trackId];
    if (track) updateMediaSession(track);

    setPlayer(prev => ({ 
      ...prev, 
      currentTrackId: trackId, 
      isPlaying: true,
      queue: customQueue || (prev.queue.length > 0 ? prev.queue : Object.keys(library.tracks))
    }));

    if (track?.coverArt) {
      const color = await extractPrimaryColor(track.coverArt);
      setThemeColor(color);
    } else {
      setThemeColor('#6750A4');
    }
    
    dbService.setSetting('lastTrackId', trackId);
  };

  const nextTrack = useCallback(() => {
    const currentIndex = player.queue.indexOf(player.currentTrackId || '');
    if (currentIndex < player.queue.length - 1) {
      playTrack(player.queue[currentIndex + 1]);
    } else if (player.repeat === RepeatMode.ALL) {
      playTrack(player.queue[0]);
    } else {
      setPlayer(prev => ({ ...prev, isPlaying: false }));
    }
  }, [player.queue, player.currentTrackId, player.repeat, library.tracks]);

  const prevTrack = useCallback(() => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    const currentIndex = player.queue.indexOf(player.currentTrackId || '');
    if (currentIndex > 0) {
      playTrack(player.queue[currentIndex - 1]);
    }
  }, [player.queue, player.currentTrackId, currentTime, library.tracks]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (player.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [player.isPlaying]);

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    
    dbService.init().then(async () => {
      await refreshLibrary();
      const lastId = await dbService.getSetting<string>('lastTrackId');
      const savedShuffle = await dbService.getSetting<boolean>('shuffle');
      const savedRepeat = await dbService.getSetting<RepeatMode>('repeat');
      if (lastId) setPlayer(prev => ({ ...prev, currentTrackId: lastId, shuffle: !!savedShuffle, repeat: savedRepeat || RepeatMode.OFF }));
    });
    
    const updateProgress = () => setCurrentTime(audio.currentTime);
    const handleEnd = () => player.repeat === RepeatMode.ONE ? (audio.currentTime = 0, audio.play()) : nextTrack();

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnd);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
      navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
    }

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnd);
    };
  }, [nextTrack, player.repeat, refreshLibrary, togglePlay, prevTrack]);

  const filteredTracks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const tracks = Object.values(library.tracks).filter(t => 
      t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q)
    );
    return tracks.sort((a,b) => b.addedAt - a.addedAt);
  }, [library.tracks, searchQuery]);

  const currentTrack = useMemo(() => 
    player.currentTrackId ? library.tracks[player.currentTrackId] : null
  , [player.currentTrackId, library.tracks]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading({ active: true, progress: 0, message: 'Warming up the deck...' });

    try {
      const fileList = Array.from(files);
      for (let fIdx = 0; fIdx < fileList.length; fIdx++) {
        const file = fileList[fIdx];
        if (file.name.toLowerCase().endsWith('.zip')) {
          setLoading(l => ({ ...l, message: `Extracting ${file.name}...` }));
          const zip = await JSZip.loadAsync(file);
          const entries = Object.values(zip.files).filter(f => !f.dir && f.name.match(/\.(mp3|wav|flac|m4a|ogg)$/i));
          
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const blob = await entry.async('blob');
            const id = crypto.randomUUID();
            await dbService.saveTrack({ 
              id, 
              title: entry.name.split('/').pop()!.replace(/\.[^/.]+$/, ""), 
              artist: 'Local Vibe', 
              album: 'Zip Import', 
              duration: 0, 
              addedAt: Date.now() 
            }, blob);
            setLoading(l => ({ ...l, progress: ((fIdx / fileList.length) * 100) + (((i + 1) / entries.length) * (100 / fileList.length)) }));
          }
        } else {
          const id = crypto.randomUUID();
          await dbService.saveTrack({ 
            id, 
            title: file.name.replace(/\.[^/.]+$/, ""), 
            artist: 'Local Vibe', 
            album: 'Local Upload', 
            duration: 0, 
            addedAt: Date.now() 
          }, file);
        }
        setLoading(l => ({ ...l, progress: ((fIdx + 1) / fileList.length) * 100 }));
      }
      await refreshLibrary();
    } catch (err) {
      console.error("Critical upload error:", err);
      alert("Failed to process files. Ensure they are valid audio or ZIP archives.");
    } finally {
      setLoading({ active: false, progress: 0, message: '' });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FEF7FF] text-[#1C1B1F] safe-area-top safe-area-bottom">
      <AnimatePresence>{loading.active && <LoadingOverlay {...loading} />}</AnimatePresence>

      <div className="fixed inset-0 -z-10 opacity-[0.12] transition-colors duration-[1500ms]" style={{ background: `radial-gradient(circle at 50% 10%, ${themeColor}, transparent 80%)` }} />

      <header className="px-10 pt-16 pb-6 flex justify-between items-end bg-gradient-to-b from-white/40 to-transparent">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-6xl font-black tracking-tighter mb-1 leading-none">
            {activeTab === 'home' ? 'Vibe' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <p className="text-xl font-bold opacity-30 tracking-tight">{filteredTracks.length} tracks synced locally</p>
        </motion.div>
        
        <label className="h-20 w-20 rounded-[38px] bg-[#EADDFF] text-[#21005D] flex items-center justify-center cursor-pointer shadow-[0_12px_40px_rgba(103,80,164,0.2)] active:scale-90 transition-all hover:bg-[#D1C4E9]">
          <Plus className="w-10 h-10" strokeWidth={3} />
          <input type="file" multiple accept="audio/*,.zip" onChange={handleFileUpload} className="hidden" />
        </label>
      </header>

      <main className="flex-1 overflow-y-auto px-10 pb-48 scrollbar-hide scroll-smooth">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-16">
              <section>
                <div className="flex justify-between items-end mb-10">
                  <h2 className="text-4xl font-black tracking-tight">Recent Heat</h2>
                  <button onClick={() => filteredTracks[0] && playTrack(filteredTracks[0].id)} className="text-lg font-bold text-[#6750A4] bg-[#EADDFF] px-8 py-3 rounded-full hover:bg-[#D1C4E9] transition-colors">Play All</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
                  {filteredTracks.slice(0, 10).map((t, i) => (
                    <motion.div 
                      key={t.id} 
                      initial={{ scale: 0.9, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.95 }} 
                      onClick={() => playTrack(t.id)} 
                      className="p-5 rounded-[56px] bg-white shadow-xl shadow-black/[0.03] cursor-pointer group hover:shadow-2xl hover:shadow-[#6750A4]/10 transition-all"
                    >
                      <div className="aspect-square rounded-[44px] bg-gradient-to-br from-[#F3EDF7] to-[#EADDFF] mb-6 overflow-hidden flex items-center justify-center relative">
                        <Music className="w-14 h-14 text-[#6750A4] opacity-20 group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-all">
                          <Play className="w-12 h-12 text-white fill-white opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      </div>
                      <h3 className="font-black truncate text-xl mb-1 tracking-tight">{t.title}</h3>
                      <p className="text-base font-bold text-[#49454F] opacity-40 truncate">{t.artist}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
                {(['Songs', 'Albums', 'Artists', 'Playlists'] as LibraryTab[]).map(t => (
                  <button key={t} onClick={() => setLibraryTab(t)} className={`px-12 py-5 rounded-[32px] font-black text-xl transition-all shadow-sm ${libraryTab === t ? 'bg-[#21005D] text-white shadow-[#21005D]/20' : 'bg-white text-[#49454F] border border-black/[0.05]'}`}>{t}</button>
                ))}
              </div>

              {libraryTab === 'Songs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTracks.map((t, i) => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => playTrack(t.id)} 
                      className={`flex items-center gap-8 p-6 rounded-[48px] cursor-pointer transition-all ${player.currentTrackId === t.id ? 'bg-[#EADDFF] shadow-lg' : 'hover:bg-white border border-transparent hover:border-black/[0.03]'}`}
                    >
                      <div className="w-20 h-20 rounded-[32px] bg-white/60 flex items-center justify-center shadow-inner relative overflow-hidden flex-shrink-0">
                        <Music className={`w-10 h-10 ${player.currentTrackId === t.id ? 'text-[#6750A4]' : 'opacity-10'}`} />
                        {player.currentTrackId === t.id && player.isPlaying && (
                          <div className="absolute inset-0 bg-[#6750A4]/10 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-[#6750A4] animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-2xl font-black truncate leading-tight tracking-tight">{t.title}</h4>
                        <p className="text-lg font-bold opacity-30 truncate tracking-tight">{t.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <button onClick={(e) => { e.stopPropagation(); dbService.deleteTrack(t.id); refreshLibrary(); }} className="p-5 text-red-300 hover:text-red-500 rounded-full hover:bg-red-50 transition-all"><Trash2 className="w-7 h-7" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {libraryTab === 'Playlists' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div onClick={() => alert("Playlist creation logic in development")} className="aspect-square rounded-[60px] border-4 border-dashed border-black/10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#6750A4] hover:text-[#6750A4] transition-all">
                    <PlusCircle className="w-16 h-16" strokeWidth={1} /><span className="text-2xl font-black">Craft Playlist</span>
                  </div>
                  <div className="aspect-square rounded-[60px] bg-[#21005D] p-12 text-white flex flex-col justify-end shadow-2xl relative overflow-hidden group">
                     <Music className="absolute -top-10 -right-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                     <h3 className="text-4xl font-black leading-tight">My Vibe</h3>
                     <p className="text-xl font-bold opacity-60">{filteredTracks.length} tracks</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-12">
              <div className="relative group">
                <SearchIcon className="absolute left-10 top-1/2 -translate-y-1/2 text-[#49454F] w-10 h-10 transition-colors group-focus-within:text-[#6750A4]" />
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="Find your frequency..." 
                  className="w-full bg-[#F3EDF7] rounded-[60px] py-10 pl-24 pr-12 text-3xl font-black outline-none border-4 border-transparent focus:border-[#6750A4]/15 focus:bg-white transition-all shadow-inner" 
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filteredTracks.map(t => (
                  <motion.div 
                    key={t.id} 
                    whileTap={{ scale: 0.97 }} 
                    onClick={() => playTrack(t.id)} 
                    className="p-8 bg-white rounded-[56px] shadow-sm flex items-center justify-between border border-black/[0.02] hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 bg-[#F3EDF7] rounded-[32px] flex items-center justify-center flex-shrink-0"><Music className="w-10 h-10 opacity-20" /></div>
                      <div>
                        <h4 className="text-2xl font-black tracking-tight">{t.title}</h4>
                        <p className="text-lg font-bold opacity-30 tracking-tight">{t.artist}</p>
                      </div>
                    </div>
                    <PlayCircle className="w-14 h-14 text-[#6750A4] opacity-40" strokeWidth={1.5} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mini Player */}
      <AnimatePresence>
        {currentTrack && !isPlayerOpen && (
          <motion.div 
            initial={{ y: 150, scale: 0.9, opacity: 0 }} 
            animate={{ y: 0, scale: 1, opacity: 1 }} 
            exit={{ y: 150, opacity: 0 }} 
            onClick={() => setIsPlayerOpen(true)} 
            className="fixed bottom-[130px] left-10 right-10 glass border border-white/50 rounded-[56px] p-6 flex items-center gap-8 shadow-[0_30px_80px_rgba(0,0,0,0.15)] z-[70] cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-[36px] bg-[#6750A4]/10 overflow-hidden flex-shrink-0 relative">
              {currentTrack.coverArt ? <img src={currentTrack.coverArt} className="w-full h-full object-cover" /> : <Music className="w-full h-full p-6 text-[#6750A4] opacity-20" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-2xl truncate tracking-tight">{currentTrack.title}</h4>
              <p className="text-lg font-bold opacity-30 truncate tracking-tight">{currentTrack.artist}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
              className="w-20 h-20 rounded-full bg-[#21005D] text-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            >
              {player.isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current translate-x-1" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Player with Gestures */}
      <AnimatePresence>
        {isPlayerOpen && currentTrack && (
          <motion.div 
            drag="y" 
            dragConstraints={{ top: 0 }} 
            onDragEnd={(_, info) => info.offset.y > 150 && setIsPlayerOpen(false)} 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.8 }}
            className="fixed inset-0 bg-[#FEF7FF] z-[100] flex flex-col p-12 pb-20 safe-area-top"
          >
            <div className="absolute inset-0 -z-10 opacity-[0.2]" style={{ background: `radial-gradient(circle at center, ${themeColor}, transparent 70%)` }} />

            <div className="flex justify-between items-center mb-16">
              <button onClick={() => setIsPlayerOpen(false)} className="w-20 h-20 rounded-[38px] glass flex items-center justify-center border border-black/[0.03] shadow-sm"><ChevronDown className="w-12 h-12" /></button>
              <div className="text-center">
                <p className="text-xs font-black tracking-[0.4em] uppercase text-[#6750A4] mb-1 opacity-60">Frequency Active</p>
                <h2 className="text-base font-black tracking-tight">{currentTrack.album}</h2>
              </div>
              <button className="w-20 h-20 rounded-[38px] glass flex items-center justify-center border border-black/[0.03] shadow-sm"><MoreVertical className="w-8 h-8" /></button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
              <motion.div 
                layoutId="artwork"
                drag="x"
                onDragEnd={(_, info) => info.offset.x > 100 ? prevTrack() : info.offset.x < -100 && nextTrack()}
                className="w-full aspect-square rounded-[100px] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.4)] overflow-hidden mb-20 bg-gradient-to-br from-[#EADDFF] to-[#6750A4] flex items-center justify-center relative ring-[16px] ring-white/10"
              >
                {currentTrack.coverArt ? <img src={currentTrack.coverArt} className="w-full h-full object-cover" /> : <Music className="w-48 h-48 text-white opacity-20" />}
                <div className="absolute bottom-16 inset-x-0 flex justify-center text-white/40"><Waveform isPlaying={player.isPlaying} /></div>
              </motion.div>

              <div className="w-full flex justify-between items-end mb-16">
                <div className="flex-1 min-w-0 pr-10">
                  <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-7xl font-black tracking-tighter truncate leading-[0.8] mb-4">{currentTrack.title}</motion.h2>
                  <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-3xl font-bold text-[#6750A4] opacity-50 tracking-tight">{currentTrack.artist}</motion.p>
                </div>
                <button className="w-24 h-24 rounded-[44px] bg-[#EADDFF] text-[#6750A4] flex items-center justify-center shadow-xl"><Heart className="w-12 h-12 fill-[#6750A4]" strokeWidth={3} /></button>
              </div>

              <div className="w-full mb-16 px-4">
                <div className="relative h-8 flex items-center">
                  <input type="range" min="0" max={audioRef.current?.duration || 0} value={currentTime} onChange={handleSeek} className="absolute w-full h-full opacity-0 cursor-pointer z-30" />
                  <div className="w-full h-8 bg-[#E7E0EB] rounded-full overflow-hidden relative shadow-inner">
                    <motion.div className="absolute inset-y-0 left-0 bg-[#6750A4] shadow-[0_0_20px_rgba(103,80,164,0.4)]" style={{ width: `${(currentTime / (audioRef.current?.duration || 1)) * 100}%` }} />
                  </div>
                  <div className="absolute w-12 h-12 bg-[#21005D] border-[8px] border-white rounded-full shadow-2xl z-20 pointer-events-none" style={{ left: `calc(${(currentTime / (audioRef.current?.duration || 1)) * 100}% - 24px)` }} />
                </div>
                <div className="flex justify-between mt-8 text-sm font-black opacity-30 tracking-[0.3em] tabular-nums uppercase">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(audioRef.current?.duration || 0)}</span>
                </div>
              </div>

              <div className="w-full flex items-center justify-between mb-20">
                <button onClick={() => setPlayer(p => ({ ...p, shuffle: !p.shuffle }))} className={`w-24 h-24 rounded-full flex items-center justify-center ${player.shuffle ? 'bg-[#EADDFF] text-[#6750A4]' : 'opacity-20'}`}><Shuffle className="w-10 h-10" strokeWidth={3} /></button>
                <div className="flex items-center gap-12">
                  <SkipBack onClick={prevTrack} className="w-20 h-20 fill-current cursor-pointer active:scale-90 transition-transform" />
                  <button onClick={togglePlay} className="w-48 h-48 rounded-[72px] bg-[#21005D] text-white flex items-center justify-center shadow-[0_40px_80px_-10px_rgba(33,0,93,0.5)] active:scale-95 transition-all">
                    {player.isPlaying ? <Pause className="w-24 h-24 fill-current" /> : <Play className="w-24 h-24 fill-current translate-x-2" />}
                  </button>
                  <SkipForward onClick={nextTrack} className="w-20 h-20 fill-current cursor-pointer active:scale-90 transition-transform" />
                </div>
                <button onClick={() => setPlayer(p => ({ ...p, repeat: p.repeat === RepeatMode.OFF ? RepeatMode.ALL : p.repeat === RepeatMode.ALL ? RepeatMode.ONE : RepeatMode.OFF }))} className={`w-24 h-24 rounded-full flex items-center justify-center ${player.repeat !== RepeatMode.OFF ? 'bg-[#EADDFF] text-[#6750A4]' : 'opacity-20'}`}><Repeat className="w-10 h-10" strokeWidth={3} /></button>
              </div>
            </div>

            <div className="flex justify-around pt-12 border-t border-black/[0.03] max-w-lg mx-auto w-full opacity-40">
              <div className="flex flex-col items-center gap-3"><ListMusic className="w-10 h-10" /><span className="text-xs font-black uppercase tracking-[0.3em]">Queue</span></div>
              <div className="flex flex-col items-center gap-3"><Volume2 className="w-10 h-10" /><span className="text-xs font-black uppercase tracking-[0.3em]">Device</span></div>
              <div className="flex flex-col items-center gap-3"><Share2 className="w-10 h-10" /><span className="text-xs font-black uppercase tracking-[0.3em]">Share</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
