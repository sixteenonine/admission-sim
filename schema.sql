PRAGMA defer_foreign_keys = TRUE;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS exam_history;
DROP TABLE IF EXISTS user_sync_data;
DROP TABLE IF EXISTS user_vocab_progress;
DROP TABLE IF EXISTS user_study_stats;
DROP TABLE IF EXISTS vocab_repository;
DROP TABLE IF EXISTS stories;
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
    transaction_id TEXT,
    amount INTEGER NOT NULL,
    plan_tier TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'story',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sync_data (
    user_id TEXT PRIMARY KEY,
    favorites TEXT DEFAULT '{"stories":[], "vocab":[]}',
    custom_decks TEXT DEFAULT '[]',
    custom_speedreads TEXT DEFAULT '[]',
    srs_progress TEXT DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE vocab_repository (
    id TEXT PRIMARY KEY,
    eng TEXT NOT NULL UNIQUE,
    thai TEXT NOT NULL,
    pos TEXT,
    category TEXT,
    example TEXT,
    synonyms TEXT,
    antonyms TEXT,
    sync_batch_id TEXT,
    is_deleted BOOLEAN DEFAULT 0,
    sort_order INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_vocab_progress (
    user_id TEXT NOT NULL,
    vocab_id TEXT NOT NULL,
    status TEXT DEFAULT 'learning',
    interval INTEGER DEFAULT 0,
    ease_factor REAL DEFAULT 2.5,
    next_review_date DATETIME NOT NULL,
    revision INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, vocab_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vocab_id) REFERENCES vocab_repository(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_vocab_review ON user_vocab_progress(user_id, next_review_date);

CREATE TABLE user_study_stats (
    user_id TEXT NOT NULL,
    study_date DATE NOT NULL,
    cards_reviewed INTEGER DEFAULT 0,
    remembered_count INTEGER DEFAULT 0,
    forgotten_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, study_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_users_plan_expire ON users(plan_expire_at);
CREATE INDEX IF NOT EXISTS idx_exam_history_user ON exam_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_category_order ON vocab_repository(category, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_vocab_status ON user_vocab_progress(user_id, status);