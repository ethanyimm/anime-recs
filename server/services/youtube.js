import fetch from 'node-fetch';
import { getCachedTrailer, setCachedTrailer } from '../utils/cashe.js';

const YT_API_KEY = process.env.YOUTUBE_API_KEY;

// Keywords to block live-action or irrelevant trailers
const BANNED_KEYWORDS = [
  'live action',
  'official movie',
  'movie trailer',
  'teaser trailer',
  'netflix series',
  'prime video',
  'hbo'
];

/**
 * Get a YouTube trailer ID for an anime title, with optional language localization.
 * @param {string} title - The anime title to search for.
 * @param {string} lang - Language code (e.g., 'en', 'ja', 'ko').
 * @returns {Promise<string|null>} - The YouTube video ID or null if not found.
 */
export async function getTrailerId(title, lang = 'en') {
  const cacheKey = `${title}:${lang}`;
  const cached = getCachedTrailer(cacheKey);
  if (cached) return cached;

  // Localize search query if needed
  let searchTitle = title;
  if (lang === 'ja') {
    // If you have native title from AniList, pass it here instead of romaji
    searchTitle = title; // Replace with native title if available
  } else if (lang === 'ko') {
    // AniList doesn't have Korean titles, so use romaji or English
    searchTitle = title;
  }

  const query = encodeURIComponent(`${searchTitle} Official Trailer`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${query}&key=${YT_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    const json = await res.json();
    const items = json.items || [];

    // Filter out live-action or irrelevant trailers
    const filteredItems = items.filter(i => {
      const t = i.snippet.title.toLowerCase();
      const d = i.snippet.description.toLowerCase();
      return !BANNED_KEYWORDS.some(k => t.includes(k) || d.includes(k));
    });

    // Prefer "official trailer" match, else first filtered result
    const official = filteredItems.find(i => /official trailer/i.test(i.snippet.title));
    const chosen = official || filteredItems[0];
    const trailerId = chosen?.id?.videoId || null;

    setCachedTrailer(cacheKey, trailerId);
    return trailerId;
  } catch (err) {
    console.error('❌ YouTube fetch failed:', err);
    return null;
  }
}