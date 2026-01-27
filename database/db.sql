-- Reset Tables
DROP TABLE IF EXISTS task_assignee;
DROP TABLE IF EXISTS task;
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS user_subteam;
DROP TABLE IF EXISTS subteam;
DROP TABLE IF EXISTS user_account;
DROP TABLE IF EXISTS team;

-- Team Information
CREATE TABLE team (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- User Account Information
CREATE TABLE user_account (
    id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES team(id),
    user_name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL
);

-- Subteam Information
CREATE TABLE subteam (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    team_id INT NOT NULL REFERENCES team(id),
    lead_id INT REFERENCES user_account(id)
);

-- Join Table for user_account & subteam
CREATE TABLE user_subteam (
    user_id INT NOT NULL REFERENCES user_account(id),
    subteam_id INT NOT NULL REFERENCES subteam(id),
    notify BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, subteam_id)
);

-- Project Information
CREATE TABLE project (
    id SERIAL PRIMARY KEY,
    subteam_id INT NOT NULL REFERENCES subteam(id),
    lead_id INT REFERENCES user_account(id),
    title TEXT NOT NULL,
    description TEXT,
    status INT,
    duedate TIMESTAMPTZ
);

-- Task Information
CREATE TABLE task (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES project(id),
    title TEXT NOT NULL,
    description TEXT,
    status INT,
    duedate TIMESTAMPTZ
);

-- Join Table for user_account and task
CREATE TABLE task_assignee (
    task_id INT NOT NULL REFERENCES task(id),
    user_id INT NOT NULL REFERENCES user_account(id),
    PRIMARY KEY (task_id, user_id)
);

-- Indexes
CREATE INDEX idx_user_team ON user_account(team_id);
CREATE INDEX idx_subteam_team ON subteam(team_id);
CREATE INDEX idx_project_subteam ON project(subteam_id);
CREATE INDEX idx_task_project ON task(project_id);


-- Only insert seed data if tables are empty
-- Check team table first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM team) THEN
        INSERT INTO team (name) VALUES ('SKERS');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_account) THEN
        -- Password hash placeholder; replace with a real bcrypt hash
        INSERT INTO user_account (team_id, user_name, email, password_hash)
        VALUES (1, 'SKERS_Admin', 'skers.vurc@gmail.com', '$2b$12$examplehashhere');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM subteam) THEN
        INSERT INTO subteam (name, team_id, lead_id)
        VALUES ('Software', 1, NULL);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM project) THEN
        INSERT INTO project (subteam_id, lead_id, title, description, status, duedate)
        VALUES (1, NULL, 'VLAD', 'VEX Logging & Assignment Dashboard', NULL, NULL);
    END IF;
END$$;