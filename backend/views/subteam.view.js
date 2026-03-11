/**
 * Renders the Subteam Creation Page form content.
 * @param {string} primaryTeam - The team that the subteam will be created under.
 * @param {string} error - Optional error message from URL query.
 */
export const createSubteamPage = (primaryTeam, error) => {
    const errorMessageHtml = error ? `
        <div class="alert-box" style="margin-bottom: 20px;">
            ${error}
        </div>` : '';

    return `
        <div class="card" style="max-width: 500px; margin: 40px auto;">
            <form action="/subteam/create-subteam" method="POST">
                <h2 style="border-bottom: 2px solid var(--accent-red); padding-bottom: 10px; margin-bottom: 20px;">
                    Initialize Subteam
                </h2>
                
                ${errorMessageHtml}

                <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 25px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">
                    Primary Team: <span style="color: var(--text-main);">${primaryTeam}</span>
                </p>

                <label>Subteam Designation</label>
                <input type="text" name="subteamName" placeholder="Enter subteam name..." required autofocus />

                <div style="margin-top: 25px;">
                    <button type="submit">Deploy Subteam</button>
                    
                    <a href="/dashboard" class="secondary-btn" style="margin-top: 10px;">Return to Dashboard</a>
                </div>
            </form>
        </div>
    `;
};