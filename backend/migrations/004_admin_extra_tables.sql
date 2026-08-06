-- 004_admin_extra_tables.sql
-- Migration for Admin extra feature tables

CREATE TABLE IF NOT EXISTS disciplinary_records (
  id SERIAL PRIMARY KEY,
  student_sdc_id VARCHAR(50),
  student_name VARCHAR(150) NOT NULL,
  batch VARCHAR(100),
  incident_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  action_taken VARCHAR(255),
  logged_by VARCHAR(150),
  incident_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portion_progress (
  id SERIAL PRIMARY KEY,
  batch_name VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  percentage INT NOT NULL DEFAULT 0,
  logged_by VARCHAR(150),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anonymous_feedback (
  id SERIAL PRIMARY KEY,
  user_role VARCHAR(50) DEFAULT 'anonymous',
  feedback_text TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS broadcast_logs (
  id SERIAL PRIMARY KEY,
  batch_name VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  template VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  sent_by VARCHAR(150),
  recipient_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
