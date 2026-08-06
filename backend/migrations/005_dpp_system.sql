-- 005_dpp_system.sql
-- Migration for Online DPP (Daily Practice Problems) System & Practice Modules

CREATE TABLE IF NOT EXISTS dpp_modules (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  exam_category VARCHAR(100) NOT NULL, -- 'CET PCM', 'CET PCB', 'NEET', 'JEE Mains', 'JEE Adv'
  subject VARCHAR(100) NOT NULL,        -- 'Physics', 'Chemistry', 'Mathematics', 'Biology'
  chapter VARCHAR(255),
  total_questions INT NOT NULL DEFAULT 0,
  duration_mins INT NOT NULL DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dpp_questions (
  id SERIAL PRIMARY KEY,
  dpp_id INT NOT NULL REFERENCES dpp_modules(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option VARCHAR(5) NOT NULL, -- 'A', 'B', 'C', 'D'
  explanation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dpp_submissions (
  id SERIAL PRIMARY KEY,
  dpp_id INT NOT NULL REFERENCES dpp_modules(id) ON DELETE CASCADE,
  student_auth_id INT,
  student_name VARCHAR(150),
  score INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  answers JSONB,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
