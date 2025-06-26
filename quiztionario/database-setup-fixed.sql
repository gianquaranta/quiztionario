-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS student_responses CASCADE;
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS quiz_sessions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;

-- Create teachers table
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  max_points INTEGER DEFAULT 1 CHECK (max_points >= 1 AND max_points <= 3),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create quiz sessions table
CREATE TABLE quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  session_code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
  current_question_id UUID REFERENCES questions(id),
  current_question_started_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create session participants table
CREATE TABLE session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  student_name VARCHAR NOT NULL,
  total_points INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT NOW()
);

-- Create student responses table with correct column names
CREATE TABLE student_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES session_participants(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  response_time INTEGER NOT NULL, -- milliseconds
  points_awarded INTEGER DEFAULT 0,
  rank_position INTEGER,
  responded_at TIMESTAMP DEFAULT NOW()
);

-- Function to generate session codes
CREATE OR REPLACE FUNCTION generate_session_code() RETURNS VARCHAR(6) AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update participant points
CREATE OR REPLACE FUNCTION update_participant_points(p_participant_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE session_participants 
  SET total_points = (
    SELECT COALESCE(SUM(points_awarded), 0) 
    FROM student_responses 
    WHERE participant_id = p_participant_id
  )
  WHERE id = p_participant_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample teacher (password is "teacher123")
INSERT INTO teachers (email, name, password_hash) VALUES 
('demo@profesor.com', 'Profesor Demo', '$2b$10$rQZ9QmjlhQmjlhQmjlhQmOK8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8')
ON CONFLICT (email) DO NOTHING;

-- Insert sample quiz
INSERT INTO quizzes (teacher_id, title, description) 
SELECT id, 'Quiz de Matemáticas', 'Preguntas básicas de aritmética' 
FROM teachers WHERE email = 'demo@profesor.com'
ON CONFLICT DO NOTHING;

-- Insert sample questions
INSERT INTO questions (quiz_id, question_text, max_points, order_index)
SELECT q.id, '¿Cuánto es 2 + 2?', 1, 1 FROM quizzes q WHERE q.title = 'Quiz de Matemáticas'
UNION ALL
SELECT q.id, '¿Cuánto es 5 × 3?', 2, 2 FROM quizzes q WHERE q.title = 'Quiz de Matemáticas'
UNION ALL
SELECT q.id, '¿Cuánto es 100 ÷ 4?', 3, 3 FROM quizzes q WHERE q.title = 'Quiz de Matemáticas'
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_code ON quiz_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_student_responses_session ON student_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_student_responses_participant ON student_responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
