# Authentication & Multi-User Support Guide

## Overview

GitLife now supports multiple users with authentication! Each user has their own private data (branches, decisions, and stats) that only they can access.

## Features

- **User Registration**: Create a new account with email, username, and password
- **User Login**: Secure login with JWT tokens
- **Data Isolation**: Each user's data is completely separate and private
- **Persistent Sessions**: Stay logged in across browser sessions
- **Logout**: Secure logout functionality

## How It Works

### Backend (MongoDB + JWT)

1. **User Model** (`server/models/User.js`):
   - Stores user credentials (email, username, hashed password)
   - Passwords are hashed using bcrypt
   - Unique indexes on email and username

2. **Authentication Middleware** (`server/middleware/auth.js`):
   - Verifies JWT tokens on protected routes
   - Extracts user information from token
   - Adds `req.user` to all authenticated requests

3. **Protected Routes**:
   - All branch, decision, and stats routes require authentication
   - Data is automatically filtered by `userId`
   - Users can only access their own data

### Frontend (React Context + LocalStorage)

1. **Auth Context** (`src/contexts/AuthContext.jsx`):
   - Manages authentication state
   - Provides login, register, and logout functions
   - Stores JWT token in localStorage

2. **Auth Component** (`src/components/Auth.jsx`):
   - Beautiful login/register form
   - Handles user authentication
   - Shows before accessing the main app

3. **Protected App**:
   - Main app only shown to authenticated users
   - Logout button in navbar
   - User info displayed in navbar

## Usage

### Starting the Application

1. **Install dependencies** (if not already done):
   ```bash
   # Frontend
   npm install

   # Backend
   cd server
   npm install
   cd ..
   ```

2. **Start MongoDB**:
   ```bash
   mongod
   ```

3. **Start Backend Server**:
   ```bash
   cd server
   npm start
   ```

4. **Start Frontend**:
   ```bash
   npm run dev
   ```

5. **Open the app** at `http://localhost:5173`

### Creating an Account

1. Visit the app URL
2. Click the "Register" tab
3. Enter:
   - Email address
   - Username (3-30 characters, alphanumeric, hyphens, underscores)
   - Password (minimum 6 characters)
   - Confirm password
4. Click "Create Account"

### Logging In

1. Visit the app URL
2. Click the "Login" tab (default)
3. Enter your email and password
4. Click "Login"

### Logging Out

- Click the red logout button (with logout icon) in the navbar

## Security Features

### Password Security
- Passwords hashed with bcrypt (salt rounds: 10)
- Never stored in plain text
- Server-side validation

### Token Security
- JWT tokens with 7-day expiration
- Tokens stored in localStorage (client-side)
- Token verified on every API request
- Tokens include: userId, email, username

### Data Security
- All routes require authentication
- Database queries filtered by userId
- Users cannot access other users' data
- Proper error handling to prevent information leakage

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register
```
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "username": "myusername",
  "password": "mypassword"
}
Response: {
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "myusername"
  }
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "mypassword"
}
Response: {
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "myusername"
  }
}
```

#### Verify Token
```
GET /api/auth/verify
Headers: {
  "Authorization": "Bearer jwt_token_here"
}
Response: {
  "valid": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "myusername"
  }
}
```

#### Get Current User
```
GET /api/auth/me
Headers: {
  "Authorization": "Bearer jwt_token_here"
}
Response: {
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "myusername",
    "createdAt": "2025-01-15T..."
  }
}
```

#### Logout
```
POST /api/auth/logout
Headers: {
  "Authorization": "Bearer jwt_token_here"
}
Response: {
  "message": "Logout successful"
}
```

### Protected Routes

All these routes now require authentication (Authorization header with Bearer token):

- `/api/branches/*` - Branch operations
- `/api/decisions/*` - Decision operations
- `/api/stats/*` - Statistics operations

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  username: String (unique, indexed),
  password: String (hashed),
  createdAt: String (ISO 8601),
  updatedAt: String (ISO 8601),
  lastLogin: String (ISO 8601)
}
```

### Branches Collection (Updated)
```javascript
{
  _id: ObjectId,
  userId: String (indexed), // Links to user
  name: String,
  type: String,
  commits: Number,
  impact: Number,
  status: String,
  timestamp: String,
  createdAt: String,
  updatedAt: String
}
```

### Decisions Collection (Updated)
```javascript
{
  _id: ObjectId,
  userId: String (indexed), // Links to user
  decision: String,
  branch_name: String,
  mood: String,
  impact: Number,
  type: String,
  timestamp: String,
  createdAt: String
}
```

### Stats Collection (Updated)
```javascript
{
  _id: ObjectId,
  userId: String (unique indexed), // Links to user
  impacts: Number,
  createdAt: String,
  updatedAt: String
}
```

## Environment Variables

### Backend (`server/.env`)
```
MONGODB_URI=mongodb://localhost:27017/gitlife
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**IMPORTANT**: Change `JWT_SECRET` to a secure random string in production!

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:5000/api
```

## Troubleshooting

### "Access denied. No token provided"
- Make sure you're logged in
- Check if token exists in localStorage: `localStorage.getItem('token')`
- Token may have expired (7 days), try logging in again

### "Invalid or expired token"
- Token may be corrupted or expired
- Clear localStorage and login again: `localStorage.clear()`

### Cannot register: "Email already registered"
- This email is already in use
- Try logging in instead or use a different email

### Cannot register: "Username already taken"
- This username is already in use
- Choose a different username

### Token not being sent with requests
- Check browser console for errors
- Verify API client is adding Authorization header
- Check that token is in localStorage

## Production Deployment

### Security Checklist

1. **Change JWT_SECRET**:
   - Generate a strong random secret
   - Never commit secrets to git
   - Use environment variables

2. **Use HTTPS**:
   - JWT tokens should only be sent over HTTPS
   - Configure your hosting platform for SSL

3. **Secure MongoDB**:
   - Use MongoDB Atlas or secured MongoDB instance
   - Enable authentication
   - Use strong passwords
   - Whitelist IP addresses

4. **Additional Security (Optional)**:
   - Add rate limiting (express-rate-limit)
   - Add helmet.js for security headers
   - Implement refresh tokens
   - Add email verification
   - Add password reset functionality
   - Add 2FA (two-factor authentication)

### Deployment Steps

1. Deploy backend to Heroku/Railway/Render
2. Deploy frontend to Vercel/Netlify
3. Update environment variables on both platforms
4. Test authentication flow end-to-end

## Future Enhancements

Possible improvements:
- Email verification
- Password reset via email
- Social login (Google, GitHub)
- Two-factor authentication (2FA)
- Remember me functionality
- Session management (view active sessions)
- User profile management
- Avatar upload
- Account deletion
- Export user data

## Support

If you encounter issues:
1. Check MongoDB is running
2. Check backend server console for errors
3. Check browser console for errors
4. Verify environment variables are set correctly
5. Clear localStorage and try again
