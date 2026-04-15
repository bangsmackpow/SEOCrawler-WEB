-- SEOCrawler D1 Database Schema

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Reports metadata
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  client_name TEXT,
  status TEXT DEFAULT 'pending',
  overall_score INTEGER,
  critical_issues INTEGER,
  high_issues INTEGER,
  medium_issues INTEGER,
  low_issues INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Shared reports
CREATE TABLE shared_reports (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  shared_with_email TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (report_id) REFERENCES reports(id)
);

-- Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_domain ON reports(domain);
CREATE INDEX idx_shared_report_email ON shared_reports(shared_with_email);

-- Insert default admin user (password: admin123)
INSERT INTO users (id, email, password_hash, name, is_admin) 
VALUES ('admin', 'admin@example.com', '$2a$10$xKxKxKxKxKxKxKxKxKxKO', 'Admin', 1);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
('default_agency_name', 'My Agency'),
('site_url', '');