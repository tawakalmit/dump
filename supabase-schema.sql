-- Albums table
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_photo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true);

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

-- Storage policies for photos bucket
CREATE POLICY "Allow public read access on photos storage"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'photos');

-- Anon storage write access (auth is handled at application layer)
CREATE POLICY "Allow anon upload to photos storage"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Allow anon delete from photos storage"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'photos');

-- Authenticated storage policies (kept for compatibility)
CREATE POLICY "Allow authenticated upload to photos storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Allow authenticated delete from photos storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos');
