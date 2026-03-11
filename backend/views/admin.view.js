/**
 * Renders the Team Request form content.
 * @param {string} error - Optional error message from URL query.
 */
export const teamRequestsPage = (requests) => {
    const requestListHtml = requests.map(r => `
        <div class="request-panel">
            <div class="request-details">
                <div class="info-label">User</div>
                <div class="info-value">${r.user_name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${r.email}</div>
            </div>
            <div class="request-actions">
                <form action="/admin/approve-member" method="POST" style="margin:0;">
                    <input type="hidden" name="user_id" value="${r.id}">
                    <button type="submit" class="action-btn approve">Approve</button>
                </form>
                <form action="/admin/reject-member" method="POST" style="margin:0;">
                    <input type="hidden" name="user_id" value="${r.id}">
                    <button type="submit" class="action-btn reject">Reject</button>
                </form>
            </div>
        </div>
    `).join('') || `
        <div class="request-panel empty-state">
            <p style="margin:0; color:var(--text-muted);">No pending requests at this time.</p>
        </div>`;

    return `
        <style>
            .requests-container {
                max-width: 500px;
                margin: 0 auto;
                min-height: 400px;
            }

            .request-panel {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: var(--shadow-sm);
                animation: fadeIn 0.3s ease-in-out;
            }

            .empty-state {
                justify-content: center;
                border: 1px dashed var(--border-color);
                background: transparent;
                box-shadow: none;
            }

            .request-actions {
                display: flex;
                gap: 8px;
            }

            .action-btn {
                width: auto !important;
                padding: 8px 16px !important;
                font-size: 0.8rem !important;
                cursor: pointer;
                border-radius: 6px;
                border: none;
                font-weight: 600;
                transition: opacity 0.2s;
            }
            
            .action-btn:hover {
                opacity: 0.9;
            }

            .approve { background: #2f855a !important; color: white !important; }
            .reject { background: var(--accent-red) !important; color: white !important; }

            .back-nav {
                max-width: 500px;
                margin: 2rem auto 0.5rem;
                text-align: left;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(5px); }
                to { opacity: 1; transform: translateY(0); }
            }
        </style>

        <div class="back-nav">
            <a href="/dashboard" style="text-decoration:none; color:var(--accent-red); font-weight:700; font-size:0.9rem; display: inline-block;">
                ← BACK TO DASHBOARD
            </a>
        </div>
        
        <h2 style="text-align:center; margin-bottom: 2rem;">Pending Requests</h2>
        
        <div class="requests-container">
            ${requestListHtml}
        </div>
    `;
};