-- 2026-02-25: Add Cascade Deletes to Projects and Related Tables

-- 1. Update Join Table (When subteam is deleted, remove member associations)
ALTER TABLE user_subteam 
DROP CONSTRAINT IF EXISTS user_subteam_subteam_id_fkey;

ALTER TABLE user_subteam 
ADD CONSTRAINT user_subteam_subteam_id_fkey 
FOREIGN KEY (subteam_id) 
REFERENCES subteam(id) 
ON DELETE CASCADE;

-- 2. Update Project Table (When subteam is deleted, remove all projects)
ALTER TABLE project 
DROP CONSTRAINT IF EXISTS project_subteam_id_fkey;

ALTER TABLE project 
ADD CONSTRAINT project_subteam_id_fkey 
FOREIGN KEY (subteam_id) 
REFERENCES subteam(id) 
ON DELETE CASCADE;

-- 3. Update Task Table (When project is deleted, remove all tasks)
ALTER TABLE task 
DROP CONSTRAINT IF EXISTS task_project_id_fkey;

ALTER TABLE task 
ADD CONSTRAINT task_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES project(id) 
ON DELETE CASCADE;