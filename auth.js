// auth.js - GitHub OAuth authentication for staff access control
// Implements CELA compliance requirements for enterprise-only access

class GitHubAuth {
  constructor() {
    // Use window properties or defaults for browser environment
    this.clientId = window.GITHUB_CLIENT_ID || 'your_github_client_id';
    this.redirectUri = window.GITHUB_REDIRECT_URI || window.location.origin + '/auth/callback';
    this.enterpriseOrg = window.GITHUB_ENTERPRISE_ORG || 'your_enterprise_org';
    this.currentUser = null;
  }

  // Initiate GitHub OAuth flow
  signIn() {
    const scope = 'read:user read:org';
    const state = this.generateState();
    sessionStorage.setItem('github_oauth_state', state);
    
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;
    
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = sessionStorage.getItem('github_oauth_state');

    if (!code || !state || state !== storedState) {
      throw new Error('Invalid OAuth callback parameters');
    }

    sessionStorage.removeItem('github_oauth_state');

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const { access_token } = await tokenResponse.json();
      
      // Get user info and verify enterprise membership
      const user = await this.getUserInfo(access_token);
      const isStaff = await this.verifyStaffMembership(access_token, user.login);

      if (!isStaff) {
        throw new Error('Access denied: Only enterprise staff members can access this application');
      }

      // Store authentication info
      sessionStorage.setItem('github_token', access_token);
      sessionStorage.setItem('github_user', JSON.stringify(user));
      this.currentUser = user;

      return user;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  // Get user information from GitHub API
  async getUserInfo(token) {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user information');
    }

    return await response.json();
  }

  // Verify user is a member of the enterprise organization
  async verifyStaffMembership(token, username) {
    try {
      const response = await fetch(`https://api.github.com/orgs/${this.enterpriseOrg}/members/${username}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      // GitHub returns 204 for public members, 404 for non-members or private membership
      // For enterprise compliance, we need to be more strict
      if (response.status === 204) {
        return true;
      }

      // For private memberships, check if user can access org repos
      const orgsResponse = await fetch(`https://api.github.com/user/orgs`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (orgsResponse.ok) {
        const orgs = await orgsResponse.json();
        return orgs.some(org => org.login === this.enterpriseOrg);
      }

      return false;
    } catch (error) {
      console.error('Error verifying staff membership:', error);
      return false;
    }
  }

  // Check if user is currently authenticated and is staff
  isAuthenticated() {
    const token = sessionStorage.getItem('github_token');
    const user = sessionStorage.getItem('github_user');
    
    if (token && user) {
      this.currentUser = JSON.parse(user);
      return true;
    }
    
    return false;
  }

  // Get current authenticated user
  getCurrentUser() {
    if (!this.currentUser && this.isAuthenticated()) {
      this.currentUser = JSON.parse(sessionStorage.getItem('github_user'));
    }
    return this.currentUser;
  }

  // Sign out
  signOut() {
    sessionStorage.removeItem('github_token');
    sessionStorage.removeItem('github_user');
    sessionStorage.removeItem('github_oauth_state');
    this.currentUser = null;
    window.location.href = '/';
  }

  // Generate random state for CSRF protection
  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Get authorization header for API requests
  getAuthHeader() {
    const token = sessionStorage.getItem('github_token');
    return token ? `token ${token}` : null;
  }
}

// Initialize global auth instance
window.githubAuth = new GitHubAuth();

// Auto-handle OAuth callback if on callback page
if (window.location.pathname === '/auth/callback') {
  window.githubAuth.handleCallback()
    .then(() => {
      window.location.href = '/';
    })
    .catch(error => {
      alert('Authentication failed: ' + error.message);
      window.location.href = '/';
    });
}