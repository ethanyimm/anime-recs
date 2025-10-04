// utils/cache.js
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'cache.db'));

// Expiry time in milliseconds (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Initialize tables
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

// Add indexes for faster lookups
db.prepare(`CREATE INDEX IF NOT EXISTS idx_recommendations_updated ON recommendations(updated_at)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_trailers_updated ON trailers(updated_at)`).run();

function isExpired(updatedAt) {
  return Date.now() - updatedAt > CACHE_TTL;
}

// --------------------
// Recommendations Cache
// --------------------
export function getCachedRecommendations(title) {
  const key = title.toLowerCase();
  const row = db.prepare(
    `SELECT data, updated_at FROM recommendations WHERE title = ?`
  ).get(key);

  if (!row) {
    console.log(`❌ Cache miss: ${key}`);
    return null;
  }
  if (isExpired(row.updated_at)) {
    console.log(`⚠️ Cache expired: ${key}`);
    db.prepare(`DELETE FROM recommendations WHERE title = ?`).run(key);
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
  db.prepare(
    `INSERT OR REPLACE INTO recommendations (title, data, updated_at)
     VALUES (?, ?, ?)`
  ).run(key, JSON.stringify(data), Date.now());
  console.log(`💾 Cached recommendations for: ${key}`);
}

// --------------------
// Trailers Cache
// --------------------
export function getCachedTrailer(title) {
  const key = title.toLowerCase();
  const row = db.prepare(
    `SELECT trailer_id, updated_at FROM trailers WHERE title = ?`
  ).get(key);

  if (!row) {
    console.log(`❌ Trailer cache miss: ${key}`);
    return null;
  }
  if (isExpired(row.updated_at)) {
    console.log(`⚠️ Trailer cache expired: ${key}`);
    db.prepare(`DELETE FROM trailers WHERE title = ?`).run(key);
    return null;
  }

  console.log(`✅ Trailer cache hit: ${key}`);
  return row.trailer_id;
}

export function setCachedTrailer(title, trailerId) {
  const key = title.toLowerCase();
  db.prepare(
    `INSERT OR REPLACE INTO trailers (title, trailer_id, updated_at)
     VALUES (?, ?, ?)`
  ).run(key, trailerId, Date.now());
  console.log(`💾 Cached trailer for: ${key}`);
}

// --------------------
// Maintenance Helpers
// --------------------
export function clearExpired() {
  const now = Date.now();
  const recs = db.prepare(`DELETE FROM recommendations WHERE ? - updated_at > ?`).run(now, CACHE_TTL);
  const trs = db.prepare(`DELETE FROM trailers WHERE ? - updated_at > ?`).run(now, CACHE_TTL);
  console.log(`🧹 Cleared expired cache: ${recs.changes} recs, ${trs.changes} trailers`);
}

export function clearAll() {
  db.prepare(`DELETE FROM recommendations`).run();
  db.prepare(`DELETE FROM trailers`).run();
  console.log(`🗑️ Cleared all cache entries`);
}