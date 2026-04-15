CREATE TABLE category_scores (
	id text PRIMARY KEY NOT NULL,
	report_id text,
	category text NOT NULL,
	score integer NOT NULL,
	status text NOT NULL,
	created_at text DEFAULT (datetime('now')),
	FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
CREATE TABLE crawled_pages (
	id text PRIMARY KEY NOT NULL,
	report_id text,
	url text NOT NULL,
	status_code integer,
	title text,
	meta_description text,
	h1_count integer,
	h2_count integer,
	word_count integer,
	has_noindex integer,
	has_canonical integer,
	canonical_url text,
	images_total integer,
	images_missing_alt integer,
	internal_links integer,
	external_links integer,
	has_structured_data integer,
	structured_data_type text,
	page_load_time real,
	loaded_at text DEFAULT (datetime('now')),
	FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
CREATE TABLE issues (
	id text PRIMARY KEY NOT NULL,
	report_id text,
	page_url text,
	severity text NOT NULL,
	category text NOT NULL,
	title text NOT NULL,
	description text,
	impact text,
	created_at text DEFAULT (datetime('now')),
	FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
CREATE TABLE keywords (
	id text PRIMARY KEY NOT NULL,
	report_id text,
	keyword text NOT NULL,
	intent text,
	search_volume text,
	difficulty text,
	created_at text DEFAULT (datetime('now')),
	FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
CREATE TABLE reports (
	id text PRIMARY KEY NOT NULL,
	user_id text,
	domain text NOT NULL,
	client_name text,
	status text DEFAULT 'pending',
	overall_score integer,
	critical_issues integer,
	high_issues integer,
	medium_issues integer,
	low_issues integer,
	traffic_uplift text,
	crawled_page_count integer,
	sitemap_url_count integer,
	created_at text DEFAULT (datetime('now')),
	completed_at text,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE settings (
	key text PRIMARY KEY NOT NULL,
	value text NOT NULL,
	updated_at text DEFAULT (datetime('now'))
);
CREATE TABLE shared_reports (
	id text PRIMARY KEY NOT NULL,
	report_id text,
	shared_with_email text NOT NULL,
	created_at text DEFAULT (datetime('now')),
	FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
CREATE TABLE users (
	id text PRIMARY KEY NOT NULL,
	email text NOT NULL,
	password_hash text NOT NULL,
	name text,
	is_admin integer DEFAULT 0,
	created_at text DEFAULT (datetime('now')),
	updated_at text DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX users_email_unique ON users (email);