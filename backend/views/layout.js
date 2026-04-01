// This holds the styles for the HTML including a light and dark mode that go by
// what the users system settings are this is here to making changing application looks
export const commonStyles = `
<style>
    :root {
        /* Light Mode: White and Red */
        --bg-body: #f7f9fc;
        --bg-card: #ffffff;
        --bg-sidebar: #ffffff;
        --text-main: #1a1a1a;
        --text-heading: #1a1a1a;
        --text-label: #4a5568;
        --text-muted: #718096;
        --border-color: #e2e8f0;
        --input-bg: #ffffff;
        --btn-secondary-bg: #edf2f7;
        --btn-secondary-text: #4a5568;
        --accent-red: #e53e3e;
        --accent-hover: #c53030;
        
        --badge-approved-bg: #c6f6d5;
        --badge-approved-text: #22543d;
        --badge-pending-bg: #fff5f5;
        --badge-pending-text: #c53030;
        --alert-bg: #fff5f5;
        --alert-text: #c53030;
        --alert-border: #feb2b2;
    }

    @media (prefers-color-scheme: dark) {
        :root {
            /* Dark Mode: Black and Red */
            --bg-body: #000000;
            --bg-card: #121212;
            --bg-sidebar: #121212;
            --text-main: #f7fafc;
            --text-heading: #ffffff;
            --text-label: #a0aec0;
            --text-muted: #718096;
            --border-color: #2d2d2d;
            --input-bg: #1a1a1a;
            --btn-secondary-bg: #2d2d2d;
            --btn-secondary-text: #f7fafc;
            --accent-red: #ff4d4d;
            --accent-hover: #ff6666;

            --badge-approved-bg: #1c4532;
            --badge-approved-text: #9ae6b4;
            --badge-pending-bg: #441919;
            --badge-pending-text: #feb2b2;
            --alert-bg: #822727; /* Deep blood red */
            --alert-text: #ffffff;
            --alert-border: #e53e3e;
        }
    }

    body { font-family: 'Inter', sans-serif; margin: 0; background: var(--bg-body); color: var(--text-main); display: flex; flex-direction: column; min-height: 100vh; transition: 0.3s; }
    .card { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); width: 100%; max-width: 400px; margin: auto; border: 1px solid var(--border-color); }
    h2 { margin-top: 0; color: var(--text-heading); letter-spacing: -0.02em; }
    label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.85rem; color: var(--text-label); text-transform: uppercase; }
    input { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 8px; box-sizing: border-box; background: var(--input-bg); color: var(--text-main); font-size: 1rem; }
    input:focus { outline: none; border-color: var(--accent-red); }
    
    button, input[type="submit"] { width: 100%; padding: 12px; border: none; border-radius: 8px; background: var(--accent-red); color: white; font-weight: 700; cursor: pointer; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.03em; }
    button:hover, input[type="submit"]:hover { background: var(--accent-hover); transform: translateY(-1px); }
    
    .secondary-btn {
    font-family: 'Inter', sans-serif;
    background: var(--btn-secondary-bg) !important;
    color: var(--btn-secondary-text) !important;
    display: inline-block;
    padding: 12px 20px; 
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.2;
    margin-top: 10px;
    text-decoration: none;
    text-align: center;
    cursor: pointer;
    box-sizing: border-box;
    width: 100%;
    border: 1px solid var(--border-color); 
    transition: opacity 0.2s, background 0.2s;
    }
    .secondary-btn:hover { 
    background: var(--border-color) !important; 
    opacity: 0.9;
    filter: brightness(1.1);
    }
    
    /* Sidebar */
    .sidebar { width: 280px; background: var(--bg-sidebar); border-left: 1px solid var(--border-color); padding: 20px; height: 100vh; box-sizing: border-box; }
    .member-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color); position: relative; }
    .dropdown-menu { display: none; position: absolute; right: 0; top: 30px; background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: 0 10px 15px rgba(0,0,0,0.5); z-index: 100; width: 160px; border-radius: 8px; overflow: hidden;}
    .dropdown-menu button { border-radius: 0; border: none; border-bottom: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main); text-align: left; padding: 12px; font-size: 0.85rem; text-transform: none; letter-spacing: normal; }
    .dropdown-menu button:hover { background: var(--accent-red); color: white; }
    .dropdown-menu button, 
    .dropdown-item-link {
    display: block;
    width: 100%;
    padding: 10px 15px;
    text-align: left;
    background: none;
    border: none;
    color: var(--text-main);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 700; 
    font-family: inherit;
    cursor: pointer;
    box-sizing: border-box;}

    .dropdown-menu button:hover, 
    .dropdown-item-link:hover {
    background-color: var(--bg-hover);
    color: var(--text-main); }

    /* Profile UI */
    .info-group { margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
    .info-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
    .info-value { font-size: 1.1rem; color: var(--text-main); font-weight: 500; }
    .badge-approved { background: var(--badge-approved-bg); color: var(--badge-approved-text); padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
    .badge-pending { background: var(--badge-pending-bg); color: var(--badge-pending-text); padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }

    /* Password Toggle Fix */
    .password-wrapper { position: relative; display: flex; align-items: center; margin-bottom: 15px; width: 100%; }
    .password-wrapper input { margin-bottom: 0; padding-right: 60px; }
    .password-toggle-text { position: absolute; right: 15px; font-size: 0.7rem; font-weight: 800; color: var(--accent-red); cursor: pointer; user-select: none; text-transform: uppercase; }
    .password-toggle-text:hover { color: var(--accent-hover); }

    /* Alert Box */
    .alert-box {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 20px;
    text-align: center;
    line-height: 1.4;
    transition: all 0.3s ease;}
    .alert-box {
    background: var(--alert-bg);
    color: var(--alert-text);
    border: 1px solid var(--alert-border);}

    /* Top Profile Menu */
    .top-nav { position: absolute; top: 20px; right: 280px; z-index: 10; }
    .profile-trigger { 
    background: var(--bg-card); 
    border: 1px solid var(--border-color); 
    color: var(--text-main); 
    padding: 8px 15px; 
    border-radius: 8px; 
    cursor: pointer; 
    font-weight: 600; 
    font-size: 0.85rem;}

    /* Subteam Grid */
    .subteam-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
    .subteam-card { 
    background: var(--bg-card); 
    border: 1px solid var(--border-color); 
    padding: 15px; 
    border-radius: 10px; 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-start;
    position: relative;}

    /* Sidebar Request Button */
    .manage-btn { 
    background: #805ad5 !important; 
    font-size: 0.75rem !important; 
    padding: 6px !important; 
    margin-top: 10px; }

    /* Modal Styles */
    .modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1000;
    justify-content: center;
    align-items: center;}

    .modal-content {
    background: var(--bg-card);
    border: 2px solid var(--accent-red);
    padding: 2rem;
    border-radius: 12px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 0 20px rgba(229, 62, 62, 0.2);}

    .modal-btns {
    display: flex;
    gap: 10px;
    margin-top: 20px;}
</style>
`;

/**
 * Wraps page content with common HTML, CSS, and Top Nav.
 * @param {string} title - The page title for the <title> tag.
 * @param {string} content - The inner HTML of the page.
 * @param {Object} req - The request object (to show user name/role in nav).
 */
export const withLayout = (title, content, req) => {
    // Check if user is logged in to show the account menu
    const userMenu =
        req.session && req.session.user_name
            ? `
        <div class="menu-container" style="position: relative;">
            <button class="profile-trigger" onclick="toggleMenu(event, 'top-profile-menu')">
                Account: ${req.session.user_name} ▾
            </button>
            <div id="top-profile-menu" class="dropdown-menu" style="right: 0; width: 180px; top: 35px;">
                <a href="/profile?user_id=${req.session.user_id}" class="menu-link">My Profile</a>
                
                <a href="/notifications" class="menu-link">Notification Hub</a>

                <a href="/settings" class="menu-link">Settings</a>
                
                <form action="/auth/logout" method="POST" style="border-top: 1px solid var(--border-color); margin-top: 5px; padding-top: 5px;">
                    <button type="submit" style="color: var(--accent-red);">Log Out</button>
                </form>
            </div>
        </div>
    `
            : "";

    return `
    <html>
        <head>
            <title>${title} | VLAD</title>
            ${commonStyles}
            <style>
                .top-nav {
                    height: 40px;
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    padding: 0 40px;
                    background: var(--bg-card);
                    border-bottom: 1px solid var(--border-color);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }
                main {
                    min-height: calc(100vh - 40px);
                    width: 100%;
                    display: flex; 
                    flex-direction: column; 
                    justify-content: center; 
                    align-items: center; 
                }
                .profile-trigger {
                    background: none;
                    border: 1px solid var(--border-color);
                    color: var(--text-heading);
                    padding: 4px 12px; 
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    line-height: 1;
                }
                .dropdown-menu {
                    display: none;
                    position: absolute;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    padding: 4px 0;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                /* Added styling for anchor links to match button appearance */
                .menu-link, .dropdown-menu button {
                    width: 100%;
                    text-align: left;
                    background: none;
                    border: none;
                    padding: 8px 15px; 
                    color: var(--text-main);
                    cursor: pointer;
                    display: block;
                    font-size: 0.85rem;
                    text-decoration: none;
                    box-sizing: border-box;
                }
                .menu-link:hover, .dropdown-menu button:hover {
                    background: var(--bg-body);
                }
            </style>
        </head>
        <body>
            <div class="top-nav">
                ${userMenu}
            </div>
            <main>
                ${content}
            </main>

            <script>
                function toggleMenu(event, id) {
                    event.stopPropagation();
                    const menu = document.getElementById(id);
                    const isVisible = menu.style.display === 'block';
                    
                    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
                    
                    if (menu) {
                        menu.style.display = isVisible ? 'none' : 'block';
                    }
                }

                document.addEventListener('click', () => {
                    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
                });
            </script>
        </body>
    </html>
    `;
};

export default commonStyles;
