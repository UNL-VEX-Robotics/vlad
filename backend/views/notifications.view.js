/**
 * Renders the Notification Page form content.
 * @param {string} notifications - All of the notifications for the specified user
 */
export const notificationsPage = (notifications) => {
    const notifHtml = notifications.length > 0 ? notifications.map(n => `
        <div class="notif-card ${n.is_read ? 'read' : 'unread'}">
            <div class="notif-header">
                <div>
                    <h4 class="notif-title">${n.title}</h4>
                    <span class="notif-timestamp">
                        ${new Date(n.created_at).toLocaleString()}
                    </span>
                </div>
                <form action="/notifications/delete" method="POST" style="margin:0;">
                    <input type="hidden" name="notification_id" value="${n.id}">
                    <button type="submit" class="delete-notif-btn" title="Delete" aria-label="Delete notification">×</button>
                </form>
            </div>
            
            <p class="notif-message">${n.message}</p>
            
            ${!n.is_read ? `
                <form action="/notifications/mark-as-read" method="POST" style="margin-top: 15px;">
                    <input type="hidden" name="notification_id" value="${n.id}">
                    <input type="hidden" name="redirect" value="/notifications">
                    <button type="submit" class="mark-read-btn">
                        Mark as read
                    </button>
                </form>
            ` : ''}
        </div>
    `).join('') : '<p style="text-align:center; color:var(--text-muted); margin-top: 3rem;">No recent notifications.</p>';

    return `
        <style>
            .hub-header { text-align: center; margin-bottom: 30px; }
            .unread { border-left: 4px solid var(--accent-red) !important; }
            .read { opacity: 0.7; }
            
            .notif-card {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                padding: 18px;
                border-radius: 8px;
                margin-bottom: 15px;
                position: relative;
                transition: transform 0.2s;
            }

            .notif-header { display: flex; justify-content: space-between; align-items: flex-start; }
            .notif-title { margin: 0; color: var(--text-heading); font-size: 1.05rem; }
            .notif-timestamp { font-size: 0.75rem; color: var(--text-muted); }
            .notif-message { margin: 12px 0 0 0; font-size: 0.95rem; color: #ffffff; line-height: 1.5; }
            
            .delete-notif-btn { background:none; border:none; color:var(--text-muted); cursor:pointer; font-size: 1.2rem; padding:0 5px; }
            .mark-read-btn { background:none; border:none; color:var(--accent-red); font-size: 0.75rem; font-weight:bold; cursor:pointer; text-transform:uppercase; padding:0; }

            .global-actions { display: flex; justify-content: center; gap: 20px; margin-bottom: 25px; }
            .action-btn-reverted {
                background: none; border: none; color: var(--accent-red);
                font-size: 0.7rem; font-weight: bold; cursor: pointer;
                text-transform: uppercase; letter-spacing: 0.05rem;
            }
            
            .info-banner {
                background: rgba(255, 255, 255, 0.05);
                border: 1px dashed var(--border-color);
                padding: 10px; border-radius: 6px;
                text-align: center; font-size: 0.8rem;
                color: var(--text-muted); margin-bottom: 30px;
            }
        </style>

        <div class="container" style="max-width: 650px; margin: 20px auto; padding: 0 20px;">
            <div class="hub-header">
                <h2 style="color: var(--text-heading); margin-bottom: 10px;">Notification Hub</h2>
                <div class="global-actions">
                    <form action="/notifications/mark-all-as-read" method="POST" style="margin:0;">
                        <button type="submit" class="action-btn-reverted">✓ Mark All Read</button>
                    </form>
                    <form action="/notifications/delete-all" method="POST" style="margin:0;"onsubmit="return confirm('Delete all notifications?')">
                        <button type="submit" class="action-btn-reverted">🗑 Delete All</button>
                    </form>
                </div>
            </div>

            <div class="info-banner">
                Notifications are automatically cleared after 30 days.
            </div>

            <div class="notif-list">
                ${notifHtml}
            </div>

            <div style="margin-top: 40px; text-align: center; border-top: 1px solid var(--border-color); padding-top: 30px;">
                <a href="/dashboard" class="secondary-btn">Back to Dashboard</a>
            </div>
        </div>
    `;
};