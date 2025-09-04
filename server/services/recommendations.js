import fetch from 'node-fetch';

export async function getRecommendedAnime(seedTitle) {
  const searchQuery = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
      }
    }
  `;

  const searchRes = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: searchQuery, variables: { search: seedTitle } })
  });

  const searchJson = await searchRes.json();
  const mediaId = searchJson?.data?.Media?.id;
  if (!mediaId) return [];

  const recQuery = `
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

  const recRes = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: recQuery, variables: { id: mediaId } })
  });

  const recJson = await recRes.json();
  const nodes = recJson?.data?.Media?.recommendations?.nodes || [];

  return nodes.map(({ mediaRecommendation }) => ({
    title: mediaRecommendation.title.english || mediaRecommendation.title.romaji,
    year: mediaRecommendation.seasonYear,
    genres: mediaRecommendation.genres,
    synopsis: mediaRecommendation.description?.replace(/<[^>]+>/g, '') || ''
  }));
}