# How to Start GitLife

## Quick Start Guide

### Prerequisites Check
Before starting, make sure:
1. ✅ MongoDB is installed and running
2. ✅ Node.js is installed (v16+)
3. ✅ Dependencies are installed

### Step 1: Install Dependencies (First Time Only)

Run these commands once:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 2: Start MongoDB

**MongoDB is already running on your system!** ✅

If you need to start it manually:
- **Windows**: MongoDB should be running as a service
- **Mac**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`

### Step 3: Start Backend Server

Open a terminal and run:

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

**Keep this terminal open!** Don't close it.

### Step 4: Start Frontend

Open a **NEW terminal** (separate from backend) and run:

```bash
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 5: Open the App

1. Open your browser
2. Go to `http://localhost:5173`
3. You should see the login/register screen
4. Create an account and start using GitLife!

## Troubleshooting

### Error: "Unexpected token '<', '<!DOCTYPE'... is not valid JSON"

**This means the backend server is not running!**

Solution:
1. Check if the backend terminal is running
2. Make sure you see "Server is running on http://localhost:5000"
3. If not, run `cd server && npm start`
4. Refresh your browser

### Error: "Failed to fetch" or "Network request failed"

**The backend server isn't running or can't be reached.**

Solution:
1. Start the backend server: `cd server && npm start`
2. Check that it's running on port 5000
3. Verify your `.env` file has: `VITE_API_URL=http://localhost:5000/api`

### Error: "MongoDB connection error"

**MongoDB isn't running.**

Solution:
1. Start MongoDB:
   - Windows: Check Task Manager for "mongod" service
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`
2. Verify it's running: `mongosh` (should connect)

### Error: Port 5000 already in use

**Another application is using port 5000.**

Solution:
1. Find what's using port 5000:
   - Windows: `netstat -ano | findstr :5000`
   - Mac/Linux: `lsof -i :5000`
2. Kill that process or change port in `server/.env`:
   ```
   PORT=5001
   ```
3. Also update frontend `.env`:
   ```
   VITE_API_URL=http://localhost:5001/api
   ```

### Backend starts but immediately crashes

Check the error message in the terminal. Common issues:

1. **Missing dependencies**: Run `cd server && npm install`
2. **MongoDB not accessible**: Make sure MongoDB is running
3. **Wrong MongoDB URI**: Check `server/.env` has correct URI

### Can't register/login after backend is running

Check browser console (F12) for errors:

1. **CORS errors**: Backend should have CORS enabled (it does)
2. **Network errors**: Check Network tab, make sure requests go to `localhost:5000`
3. **Backend errors**: Check backend terminal for error messages

## Quick Commands Reference

```bash
# Install all dependencies (first time)
npm install && cd server && npm install && cd ..

# Start backend (Terminal 1)
cd server && npm start

# Start frontend (Terminal 2)
npm run dev

# Check if MongoDB is running
mongosh

# Check what's on port 5000
netstat -ano | findstr :5000
```

## Development Mode

For faster development with auto-reload:

**Backend (Terminal 1):**
```bash
cd server
npm run dev  # Uses nodemon for auto-reload
```

**Frontend (Terminal 2):**
```bash
npm run dev  # Vite has hot-reload by default
```

## Stopping the Servers

1. **Backend**: Press `Ctrl+C` in the backend terminal
2. **Frontend**: Press `Ctrl+C` in the frontend terminal
3. **MongoDB** (optional):
   - Usually leave it running
   - To stop: `brew services stop mongodb-community` (Mac) or `sudo systemctl stop mongod` (Linux)

## Summary

**Two terminals needed:**
1. Terminal 1: Backend server (`cd server && npm start`)
2. Terminal 2: Frontend dev server (`npm run dev`)

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- MongoDB: mongodb://localhost:27017

Keep both terminals open while using the app!
