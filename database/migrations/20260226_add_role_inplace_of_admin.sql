-- 1. Add the role column if you haven't yet
ALTER TABLE user_account ADD COLUMN IF NOT EXISTS role INT DEFAULT 0;

-- 2. SET OWNERS (Role 4)
-- Anyone whose ID is the lead_id for a team
UPDATE user_account 
SET role = 4 
WHERE id IN (SELECT lead_id FROM team);

-- 3. SET MEMBERS (Role 1)
-- Anyone who was approved but isn't an owner
UPDATE user_account 
SET role = 1 
WHERE is_approved = TRUE 
AND role != 4;

-- 4. SET PENDING (Role 0)
-- Anyone not approved stays 0 (already default), but let's be explicit
UPDATE user_account 
SET role = 0 
WHERE is_approved = FALSE 
AND role != 4;

-- 5. CLEAN UP
ALTER TABLE user_account DROP COLUMN is_approved;