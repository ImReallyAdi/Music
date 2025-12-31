import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MetadataProvider } from './context/MetadataContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Navigation } from './components/Navigation';
import { Player } from './components/Player';
import { Library } from './components/Library';
import { Home } from './components/Home';
import { Search } from './components/Search';
import { Plus, Music, Loader2 } from 'lucide-react';

// Main Content Wrapper to consume contexts
function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const { importFiles, loading } = useLibrary();
  const { currentTrack } = usePlayer();

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface safe-area-top safe-area-bottom md:flex-row flex-col">

       <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

       <main className="flex-1 relative overflow-hidden flex flex-col md:ml-24 pb-[85px] md:pb-0">
           {/* Header with Upload Button */}
           <header className="absolute top-0 right-0 p-6 z-50">
              <label className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95">
                  <Plus className="w-8 h-8" />
                  <input type="file" multiple accept="audio/*,.zip" onChange={(e) => e.target.files && importFiles(e.target.files)} className="hidden" />
              </label>
           </header>

           <div className="flex-1 overflow-y-auto scroll-smooth">
               <AnimatePresence mode="wait">
                   {activeTab === 'home' && (
                       <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                           <Home />
                       </motion.div>
                   )}
                   {activeTab === 'library' && (
                       <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                           <Library />
                       </motion.div>
                   )}
                   {activeTab === 'search' && (
                       <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                           <Search />
                       </motion.div>
                   )}
               </AnimatePresence>
           </div>
       </main>

       {/* Loading Overlay */}
       <AnimatePresence>
        {loading.active && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white"
            >
                <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-8 p-6 rounded-full bg-white/10"
                >
                <Loader2 className="w-16 h-16 text-primary-container" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-2">Syncing Vibe...</h2>
                <p className="text-white/60 mb-8 text-center max-w-sm">{loading.message}</p>
                <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-primary-container"
                    initial={{ width: 0 }}
                    animate={{ width: `${loading.progress}%` }}
                />
                </div>
            </motion.div>
        )}
       </AnimatePresence>

       <Player isPlayerOpen={isPlayerOpen} setIsPlayerOpen={setIsPlayerOpen} />
    </div>
  );
}

export default function App() {
  return (
    <MetadataProvider>
      <LibraryProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </LibraryProvider>
    </MetadataProvider>
  );
}
