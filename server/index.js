import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { getTopCurrentAnime, getTrendingAnime, getFilteredRecommendations } from './services/anilist.js';
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

const app = express();
app.use(cors());
app.use(express.json());
app.use(compression()); // 🔹 Enable GZIP compression
app.set('etag', 'strong'); // 🔹 Enable strong ETag headers

// Keywords to block live-action trailers
const BANNED_KEYWORDS = [
  'live action',
  'official movie',
  'movie trailer',
  'teaser trailer',
  'netflix series',
  'prime video',
  'hbo'
];

app.get('/api/recommendations', async (req, res) => {
  try {
    const { title, page = 1, limit = 8, mode = 'popular' } = req.query;
    const dislikedIds = getDislikedIds();
    const watchedIds = getWatchedIds();
    const blockedIds = new Set([...dislikedIds, ...watchedIds]);

    // --------------------
    // FYP mode: no title provided
    // --------------------
    if (!title) {
      let animeList = mode === 'trending'
        ? await getTrendingAnime(Number(page), Number(limit) * 3)
        : await getTopCurrentAnime(Number(page), Number(limit) * 3);

      animeList = animeList.filter(a => !blockedIds.has(a.id));

      const liked = getLikedAnime();
      const likedGenres = [...new Set(liked.flatMap(a => a.genres))];
      if (likedGenres.length) {
        animeList = animeList.filter(a =>
          a.genres?.some(g => likedGenres.includes(g))
        );
      }

      const start = (Number(page) - 1) * Number(limit);
      const paged = animeList.slice(start, start + Number(limit));

      const items = await Promise.all(
        paged.map(async a => {
          let trailerId = await getTrailerId(a.title);
          if (trailerId && BANNED_KEYWORDS.some(k => a.title.toLowerCase().includes(k))) {
            trailerId = null;
          }
          return {
            id: a.id,
            title: a.title,
            year: a.year,
            genres: a.genres,
            synopsis: a.synopsis,
            trailerId,
            stopPlayback: true
          };
        })
      );

      return res.json({
        page: Number(page),
        limit: Number(limit),
        hasMore: start + Number(limit) < animeList.length,
        items
      });
    }

    // --------------------
    // Search mode
    // --------------------
    const recs = await getFilteredRecommendations(title);
    const filtered = recs
      .filter(r => !blockedIds.has(r.id))
      .filter(r => !r.isAdult); // NSFW filter

    const start = (Number(page) - 1) * Number(limit);
    const paged = filtered.slice(start, start + Number(limit));

    const items = await Promise.all(
      paged.map(async r => {
        let trailerId = await getTrailerId(r.title);
        if (trailerId && BANNED_KEYWORDS.some(k => r.title.toLowerCase().includes(k))) {
          trailerId = null;
        }
        return { ...r, trailerId, stopPlayback: true };
      })
    );

    res.json({
      page: Number(page),
      limit: Number(limit),
      hasMore: start + Number(limit) < filtered.length,
      items
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// --------------------
// Like
// --------------------
app.post('/api/like', async (req, res) => {
  try {
    const item = req.body;
    if (!item?.id || !item?.title) {
      return res.status(400).json({ error: 'Missing id or title' });
    }
    const likedItem = { ...item, likedAt: new Date().toISOString() };
    likeAnime(likedItem);
    res.json({ success: true, stopPlayback: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to like anime' });
  }
});

// --------------------
// Unlike
// --------------------
app.delete('/api/like/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    unlikeAnime(id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to remove like' });
  }
});

// --------------------
// Liked list
// --------------------
app.get('/api/liked', (req, res) => {
  try {
    res.json({ items: getLikedAnime() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch liked list' });
  }
});

// --------------------
// Dislike
// --------------------
app.post('/api/dislike', (req, res) => {
  try {
    const item = req.body;
    if (!item?.id || !item?.title) {
      return res.status(400).json({ error: 'Missing id or title' });
    }
    dislikeAnime(item);
    res.json({ success: true, stopPlayback: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to dislike anime' });
  }
});

// --------------------
// Enrich
// --------------------
app.post('/api/enrich', async (req, res) => {
  try {
    const { title, items } = req.body;
    if (!title || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Missing title or items' });
    }
    const explanation = await enrichRecommendations(title, items);
    res.json({ explanation });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to enrich' });
  }
});

app.listen(4000, () => {
  console.log('🚀 Backend running at http://localhost:4000');
});