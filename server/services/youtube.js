import fetch from 'node-fetch';
import { getCachedTrailer, setCachedTrailer } from '../utils/cashe.js';

const YT_API_KEY = process.env.YOUTUBE_API_KEY;

export async function getTrailerId(title) {
  const cached = getCachedTrailer(title);
  if (cached) return cached;

  const query = encodeURIComponent(`${title} Official Trailer`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${query}&key=${YT_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    const json = await res.json();
    const items = json.items || [];

    const official = items.find(i => /official trailer/i.test(i.snippet.title));
    const chosen = official || items[0];
    const trailerId = chosen?.id?.videoId || null;

    setCachedTrailer(title, trailerId);
    return trailerId;
  } catch (err) {
    console.error('❌ YouTube fetch failed:', err);
    return null;
  }
}