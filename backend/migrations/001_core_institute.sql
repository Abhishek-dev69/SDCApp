-- Core institute data used by admin, owner, student, and parent flows.
-- Run this once on the Cloud SQL PostgreSQL database before using the new APIs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  branch text NOT NULL DEFAULT 'Main',
  stream text NOT NULL DEFAULT 'PCM',
  program text NOT NULL DEFAULT 'PCM',
  capacity integer,
  timing text,
  start_date date,
  textbook_sources text[] NOT NULL DEFAULT ARRAY['maharashtra'],
  active boolean NOT NULL DEFAULT true,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  experience text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'Active',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS batch_teachers (
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (batch_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  chapter text,
  type text NOT NULL CHECK (type IN ('textbook', 'notes', 'assignment', 'video', 'pyq')),
  source text,
  class_level text,
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  batch_code text,
  gcs_path text NOT NULL,
  uploaded_by text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_sdc_batch ON students (sdc_batch);
CREATE INDEX IF NOT EXISTS idx_study_materials_filters
  ON study_materials (subject, type, source, class_level, batch_code);
