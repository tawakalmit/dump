-- Albums table
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_photo_url TEXT,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration for existing databases:
--   ALTER TABLE albums ADD COLUMN category TEXT;

-- Photos table (also stores videos; see media_type)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  storage_path TEXT,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' | 'video'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration for existing databases:
--   ALTER TABLE photos ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image';

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on categories"
  ON categories
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert on categories"
  ON categories
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon delete on categories"
  ON categories
  FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated insert on categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS policies for albums
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Public read access (anon)
CREATE POLICY "Allow public read access on albums"
  ON albums
  FOR SELECT
  TO anon
  USING (true);

-- Anon write access (auth is handled at application layer)
CREATE POLICY "Allow anon insert on albums"
  ON albums
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update on albums"
  ON albums
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete on albums"
  ON albums
  FOR DELETE
  TO anon
  USING (true);

-- Authenticated role policies (kept for compatibility)
CREATE POLICY "Allow authenticated insert on albums"
  ON albums
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on albums"
  ON albums
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on albums"
  ON albums
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS policies for photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Public read access (anon)
CREATE POLICY "Allow public read access on photos"
  ON photos
  FOR SELECT
  TO anon
  USING (true);

-- Anon write access (auth is handled at application layer)
CREATE POLICY "Allow anon insert on photos"
  ON photos
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update on photos"
  ON photos
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete on photos"
  ON photos
  FOR DELETE
  TO anon
  USING (true);

-- Authenticated role policies (kept for compatibility)
CREATE POLICY "Allow authenticated insert on photos"
  ON photos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on photos"
  ON photos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on photos"
  ON photos
  FOR DELETE
  TO authenticated
  USING (true);
