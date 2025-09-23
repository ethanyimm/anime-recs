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
// Helper: Select title based on language
// --------------------
function selectTitleByLang(titleObj, lang) {
  switch (lang) {
    case 'ja':
      return titleObj.native || titleObj.romaji || titleObj.english;
    case 'en':
      return titleObj.english || titleObj.romaji || titleObj.native;
    case 'ko':
      // AniList doesn't have Korean titles, fallback to romaji/english
      return titleObj.romaji || titleObj.english || titleObj.native;
    default:
      return titleObj.english || titleObj.romaji || titleObj.native;
  }
}

// --------------------
// Get currently airing anime (paginated) with NSFW filter
// --------------------
export async function getTopCurrentAnime(page = 1, perPage = 100, lang = 'en') {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, status: RELEASING) {
          id
          title { romaji english native }
          seasonYear
          genres
          description
          isAdult
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page, perPage }, `topCurrent:${page}:${perPage}:${lang}`);
  return data?.Page?.media
    ?.filter(m => !m.isAdult) // NSFW filter
    .map(m => ({
      id: m.id,
      title: selectTitleByLang(m.title, lang),
      year: m.seasonYear || '',
      genres: m.genres || [],
      synopsis: m.description?.replace(/<[^>]+>/g, '') || ''
    })) || [];
}

// --------------------
// Get trending anime (paginated) with NSFW filter
// --------------------
export async function getTrendingAnime(page = 1, perPage = 100, lang = 'en') {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: TRENDING_DESC, type: ANIME) {
          id
          title { romaji english native }
          seasonYear
          genres
          description
          isAdult
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page, perPage }, `trending:${page}:${perPage}:${lang}`);
  return data?.Page?.media
    ?.filter(m => !m.isAdult) // NSFW filter
    .map(m => ({
      id: m.id,
      title: selectTitleByLang(m.title, lang),
      year: m.seasonYear || '',
      genres: m.genres || [],
      synopsis: m.description?.replace(/<[^>]+>/g, '') || ''
    })) || [];
}

// --------------------
// Existing functions updated to accept lang
// --------------------
export async function getAnimeId(title) { /* ... */ }

export async function getRecommendationsById(id) { /* ... */ }

export async function getRecommendedAnime(seedTitle, lang = 'en') { /* ... */ }

export async function getFilteredRecommendations(seedTitle, lang = 'en') {
  // Example: update your existing query to request romaji/english/native and use selectTitleByLang
  /* ... */
}