/**
 * Generates the HTML for the settings page.
 * @param {*} data - The data to populate the settings page.
 * @returns {string} The HTML for the settings page.
 */
export const settingsPage = (data) => {
    const { user, settings, version } = data;

    return `
    <style>
        .settings-wrapper { display: flex; flex-direction: row; width: 100%; min-height: 80vh; }
        .settings-content { flex: 1; padding: 40px; }
        .settings-sidebar { 
            width: 280px; border-right: 1px solid var(--border-color); 
            padding: 30px 20px; background: var(--bg-card); display: flex; flex-direction: column; 
        }

        /* Back Button Styling */
        .back-nav {
            margin-bottom: 30px;
        }
        .back-link {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 500;
            transition: color 0.2s;
        }
        .back-link:hover {
            color: var(--accent-red);
        }

        .tab-btn { 
            width: 100%; text-align: left; background: none; border: none; padding: 12px; 
            margin-bottom: 5px; cursor: pointer; color: var(--text-muted); border-radius: 6px; 
            transition: all 0.2s; font-size: 0.9rem;
        }
        .tab-btn.active { background: rgba(255, 0, 0, 0.1); color: var(--accent-red); font-weight: bold; }

        .setting-section { display: none; max-width: 650px; }
        .setting-section.active { display: block; }

        .form-group { margin-bottom: 25px; }
        .form-group label { 
            display: block; font-size: 0.7rem; font-weight: bold; color: var(--text-muted); 
            text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05rem;
        }

        /* Vlad Custom Inputs & Dropdowns */
        .vlad-input, .vlad-select {
            width: 100%; background: var(--bg-body); border: 1px solid var(--border-color);
            color: var(--text-main); padding: 12px; border-radius: 6px; font-size: 0.9rem;
            appearance: none;
        }
        .vlad-select {
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em;
        }

        /* Custom "Vlad" Switch */
        .vlad-switch {
            position: relative; display: inline-block; width: 40px; height: 20px;
        }
        .vlad-switch input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
            background-color: #333; transition: .4s; border-radius: 20px;
        }
        .slider:before {
            position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px;
            background-color: white; transition: .4s; border-radius: 50%;
        }
        input:checked + .slider { background-color: var(--accent-red); }
        input:checked + .slider:before { transform: translateX(20px); }

        .toggle-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 18px 0; border-bottom: 1px solid var(--border-color);
        }

        .dirty-bar {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: var(--bg-card); border: 1px solid var(--accent-red);
            padding: 12px 25px; border-radius: 50px; display: flex; align-items: center;
            gap: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 100;
        }
        .hidden { display: none !important; }

        .vlad-btn-accent { background: var(--accent-red); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .vlad-btn-secondary { 
            background: var(--bg-card); color: var(--accent-red); border: 1px solid var(--border-color); 
            padding: 10px 15px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; 
            font-weight: bold; text-transform: uppercase; margin-top: 10px;
        }

        .sidebar-spacer { flex-grow: 1; }
    </style>

    <div class="settings-wrapper">
        <div class="settings-sidebar">
            <div class="back-nav">
                <a href="/dashboard" class="back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back to Dashboard
                </a>
            </div>

            <h3 style="margin-top:0; color: var(--text-heading); letter-spacing: 1px; font-size: 0.75rem; opacity: 0.5;">PREFERENCES</h3>
            <nav class="settings-nav">
                <button class="tab-btn active" onclick="switchTab(event, 'profile')">Profile</button>
                <button class="tab-btn" onclick="switchTab(event, 'security')">Security</button>
                <button class="tab-btn" onclick="switchTab(event, 'prefs')">System Preferences</button>
            </nav>
            
            <div class="sidebar-spacer"></div>

            <div style="font-size: 0.65rem; color: var(--text-muted); font-family: monospace;">
                BUILD // <span style="color: var(--accent-red)">v${version}</span>
            </div>
        </div>

        <div class="settings-content">
            <form id="settingsForm" action="/settings/update" method="POST">
                
                <div id="profile" class="setting-section active">
                    <h2 style="color: var(--text-heading); margin-bottom: 30px;">Profile Information</h2>
                    <div class="form-group">
                        <label>Display Name</label>
                        <input type="text" name="user_name" value="${user.user_name}" class="vlad-input">
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" name="email" value="${user.email}" class="vlad-input" readonly style="cursor: not-allowed; opacity: 0.8;">
                        <button type="button" onclick="location.href='/settings/change-email'" class="vlad-btn-secondary">Request Email Change</button>
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 12px;">Email changes require multi-step verification for security.</p>
                    </div>
                </div>

                <div id="security" class="setting-section">
                    <h2 style="color: var(--text-heading); margin-bottom: 30px;">Security</h2>
                    <div class="form-group">
                        <label>Authentication</label>
                        <button type="button" onclick="location.href='/reset/forgot-password'" class="vlad-input" style="text-align:left; cursor:pointer;">
                            Update Password →
                        </button>
                    </div>
                    <div class="toggle-row">
                        <span style="color: var(--text-main); font-size: 0.9rem;">Two-Factor Authentication (2FA)</span>
                        <label class="vlad-switch">
                            <input type="checkbox" name="two_factor_enabled" ${settings.two_factor_enabled ? "checked" : ""}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <div id="prefs" class="setting-section">
                    <h2 style="color: var(--text-heading); margin-bottom: 30px;">System Preferences</h2>
                    <div class="form-group">
                        <label>Interface Theme</label>
                        <select name="theme" class="vlad-select">
                            <option value="system" ${settings.theme === "system" ? "selected" : ""}>System Default</option>
                            <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Dark Mode</option>
                            <option value="light" ${settings.theme === "light" ? "selected" : ""}>Light Mode</option>
                        </select>
                    </div>
                    <div class="toggle-row">
                        <span style="color: var(--text-main); font-size: 0.9rem;">Email Notifications</span>
                        <label class="vlad-switch">
                            <input type="checkbox" name="email_notifications" ${settings.email_notifications ? "checked" : ""}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="form-group" style="margin-top: 25px;">
                        <label>Digest Frequency</label>
                        <select name="email_digest_mode" class="vlad-select">
                            <option value="instant" ${settings.email_digest_mode === "instant" ? "selected" : ""}>Instant</option>
                            <option value="daily" ${settings.email_digest_mode === "daily" ? "selected" : ""}>Daily Digest</option>
                            <option value="weekly" ${settings.email_digest_mode === "weekly" ? "selected" : ""}>Weekly</option>
                        </select>
                    </div>
                </div>

                <div id="dirtyBar" class="dirty-bar hidden">
                    <span style="color: var(--text-main); font-size: 0.85rem; font-weight: 500;">Unsaved changes detected</span>
                    <div style="display:flex; gap:12px;">
                        <button type="button" onclick="location.reload()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size: 0.85rem;">Discard</button>
                        <button type="submit" class="vlad-btn-accent">Save Changes</button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <script>
        function switchTab(event, tabId) {
            document.querySelectorAll('.setting-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            event.currentTarget.classList.add('active');
        }

        const form = document.getElementById('settingsForm');
        const dirtyBar = document.getElementById('dirtyBar');
        
        const getFormState = () => {
            const formData = new FormData(form);
            const state = [];
            for (let [key, value] of formData.entries()) {
                state.push(key + ":" + value);
            }
            form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                if (!cb.checked) state.push(cb.name + ":false");
            });
            return state.sort().join('|');
        };

        const initialState = getFormState();

        const updateDirtyState = () => {
            const isDirty = getFormState() !== initialState;
            dirtyBar.classList.toggle('hidden', !isDirty);
        };

        form.addEventListener('input', updateDirtyState);
        form.addEventListener('change', updateDirtyState);
    </script>
    `;
};

/**
 * Renders the Request Email Change form content.
 * @param {string} error - Optional error message from URL query.
 */
export const changeEmailPage = (error) => {
    const errorMessageHtml = error ? `<div class="alert-box">${error}</div>` : "";

    return `
        <div class="card">
            <form method="POST" action="/settings/verify-email">
                <h2>Change Email Address</h2>
                ${errorMessageHtml}
                <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">
                    Enter your <strong>new</strong> email address. we'll send a verification link to confirm the change.
                </p>
                
                <label>New Email Address</label>
                <input name="pending_email" type="email" placeholder="new-email@example.com" inputmode="email" required />
                
                <input type="submit" value="Send Verification Link" />
            </form>

            <a href="/settings" class="secondary-btn">Back to Settings</a>
        </div>
    `;
};

/**
 * Renders the Verification Sent Page content.
 */
export const verificationSentPage = () => {
    return `
        <style>
            .success-icon { font-size: 3rem; color: #48bb78; margin-bottom: 1rem; }
            .instruction-box {
                background: #f7fafc; border-radius: 8px; padding: 15px;
                margin: 20px 0; text-align: left; font-size: 0.9rem;
                color: #4a5568; border: 1px solid #e2e8f0;
            }
        </style>

        <div class="card" style="text-align: center;">
            <div class="success-icon">✉️</div>
            <h2>Verify Your New Email</h2>
            <p style="color: #718096;">We've sent a verification link to your new email address.</p>
            
            <div class="instruction-box">
                <strong>Important Security Note:</strong>
                <ul style="margin: 10px 0 0 20px; padding: 0;">
                    <li>A notification was also sent to your <strong>current</strong> email address.</li>
                    <li>Click the link in the <strong>new</strong> email to finalize the change.</li>
                    <li>The verification link will expire in 1 hour.</li>
                </ul>
            </div>

            <a href="/settings" class="secondary-btn">Return to Settings</a>
            
            <p style="font-size: 0.8rem; margin-top: 15px; color: #a0aec0;">
                Didn't get the email? <a href="/settings/change-email" style="color: #3182ce; text-decoration: none;">Try again</a>
            </p>
        </div>
    `;
};

/**
 * Renders the Finalize Email Change form content.
 * @param {string} token - Verification token
 * @param {string} pendingEmail - The email waiting to be confirmed
 * @param {string} error - Optional error message
 */
export const finalizeEmailChangePage = (token, pendingEmail, error) => {
    const errorMessageHtml = error ? `<div class="alert-box">${error}</div>` : "";

    return `
        <div class="card">
            <form method="GET" action="/settings/finalize-email">
                <h2>Finalize Email Change</h2>
                ${errorMessageHtml}
                
                <input type="hidden" name="token" value="${token || ""}" />
                
                <p style="color: #4a5568; font-size: 0.9rem; margin-bottom: 20px;">
                    You are changing your account email to:<br>
                    <strong style="color: var(--accent-red);">${pendingEmail}</strong>
                </p>

                <label>Confirm Your Current Password</label>
                <div class="password-wrapper">
                    <input type="password" name="password" placeholder="Enter password to confirm" required />
                </div>

                <input type="submit" value="Update Email Address" />
            </form>

            <a href="/settings" class="secondary-btn" style="margin-top: 15px;">Cancel and Return to Settings</a>
        </div>
    `;
};

/**
 * Renders the Email Updated Confirmation Page.
 * This page is shown after the user is automatically logged out.
 */
export const emailUpdateSuccessPage = () => {
    return `
        <div class="card" style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
            <h2>Email Updated</h2>
            <p style="color: #4a5568; margin-bottom: 20px;">
                Your email address has been successfully updated. 
                <strong>For your security, you have been logged out.</strong>
            </p>
            <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">
                Please use your new email address to log back in.
            </p>
            <form action="/auth/login" method="GET">
                <button type="submit">Log In with New Email</button>
            </form>
        </div>
    `;
};
