import fetch from 'node-fetch';
import { getCachedRecommendations, setCachedRecommendations } from '../utils/cashe.js';
import { getWatchedIds } from '../utils/db.js';

const ANILIST_URL = 'https://graphql.anilist.co';

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

export async function getAnimeId(title) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) { id }
    }
  `;
  const data = await anilistQuery(query, { search: title });
  return data?.Media?.id || null;
}

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

export async function getRecommendedAnime(seedTitle) {
  const cached = getCachedRecommendations(seedTitle);
  if (cached) return cached;

  const id = await getAnimeId(seedTitle);
  if (!id) return [];

  const recs = await getRecommendationsById(id);
  setCachedRecommendations(seedTitle, recs);
  return recs;
}

// New: returns recs filtered by watched IDs
export async function getFilteredRecommendations(seedTitle) {
  const recs = await getRecommendedAnime(seedTitle);
  const watchedIds = getWatchedIds(); // persistent SQLite
  return recs.filter(r => !watchedIds.includes(r.id));
}