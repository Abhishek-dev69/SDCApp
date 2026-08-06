-- 006_teacher_remarks.sql
-- Migration for Teacher Remarks system

CREATE TABLE IF NOT EXISTS teacher_remarks (
  id SERIAL PRIMARY KEY,
  teacher_auth_id INT REFERENCES auth(id) ON DELETE SET NULL,
  student_auth_id INT NOT NULL REFERENCES auth(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL, -- 'Lecture Missed', 'Test Scored', 'Discipline', 'General'
  remark_text TEXT NOT NULL,
  visible_to_student BOOLEAN DEFAULT TRUE,
  visible_to_parent BOOLEAN DEFAULT TRUE,
  visible_to_admin BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
