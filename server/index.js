// server/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getRecommendedAnime } from './anilist.js';
import { enrichRecommendations } from './services/chatgpt.js';
import { getTrailerId } from './services/youtube.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/recommendations', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: 'Missing ?title' });

    const recs = await getRecommendedAnime(title);

    // Fetch trailers in parallel
    const withTrailers = await Promise.all(
      recs.map(async r => ({
        ...r,
        trailerId: await getTrailerId(r.title)
      }))
    );

    res.json({ items: withTrailers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

app.post('/api/enrich', async (req, res) => {
  try {
    const { title, items } = req.body;
    if (!title || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Missing title or items' });
    }
    const enriched = await enrichRecommendations(title, items);
    res.json({ explanation: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to enrich recommendations' });
  }
});

app.get('/api/trailer', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: 'Missing ?title' });

    const trailerId = await getTrailerId(title);
    res.json({ trailerId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get trailer' });
  }
});

app.listen(4000, () => {
  console.log('🚀 Backend running at http://localhost:4000');
});