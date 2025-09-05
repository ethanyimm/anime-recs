import fetch from 'node-fetch';

const ANILIST_URL = 'https://graphql.anilist.co';

/**
 * Helper to send a GraphQL request to AniList
 */
async function anilistQuery(query, variables = {}) {
  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
      throw new Error(`AniList API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    if (json.errors) {
      console.error('AniList returned errors:', json.errors);
      return null;
    }
    return json.data;
  } catch (err) {
    console.error('❌ AniList request failed:', err);
    return null;
  }
}

/**
 * Searches AniList for a title and returns its ID.
 */
export async function getAnimeId(title) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
      }
    }
  `;

  const data = await anilistQuery(query, { search: title });
  return data?.Media?.id || null;
}

/**
 * Gets recommended anime for a given AniList ID.
 */
export async function getRecommendationsById(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        recommendations {
          nodes {
            mediaRecommendation {
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
    title: mediaRecommendation.title.english || mediaRecommendation.title.romaji,
    year: mediaRecommendation.seasonYear,
    genres: mediaRecommendation.genres,
    synopsis: mediaRecommendation.description?.replace(/<[^>]+>/g, '') || ''
  }));
}

/**
 * Shortcut: Get recommended anime by title.
 */
export async function getRecommendedAnime(seedTitle) {
  const id = await getAnimeId(seedTitle);
  if (!id) {
    console.warn(`⚠️ AniList ID not found for "${seedTitle}"`);
    return [];
  }
  return await getRecommendationsById(id);
}