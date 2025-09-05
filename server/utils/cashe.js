// backend/cache.js
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
  const row = db.prepare(`SELECT data, updated_at FROM recommendations WHERE title = ?`)
    .get(title.toLowerCase());
  if (!row) return null;
  if (isExpired(row.updated_at)) return null; // expired
  return JSON.parse(row.data);
}

export function setCachedRecommendations(title, data) {
  db.prepare(`
    INSERT OR REPLACE INTO recommendations (title, data, updated_at)
    VALUES (?, ?, ?)
  `).run(title.toLowerCase(), JSON.stringify(data), Date.now());
}

export function getCachedTrailer(title) {
  const row = db.prepare(`SELECT trailer_id, updated_at FROM trailers WHERE title = ?`)
    .get(title.toLowerCase());
  if (!row) return null;
  if (isExpired(row.updated_at)) return null; // expired
  return row.trailer_id;
}

export function setCachedTrailer(title, trailerId) {
  db.prepare(`
    INSERT OR REPLACE INTO trailers (title, trailer_id, updated_at)
    VALUES (?, ?, ?)
  `).run(title.toLowerCase(), trailerId, Date.now());
}