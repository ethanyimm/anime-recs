import fetch from 'node-fetch';

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

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { search: title } })
  });

  const json = await res.json();
  return json?.data?.Media?.id || null;
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

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id } })
  });

  const json = await res.json();
  const nodes = json?.data?.Media?.recommendations?.nodes || [];

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