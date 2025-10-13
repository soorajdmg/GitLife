# Firebase to MongoDB Migration Guide

This guide explains the migration from Firebase to MongoDB for the GitLife project.

## What Changed

### Backend
- **Before**: Google Firebase (Firestore + Authentication)
- **After**: MongoDB with Express.js REST API

### Architecture
The application now uses a client-server architecture:
- **Frontend**: React app (runs on Vite dev server at `http://localhost:5173`)
- **Backend**: Express.js API server (runs at `http://localhost:5000`)
- **Database**: MongoDB (runs at `mongodb://localhost:27017/gitlife`)

## Setup Instructions

### Prerequisites
1. **MongoDB**: Install MongoDB Community Edition
   - Windows: Download from https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: Follow instructions at https://docs.mongodb.com/manual/installation/

2. **Node.js**: Version 16 or higher

### Installation Steps

#### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

#### 2. Configure Environment Variables

**Frontend (`.env` in root directory):**
```
VITE_API_URL=http://localhost:5000/api
```

**Backend (`server/.env`):**
```
MONGODB_URI=mongodb://localhost:27017/gitlife
PORT=5000
```

#### 3. Start MongoDB

**Windows:**
```bash
# If installed as a service, it should start automatically
# Otherwise, run:
mongod
```

**Mac/Linux:**
```bash
# If installed via brew (Mac):
brew services start mongodb-community

# Or run manually:
mongod --config /usr/local/etc/mongod.conf
```

#### 4. Start the Application

You need to run both the backend server and the frontend:

**Terminal 1 - Backend Server:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## API Endpoints

### Branches
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get a specific branch
- `POST /api/branches` - Create a new branch
- `PUT /api/branches/:id` - Update a branch
- `DELETE /api/branches/:id` - Delete a branch

### Decisions
- `GET /api/decisions` - Get all decisions (supports query params: limit, sortBy, sortOrder)
- `GET /api/decisions/:id` - Get a specific decision
- `GET /api/decisions/branch/:branchName` - Get decisions for a branch
- `POST /api/decisions` - Create a new decision
- `DELETE /api/decisions/:id` - Delete a decision
- `GET /api/decisions/count/total` - Get total decision count

### Stats
- `GET /api/stats` - Get statistics
- `POST /api/stats/increment` - Increment impact score
- `POST /api/stats/reset` - Reset statistics

## Database Structure

### Collections

#### 1. `branches`
```javascript
{
  _id: ObjectId,
  name: String,
  type: String, // 'main', 'what-if', 'alternative'
  commits: Number,
  impact: Number,
  status: String,
  timestamp: String (ISO 8601),
  createdAt: String (ISO 8601),
  updatedAt: String (ISO 8601)
}
```

#### 2. `decisions`
```javascript
{
  _id: ObjectId,
  decision: String,
  branch_name: String,
  mood: String,
  impact: Number,
  type: String, // 'feat', 'fix', 'chore'
  timestamp: String (ISO 8601),
  createdAt: String (ISO 8601)
}
```

#### 3. `stats`
```javascript
{
  _id: ObjectId,
  impacts: Number,
  createdAt: String (ISO 8601),
  updatedAt: String (ISO 8601)
}
```

## Key Differences from Firebase

### Real-time Updates
- **Firebase**: Used `onSnapshot` for real-time updates
- **MongoDB**: Uses polling (every 5-10 seconds) to fetch updates
- To implement true real-time updates, consider using WebSockets or Socket.io

### Authentication
- **Firebase**: Used Firebase Authentication
- **MongoDB**: Currently no authentication implemented
- To add authentication, consider using:
  - Passport.js
  - JWT tokens
  - Express-session

### Data Fetching
- **Firebase**: Direct client-side database access
- **MongoDB**: Client makes HTTP requests to REST API

## Files Changed

### Removed
- `src/config/firebase.js` (replaced by `src/config/api.js`)
- Firebase dependencies from `package.json`

### Added
- `server/` directory with entire backend
- `src/config/api.js` - API client
- `.env` files for configuration

### Modified
- All component files to use the new API client
- `src/config/addBranch.js`
- `src/config/addDecision.js`

## Troubleshooting

### Backend won't start
- Check if MongoDB is running: `mongosh` or `mongo`
- Verify port 5000 is not in use
- Check `server/.env` configuration

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check `.env` file has correct API URL
- Check browser console for CORS errors

### MongoDB connection errors
- Ensure MongoDB service is running
- Check MongoDB URI in `server/.env`
- Verify MongoDB is accessible on localhost:27017

## Production Deployment

For production, you'll need to:

1. **Use MongoDB Atlas** (cloud MongoDB)
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a cluster
   - Update `MONGODB_URI` in production environment

2. **Deploy Backend**
   - Consider using: Heroku, Railway, Render, or AWS
   - Set environment variables in hosting platform

3. **Deploy Frontend**
   - Build: `npm run build`
   - Deploy to: Vercel, Netlify, or AWS S3
   - Update `VITE_API_URL` to point to production backend

4. **Security Considerations**
   - Add authentication/authorization
   - Implement rate limiting
   - Use HTTPS
   - Validate all inputs
   - Add proper error handling

## Future Improvements

1. **Real-time Updates**: Implement WebSockets/Socket.io
2. **Authentication**: Add user authentication system
3. **Caching**: Implement Redis for better performance
4. **Validation**: Add request validation using Joi or Yup
5. **Testing**: Add unit and integration tests
6. **Logging**: Implement proper logging (Winston, Morgan)

## Support

If you encounter any issues during migration, check:
- MongoDB logs
- Backend server console
- Browser console
- Network tab in browser DevTools
