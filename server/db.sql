-- Updated Database schema for Minimal Timetable Management System

DROP TABLE IF EXISTS timetable CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    login_id VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'PROFESSOR')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    year VARCHAR(50) NOT NULL CHECK (year IN ('SY', 'TY', 'B.Tech', 'FY M.Tech')),
    division VARCHAR(50) NOT NULL CHECK (division IN ('A', 'B', 'No Div')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, division)
);

CREATE TABLE timetable (
    id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    professor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    location VARCHAR(255), -- Added manual location
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1=Mon, ..., 5=Fri
    start_slot INT NOT NULL CHECK (start_slot BETWEEN 0 AND 6),
    duration_slots INT NOT NULL CHECK (duration_slots IN (1, 2)),
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('LECTURE', 'LAB')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timetable_professor_id ON timetable(professor_id);
CREATE INDEX idx_timetable_class_id ON timetable(class_id);
