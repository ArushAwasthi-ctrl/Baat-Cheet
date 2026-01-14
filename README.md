# Baat Cheet

A modern, real-time chat application built with the MERN stack, Socket.IO, and Redis.

## Features

- **Real-time Messaging** - Instant message delivery with Socket.IO
- **Group Chats** - Create groups, manage members, promote admins
- **Direct Messages** - 1-on-1 private conversations
- **User Authentication** - JWT-based auth with email OTP verification
- **File Sharing** - Image and file uploads via Cloudinary
- **Typing Indicators** - See when others are typing
- **Online Status** - Real-time presence tracking
- **Read Receipts** - Know when messages are read
- **Dark/Light Theme** - Modern UI with theme support
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB (Atlas) + Mongoose
- Socket.IO for real-time communication
- Redis (Upstash) for caching and sessions
- BullMQ for background job processing
- JWT authentication with refresh tokens

**Frontend:**
- React 19 + Vite
- Redux Toolkit for state management
- Tailwind CSS + Radix UI
- Framer Motion animations
- Socket.IO Client

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Redis (local or Upstash)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/baat-cheet.git
cd baat-cheet

# Install all dependencies
npm run install:all

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your credentials

# Start development servers
npm run dev
```

### Environment Variables

See [backend/.env.example](backend/.env.example) and [frontend/.env.example](frontend/.env.example) for required variables.

**Important:** Generate secure JWT secrets for production:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Project Structure

```
baat-cheet/
├── backend/                 # Express.js API server
│   ├── controllers/         # Route handlers
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API endpoints
│   ├── middlewares/         # Auth, validation, rate limiting
│   ├── socket/              # Socket.IO handlers
│   ├── queues/              # BullMQ job queues
│   └── workers/             # Background job workers
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store & slices
│   │   ├── services/        # API & socket services
│   │   └── hooks/           # Custom React hooks
└── DEPLOYMENT.md            # Deployment guide
```

## Scripts

```bash
# Development
npm run dev              # Start all services (backend, worker, frontend)
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run dev:worker       # Start email worker only

# Production
npm run build            # Build frontend
npm run start:prod       # Start backend in production mode
npm run start:worker     # Start email worker in production
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Recommended platforms:**
- **Railway** - Easiest setup, free tier available
- **Render** - Free tier with auto-deploys
- **Vercel + Railway** - Frontend on Vercel CDN, backend on Railway

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Register new user |
| `POST /api/auth/verify-otp` | Verify email OTP |
| `POST /api/auth/login` | User login |
| `POST /api/auth/logout` | User logout |
| `POST /api/auth/refresh` | Refresh access token |
| `GET /api/users/me` | Get current user |
| `GET /api/users/search` | Search users |
| `GET /api/chats` | Get user's chats |
| `POST /api/chats` | Create new chat |
| `GET /api/messages/:chatId` | Get chat messages |
| `POST /api/messages/:chatId` | Send message |
| `GET /api/health` | Health check |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License - see [LICENSE](LICENSE) for details.

## Author

**Arush Awasthi**

---

Built with love and lots of chai
