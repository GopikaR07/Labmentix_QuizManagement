-- Quiz Management & Online Assessment Platform
-- PostgreSQL schema

-- Run with: psql -U postgres -d quiz_platform -f db/schema.sql

DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('ADMIN', 'STUDENT')),
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- QUIZZES
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'BEGINNER'
        CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    duration INTEGER NOT NULL,              -- minutes
    passing_score INTEGER NOT NULL DEFAULT 60, -- percentage
    max_attempts INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(15) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
    thumbnail_url VARCHAR(255),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- QUESTIONS
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    explanation TEXT,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'BEGINNER'
        CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- OPTIONS (each question has multiple options, exactly one is_correct = true)
CREATE TABLE options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

-- ATTEMPTS (one row per quiz attempt by a student)
CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER,
    percentage NUMERIC(5,2),
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    unanswered INTEGER DEFAULT 0,
    time_taken INTEGER,                     -- seconds
    status VARCHAR(15) NOT NULL DEFAULT 'IN_PROGRESS'
        CHECK (status IN ('IN_PROGRESS', 'PASSED', 'FAILED')),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- ANSWERS (student's selected option per question, per attempt)
CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id INTEGER REFERENCES options(id) ON DELETE SET NULL,
    is_correct BOOLEAN
);

-- Helpful indexes
CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_quizzes_category ON quizzes(category_id);
CREATE INDEX idx_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_options_question ON options(question_id);
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_quiz ON attempts(quiz_id);
CREATE INDEX idx_answers_attempt ON answers(attempt_id);

-- Seed one admin account so you have something to log in with.
-- Email: admin@quiz.com  Password: Admin@123
-- (hash below is bcrypt of "Admin@123" — change it after first login)
INSERT INTO users (name, email, password, role)
VALUES (
    'Platform Admin',
    'admin@quiz.com',
    '$2b$10$GQfXYjXh6fbDr4cn8iLYc.v0VJSXbWcNWM9ditp//91G3w8xSmmZu',
    'ADMIN'
);
