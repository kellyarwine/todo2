# Enterprise Todo App with GitHub Sign-In

This application implements GitHub OAuth authentication to ensure only enterprise staff members can access the application, addressing CELA compliance requirements.

## Features

- **GitHub OAuth Authentication**: Users must sign in with their GitHub enterprise account
- **Staff-Only Access**: Only enterprise organization members can access the application
- **Payment Processing**: Secure payment processing with authentication verification
- **EU Tax Support**: Fixed tax calculation for EU regions (addresses previous bug)
- **Session Management**: Secure token-based session handling

## Security & Compliance

### CELA Compliance Features
1. **Block non-staff from using the bot**: Only enterprise employees can access the application
2. **Staff verification**: Users must be members of the configured GitHub enterprise organization
3. **Authenticated requests**: All API calls require valid GitHub authentication

### User Classification
- **Staff**: Enterprise organization members
- **Non-staff**: Guests, external users, anonymous users (blocked from access)

## Setup Instructions

### 1. GitHub OAuth App Setup
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - Application name: "Enterprise Todo App"
   - Homepage URL: `http://localhost:3000` (or your domain)
   - Authorization callback URL: `http://localhost:3000/auth/callback`
3. Note the Client ID and Client Secret

### 2. Environment Configuration
Create a `.env` file or set environment variables:

```bash
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_ENTERPRISE_ORG=your_enterprise_organization_name
PORT=3000
```

### 3. Installation and Running

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The application will be available at `http://localhost:3000`

## How It Works

### Authentication Flow
1. User visits the application
2. If not authenticated, they see the sign-in screen
3. Clicking "Sign in with GitHub" redirects to GitHub OAuth
4. After authorization, GitHub redirects back with an authorization code
5. The server exchanges the code for an access token
6. The application verifies the user is a member of the enterprise organization
7. If verified, the user gains access to the application

### Payment Processing
1. Only authenticated enterprise users can access the payment form
2. Payment requests include the user's authentication token
3. The server verifies the token and organization membership before processing payments
4. All transactions are logged with the authenticated user information

## Security Considerations

- Client secrets are kept secure on the server side
- OAuth state parameter prevents CSRF attacks
- All API endpoints verify authentication
- Session tokens are stored in sessionStorage (cleared on browser close)
- Organization membership is verified for each critical operation

## Files Structure

- `index.html` - Main application UI with authentication integration
- `auth.js` - Client-side GitHub OAuth authentication handling
- `checkout.js` - Payment processing with authentication checks
- `server.js` - Backend server handling OAuth token exchange and API endpoints
- `package.json` - Node.js dependencies and scripts

## API Endpoints

- `POST /api/auth/token` - Exchange OAuth code for access token
- `POST /api/auth/verify` - Verify user's enterprise membership
- `POST /api/payments` - Process payments (requires authentication)
- `GET /auth/callback` - OAuth callback handler
- `GET /success` - Payment success page

## Bug Fixes Included

- **EU Tax Calculation**: Fixed the issue where cart.total became null for EU users by adding support for EU tax rates and handling undefined rates gracefully
- **Authentication Integration**: All payment processing now requires valid enterprise authentication
- **Error Handling**: Improved error messages and handling throughout the application