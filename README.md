# 🌍 GitLife - Version Control System for your Life Decisions.

![gitlifeVideoGIF](https://github.com/user-attachments/assets/e8623512-85ee-4cda-b70a-a25f428e4a73)


Welcome to GitLife, the app that proves version control can be as chaotic and unpredictable as your life! Forget the boring Git tutorials; we’re here to turn your life decisions into a version control system. Because who doesn’t want to commit their choices like they’re pushing code?

## 🚀 Table of Contents

- [Introduction](#%EF%B8%8F-introduction)
- [Features](#%F0%9F%8C%9F-features)
- [Installation](#%F0%9F%9B%A0-installation)
- [Usage](#%F0%9F%8F%92-usage)
- [Controls](#%F0%9F%8F%92-controls)
- [Contributing](#%F0%9F%A4%9D-contributing)
- [Contact](#%F0%9F%93%AC-contact)

## 📖 Introduction

Welcome to GitLife! Here, you can interact with your life decisions just like you would with your Git repositories—without needing to understand anything about Git! Commit your choices, create new branches for those “what if” scenarios, and visualize your life timeline as a graph. It's like living your life with a commit history, because who needs spontaneity?

## 🌟 Features

- **Multi-User Support**: Create your own account and keep your existential crises private!
- **Secure Authentication**: JWT-based login system—because your life decisions deserve encryption.
- **Decision Commits**: Turn every life choice into a commit—because it's easier to track regrets this way!
- **Branch Out**: Create branches for alternative paths in life, so you can wonder "what if?" without any real commitment.
- **Graphical Timeline**: Visualize your life as a graph, showing your ups, downs, and existential crises.
- **Impact Tracking**: Measure the impact of your decisions with a fancy slider (1-100).
- **Mood Logging**: Track your emotional state with emojis—because words are overrated.
- **Private Data**: Each user's data is completely isolated—no one else needs to see your chaos.
- **User-Friendly Interface**: Enjoy navigating through choices with an interface that may or may not make sense.
- **Community Shenanigans**: Join others who are just as lost as you are, sharing the joys of turning life into code.

## 🛠 Installation

Ready to embark on this emotional rollercoaster? Here's how to get started:

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)

### Quick Start

1. **Clone the repository:**
    ```sh
    git clone https://github.com/soorajdmg/GitLife
    cd GitLife
    ```

2. **Install dependencies:**
    ```sh
    # Install frontend dependencies
    npm install

    # Install backend dependencies
    cd server
    npm install
    cd ..
    ```

3. **Set up environment variables:**

    Create `.env` file in root directory:
    ```
    VITE_API_URL=http://localhost:5000/api
    ```

    Create `server/.env` file:
    ```
    MONGODB_URI=mongodb://localhost:27017/gitlife
    PORT=5000
    JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
    ```

4. **Start MongoDB:**
    ```sh
    # On macOS (if installed via homebrew)
    brew services start mongodb-community

    # On Windows/Linux
    mongod
    ```

5. **Run the application:**

    Terminal 1 - Start backend:
    ```sh
    cd server
    npm start
    ```

    Terminal 2 - Start frontend:
    ```sh
    npm run dev
    ```

6. **Open the app:**
    - Visit `http://localhost:5173`
    - Create an account and start tracking your life decisions!
    - If things go wrong, just remember: it's not you; it's the universe.

### Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js + MongoDB
- **Authentication**: JWT tokens
- **Database**: MongoDB

📚 For detailed setup and migration information, see:
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Firebase to MongoDB migration
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) - Multi-user authentication

## 🎮 Usage

Navigate through the app and commit your life decisions with a sense of thrill and potential disaster! Keep your life “alive” while enjoying the weirdness of this experience.

## 🤝 Contributing

We welcome your contributions, even if they are as chaotic as this project itself. Here’s how to get involved:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request and try not to laugh too hard at your genius!

## 📬 Contact

Got questions, funny life stories, or want to share your version control mishaps? Reach out to me:

- **Email:** [soorajmurugaraj@gmail.com](mailto:soorajmurugaraj@gmail.com)
- **GitHub:** [soorajdmg](https://github.com/soorajdmg)

---

⭐️ If you enjoy this wonderfully chaotic experience, please give it a star! It might not fix your life, but it will definitely bring a smile.
---

https://github.com/user-attachments/assets/fffc5474-a644-4cc9-8bed-7e239f70668d

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

