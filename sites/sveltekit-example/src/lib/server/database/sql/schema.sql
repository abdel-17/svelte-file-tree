CREATE TABLE IF NOT EXISTS files (
	id INTEGER NOT NULL PRIMARY KEY,
	type TEXT NOT NULL,
	name TEXT NOT NULL,
	parent_id INTEGER,
	index_in_parent INTEGER NOT NULL,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (parent_id) REFERENCES files (id) ON DELETE CASCADE,
	UNIQUE (parent_id, name)
);
