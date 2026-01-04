import { Lyrics, LyricLine, Track, LyricWord } from '../types';
import { dbService } from '../db';

/**
 * Parses LRC format: [mm:ss.xx] Lyrics
 */
const parseLrc = (lrc: string): LyricLine[] => {
  const lines: LyricLine[] = [];
  const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;

  lrc.split('\n').forEach(line => {
    const trimmed = line.trim();
    const match = trimmed.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3], 10);
      // Determine if milliseconds are 2 or 3 digits
      const msDivisor = match[3].length === 3 ? 1000 : 100;
      const totalSeconds = minutes * 60 + seconds + milliseconds / msDivisor;
      const text = match[4].trim();

      if (text) { // Filter out empty lines if desired, or keep them for spacing
        lines.push({ time: totalSeconds, text });
      }
    }
  });

  return lines;
};

const fetchLyricsWithGemini = async (track: Track, apiKey: string): Promise<Lyrics | null> => {
    const { title, artist } = track;
    // Construct prompt
    const prompt = `Generate word-for-word synced lyrics for the song "${title}" by "${artist}".
    Format the output strictly as a JSON object with this structure:
    {
      "lines": [
        {
          "time": <start_time_seconds>,
          "text": "<line_text>",
          "words": [
            { "time": <word_time_seconds>, "text": "<word>" },
            ...
          ]
        },
        ...
      ]
    }
    The "time" for the line should be the start time of the first word.
    Ensure strict JSON validity. Do not include markdown code blocks. Just return the raw JSON string.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            console.warn("Gemini API error:", response.statusText);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) return null;

        // Robust JSON parsing
        let parsed: any = null;
        try {
            // 1. Try regex to find the JSON object (first { to last })
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                // 2. Fallback: try cleaning markdown code blocks explicitly
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleanJson);
            }
        } catch (e) {
             console.warn("Failed to parse Gemini JSON:", e);
             return null;
        }

        if (parsed && parsed.lines && Array.isArray(parsed.lines)) {
             return {
                 lines: parsed.lines,
                 synced: true,
                 isWordSynced: true,
                 error: false
             };
        }
    } catch (e) {
        console.warn("Gemini parsing/fetch failed", e);
    }
    return null;
};

export const fetchLyrics = async (track: Track): Promise<Lyrics> => {
  // 0. Check settings first
  const wordSyncEnabled = await dbService.getSetting<boolean>('wordSyncEnabled');
  const geminiApiKey = await dbService.getSetting<string>('geminiApiKey');
  
  // 0.1 Check if we already have lyrics stored
  // If Word Sync is enabled, we ONLY accept stored lyrics if they are word-synced.
  // Otherwise, we might want to re-fetch to upgrade them.
  if (track.lyrics && !track.lyrics.error) {
       if (wordSyncEnabled && geminiApiKey) {
           if (track.lyrics.isWordSynced) {
               return track.lyrics;
           }
           // If we have line lyrics but want word lyrics, we proceed to fetch.
           // However, we should prioritize Gemini only if we don't have word lyrics yet.
       } else {
           // Standard mode: any valid lyrics are fine
           return track.lyrics;
       }
  }

  const { title, artist } = track;
  let result: Lyrics = { lines: [], synced: false, error: true };

  // 1. Try Gemini (if enabled)
  if (wordSyncEnabled && geminiApiKey) {
      const geminiLyrics = await fetchLyricsWithGemini(track, geminiApiKey);
      if (geminiLyrics) {
          // Save and return
          const updatedTrack = { ...track, lyrics: geminiLyrics };
          await dbService.saveTrack(updatedTrack);
          return geminiLyrics;
      }
      // Fallback continues below if Gemini fails
  }

  try {
    // 2. Try lrclib.net for synced lyrics
    const lrcUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    try {
        const lrcRes = await fetch(lrcUrl);
        if (lrcRes.ok) {
            const data = await lrcRes.json();
            if (data.syncedLyrics) {
                const lines = parseLrc(data.syncedLyrics);
                if (lines.length > 0) {
                    result = { lines, synced: true, plain: data.plainLyrics };
                }
            } else if (data.plainLyrics) {
                result = { lines: [], synced: false, plain: data.plainLyrics };
            }
        }
    } catch (e) {
        console.warn("Lrclib fetch failed", e);
    }

    // 3. Fallback to api.popcat.xyz if no result yet
    if (result.error) {
        const backupUrl = `https://api.popcat.xyz/v2/lyrics?song=${encodeURIComponent(title + " " + artist)}`;
        try {
            const backupRes = await fetch(backupUrl);
            if (backupRes.ok) {
                const data = await backupRes.json();
                if (data.lyrics) {
                    result = { lines: [], synced: false, plain: data.lyrics };
                }
            }
        } catch (e) {
            console.warn("Popcat fetch failed", e);
        }
    }

    // 4. Save to DB if we found something
    if (!result.error) {
        const updatedTrack = { ...track, lyrics: result };
        await dbService.saveTrack(updatedTrack);
        return result;
    }

    // If we have "stale" line lyrics but failed to upgrade to word lyrics, return the old ones?
    // The initial check at step 0 handled returning valid word lyrics.
    // If we reached here, it means we didn't have word lyrics (or didn't accept the line lyrics).
    // If we have existing line lyrics in the track but we wanted to upgrade and failed, we should probably fall back to them.
    if (track.lyrics && !track.lyrics.error) {
        return track.lyrics;
    }

    return result;
  } catch (e) {
    console.error("Lyrics fetch failed:", e);
    return { lines: [], synced: false, error: true };
  }
};
