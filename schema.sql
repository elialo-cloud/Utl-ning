CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE(class_id, name)
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  category TEXT NOT NULL DEFAULT 'Övrigt',
  total INTEGER NOT NULL DEFAULT 0 CHECK(total >= 0)
);

CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id),
  class_name TEXT NOT NULL,
  student TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_name TEXT NOT NULL,
  icon TEXT NOT NULL,
  borrowed_at TEXT NOT NULL,
  returned INTEGER NOT NULL DEFAULT 0 CHECK(returned IN (0, 1)),
  returned_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_loans_active ON loans(returned, item_id);
CREATE INDEX IF NOT EXISTS idx_loans_student ON loans(class_id, student, returned);

INSERT OR IGNORE INTO classes (id, name) VALUES
  ('1A', '1A'), ('1B', '1B'), ('2A', '2A'), ('2B', '2B');

INSERT OR IGNORE INTO students (class_id, name) VALUES
  ('1A','Alma'),('1A','Elias'),('1A','Hugo'),('1A','Liam'),('1A','Maja'),('1A','Noah'),('1A','Olivia'),('1A','William'),
  ('1B','Alice'),('1B','Axel'),('1B','Elsa'),('1B','Isak'),('1B','Leo'),('1B','Nora'),('1B','Sofia'),('1B','Vera'),
  ('2A','Adam'),('2A','Ella'),('2A','Felix'),('2A','Freja'),('2A','Loke'),('2A','Milo'),('2A','Saga'),('2A','Wilma'),
  ('2B','Albin'),('2B','Ebba'),('2B','Harry'),('2B','Ida'),('2B','Kalle'),('2B','Lilly'),('2B','Nils'),('2B','Tilde');

INSERT OR IGNORE INTO items (id, name, icon, category, total) VALUES
  ('boll','Boll','⚽','Bollar',10),
  ('innebandy','Innebandyklubba','🏑','Sport',12),
  ('kon','Kon','🔶','Lek',20),
  ('hopprep','Hopprep','〰️','Lek',8),
  ('pingisrack','Pingisrack','🏓','Sport',6),
  ('rockring','Rockring','⭕','Lek',6),
  ('vast','Fotbollsväst','🦺','Sport',15),
  ('frisbee','Frisbee','🥏','Lek',5);
