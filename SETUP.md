# GitLife Setup Guide

Quick setup guide to get GitLife running on your machine.

## Step-by-Step Setup

### 1. Install Prerequisites

#### MongoDB
- **Windows**: Download from https://www.mongodb.com/try/download/community
- **Mac**: `brew install mongodb-community`
- **Linux**: Follow instructions at https://docs.mongodb.com/manual/installation/

#### Node.js
- Download from https://nodejs.org/ (LTS version recommended)
- Verify installation: `node --version` (should be v16+)

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/soorajdmg/GitLife
cd GitLife

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Configure Environment Variables

#### Frontend Configuration
Create `.env` file in the root directory:
```bash
# Copy the example file
cp .env.example .env
```

The file should contain:
```
VITE_API_URL=http://localhost:5000/api
```

#### Backend Configuration
Create `server/.env` file:
```bash
# Copy the example file
cp server/.env.example server/.env
```

The file should contain:
```
MONGODB_URI=mongodb://localhost:27017/gitlife
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**IMPORTANT**: For production, change `JWT_SECRET` to a secure random string!

### 4. Start MongoDB

#### On Windows:
MongoDB should start automatically if installed as a service.
To verify:
```bash
# Check if MongoDB is running
mongosh
```

If not running:
```bash
# Start MongoDB manually
mongod
```

#### On Mac:
```bash
# Start MongoDB as a service
brew services start mongodb-community

# Or run manually
mongod --config /usr/local/etc/mongod.conf
```

#### On Linux:
```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod
```

### 5. Run the Application

Open **two separate terminals**:

#### Terminal 1: Backend Server
```bash
cd server
npm start
```

You should see:
```
Connected to MongoDB successfully
Creating database indexes...
Database indexes created successfully
Server is running on http://localhost:5000
```

#### Terminal 2: Frontend Development Server
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 6. Access the Application

1. Open your browser
2. Go to `http://localhost:5173`
3. You'll see the login/register screen
4. Create a new account:
   - Email: your@email.com
   - Username: yourusername
   - Password: minimum 6 characters
5. Start tracking your life decisions!

## Troubleshooting

### MongoDB Won't Start

**Problem**: `mongod` command not found

**Solution**:
- Verify MongoDB is installed: `mongod --version`
- Add MongoDB to your PATH
- On Windows, you may need to use the full path: `"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"`

**Problem**: Connection refused to MongoDB

**Solution**:
- Check if MongoDB is running: `ps aux | grep mongod` (Mac/Linux)
- Check MongoDB logs for errors
- Verify port 27017 is not being used by another application

### Backend Server Won't Start

**Problem**: Port 5000 is already in use

**Solution**:
- Check what's using port 5000: `lsof -i :5000` (Mac/Linux) or `netstat -ano | findstr :5000` (Windows)
- Kill the process or change the PORT in `server/.env`

**Problem**: "Cannot find module" errors

**Solution**:
- Make sure you ran `npm install` in the server directory
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

### Frontend Won't Start

**Problem**: "VITE_API_URL is not defined"

**Solution**:
- Make sure `.env` file exists in the root directory
- Restart the dev server after creating/modifying `.env`

**Problem**: Can't connect to backend

**Solution**:
- Verify backend is running on port 5000
- Check `.env` has the correct API URL
- Open browser console and check for CORS errors

### Authentication Issues

**Problem**: Can't register/login

**Solution**:
- Check backend console for error messages
- Verify MongoDB is running and connected
- Check that JWT_SECRET is set in `server/.env`

**Problem**: Token expired or invalid

**Solution**:
- Clear localStorage: Open browser console and run `localStorage.clear()`
- Login again

### Database Issues

**Problem**: "Database not initialized" error

**Solution**:
- Make sure MongoDB is running
- Check that MONGODB_URI in `server/.env` is correct
- Try connecting manually: `mongosh mongodb://localhost:27017/gitlife`

## Development Tips

### Running with Auto-Reload

For faster development, use nodemon for the backend:

```bash
cd server
npm run dev  # Uses nodemon instead of node
```

### Viewing MongoDB Data

Use MongoDB Compass (GUI tool):
1. Download from https://www.mongodb.com/try/download/compass
2. Connect to `mongodb://localhost:27017`
3. Select `gitlife` database
4. Browse collections: users, branches, decisions, stats

Or use command line:
```bash
mongosh
use gitlife
db.users.find()
db.branches.find()
db.decisions.find()
db.stats.find()
```

### Resetting the Database

To start fresh:

```bash
mongosh
use gitlife
db.dropDatabase()
```

Then restart the backend server to recreate indexes.

### Viewing Logs

Backend logs:
- Watch the terminal where `npm start` is running
- Backend logs all API requests and errors

Frontend logs:
- Open browser Developer Tools (F12)
- Check the Console tab for errors
- Check the Network tab for API requests

## Next Steps

Once everything is running:

1. Create your first account
2. Make a life decision (click "Make Life Choice")
3. Create a "what-if" branch (click "Create What If Branch")
4. Explore your timeline and statistics
5. Invite friends to track their lives too!

## Need Help?

- Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for Firebase migration details
- Check [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for authentication docs
- Open an issue on GitHub
- Contact: soorajmurugaraj@gmail.com

## Production Deployment

For deploying to production, see:
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md#production-deployment)
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md#production-deployment)

Key points:
- Use MongoDB Atlas instead of local MongoDB
- Change JWT_SECRET to a secure random string
- Use environment variables on your hosting platform
- Enable HTTPS
- Consider adding rate limiting and security headers
