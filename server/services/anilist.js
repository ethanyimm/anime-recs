import fetch from 'node-fetch';
import { getCachedRecommendations, setCachedRecommendations } from '../utils/cashe.js';
import { getWatchedIds, getDislikedIds } from '../utils/db.js';

const ANILIST_URL = 'https://graphql.anilist.co';

// --------------------
// Generic AniList query helper
// --------------------
async function anilistQuery(query, variables = {}) {
  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    return json.data;
  } catch (err) {
    console.error('❌ AniList request failed:', err);
    return null;
  }
}

// --------------------
// Get top 100 currently airing anime
// --------------------
export async function getTop100CurrentAnime() {
  const query = `
    query {
      Page(perPage: 100) {
        media(type: ANIME, sort: POPULARITY_DESC, status: RELEASING) {
          id
          title {
            romaji
          }
        }
      }
    }
  `;

  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  const json = await res.json();
  return json.data.Page.media.map(m => ({
    id: m.id,
    title: m.title.romaji
  }));
}

// --------------------
// Get AniList ID for a title
// --------------------
export async function getAnimeId(title) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) { id }
    }
  `;
  const data = await anilistQuery(query, { search: title });
  return data?.Media?.id || null;
}

// --------------------
// Get recommendations by AniList ID
// --------------------
export async function getRecommendationsById(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        recommendations {
          nodes {
            mediaRecommendation {
              id
              title { romaji english }
              seasonYear
              genres
              description
            }
          }
        }
      }
    }
  `;
  const data = await anilistQuery(query, { id });
  const nodes = data?.Media?.recommendations?.nodes || [];

  return nodes.map(({ mediaRecommendation }) => ({
    id: mediaRecommendation.id,
    title: mediaRecommendation.title.english || mediaRecommendation.title.romaji,
    year: mediaRecommendation.seasonYear || 'Unknown',
    genres: mediaRecommendation.genres || [],
    synopsis: mediaRecommendation.description?.replace(/<[^>]+>/g, '') || 'No synopsis available.'
  }));
}

// --------------------
// Get recommendations for a seed title (with caching)
// --------------------
export async function getRecommendedAnime(seedTitle) {
  const cached = getCachedRecommendations(seedTitle);
  if (cached) return cached;

  const id = await getAnimeId(seedTitle);
  if (!id) return [];

  const recs = await getRecommendationsById(id);
  setCachedRecommendations(seedTitle, recs);
  return recs;
}

// --------------------
// Filtered recommendations (exclude watched + disliked)
// --------------------
export async function getFilteredRecommendations(seedTitle) {
  const recs = await getRecommendedAnime(seedTitle);
  const watchedIds = getWatchedIds();
  const dislikedIds = getDislikedIds();
  const blockedIds = new Set([...watchedIds, ...dislikedIds]);

  return recs.filter(r => !blockedIds.has(r.id));
}