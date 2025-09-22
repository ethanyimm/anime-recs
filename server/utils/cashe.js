// utils/cashe.js
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'cache.db'));

// Expiry time in milliseconds (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000;

db.prepare(`
  CREATE TABLE IF NOT EXISTS recommendations (
    title TEXT PRIMARY KEY,
    data TEXT,
    updated_at INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS trailers (
    title TEXT PRIMARY KEY,
    trailer_id TEXT,
    updated_at INTEGER
  )
`).run();

function isExpired(updatedAt) {
  return Date.now() - updatedAt > CACHE_TTL;
}

export function getCachedRecommendations(title) {
  const key = title.toLowerCase();
  const row = db.prepare(`SELECT data, updated_at FROM recommendations WHERE title = ?`).get(key);

  if (!row) {
    console.log(`❌ Cache miss: ${key}`);
    return null;
  }
  if (isExpired(row.updated_at)) {
    console.log(`⚠️ Cache expired: ${key}`);
    return null;
  }

  console.log(`✅ Cache hit: ${key}`);
  try {
    return JSON.parse(row.data);
  } catch (err) {
    console.error(`⚠️ Cache parse error for ${key}:`, err);
    return null;
  }
}

export function setCachedRecommendations(title, data) {
  const key = title.toLowerCase();
  db.prepare(`
    INSERT OR REPLACE INTO recommendations (title, data, updated_at)
    VALUES (?, ?, ?)
  `).run(key, JSON.stringify(data), Date.now());
  console.log(`💾 Cached recommendations for: ${key}`);
}

export function getCachedTrailer(title) {
  const key = title.toLowerCase();
  const row = db.prepare(`SELECT trailer_id, updated_at FROM trailers WHERE title = ?`).get(key);

  if (!row) {
    console.log(`❌ Trailer cache miss: ${key}`);
    return null;
  }
  if (isExpired(row.updated_at)) {
    console.log(`⚠️ Trailer cache expired: ${key}`);
    return null;
  }

  console.log(`✅ Trailer cache hit: ${key}`);
  return row.trailer_id;
}

export function setCachedTrailer(title, trailerId) {
  const key = title.toLowerCase();
  db.prepare(`
    INSERT OR REPLACE INTO trailers (title, trailer_id, updated_at)
    VALUES (?, ?, ?)
  `).run(key, trailerId, Date.now());
  console.log(`💾 Cached trailer for: ${key}`);
}