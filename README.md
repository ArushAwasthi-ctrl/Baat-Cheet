# Baat Cheet

A real-time chat application built with the MERN stack, featuring instant messaging, group chats, and a modern UI.

## Features

- **Real-time Messaging** - Instant message delivery using Socket.IO
- **Direct & Group Chats** - One-on-one conversations and group chats with admin controls
- **User Authentication** - Secure signup/login with email OTP verification
- **File Sharing** - Share images and files via Cloudinary
- **Dark/Light Theme** - Toggle between themes with warm vanilla cream light mode
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Profile Management** - Update avatar, username, and bio

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- Socket.IO for real-time communication
- Redis (Upstash) for caching & session management
- BullMQ for background email jobs
- JWT authentication (access + refresh tokens)
- Cloudinary for file uploads

### Frontend
- React 19 with Vite
- Redux Toolkit for state management
- React Router v7
- Tailwind CSS v4
- Framer Motion for animations
- Axios with interceptors for API calls

## Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account
- Upstash Redis account
- Cloudinary account
- Gmail account (for SMTP)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/baat-cheet.git
   cd baat-cheet
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**

   Create `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=9990

   # MongoDB
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_CLUSTER=cluster0.xxxxx.mongodb.net
   DB_NAME=BaatCheet

   # Redis
   REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379

   # JWT
   ACCESS_TOKEN_SECRET=your_secret_min_64_chars
   ACCESS_TOKEN_EXPIRY=15m
   REFRESH_TOKEN_SECRET=your_secret_min_64_chars
   REFRESH_TOKEN_EXPIRY=7d

   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # CORS
   CORS_ORIGINS=http://localhost:5173
   ```

   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:9990
   ```

## Running the Application

### Development

**Option 1: Using npm script (recommended)**
```bash
npm run dev
```
This starts backend, email worker, and frontend concurrently.

**Option 2: Using batch file (Windows)**
```bash
./start-all.bat
```

**Option 3: Start services individually**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Email Worker
npm run dev:worker

# Terminal 3 - Frontend
npm run dev:frontend
```

### Production Build

```bash
# Build frontend
npm run build

# Start production server
npm run start:prod

# Start email worker (separate process)
npm run start:worker
```

## Project Structure

```
baat-cheet/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── middlewares/     # Auth, validation, rate limiting
│   ├── models/          # Mongoose schemas
│   ├── queues/          # BullMQ email queue
│   ├── redis/           # Redis client
│   ├── routes/          # API routes
│   ├── socket/          # Socket.IO handlers
│   ├── utils/           # Helpers (ApiError, asyncHandler, mailgen)
│   └── workers/         # Background job processors
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── layouts/     # Page layouts
│   │   ├── pages/       # Route pages
│   │   ├── services/    # API service layer
│   │   └── store/       # Redux store & slices
│   └── index.html
├── BACKEND_DOCUMENTATION.md
├── FRONTEND_DOCUMENTATION.md
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/users/me` | Get current user |
| GET | `/api/chats` | Get user's chats |
| POST | `/api/chats` | Create direct chat |
| POST | `/api/chats/group` | Create group chat |
| GET | `/api/messages/:chatId` | Get messages |
| POST | `/api/messages/:chatId` | Send message |
| GET | `/api/health` | Health check |

## Documentation

- [Backend Documentation](BACKEND_DOCUMENTATION.md) - Architecture, API design, security
- [Frontend Documentation](FRONTEND_DOCUMENTATION.md) - Components, state management, styling

## Author

**Arush Awasthi**

## License

ISC