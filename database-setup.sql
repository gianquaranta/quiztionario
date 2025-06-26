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

-- Create student responses table
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

-- Insert sample teacher (password is "teacher123")
INSERT INTO teachers (email, name, password_hash) VALUES 
('teacher@example.com', 'Demo Teacher', '$2b$10$rQZ9QmjlhQmjlhQmjlhQmOK8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8');

-- Insert sample quiz
INSERT INTO quizzes (teacher_id, title, description) 
SELECT id, 'Sample Math Quiz', 'Basic arithmetic questions' 
FROM teachers WHERE email = 'teacher@example.com';

-- Insert sample questions
INSERT INTO questions (quiz_id, question_text, max_points, order_index)
SELECT q.id, 'What is 2 + 2?', 1, 1 FROM quizzes q WHERE q.title = 'Sample Math Quiz'
UNION ALL
SELECT q.id, 'What is 5 × 3?', 2, 2 FROM quizzes q WHERE q.title = 'Sample Math Quiz'
UNION ALL
SELECT q.id, 'What is 100 ÷ 4?', 3, 3 FROM quizzes q WHERE q.title = 'Sample Math Quiz';
