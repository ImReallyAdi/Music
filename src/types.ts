
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverArt?: string;
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

export enum RepeatMode {
  OFF = 'OFF',
  ONE = 'ONE',
  ALL = 'ALL'
}

export interface PlayerState {
  currentTrackId: string | null;
  isPlaying: boolean;
  queue: string[];
  history: string[];
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
}

export interface LibraryState {
  tracks: Record<string, Track>;
  playlists: Record<string, Playlist>;
}
