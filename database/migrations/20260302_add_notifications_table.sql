-- Migration to add notifications table for user notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_account(id) ON DELETE CASCADE,
    title VARCHAR(100),
    message TEXT,
    type VARCHAR(20) DEFAULT 'info', -- e.g., 'removal', 'promotion', 'alert'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);