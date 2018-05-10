-- Up
CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT);
CREATE TABLE defectors (id INTEGER PRIMARY KEY, username TEXT, unfollowed_at DATETIME);

-- Down
DROP TABLE users;
DROP TABLE defectors;