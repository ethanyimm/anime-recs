import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getRecommendedAnime } from './services/recommendations.js';
import { enrichRecommendations } from './services/chatgpt.js';
import { getTrailerId } from './services/youtube.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/recommendations', async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: 'Missing ?title' });

  const recs = await getRecommendedAnime(title);
  res.json({ items: recs });
});

app.post('/api/enrich', async (req, res) => {
  const { title, items } = req.body;
  if (!title || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Missing title or items' });
  }

  const enriched = await enrichRecommendations(title, items);
  res.json({ explanation: enriched });
});

app.get('/api/test-chatgpt', async (req, res) => {
  const response = await enrichRecommendations("Naruto", [
    { title: "Attack on Titan" },
    { title: "Tokyo Ghoul" }
  ]);
  res.send(response);
});

app.get('/api/trailer', async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: 'Missing ?title' });

  const trailerId = await getTrailerId(title);
  res.json({ trailerId });
});

app.listen(4000, () => {
  console.log("🚀 New backend running at http://localhost:4000");
});