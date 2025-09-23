import Database from 'better-sqlite3';

const db = new Database('./anime.db'); // adjust path if needed
db.pragma('journal_mode = WAL');

// --------------------
// Auto-create tables if missing
// --------------------
function initTables() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS liked (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      genres TEXT,
      likedAt TEXT,
      language_code TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS disliked (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      language_code TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS watched (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      language_code TEXT
    )
  `).run();
}

initTables();

// --------------------
// Utility: check if a column exists in a table
// --------------------
function columnExists(table, column) {
  try {
    const pragma = db.prepare(`PRAGMA table_info(${table})`).all();
    return pragma.some(col => col.name === column);
  } catch (err) {
    console.error(`⚠️ Could not check columns for ${table}:`, err.message);
    return false;
  }
}

// --------------------
// Likes
// --------------------
export function likeAnime(anime) {
  const hasLangCol = columnExists('liked', 'language_code');
  if (hasLangCol) {
    db.prepare(
      `INSERT OR REPLACE INTO liked (id, title, genres, likedAt, language_code)
       VALUES (@id, @title, @genres, @likedAt, @language_code)`
    ).run({
      ...anime,
      language_code: anime.lang || 'en'
    });
  } else {
    db.prepare(
      `INSERT OR REPLACE INTO liked (id, title, genres, likedAt)
       VALUES (@id, @title, @genres, @likedAt)`
    ).run(anime);
  }
}

export function getLikedAnime(lang = 'en') {
  const hasLangCol = columnExists('liked', 'language_code');
  if (hasLangCol) {
    return db.prepare(`SELECT * FROM liked WHERE language_code = ?`).all(lang);
  }
  return db.prepare(`SELECT * FROM liked`).all();
}

export function unlikeAnime(id, lang = 'en') {
  const hasLangCol = columnExists('liked', 'language_code');
  if (hasLangCol) {
    db.prepare(`DELETE FROM liked WHERE id = ? AND language_code = ?`).run(id, lang);
  } else {
    db.prepare(`DELETE FROM liked WHERE id = ?`).run(id);
  }
}

// --------------------
// Dislikes
// --------------------
export function dislikeAnime(anime) {
  const hasLangCol = columnExists('disliked', 'language_code');
  if (hasLangCol) {
    db.prepare(
      `INSERT OR REPLACE INTO disliked (id, title, language_code)
       VALUES (@id, @title, @language_code)`
    ).run({
      ...anime,
      language_code: anime.lang || 'en'
    });
  } else {
    db.prepare(
      `INSERT OR REPLACE INTO disliked (id, title)
       VALUES (@id, @title)`
    ).run(anime);
  }
}

export function getDislikedIds(lang = 'en') {
  const hasLangCol = columnExists('disliked', 'language_code');
  if (hasLangCol) {
    return db.prepare(`SELECT id FROM disliked WHERE language_code = ?`)
      .all(lang)
      .map(row => row.id);
  }
  return db.prepare(`SELECT id FROM disliked`).all().map(row => row.id);
}

// --------------------
// Watched
// --------------------
export function markWatched(anime) {
  const hasLangCol = columnExists('watched', 'language_code');
  if (hasLangCol) {
    db.prepare(
      `INSERT OR REPLACE INTO watched (id, title, language_code)
       VALUES (@id, @title, @language_code)`
    ).run({
      ...anime,
      language_code: anime.lang || 'en'
    });
  } else {
    db.prepare(
      `INSERT OR REPLACE INTO watched (id, title)
       VALUES (@id, @title)`
    ).run(anime);
  }
}

export function getWatchedIds(lang = 'en') {
  const hasLangCol = columnExists('watched', 'language_code');
  if (hasLangCol) {
    return db.prepare(`SELECT id FROM watched WHERE language_code = ?`)
      .all(lang)
      .map(row => row.id);
  }
  return db.prepare(`SELECT id FROM watched`).all().map(row => row.id);
}