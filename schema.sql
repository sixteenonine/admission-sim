DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS exam_history;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_id INTEGER DEFAULT 1,
    avatar_url TEXT,
    plan_tier TEXT DEFAULT 'common',
    plan_expire_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
PRAGMA defer_foreign_keys = TRUE;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS exam_history;
DROP TABLE IF EXISTS user_sync_data;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_id INTEGER DEFAULT 1,
    avatar_url TEXT,
    plan_tier TEXT DEFAULT 'common',
    plan_expire_at DATETIME,
    generation TEXT,
    target_uni TEXT,
    target_fac TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exam_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    score INTEGER NOT NULL,
    reflection_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    plan_tier TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
DROP TABLE IF EXISTS stories;
CREATE TABLE stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    translation TEXT,
    image_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS user_sync_data;
CREATE TABLE user_sync_data (
    user_id TEXT PRIMARY KEY,
    favorites TEXT DEFAULT '{"stories":[], "vocab":[]}',
    custom_decks TEXT DEFAULT '[]',
    custom_speedreads TEXT DEFAULT '[]',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
DROP TABLE IF EXISTS vocab_repository;
CREATE TABLE vocab_repository (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eng TEXT NOT NULL UNIQUE,
    thai TEXT NOT NULL,
    type TEXT,
    example TEXT,
    category TEXT,
    level TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);