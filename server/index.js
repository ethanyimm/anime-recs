// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import {
  getTopCurrentAnime,
  getTrendingAnime,
  getFilteredRecommendations
} from './services/anilist.js';
import { enrichRecommendations } from './services/chatgpt.js';
import { getTrailerId } from './services/youtube.js';
import {
  likeAnime,
  getLikedAnime,
  unlikeAnime,
  dislikeAnime,
  getDislikedIds,
  getWatchedIds
} from './utils/db.js';
import {
  getCachedRecommendations,
  setCachedRecommendations
} from './utils/cache.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(compression());
app.set('etag', 'strong');

// Keywords to block live-action trailers (applied inside youtube service)
const BANNED_KEYWORDS = [
  'live action',
  'official movie',
  'movie trailer',
  'teaser trailer',
  'netflix series',
  'prime video',
  'hbo'
];

// Root route — quick check
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Test route — for debugging
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is alive!' });
});

// Helpers
function normalizeGenres(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

function deriveLikedGenres(lang = 'en') {
  const liked = getLikedAnime(lang);
  const all = liked.flatMap(a => normalizeGenres(a.genres));
  return [...new Set(all)];
}

function scoreByGenreOverlap(itemGenres, likedGenres) {
  if (!likedGenres.length) return 0;
  const ig = normalizeGenres(itemGenres);
  let overlap = 0;
  for (const g of ig) {
    if (likedGenres.includes(g)) overlap += 1;
  }
  return overlap;
}

// Recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    const {
      title,
      page = 1,
      limit = 8,
      mode = 'popular',
      lang = 'en'
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const dislikedIds = getDislikedIds(lang);
    const watchedIds = getWatchedIds(lang);
    const blockedIds = new Set([...dislikedIds, ...watchedIds]);
    const likedGenres = deriveLikedGenres(lang);
    const genreKey = likedGenres.slice().sort().join('|') || 'none';

    // Browse mode (no title): batch fetch, re-rank, lazy load, cache by preference profile
    if (!title) {
      // Batch size: fetch more than needed to allow filtering and ranking headroom
      const batchSize = limitNum * 4;

      const baseCacheKey = `browse:${mode}:batch:${batchSize}:lang:${lang}:genres:${genreKey}`;
      // Try personalized candidates cache
      let candidates = getCachedRecommendations(baseCacheKey);

      if (!candidates) {
        const rawList =
          mode === 'trending'
            ? await getTrendingAnime(1, batchSize, lang)
            : await getTopCurrentAnime(1, batchSize, lang);

        // Filter NSFW is already handled in services; still filter blocked
        const filtered = rawList.filter(a => !blockedIds.has(a.id));

        // Re-rank by genre overlap (content-based)
        const ranked = filtered
          .map(a => ({
            ...a,
            score: scoreByGenreOverlap(a.genres, likedGenres)
          }))
          .sort((a, b) => b.score - a.score);

        // Cache the ranked candidates BEFORE pagination (preference-aware)
        setCachedRecommendations(baseCacheKey, ranked);
        candidates = ranked;
      } else {
        // Even when using cached candidates, ensure we respect current blockedIds
        candidates = candidates.filter(a => !blockedIds.has(a.id));
      }

      // Lazy load: paginate the ranked list
      const start = (pageNum - 1) * limitNum;
      const paged = candidates.slice(start, start + limitNum);

      const items = await Promise.all(
        paged.map(async a => ({
          id: a.id,
          title: a.title,
          year: a.year,
          genres: a.genres,
          synopsis: a.synopsis,
          trailerId: await getTrailerId(a.title, lang),
          stopPlayback: true,
          lang
        }))
      );

      return res.json({
        page: pageNum,
        limit: limitNum,
        hasMore: start + limitNum < candidates.length,
        items
      });
    }

    // Search mode: delegate to filtered recommendations (should already respect NSFW)
    // You can apply the same re-ranking here if desired.
    const recs = await getFilteredRecommendations(title, lang);

    const filtered = recs
      .filter(r => !blockedIds.has(r.id))
      .filter(r => !r.isAdult);

    // Optional: re-rank search results by genre overlap
    const ranked = filtered
      .map(r => ({
        ...r,
        score: scoreByGenreOverlap(r.genres, likedGenres)
      }))
      .sort((a, b) => b.score - a.score);

    const start = (pageNum - 1) * limitNum;
    const paged = ranked.slice(start, start + limitNum);

    const items = await Promise.all(
      paged.map(async r => ({
        ...r,
        trailerId: await getTrailerId(r.title, lang),
        stopPlayback: true,
        lang
      }))
    );

    res.json({
      page: pageNum,
      limit: limitNum,
      hasMore: start + limitNum < ranked.length,
      items
    });
  } catch (err) {
    console.error('❌ Failed to get recommendations:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Like
app.post('/api/like', async (req, res) => {
  try {
    const item = req.body;
    if (!item?.id || !item?.title) {
      return res.status(400).json({ error: 'Missing id or title' });
    }
    likeAnime({
      ...item,
      likedAt: new Date().toISOString(),
      lang: item.lang || 'en'
    });
    res.json({ success: true, stopPlayback: true });
  } catch (e) {
    console.error('❌ Failed to like anime:', e);
    res.status(500).json({ error: 'Failed to like anime' });
  }
});

// Dislike
app.post('/api/dislike', (req, res) => {
  try {
    const item = req.body;
    if (!item?.id || !item?.title) {
      return res.status(400).json({ error: 'Missing id or title' });
    }
    dislikeAnime({ ...item, lang: item.lang || 'en' });
    res.json({ success: true, stopPlayback: true });
  } catch (e) {
    console.error('❌ Failed to dislike anime:', e);
    res.status(500).json({ error: 'Failed to dislike anime' });
  }
});

// Optional: Unlike route (useful for completeness)
app.post('/api/unlike', (req, res) => {
  try {
    const { id, lang = 'en' } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    unlikeAnime(id, lang);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Failed to unlike anime:', e);
    res.status(500).json({ error: 'Failed to unlike anime' });
  }
});

// Enrich
app.post('/api/enrich', async (req, res) => {
  try {
    const { title, items } = req.body;
    if (!title || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Missing title or items' });
    }
    const explanation = await enrichRecommendations(title, items);
    res.json({ explanation });
  } catch (e) {
    console.error('❌ Failed to enrich:', e);
    res.status(500).json({ error: 'Failed to enrich' });
  }
});

app.listen(4000, () => {
  console.log('🚀 Backend running at http://localhost:4000');
});