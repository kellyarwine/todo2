// signin.js - User authentication and session management

class SigninManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check if user is already signed in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Validate the structure of the parsed data
        if (parsed && typeof parsed === 'object' && parsed.id && parsed.email) {
          this.currentUser = parsed;
        } else {
          // Invalid data structure, clear it
          localStorage.removeItem('currentUser');
        }
      } catch (error) {
        // Invalid JSON, clear it
        console.error('Invalid user data in localStorage:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  validateEmail(email) {
    // RFC 5322 compliant email validation pattern
    // Matches most valid email addresses while preventing common malformed inputs
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  validatePassword(password) {
    // Password must be at least 8 characters
    return password && password.length >= 8;
  }

  async signin(email, password) {
    // Validate inputs
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters');
    }

    try {
      // API call to authenticate user
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signin failed');
      }

      const userData = await response.json();
      
      // Store user data
      this.currentUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        token: userData.token
      };

      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      
      return this.currentUser;
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  }

  getRedirectUrl() {
    // Check for return URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    
    // Validate return URL to prevent open redirect attacks
    if (returnUrl) {
      try {
        // Try to construct URL - this validates the format
        const url = new URL(returnUrl, window.location.origin);
        
        // Only allow same-origin URLs
        if (url.origin === window.location.origin) {
          // Return just the path, search, and hash (no origin)
          return url.pathname + url.search + url.hash;
        }
      } catch (e) {
        // Invalid URL format, fall through to default
        console.warn('Invalid return URL:', returnUrl);
      }
    }
    
    // Default to home page
    return '/';
  }

  async signup(email, password, name) {
    // Validate inputs
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    try {
      // API call to create new user
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const userData = await response.json();
      
      // Store user data
      this.currentUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        token: userData.token
      };

      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      
      return this.currentUser;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  signout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  isSignedIn() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getAuthToken() {
    return this.currentUser ? this.currentUser.token : null;
  }
}

// Create global instance
window.signinManager = new SigninManager();

// Form handling if elements exist
document.addEventListener('DOMContentLoaded', () => {
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');
  const errorDisplay = document.getElementById('error-message');
  const signupToggle = document.getElementById('signup-toggle');
  const signinToggle = document.getElementById('signin-toggle');

  function showError(message) {
    if (errorDisplay) {
      errorDisplay.textContent = message;
      errorDisplay.style.display = 'block';
    }
  }

  function clearError() {
    if (errorDisplay) {
      errorDisplay.textContent = '';
      errorDisplay.style.display = 'none';
    }
  }

  // Handle signin form submission
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      const email = document.getElementById('signin-email').value;
      const password = document.getElementById('signin-password').value;

      try {
        await window.signinManager.signin(email, password);
        // Redirect to return URL or home page
        window.location.href = window.signinManager.getRedirectUrl();
      } catch (error) {
        showError(error.message);
      }
    });
  }

  // Handle signup form submission
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

      if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
      }

      try {
        await window.signinManager.signup(email, password, name);
        // Redirect to return URL or home page
        window.location.href = window.signinManager.getRedirectUrl();
      } catch (error) {
        showError(error.message);
      }
    });
  }

  // Toggle between signin and signup forms
  if (signupToggle) {
    signupToggle.addEventListener('click', (e) => {
      e.preventDefault();
      clearError();
      if (signinForm) signinForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'block';
    });
  }

  if (signinToggle) {
    signinToggle.addEventListener('click', (e) => {
      e.preventDefault();
      clearError();
      if (signupForm) signupForm.style.display = 'none';
      if (signinForm) signinForm.style.display = 'block';
    });
  }
});
