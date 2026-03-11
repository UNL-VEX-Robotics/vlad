import { ROLES } from '../utils/constants.js';

/**
 * Renders the Notifications on the Dashboard form content.
 * @param {string} n - notifications
 */
const renderNotifItem = (n) => `
    <div class="notification-item" style="background: var(--bg-card); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-red); padding: 12px; border-radius: 6px; margin-bottom: 10px; position: relative;">
        <h4 style="margin: 0 0 3px 0; font-size: 0.9rem; color: var(--text-heading);">${n.title}</h4>
        <p style="margin: 0; font-size: 0.85rem; color: var(--text-main); line-height:1.4;">${n.message}</p>
        
        <form action="/notifications/mark-as-read" method="POST" style="margin-top: 8px;">
            <input type="hidden" name="notification_id" value="${n.id}">
            <button type="submit" class="text-link-btn" style="background:none; border:none; color:var(--text-muted); font-size:0.75rem; cursor:pointer; text-decoration:underline; padding:0;">
                Mark as read
            </button>
        </form>
    </div>
`;

/**
 * Renders the Members on the Dashboard form content.
 * @param {string} m - members
 * @param {string} userRole - The members role
 * @param {string} currentUserId - The current users ID
 */
const renderMemberRow = (m, userRole, currentUserId) => {
    const roleLabels = { 1: 'Member', 2: 'Lead', 3: 'Admin', 4: 'Owner' };
    let actionButtons = '';

    // Promote/Demote logic: Keep as POST because it changes database permissions
    if (userRole >= 3 && m.id !== currentUserId) {
        if (m.role < 3) {
            actionButtons += `
                <form action="/admin/change-role" method="POST" style="margin:0;">
                    <input type="hidden" name="user_id" value="${m.id}">
                    <input type="hidden" name="new_role" value="${m.role + 1}">
                    <button type="submit">Promote to ${roleLabels[m.role + 1]}</button>
                </form>`;
        }
        if (m.role > 1 && userRole > m.role) {
            actionButtons += `
                <form action="/admin/change-role" method="POST" style="margin:0;">
                    <input type="hidden" name="user_id" value="${m.id}">
                    <input type="hidden" name="new_role" value="${m.role - 1}">
                    <button type="submit" style="color:var(--accent-red);">Demote to ${roleLabels[m.role - 1]}</button>
                </form>`;
        }
    }

    return `
        <li class="member-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span>${m.user_name} <small style="color:var(--text-muted); font-size:0.7rem;">(${roleLabels[m.role]})</small></span>
            <div class="menu-container">
                <button class="dot-btn" onclick="toggleMenu(event, 'menu-${m.id}')">⋮</button>
                <div id="menu-${m.id}" class="dropdown-menu">
                    <a href="/profile?user_id=${m.id}" class="dropdown-item-link">View Profile</a>
                    
                    ${actionButtons}
                    
                    <form action="/report" method="POST" style="margin:0;">
                        <input type="hidden" name="user_id" value="${m.id}">
                        <button type="submit">Report</button>
                    </form>
                </div>
            </div>
        </li>`;
};

/**
 * Renders the Members on the Dashboard form content.
 * @param {string} data - user, notifications, members, subteams, and error
 */
export const dashboardPage = (data) => {
    const { user, notifications, members, subteams, error } = data;
    const isApproved = user.role > 0;

    return `
    <style>
        .dashboard-wrapper { 
            display: flex; 
            flex-direction: row; 
            width: 100%;
            min-height: 80vh;
        }

        .main-content { 
            flex: 1; 
            padding: 40px; 
        }

        .sidebar { 
            width: 300px; 
            border-left: 1px solid var(--border-color); 
            padding: 30px 20px;
            background: var(--bg-card);
        }

        .dropdown-menu button { width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 0.85rem; cursor: pointer; color: var(--text-main); }
        .dropdown-menu button:hover { background: var(--bg-body); }
        .alert-box { background: var(--accent-red); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        
        @media (max-width: 768px) {
            .dashboard-wrapper { flex-direction: column; }
            .sidebar { width: 100%; border-left: none; border-top: 1px solid var(--border-color); }
        }
    </style>

    <div id="deleteModal" class="modal-overlay">
        <div class="modal-content">
            <h3 style="color: var(--accent-red); margin-top: 0;">Confirm Deletion</h3>
            <p style="color: var(--text-main); font-size: 0.9rem;">
                Are you sure you want to delete subteam <strong id="deleteSubteamName"></strong>?
            </p>
            <div class="modal-btns">
                <button class="secondary-btn" onclick="closeModal()">Cancel</button>
                <form id="deleteForm" action="/subteam/delete-subteam" method="POST" style="margin:0; flex:1;">
                    <input type="hidden" name="id" id="deleteSubteamId">
                    <button type="submit" style="background: var(--accent-red); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%;">Delete</button>
                </form>
            </div>
        </div>
    </div>

    <div class="dashboard-wrapper">
        <div class="main-content">
            ${error ? `<div class="alert-box">${error}</div>` : ''}
            
            ${notifications.length > 0 ? `
                <div class="notifications-container" style="margin-bottom: 40px; max-width: 600px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <label style="font-size:0.7rem; font-weight:bold; color:var(--text-muted); text-transform:uppercase; letter-spacing: 0.05rem;">
                            Notifications (${notifications.length})
                        </label>
                        <form action="/notifications/mark-all-as-read" method="POST" style="margin:0;">
                            <button type="submit" style="background:none; border:none; color:var(--accent-red); font-size:0.7rem; font-weight:bold; cursor:pointer; text-transform:uppercase;">Clear All</button>
                        </form>
                    </div>
                    <div class="notifications-scroll-area" style="max-height: 250px; overflow-y: auto; padding-right: 8px;">
                        ${notifications.map(renderNotifItem).join('')}
                    </div>
                </div>
            ` : ''}

            <h2 style="color: var(--text-heading);">Dashboard</h2>
            
            ${(user.team && !isApproved) ? `<div style="background: var(--badge-pending-bg); border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; color: var(--badge-pending-text); margin-bottom: 20px;">⏳ Waiting for team lead approval...</div>` : ''}

            ${(!user.team) ? `
                <div class="card" style="margin:0; max-width:400px;">
                    <h3>Get Started</h3>
                    <form action="/auth/create-team" method="GET"><button type="submit">Create Team</button></form>
                    <form action="/auth/join-team" method="GET"><button type="submit" class="secondary-btn" style="margin-top:10px;">Join Team</button></form>
                </div>
            ` : `
                <h3 style="color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">Subteams</h3>
                <div class="subteam-grid">
                    ${subteams.map(s => `
                        <div class="subteam-card">
                            <div style="font-weight: 700; color: var(--text-heading);">${s.name}</div>
                            ${user.role > 2 ? `
                                <div class="menu-container">
                                    <button class="dot-btn" onclick="toggleMenu(event, 'sub-${s.id}')">⋮</button>
                                    <div id="sub-${s.id}" class="dropdown-menu">
                                        <form action="/subteam/edit-subteam" method="GET" style="margin:0;"><input type="hidden" name="id" value="${s.id}"><button type="submit">Edit Name</button></form>
                                        <button type="button" onclick="confirmDelete('${s.id}', '${s.name}')" style="color:var(--accent-red);">Delete</button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                    ${user.role > 2 ? `
                        <a href="/subteam/create-subteam" style="text-decoration:none;">
                            <div class="subteam-card" style="border: 2px dashed var(--border-color); justify-content:center; color: var(--accent-red); cursor:pointer;">
                                + Create Subteam
                            </div>
                        </a>
                    ` : ''}
                </div>
            `}
        </div>

        <div class="sidebar">
            <h3 style="margin-top:0; font-size: 1.1rem; color: var(--text-heading); margin-bottom: 5px;">
                ${user.team || 'No Team'}
            </h3>
            
            ${user.role > 2 ? `
                <form action="/admin/team-requests" method="GET">
                    <button type="submit" class="manage-btn">Manage Requests</button>
                </form>
            ` : ''}

            <hr style="margin: 20px 0; border: 0; border-top: 1px solid var(--border-color);">
            
            <label style="font-size: 0.75rem; font-weight: bold; color: var(--text-muted);">MEMBERS</label>
            <ul style="list-style:none; padding:0; margin-top: 10px;">
                ${members.length > 0 ? members.map(m => renderMemberRow(m, user.role, user.user_id)).join('') : '<li style="color: var(--text-muted); font-size:0.9rem;">No members visible</li>'}
            </ul>
        </div>
    </div> <script>
        function toggleMenu(event, id) {
            event.stopPropagation();
            const menu = document.getElementById(id);
            const isVisible = menu.style.display === 'block';
            document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
            menu.style.display = isVisible ? 'none' : 'block';
        }

        function confirmDelete(id, name) {
            document.getElementById('deleteSubteamId').value = id;
            document.getElementById('deleteSubteamName').innerText = name;
            document.getElementById('deleteModal').style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('deleteModal').style.display = 'none';
        }

        document.addEventListener('click', () => { 
            document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none'); 
        });
    </script>
    `;
};

/**
 * Renders the Members on the Dashboard form content.
 * @param {string} user - users page
 * @param {string} sessionUser - The users whos session it is
 * @param {string} error - the error string
 * @param {string} ROLES - the constant ROLES
 */
export const profilePage = (user, sessionUser, error, ROLES) => {
    const roleMap = {
        [ROLES.PENDING]: { label: 'Pending Approval', class: 'badge-pending' },
        [ROLES.MEMBER]: { label: 'Member', class: 'badge-member' },
        [ROLES.LEAD]: { label: 'Lead', class: 'badge-lead' },
        [ROLES.ADMIN]: { label: 'Admin', class: 'badge-admin' },
        [ROLES.OWNER]: { label: 'Owner', class: 'badge-owner' }
    };

    const currentRole = roleMap[user.role] || { label: 'Unknown', class: 'badge-pending' };
    const errorMessageHtml = error ? `<div class="alert-box">${error}</div>` : '';

    // Logic for Management Dropdown
    let manageDropdownHtml = '';
    if (sessionUser.role === ROLES.OWNER && user.id !== sessionUser.id) {
        let actions = '';

        if (user.role < ROLES.ADMIN) {
            const nextRoleData = roleMap[user.role + 1];
            actions += `
                <form action="/admin/change-role" method="POST" style="margin:0;">
                    <input type="hidden" name="user_id" value="${user.id}">
                    <input type="hidden" name="new_role" value="${user.role + 1}">
                    <button type="submit">Promote to ${nextRoleData.label}</button>
                </form>`;
        }

        if (user.role > ROLES.MEMBER) {
            const prevRoleData = roleMap[user.role - 1];
            actions += `
                <form action="/admin/change-role" method="POST" style="margin:0;">
                    <input type="hidden" name="user_id" value="${user.id}">
                    <input type="hidden" name="new_role" value="${user.role - 1}">
                    <button type="submit" style="color:var(--accent-red);">Demote to ${prevRoleData.label}</button>
                </form>`;
        }

        actions += `
            <button type="button" onclick="openTransferModal()" style="color:var(--accent-red); font-weight:bold; border-top:1px solid var(--border-color); margin-top:5px; padding-top:10px;">Transfer Ownership</button>
            <button type="button" onclick="openRemoveModal()" style="color:var(--accent-red);">Remove from Team</button>`;

        manageDropdownHtml = `
            <div class="menu-container" style="flex: 1; position: relative;">
                <button type="button" class="manage-btn" style="width:100%;" onclick="toggleMenu(event, 'manage-menu')">Manage User ▾</button>
                <div id="manage-menu" class="dropdown-menu" style="top: 100%; right: 0; width: 100%; min-width: 200px; z-index: 1000; display: none; box-shadow: var(--shadow-lg);">
                    ${actions}
                </div>
            </div>`;
    }

    return `
        <style>
            .profile-header { text-align: center; margin-bottom: 2rem; }
            .avatar-circle { 
                width: 80px; height: 80px; background: var(--accent-red); color: white; 
                border-radius: 50%; display: flex; align-items: center; 
                justify-content: center; font-size: 2rem; margin: 0 auto 1rem;
                text-transform: uppercase; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
            .badge { display: inline-block; padding: 6px 16px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            .badge-owner { background: var(--accent-red); color: white; }
            .badge-admin { background: #805ad5; color: white; }
            .badge-lead { background: #3182ce; color: white; }
            .badge-member { background: #38a169; color: white; }
            .badge-pending { background: #718096; color: white; }
            .info-group { margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
            .info-label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 4px; }
            .info-value { font-size: 1.1rem; color: var(--text-heading); }
            .dropdown-menu { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; position: absolute; }
            .dropdown-menu button { width: 100%; text-align: left; background: none; border: none; padding: 10px 12px; font-size: 0.85rem; cursor: pointer; color: var(--text-main); border-radius: 4px; }
            .dropdown-menu button:hover { background: var(--bg-body); }
        </style>

        ${errorMessageHtml}
        
        <div id="removeModal" class="modal-overlay" style="display:none;">
            <div class="modal-content">
                <h3 style="color: var(--accent-red); margin-top: 0;">Remove ${user.user_name}</h3>
                <form action="/admin/remove-member" method="POST">
                    <input type="hidden" name="user_id" value="${user.id}">
                    <textarea name="reason" placeholder="Reason for removal..." required style="width:100%; min-height:100px; padding:10px; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-body); color:var(--text-main); margin-bottom:15px; resize: none;"></textarea>
                    <div class="modal-btns">
                        <button type="button" class="secondary-btn" onclick="closeModal('removeModal')">Cancel</button>
                        <button type="submit" style="background: var(--accent-red);">Confirm Removal</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="transferModal" class="modal-overlay" style="display:none;">
            <div class="modal-content">
                <h3 style="color: var(--accent-red); margin-top: 0;">Transfer Ownership</h3>
                <p>Are you sure you want to transfer ownership to <strong>${user.user_name}</strong>?</p>
                <form action="/admin/change-role" method="POST">
                    <input type="hidden" name="user_id" value="${user.id}">
                    <input type="hidden" name="new_role" value="${ROLES.OWNER}">
                    <div class="modal-btns">
                        <button type="button" class="secondary-btn" onclick="closeModal('transferModal')">Cancel</button>
                        <button type="submit" style="background: var(--accent-red);">Confirm Transfer</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="card" style="max-width: 450px; margin: 50px auto;">
            <div class="profile-header">
                <div class="avatar-circle">${user.user_name.charAt(0)}</div>
                <h2 style="color: var(--text-heading); margin-bottom: 8px;">${user.user_name}</h2>
                <span class="badge ${currentRole.class}">${currentRole.label}</span>
            </div>

            <div class="info-group">
                <div class="info-label">Email Address</div>
                <div class="info-value">${user.email}</div>
            </div>

            <div class="info-group">
                <div class="info-label">Current Team</div>
                <div class="info-value">${user.team_name || 'No Team Assigned'}</div>
            </div>

            <div style="margin-top: 2rem; display: flex; gap: 10px; position: relative;">
                <a href="/dashboard" style="text-decoration: none; flex: 1;">
                    <button type="button" class="secondary-btn" style="width: 100%;">Back to Dashboard</button>
                </a>
                ${manageDropdownHtml}
            </div>
        </div>

        <script>
            function toggleMenu(event, id) {
                event.stopPropagation();
                const menu = document.getElementById(id);
                const isVisible = menu.style.display === 'block';
                document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
                menu.style.display = isVisible ? 'none' : 'block';
            }
            function openRemoveModal() { document.getElementById('removeModal').style.display = 'flex'; }
            function openTransferModal() { document.getElementById('transferModal').style.display = 'flex'; }
            function closeModal(id) { document.getElementById(id).style.display = 'none'; }
            document.addEventListener('click', () => { 
                document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none'); 
            });
        </script>
    `;
};
