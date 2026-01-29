// ==================== GOOGLE AUTHENTICATION ====================

class GoogleAuth {
    constructor() {
        this.user = null;
        this.accessToken = null;
        this.isInitialized = false;
    }

    // Initialize Google Sign-In
    async init(clientId) {
        return new Promise((resolve, reject) => {
            // Load Google Identity Services library
            google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => this.handleCredentialResponse(response),
                auto_select: false,
                cancel_on_tap_outside: true
            });

            this.isInitialized = true;
            resolve();
        });
    }

    // Handle credential response from Google
    handleCredentialResponse(response) {
        // Decode JWT token
        const payload = this.parseJwt(response.credential);

        this.user = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
        };

        this.accessToken = response.credential;

        // Save to localStorage
        localStorage.setItem('googleUser', JSON.stringify(this.user));
        localStorage.setItem('googleToken', this.accessToken);

        // Trigger login event
        window.dispatchEvent(new CustomEvent('google-login', { detail: this.user }));
    }

    // Render Sign-In button
    renderButton(elementId) {
        google.accounts.id.renderButton(
            document.getElementById(elementId),
            {
                theme: 'filled_blue',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                width: 280
            }
        );
    }

    // Check if user is already logged in
    checkStoredSession() {
        const storedUser = localStorage.getItem('googleUser');
        const storedToken = localStorage.getItem('googleToken');

        if (storedUser && storedToken) {
            this.user = JSON.parse(storedUser);
            this.accessToken = storedToken;
            return true;
        }
        return false;
    }

    // Sign out
    signOut() {
        google.accounts.id.disableAutoSelect();
        this.user = null;
        this.accessToken = null;
        localStorage.removeItem('googleUser');
        localStorage.removeItem('googleToken');

        // Trigger logout event
        window.dispatchEvent(new Event('google-logout'));
    }

    // Get current user
    getUser() {
        return this.user;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.user !== null && this.accessToken !== null;
    }

    // Parse JWT token
    parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    }

    // Request access token for Google APIs (Sheets)
    async requestAccessToken() {
        const client = google.accounts.oauth2.initTokenClient({
            client_id: window.GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            callback: (response) => {
                if (response.access_token) {
                    this.apiAccessToken = response.access_token;
                    window.dispatchEvent(new CustomEvent('google-api-token', { detail: response.access_token }));
                }
            },
        });

        client.requestAccessToken();
    }

    // Get API access token
    getApiAccessToken() {
        return this.apiAccessToken;
    }
}

// Export singleton instance
const googleAuth = new GoogleAuth();
