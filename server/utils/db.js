import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'cache.db'));

// --------------------
// Tables
// --------------------
db.prepare(`
  CREATE TABLE IF NOT EXISTS liked_anime (
    id INTEGER PRIMARY KEY,
    title TEXT,
    year TEXT,
    genres TEXT,
    synopsis TEXT,
    trailer_id TEXT,
    liked_at INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS watched_anime (
    id INTEGER PRIMARY KEY,
    title TEXT,
    watched_at INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS disliked_anime (
    id INTEGER PRIMARY KEY,
    title TEXT,
    disliked_at INTEGER
  )
`).run();

// --------------------
// Watched helpers
// --------------------
export function getWatchedIds() {
  const rows = db.prepare(`SELECT id FROM watched_anime`).all();
  return rows.map(r => r.id);
}

export function markWatched(item) {
  db.prepare(`
    INSERT OR REPLACE INTO watched_anime (id, title, watched_at)
    VALUES (?, ?, ?)
  `).run(item.id, item.title, Date.now());
}

// --------------------
// Liked helpers
// --------------------
export function likeAnime(item) {
  db.prepare(`
    INSERT OR REPLACE INTO liked_anime (id, title, year, genres, synopsis, trailer_id, liked_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    item.title,
    String(item.year ?? ''),
    JSON.stringify(item.genres ?? []),
    item.synopsis ?? '',
    item.trailerId ?? null,
    Date.now()
  );
}

export function unlikeAnime(id) {
  db.prepare(`DELETE FROM liked_anime WHERE id = ?`).run(id);
}

export function getLikedAnime() {
  const rows = db.prepare(`SELECT * FROM liked_anime ORDER BY liked_at DESC`).all();
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    year: r.year,
    genres: JSON.parse(r.genres || '[]'),
    synopsis: r.synopsis,
    trailerId: r.trailer_id
  }));
}

// --------------------
// Disliked helpers
// --------------------
export function dislikeAnime(item) {
  db.prepare(`
    INSERT OR REPLACE INTO disliked_anime (id, title, disliked_at)
    VALUES (?, ?, ?)
  `).run(item.id, item.title, Date.now());
}

export function getDislikedIds() {
  const rows = db.prepare(`SELECT id FROM disliked_anime`).all();
  return rows.map(r => r.id);
}

export function removeDislike(id) {
  db.prepare(`DELETE FROM disliked_anime WHERE id = ?`).run(id);
}