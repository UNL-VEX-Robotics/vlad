CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new UUID columns to EVERY table that references a user
ALTER TABLE user_account ADD COLUMN new_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE team ADD COLUMN new_lead_id UUID;
ALTER TABLE subteam ADD COLUMN new_lead_id UUID;
ALTER TABLE user_subteam ADD COLUMN new_user_id UUID;
ALTER TABLE project ADD COLUMN new_lead_id UUID;
ALTER TABLE task_assignee ADD COLUMN new_user_id UUID;
ALTER TABLE notifications ADD COLUMN new_user_id UUID;

-- Map the new IDs
UPDATE team t SET new_lead_id = u.new_id FROM user_account u WHERE t.lead_id = u.id;
UPDATE subteam s SET new_lead_id = u.new_id FROM user_account u WHERE s.lead_id = u.id;
UPDATE user_subteam us SET new_user_id = u.new_id FROM user_account u WHERE us.user_id = u.id;
UPDATE project p SET new_lead_id = u.new_id FROM user_account u WHERE p.lead_id = u.id;
UPDATE task_assignee ta SET new_user_id = u.new_id FROM user_account u WHERE ta.user_id = u.id;
UPDATE notifications n SET new_user_id = u.new_id FROM user_account u WHERE n.user_id = u.id;

-- Remove old ids
ALTER TABLE team DROP COLUMN lead_id;
ALTER TABLE subteam DROP COLUMN lead_id;
ALTER TABLE user_subteam DROP CONSTRAINT user_subteam_pkey;
ALTER TABLE user_subteam DROP COLUMN user_id;
ALTER TABLE project DROP COLUMN lead_id;
ALTER TABLE task_assignee DROP CONSTRAINT task_assignee_pkey;
ALTER TABLE task_assignee DROP COLUMN user_id;
ALTER TABLE notifications DROP COLUMN user_id;
ALTER TABLE user_account DROP CONSTRAINT user_account_pkey CASCADE;

-- Promote user_account to UUID Primary Key
ALTER TABLE user_account DROP COLUMN id;
ALTER TABLE user_account RENAME COLUMN new_id TO id;
ALTER TABLE user_account ADD PRIMARY KEY (id);

-- Rename all referencing columns back to their original names
ALTER TABLE team RENAME COLUMN new_lead_id TO lead_id;
ALTER TABLE subteam RENAME COLUMN new_lead_id TO lead_id;
ALTER TABLE user_subteam RENAME COLUMN new_user_id TO user_id;
ALTER TABLE project RENAME COLUMN new_lead_id TO lead_id;
ALTER TABLE task_assignee RENAME COLUMN new_user_id TO user_id;
ALTER TABLE notifications RENAME COLUMN new_user_id TO user_id;

-- Re-apply Foreign Keys
ALTER TABLE team ADD CONSTRAINT team_lead_fkey FOREIGN KEY (lead_id) REFERENCES user_account(id);
ALTER TABLE subteam ADD CONSTRAINT subteam_lead_fkey FOREIGN KEY (lead_id) REFERENCES user_account(id);
ALTER TABLE user_subteam ADD PRIMARY KEY (user_id, subteam_id);
ALTER TABLE project ADD CONSTRAINT project_lead_fkey FOREIGN KEY (lead_id) REFERENCES user_account(id);
ALTER TABLE task_assignee ADD PRIMARY KEY (task_id, user_id);
ALTER TABLE notifications ADD CONSTRAINT notifications_user_fkey FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE;

CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES user_account(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
    email_notifications BOOLEAN DEFAULT TRUE,
    email_digest_mode VARCHAR(20) DEFAULT 'instant', -- 'instant', 'daily', 'weekly'
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO user_settings (user_id)
SELECT id FROM user_account
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_settings
AFTER INSERT ON user_account
FOR EACH ROW
EXECUTE FUNCTION create_user_settings();

ALTER TABLE user_account 
ADD COLUMN pending_email TEXT,
ADD COLUMN email_verification_token TEXT,
ADD COLUMN email_token_expiry TIMESTAMP;