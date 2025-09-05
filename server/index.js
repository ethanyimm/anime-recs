import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getFilteredRecommendations } from './services/anilist.js';
import { enrichRecommendations } from './services/chatgpt.js';
import { getTrailerId } from './services/youtube.js';
import { likeAnime, getLikedAnime, markWatched, unlikeAnime } from './utils/db.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/recommendations', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: 'Missing ?title' });

    const recs = await getFilteredRecommendations(title);

    // Attach trailers in parallel
    const items = await Promise.all(
      recs.map(async r => ({ ...r, trailerId: await getTrailerId(r.title) }))
    );

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

app.post('/api/like', async (req, res) => {
  try {
    const item = req.body; // expects { id, title, year, genres, synopsis, trailerId }
    if (!item?.id || !item?.title) return res.status(400).json({ error: 'Missing id or title' });
    likeAnime(item);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to like anime' });
  }
});

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

app.get('/api/liked', (req, res) => {
  try {
    res.json({ items: getLikedAnime() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch liked list' });
  }
});

app.post('/api/watched', (req, res) => {
  try {
    const item = req.body; // expects { id, title }
    if (!item?.id || !item?.title) return res.status(400).json({ error: 'Missing id or title' });
    markWatched(item);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to mark watched' });
  }
});

app.post('/api/enrich', async (req, res) => {
  try {
    const { title, items } = req.body;
    if (!title || !Array.isArray(items)) return res.status(400).json({ error: 'Missing title or items' });
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