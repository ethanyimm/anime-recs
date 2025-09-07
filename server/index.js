import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getFilteredRecommendations, getTop100CurrentAnime } from './services/anilist.js';
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

// --------------------
// Recommendations (Search + FYP)
// --------------------
app.get('/api/recommendations', async (req, res) => {
  try {
    const { title } = req.query;
    const dislikedIds = getDislikedIds();
    const watchedIds = getWatchedIds();
    const blockedIds = new Set([...dislikedIds, ...watchedIds]);

    // FYP mode: no title provided
    if (!title) {
      const topAnime = await getTop100CurrentAnime();
      const randomTitles = topAnime
        .filter(a => !blockedIds.has(a.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 8);

      const items = await Promise.all(
        randomTitles.map(async a => ({
          id: a.id,
          title: a.title,
          year: '',
          genres: [],
          synopsis: '',
          trailerId: await getTrailerId(a.title)
        }))
      );

      return res.json({ items });
    }

    // Search mode
    const recs = await getFilteredRecommendations(title);
    const filtered = recs.filter(r => !blockedIds.has(r.id));

    const items = await Promise.all(
      filtered.map(async r => ({
        ...r,
        trailerId: await getTrailerId(r.title)
      }))
    );

    res.json({ items });
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
    const item = req.body; // expects { id, title, year, genres, synopsis, trailerId }
    if (!item?.id || !item?.title) {
      return res.status(400).json({ error: 'Missing id or title' });
    }

    const likedItem = { ...item, likedAt: new Date().toISOString() };
    likeAnime(likedItem);
    res.json({ success: true });
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
    const item = req.body; // expects { id, title }
    if (!item?.id || !item?.title) {
      return res.status(400).json({ error: 'Missing id or title' });
    }
    dislikeAnime(item);
    res.json({ success: true });
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