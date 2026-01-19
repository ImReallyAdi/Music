
import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock Material Web components to prevent them from crashing JSDOM
vi.mock('@material/web/tabs/tabs.js', () => ({}));
vi.mock('@material/web/tabs/primary-tab.js', () => ({}));
vi.mock('@material/web/tabs/secondary-tab.js', () => ({}));
vi.mock('@material/web/iconbutton/icon-button.js', () => ({}));
vi.mock('@material/web/icon/icon.js', () => ({}));
vi.mock('@material/web/switch/switch.js', () => ({}));
vi.mock('@material/web/slider/slider.js', () => ({}));
vi.mock('@material/web/list/list.js', () => ({}));
vi.mock('@material/web/list/list-item.js', () => ({}));
vi.mock('@material/web/chips/chip-set.js', () => ({}));
vi.mock('@material/web/chips/filter-chip.js', () => ({}));
vi.mock('@material/web/textfield/outlined-text-field.js', () => ({}));
vi.mock('@material/web/button/filled-tonal-button.js', () => ({}));

// Import Library AFTER mocks
import Library from './Library';
import { dbService } from '../db';

// Mock DB Service
vi.mock('../db', () => ({
  dbService: {
    getAllPlaylists: vi.fn().mockResolvedValue([]),
    getAllTracks: vi.fn().mockResolvedValue([]),
    getSetting: vi.fn().mockResolvedValue(false),
    setSetting: vi.fn(),
    savePlaylist: vi.fn(),
    deleteTrack: vi.fn(),
  }
}));

// Mock Toast
vi.mock('./Toast', () => ({
  useToast: () => ({ addToast: vi.fn() })
}));

// Mock Child Components
vi.mock('./Playlists', () => ({ default: () => <div>Playlists Mock</div> }));
vi.mock('./AddToPlaylistModal', () => ({ default: () => <div>AddToPlaylistModal Mock</div> }));
vi.mock('./library/LibraryCard', () => ({ LibraryCard: () => <div>LibraryCard Mock</div> }));
vi.mock('./library/ArtistCard', () => ({ ArtistCard: () => <div>ArtistCard Mock</div> }));
vi.mock('../utils/artistImage', () => ({ getOrFetchArtistImage: vi.fn() }));
vi.mock('../utils/lyrics', () => ({ parseLrc: vi.fn() }));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Library Component Performance', () => {
  const mockProps = {
    activeTab: 'library',
    libraryTab: 'Songs' as const,
    setLibraryTab: vi.fn(),
    filteredTracks: [],
    playlists: {},
    tracksMap: {},
    playerState: {
      currentTrackId: null,
      isPlaying: false,
      queue: [],
      originalQueue: [],
      history: [],
      shuffle: false,
      repeat: 'OFF',
      volume: 1,
      crossfadeEnabled: false,
      crossfadeDuration: 5,
      automixEnabled: false,
      automixMode: 'classic',
      normalizationEnabled: false,
      lyricOffset: 0
    } as any,
    setPlayerState: vi.fn(),
    playTrack: vi.fn(),
    refreshLibrary: vi.fn(),
    isLoading: false,
    onFileUpload: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('DOES NOT fetch data on mount (Optimized)', async () => {
    render(<Library {...mockProps} />);

    // Wait a bit to ensure effects would have run
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(dbService.getAllTracks).not.toHaveBeenCalled();
    expect(dbService.getAllPlaylists).not.toHaveBeenCalled();
  });
});
