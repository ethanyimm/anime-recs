import fetch from 'node-fetch';
import { getCachedRecommendations, setCachedRecommendations } from '../utils/cashe.js';

const ANILIST_URL = 'https://graphql.anilist.co';

// --------------------
// Generic AniList query helper with optional caching
// --------------------
async function anilistQuery(query, variables = {}, cacheKey) {
  if (cacheKey) {
    const cached = getCachedRecommendations(cacheKey);
    if (cached) {
      console.log(`✅ AniList cache hit: ${cacheKey}`);
      return cached;
    }
  }

  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));

    if (cacheKey) {
      setCachedRecommendations(cacheKey, json.data);
    }
    return json.data;
  } catch (err) {
    console.error('❌ AniList request failed:', err);
    return null;
  }
}

// --------------------
// Get currently airing anime (paginated) with NSFW filter
// --------------------
export async function getTopCurrentAnime(page = 1, perPage = 100) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, status: RELEASING) {
          id
          title { romaji english }
          seasonYear
          genres
          description
          isAdult
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page, perPage }, `topCurrent:${page}:${perPage}`);
  return data?.Page?.media
    ?.filter(m => !m.isAdult) // NSFW filter
    .map(m => ({
      id: m.id,
      title: m.title.english || m.title.romaji,
      year: m.seasonYear || '',
      genres: m.genres || [],
      synopsis: m.description?.replace(/<[^>]+>/g, '') || ''
    })) || [];
}

// --------------------
// Get trending anime (paginated) with NSFW filter
// --------------------
export async function getTrendingAnime(page = 1, perPage = 100) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: TRENDING_DESC, type: ANIME) {
          id
          title { romaji english }
          seasonYear
          genres
          description
          isAdult
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page, perPage }, `trending:${page}:${perPage}`);
  return data?.Page?.media
    ?.filter(m => !m.isAdult) // NSFW filter
    .map(m => ({
      id: m.id,
      title: m.title.english || m.title.romaji,
      year: m.seasonYear || '',
      genres: m.genres || [],
      synopsis: m.description?.replace(/<[^>]+>/g, '') || ''
    })) || [];
}

// --------------------
// Existing functions remain unchanged
// --------------------
export async function getAnimeId(title) { /* ... */ }
export async function getRecommendationsById(id) { /* ... */ }
export async function getRecommendedAnime(seedTitle) { /* ... */ }
export async function getFilteredRecommendations(seedTitle) { /* ... */ }