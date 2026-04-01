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
    </style>

    <div class="settings-wrapper">
        <div class="settings-sidebar">
            <h3 style="margin-top:0; color: var(--text-heading); letter-spacing: 1px;">SETTINGS</h3>
            <nav class="settings-nav">
                <button class="tab-btn active" onclick="switchTab(event, 'profile')">Profile</button>
                <button class="tab-btn" onclick="switchTab(event, 'security')">Security</button>
                <button class="tab-btn" onclick="switchTab(event, 'prefs')">System Preferences</button>
            </nav>
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
                        <button type="button" onclick="location.href='/auth/change-password'" class="vlad-input" style="text-align:left; cursor:pointer;">
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

        form.addEventListener('input', () => {
            const isDirty = getFormState() !== initialState;
            dirtyBar.classList.toggle('hidden', !isDirty);
        });

        form.addEventListener('change', () => {
            const isDirty = getFormState() !== initialState;
            dirtyBar.classList.toggle('hidden', !isDirty);
        });
    </script>
    `;
};
