/**
 * Renders the Signup form content.
 * @param {string} error - Optional error message from URL query.
 */
export const signupPage = (error) => {
    const errorMessageHtml = error ? `<div class="alert-box">${error}</div>` : '';

    return `
        <div class="card">
            <form method="POST" action="/auth/signup">
                <h2>Sign Up</h2>
                ${errorMessageHtml}
                
                <label>Username</label>
                <input name="user_name" placeholder="Username" required />
                
                <label>Email</label>
                <input name="email" type="email" placeholder="Email" required />
                
                <label>Password</label>
                <ul style="padding-left: 18px; padding-bottom: 7px; margin: 0; font-size: 0.7rem;">
                    <li>Minimum 8 characters</li>
                    <li>Include at least one uppercase letter</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character (!@#$)</li>
                </ul>
                
                <div class="password-wrapper">
                    <input type="password" id='pass' name="password" placeholder="Password" required />
                    <span class="password-toggle-text" onclick="toggle('pass', this)">Show</span>
                </div>
                
                <label>Confirm Password</label>
                <div class="password-wrapper">
                    <input type="password" id='confirmPass' name="confirmPassword" placeholder="Confirm Password" required />
                    <span class="password-toggle-text" onclick="toggle('confirmPass', this)">Show</span>
                </div>
                
                <input type="submit" value="Create Account" />
            </form>
            <form method="GET" action="/login">
                <button type="submit" class="secondary-btn">Already have an account? Login</button>
            </form>
        </div>

        <script>
            function toggle(inputId, element) {
                const input = document.getElementById(inputId);
                if (input.type === "password") {
                    input.type = "text";
                    element.textContent = "Hide";
                } else {
                    input.type = "password";
                    element.textContent = "Show";
                }
            }
        </script>
    `;
};

/**
 * Renders the Login form content.
 * @param {string} error - Optional error message from URL query.
 */
export const loginPage = (error) => {
    const errorMessageHtml = error ? `<div class="alert-box">${error}</div>` : '';

    return `
        <div class="card">
            <form method="POST" action="/auth/login">
                <h2>Log In</h2>
                ${errorMessageHtml}
                
                <label>Email</label>
                <input name="email" placeholder="Email" required />
                
                <label>Password</label>
                <div class="password-wrapper">
                    <input type="password" id="pass" name="password" placeholder="Password" required />
                    <span class="password-toggle-text" onclick="toggle('pass', this)">Show</span>
                </div>

                <input type="submit" value="Login" />
            </form>
            
            <div style="margin-top: 10px;">
                <form action="/reset/forgot-password" method="GET">
                    <button type="submit" class="secondary-btn">Forgot Password?</button>
                </form>
                <form action="/signup" method="GET">
                    <button type="submit" class="secondary-btn">New here? Signup</button>
                </form>
            </div>
        </div>

        <script>
            function toggle(inputId, element) {
                const input = document.getElementById(inputId);
                if (input.type === "password") {
                    input.type = "text";
                    element.textContent = "Hide";
                } else {
                    input.type = "password";
                    element.textContent = "Show";
                }
            }
        </script>
    `;
};

/**
 * Renders the Team Creation form content.
 * @param {string} error - Optional error message from URL query.
 */
export const createTeamPage = (error) => {
    const errorMessageHtml = error ? `<div class="alert-box">${error}</div>` : '';

    return `
        <div class="card">
            <form method="POST" action="/auth/create-team">
                <h2>Create A New Team</h2>
                ${errorMessageHtml}
                <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">
                    As the creator, you will be the team lead and manage join requests.
                </p>
                <label>Team Name</label>
                <input name="team_name" placeholder="e.g. Alpha Squad" required />
                <input type="submit" value="Establish Team" />
            </form>
            <form action="/dashboard" method="GET">
                <button type="submit" class="secondary-btn">Cancel</button>
            </form>
        </div>
    `;
};

/**
 * Renders the Join Team request form content.
 * @param {string} error - Optional error message from URL query.
 */
export const joinTeamPage = (error) => {
    const errorMessageHtml = error ? `<div class="alert-box">${error}</div>` : '';

    return `
        <div class="card">
            <form method="POST" action="/auth/join-team">
                <h2>Join Team</h2>
                ${errorMessageHtml}
                <label>Search Team Name</label>
                <input name="team_name" placeholder="Enter exact team name" required />
                <input type="submit" value="Send Join Request" />
            </form>
            <p style="font-size: 0.8rem; color: #a0aec0; text-align: center; margin-top: 15px;">
                Note: You will need to be accepted by the team lead.
            </p>
            <form action="/dashboard" method="GET">
                <button type="submit" class="secondary-btn">Back</button>
            </form>
        </div>
    `;
};