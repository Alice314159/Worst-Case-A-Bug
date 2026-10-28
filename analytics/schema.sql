CREATE TABLE IF NOT EXISTS pageviews (
  event_id TEXT PRIMARY KEY,
  occurred_at TEXT NOT NULL,
  day TEXT NOT NULL,
  session_hash TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  device TEXT NOT NULL,
  browser TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pageviews_day ON pageviews(day);
CREATE INDEX IF NOT EXISTS idx_pageviews_session ON pageviews(session_hash, day);
