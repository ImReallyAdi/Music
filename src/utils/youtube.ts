// ==============================
// Types
// ==============================

export interface YouTubeTrack {
  id: string;
  title: string;
  channel: string;
  duration: number; // seconds
  thumbnail: string;
  url: string;
}

// ==============================
// Piped instances
// ==============================

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.private.coffee',
  'https://pipedapi.drgns.space',
  'https://api.piped.smnz.de',
  'https://pipedapi.tokhmi.xyz'
];

let currentInstanceIndex = 0;

// ==============================
// Utils
// ==============================

async function fetchFromPiped(path: string): Promise<any> {
  for (let i = 0; i < PIPED_INSTANCES.length; i++) {
    const instance =
      PIPED_INSTANCES[(currentInstanceIndex + i) % PIPED_INSTANCES.length];

    try {
      const res = await fetch(`${instance}${path}`);
      if (!res.ok) throw new Error(`Bad response: ${res.status}`);

      currentInstanceIndex =
        (currentInstanceIndex + i) % PIPED_INSTANCES.length;

      return await res.json();
    } catch (err) {
      console.warn(`Piped instance failed: ${instance}`);
    }
  }

  throw new Error('All Piped instances failed');
}

export function extractVideoId(url: string): string | null {
  if (!url) return null;

  // piped playlist urls: "/watch?v=VIDEO_ID"
  if (url.startsWith('/')) {
    const match = url.match(/[?&]v=([^&#]+)/);
    return match?.[1] ?? null;
  }

  // youtube / shorts / embed
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^&#?]+)/
  );
  return match?.[1] ?? null;
}

export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&#]+)/);
  return match?.[1] ?? null;
}

// ==============================
// Single video
// ==============================

export async function getYouTubeVideo(
  url: string
): Promise<YouTubeTrack | null> {
  const videoId = extractVideoId(url);
  if (!videoId) return null;

  try {
    const data = await fetchFromPiped(`/streams/${videoId}`);

    return {
      id: videoId,
      title: data.title ?? 'Unknown title',
      channel: data.uploader ?? 'Unknown channel',
      duration: data.duration ?? 0,
      thumbnail: data.thumbnailUrl || data.thumbnail || '',
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  } catch (err) {
    console.error('Failed to fetch video', err);
    return null;
  }
}

// ==============================
// Playlist
// ==============================

export async function getYouTubePlaylist(
  url: string
): Promise<YouTubeTrack[]> {
  const playlistId = extractPlaylistId(url);
  if (!playlistId) return [];

  try {
    const data = await fetchFromPiped(`/playlists/${playlistId}`);

    if (!Array.isArray(data.relatedStreams)) {
      console.warn('Playlist missing relatedStreams');
      return [];
    }

    return data.relatedStreams
      .filter(
        (item: any) => item.type === 'stream' || item.type === 'video'
      )
      .map((item: any) => {
        const videoId = extractVideoId(item.url);
        if (!videoId) return null;

        return {
          id: videoId,
          title: item.title ?? 'Unknown title',
          channel: item.uploaderName ?? 'Unknown channel',
          duration: item.duration ?? 0,
          thumbnail: item.thumbnail || '',
          url: `https://www.youtube.com/watch?v=${videoId}`
        };
      })
      .filter((track): track is YouTubeTrack => track !== null);
  } catch (err) {
    console.error('Failed to fetch playlist', err);
    return [];
  }
}

// ==============================
// Entry helper (video OR playlist)
// ==============================

export async function importFromYouTubeLink(
  url: string
): Promise<YouTubeTrack[]> {
  if (extractPlaylistId(url)) {
    return getYouTubePlaylist(url);
  }

  const video = await getYouTubeVideo(url);
  return video ? [video] : [];
}
