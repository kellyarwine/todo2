// server.js - Backend server for GitHub OAuth and API endpoints
// This would typically be deployed as a separate backend service

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'your_github_client_id';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'your_github_client_secret';
const GITHUB_ENTERPRISE_ORG = process.env.GITHUB_ENTERPRISE_ORG || 'your_enterprise_org';

app.use(cors());
app.use(express.json());

// Rate limiting to prevent DoS attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

app.use(generalLimiter);
// Serve only specific files to avoid exposing sensitive information
app.use('/auth.js', express.static(path.join(__dirname, 'auth.js')));
app.use('/checkout.js', express.static(path.join(__dirname, 'checkout.js')));

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// OAuth callback page
app.get('/auth/callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Exchange OAuth code for access token
app.post('/api/auth/token', authLimiter, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    // Return only the access token (keep client secret secure)
    res.json({ access_token: tokenData.access_token });

  } catch (error) {
    console.error('OAuth token exchange error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify user's enterprise membership (server-side verification)
app.post('/api/auth/verify', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user information');
    }

    const user = await userResponse.json();

    // Check organization membership
    const membershipResponse = await fetch(`https://api.github.com/orgs/${GITHUB_ENTERPRISE_ORG}/members/${user.login}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const isStaff = membershipResponse.status === 204;

    res.json({
      user: user,
      isStaff: isStaff,
      organization: GITHUB_ENTERPRISE_ORG
    });

  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Mock payment endpoint (would integrate with real payment processor)
app.post('/api/payments', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('token ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(6);
    const { amount, currency, items, user } = req.body;

    // Verify the user is still authenticated and authorized
    // Use hardcoded localhost URL to prevent request forgery attacks
    const verifyResponse = await fetch('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!verifyResponse.ok) {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }

    const verification = await verifyResponse.json();

    if (!verification.isStaff) {
      return res.status(403).json({ error: 'Access denied: Enterprise staff membership required' });
    }

    // Log the authorized payment attempt
    console.log(`Payment processed for enterprise user: ${verification.user.login}`);
    console.log(`Amount: ${amount} ${currency}`);
    console.log(`Items:`, items);

    // Simulate payment processing
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 15);
    
    // In a real implementation, this would:
    // 1. Process the payment with a payment provider
    // 2. Store the transaction in a database
    // 3. Send confirmation emails
    // 4. Update user's account/licenses

    res.json({
      success: true,
      paymentId: paymentId,
      amount: amount,
      currency: currency,
      user: verification.user.login,
      status: 'completed'
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Success page
app.get('/success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Successful</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   text-align: center; padding: 50px; background: #f6f8fa; }
            .success-container { max-width: 500px; margin: 0 auto; background: white; 
                               padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .success-icon { color: #28a745; font-size: 48px; }
            h1 { color: #24292e; }
            a { color: #0366d6; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="success-container">
            <div class="success-icon">✓</div>
            <h1>Payment Successful!</h1>
            <p>Your payment has been processed successfully.</p>
            <p>Thank you for your purchase!</p>
            <a href="/">← Return to App</a>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure to set the following environment variables:');
  console.log('- GITHUB_CLIENT_ID: Your GitHub OAuth App Client ID');
  console.log('- GITHUB_CLIENT_SECRET: Your GitHub OAuth App Client Secret');
  console.log('- GITHUB_ENTERPRISE_ORG: Your GitHub Enterprise Organization name');
});

module.exports = app;