# GitLife - Version Control for Your Life Decisions

<p align="center">
  <img src="src/assets/images/gitlife-header1.png" width="100%" alt="GitLife" />
</p>

> Commit your choices. Branch your timelines. Visualize your path.

GitLife is a full-stack social platform that gamifies life decision-making using Git metaphors. Track decisions as commits, create alternate-life branches, explore an interactive decision graph, and share your journey with a community, all without needing to know anything about Git.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [Contact](#contact)

---

## Features

### Core
- **Decision Commits** - Log life choices with a title, branch, mood emoji, impact score (1-100), category, description, and optional image
- **Branch Management** - Create alternate timeline branches for "what if" scenarios; track commits and impact per branch
- **Interactive Decision Graph** - Visualize decisions as linked nodes using React Flow; explore dependency chains between choices
- **Blame Chains** - Mark decisions with blame status and notes; trace responsibility through a chain of linked choices
- **Stash System** - Draft decisions without publishing them; retrieve them when you're ready to commit

### Social
- **Social Feed** - See commits from users you follow in chronological order
- **Explore** - Discover public decisions, search users, and find suggested people to follow
- **Reactions** - Fork, Merge, and Support reactions on other users' commits
- **Comments & Threading** - Nested comment threads with like support on every decision
- **Follow System** - Follow users and build a personalized feed

### Real-Time
- **Direct Messaging** - Real-time chat powered by Socket.IO, with link preview generation, message editing, emoji reactions, and message search
- **Notifications** - Live notifications for reactions, comments, messages, and follows
- **Online Presence** - Real-time online status tracking

### Profile & Analytics
- **Stats Dashboard** - Track total decisions, branches, cumulative impact score, and mood distribution
- **Mood Chart** - Recharts-powered visualization of emotional state trends over time
- **User Profiles** - Public profile pages showing a user's decisions and stats

### Platform
- **Google OAuth + JWT Auth** - Register and log in with email/password or Google
- **Image Uploads** - Attach images to decisions via Cloudinary
- **Dark / Light Theme** - Full theme switching with an OKLch color system
- **PWA Support** - Installable as a Progressive Web App
- **Mobile-Optimized** - Bottom sheet modal for new commits, camera capture for image attachments
- **Data Export** - Export your decision data at any time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Tailwind CSS, Framer Motion |
| Server State | TanStack React Query v5 |
| Graph | React Flow (@xyflow/react) |
| Charts | Recharts |
| Backend | Express.js (Node.js, ES Modules) |
| Database | MongoDB (native driver) |
| Real-time | Socket.IO |
| Auth | JWT, bcryptjs, Google OAuth |
| Media | Cloudinary, Multer |
| Security | Helmet, express-validator, CORS |
| Deployment | Render (render.yaml included) |

---

## Getting Started

### Prerequisites

- Node.js v16+ (v18 recommended)
- MongoDB - local install or [MongoDB Atlas](https://www.mongodb.com/atlas)
- Google OAuth credentials (optional, for social login)
- Cloudinary account (optional, for image uploads)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/soorajdmg/GitLife
cd GitLife

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server && npm install && cd ..
```

### Running Locally

**Terminal 1 - Backend** (runs on port 5000):
```bash
cd server
npm start
```

**Terminal 2 - Frontend** (runs on port 5173):
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), create an account, and start committing.

---

## Environment Variables

**Frontend** - create `.env` in the root directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

**Backend** - create `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/gitlife
PORT=5000
JWT_SECRET=your-super-secret-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:5173
```

> Google OAuth and Cloudinary credentials are optional. The app works without them, but social login and image uploads will be unavailable.

---

## Scripts

**Frontend** (root directory):

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

**Backend** (`server/` directory):

| Script | Description |
|---|---|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (auto-reload) |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Screenshots

---
![image](https://github.com/user-attachments/assets/3a9a825d-f65e-4344-b677-998a67992c24)
---
![image](https://github.com/user-attachments/assets/fb48eaa4-1bdd-44e8-b3dd-cd574f801bed)
---
![image](https://github.com/user-attachments/assets/db7dafec-8720-4703-8b8c-af2bb967ef18)
---
![image](https://github.com/user-attachments/assets/291c788f-a175-40ec-b539-96907d69540f)
---
![image](https://github.com/user-attachments/assets/c36b385e-4a9b-4a85-8bc6-f57246b8d247)
---
![image](https://github.com/user-attachments/assets/d7e8adb0-ab60-4e2a-b922-bc16601ac25a)

---

## Contact

- **Email:** [soorajmurugaraj@gmail.com](mailto:soorajmurugaraj@gmail.com)
- **GitHub:** [soorajdmg](https://github.com/soorajdmg)

---

If GitLife is useful or interesting to you, consider giving it a star.
