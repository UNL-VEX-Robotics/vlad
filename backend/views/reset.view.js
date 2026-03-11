/**
 * Renders the Forgot Password Page form content.
 * @param {string} error - Optional error message from URL query.
 */
export const forgotPasswordPage = (error) => {
    const errorMessageHtml = error ? `<div class="alert-box">${error}</div>` : '';

    return `
        <div class="card">
            <form method="POST" action="/reset/send">
                <h2>Reset Password</h2>
                ${errorMessageHtml}
                <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">
                    Enter your email address and we'll send you a recovery link.
                </p>
                <label>Email Address</label>
                <input name="to" type="email" placeholder="email@example.com" required />
                <input type="submit" value="Send Reset Link" />
            </form>

            <a href="/auth/login" class="secondary-btn">Back to Login</a>
        </div>
    `;
};

/**
 * Renders the Sent Email Page form content.
 */
export const emailSentPage = () => {
    return `
        <style>
            .success-icon {
                font-size: 3rem;
                color: #48bb78;
                margin-bottom: 1rem;
            }
            .instruction-box {
                background: #f7fafc;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                text-align: left;
                font-size: 0.9rem;
                color: #4a5568;
                border: 1px solid #e2e8f0;
            }
        </style>

        <div class="card" style="text-align: center;">
            <div class="success-icon">✉️</div>
            <h2>Check Your Email</h2>
            <p style="color: #718096;">We've sent a password reset link to the email address provided.</p>
            
            <div class="instruction-box">
                <strong>Next Steps:</strong>
                <ul style="margin: 10px 0 0 20px; padding: 0;">
                    <li>Click the link in the email to reset your password.</li>
                    <li>Check your <strong>Spam</strong> folder if you don't see it.</li>
                    <li>The link will expire in 1 hour.</li>
                </ul>
            </div>

            <a href="/auth/login" class="secondary-btn">Back to Login</a>
            
            <p style="font-size: 0.8rem; margin-top: 15px; color: #a0aec0;">
                Didn't get the email? <a href="/reset/forgot-password" style="color: #3182ce; text-decoration: none;">Try again</a>
            </p>
        </div>
    `;
};

/**
 * Renders the Reset Password Page form content.
 * @param {string} token - The token passed to the email for reseting passwords
 * @param {string} error - Optional error message from URL query.
 */
export const setNewPasswordPage = (token, error) => {
    const errorMessageHtml = error ? `<div class="alert-box">${error}</div>` : '';

    return `
        <div class="card">
            <form method="POST" action="/reset/reset-password">
                <h2>Set New Password</h2>
                ${errorMessageHtml}
                <input type="hidden" name="token" value="${token || ''}" />
                
                <label>New Password</label>
                <ul style="padding-left: 18px; padding-bottom: 7px; margin: 0; font-size: 0.7rem; color: var(--text-muted);">
                    <li>Minimum 8 characters</li>
                    <li>Include at least one uppercase letter</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character (!@#$)</li>
                </ul>
                <div class="password-wrapper">
                    <input type="password" id="newPass" name="newPassword" placeholder="Min. 8 characters" required />
                    <span class="password-toggle-text" onclick="togglePassword('newPass', this)">Show</span>
                </div>

                <label>Confirm Password</label>
                <div class="password-wrapper">
                    <input type="password" id="confirmPass" name="confirmPassword" placeholder="Repeat password" required />
                    <span class="password-toggle-text" onclick="togglePassword('confirmPass', this)">Show</span>
                </div>

                <input type="submit" value="Update Password" />
            </form>

            <a href="/auth/login" class="secondary-btn" style="margin-top: 15px;">Cancel and Return to Login</a>
        </div>

        <script>
            function togglePassword(inputId, element) {
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
 * Renders the Reset Confirmation Page form content.
 */
export const resetConfirmationPage = () => {
    return `
        <div class="card" style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
            <h2>Password Reset</h2>
            <p style="color: #4a5568; margin-bottom: 20px;">
                Your password has been successfully updated. You can now use your new password to log in.
            </p>
            <form action="/login" method="GET">
                <button type="submit">Log In Now</button>
            </form>
        </div>
    `;
};