# Baat Cheet - Backend API Documentation

A real-time chat application backend built with Node.js, Express, MongoDB, Redis, and Socket.IO.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Socket Events](#socket-events)
- [Database Models](#database-models)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Express.js** | Web framework |
| **MongoDB + Mongoose** | Database & ODM |
| **Redis (ioredis)** | Session storage, rate limiting, caching |
| **Socket.IO** | Real-time communication |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing |
| **BullMQ** | Background job queue (emails) |
| **Nodemailer + Mailgen** | Email sending |
| **Cloudinary** | File/image uploads |
| **Multer** | File upload handling |
| **Helmet** | Security headers |
| **express-validator** | Request validation |

## Project Structure

```
backend/
├── controllers/          # Request handlers
│   ├── auth-controller.js
│   ├── chats-controller.js
│   ├── messages-controller.js
│   └── users-controller.js
├── models/               # MongoDB schemas
│   ├── Users.js
│   ├── Chats.js
│   └── Messages.js
├── routes/               # API route definitions
│   ├── auth-routes.js
│   ├── chats-routes.js
│   ├── messages-routes.js
│   └── users-routes.js
├── middlewares/          # Express middlewares
│   ├── auth-middleware.js
│   └── validator-middleware.js
├── socket/               # Socket.IO implementation
│   └── index.js
├── redis/                # Redis client connection
│   └── index.js
├── queues/               # BullMQ job queues
│   └── email.queue.js
├── workers/              # Background job workers
│   └── email.worker.js
├── validators/           # Request validation rules
│   └── validate.js
├── utils/                # Helper utilities
│   ├── api-error.js
│   ├── api-response.js
│   ├── asyncHandler.js
│   ├── cloudinary.js
│   └── mailgen.js
├── constants/            # Constants & projections
│   └── projections.js
├── db/                   # Database connection
│   └── index.js
├── app.js                # Express app configuration
└── index.js              # Server entry point
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=9990
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/baat-cheet

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Start email worker (separate terminal)
npm run worker:email
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/verify-otp` | Verify email OTP | No |
| POST | `/resend-verify-otp` | Resend verification OTP | No |
| POST | `/login` | Login with credentials | No |
| GET | `/logout` | Logout user | Yes |
| POST | `/refresh` | Refresh access token | No |
| POST | `/forgotpassword` | Request password reset | No |
| POST | `/verify-forgotpassword-otp` | Verify reset OTP & set new password | No |

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get current user profile | Yes |
| GET | `/` | Search/list users | Yes |
| GET | `/:id` | Get user by ID | Yes |
| PUT | `/profile` | Update profile | Yes |

#### Search Users
```http
GET /api/users?search=john&page=1&limit=20
Authorization: Bearer <access_token>
```

#### Update Profile
```http
PUT /api/users/profile
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

username: new_username
bio: Hello, I'm using Baat Cheet!
avatar: <file>
```

### Chats (`/api/chats`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create/get direct chat | Yes |
| POST | `/group` | Create group chat | Yes |
| GET | `/` | Get user's chats | Yes |
| GET | `/:chatId` | Get chat by ID | Yes |
| POST | `/:chatId` | Update group info | Yes (Admin) |
| POST | `/:chatId/members/add` | Add members to group | Yes (Admin) |
| POST | `/:chatId/members/remove` | Remove members from group | Yes (Admin) |
| POST | `/:chatId/members/promote` | Promote member to admin | Yes (Admin) |
| POST | `/:chatId/leave` | Leave group | Yes |
| DELETE | `/:chatId` | Delete chat | Yes (Admin for groups) |

#### Create Direct Chat
```http
POST /api/chats
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "userId": "user_id_here"
}
```

#### Create Group Chat
```http
POST /api/chats/group
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "My Group",
  "participants": ["user_id_1", "user_id_2", "user_id_3"]
}
```

#### Get User's Chats (Paginated)
```http
GET /api/chats?cursor=<last_chat_id>&limit=20
Authorization: Bearer <access_token>
```

#### Add Members to Group
```http
POST /api/chats/:chatId/members/add
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "memberIds": ["user_id_1", "user_id_2"]
}
```

### Messages (`/api/messages`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Send message | Yes |
| GET | `/:chatId` | Get messages for chat | Yes |
| POST | `/:chatId/mark-read` | Mark messages as read | Yes |

#### Send Message
```http
POST /api/messages
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "chatId": "chat_id_here",
  "content": "Hello, World!",
  "attachments": []
}
```

#### Get Messages (Paginated)
```http
GET /api/messages/:chatId?cursor=<timestamp>&limit=50
Authorization: Bearer <access_token>
```

## Socket Events

### Connection
Socket.IO authenticates using JWT from cookies or handshake auth.

```javascript
const socket = io('http://localhost:9990', {
  withCredentials: true,
  // OR
  auth: { token: 'your_access_token' }
});
```

### Client -> Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:join` | `chatId` | Join a chat room |
| `chat:leave` | `chatId` | Leave a chat room |
| `message:send` | `{ chatId, message }` | Broadcast new message |
| `typing:start` | `{ chatId }` | Start typing indicator |
| `typing:stop` | `{ chatId }` | Stop typing indicator |
| `message:read` | `{ chatId, messageId }` | Mark message as read |
| `chat:created` | `{ chat }` | Notify new chat creation |
| `group:updated` | `{ chatId, chat, action }` | Notify group updates |

### Server -> Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `{ chatId, message }` | New message received |
| `chat:update` | `{ chatId, lastMessage }` | Chat sidebar update |
| `chat:new` | `{ chat }` | New chat created for user |
| `chat:removed` | `{ chatId }` | User removed from chat |
| `group:updated` | `{ chatId, chat, action }` | Group info/members changed |
| `typing:start` | `{ chatId, userId, username }` | User started typing |
| `typing:stop` | `{ chatId, userId }` | User stopped typing |
| `messages:read` | `{ chatId, readBy, count }` | Messages marked as read |
| `user:online` | `{ userId, status }` | User came online |
| `user:offline` | `{ userId, status, lastSeen }` | User went offline |

## Database Models

### User Schema

```javascript
{
  username: String,        // Unique, required
  email: String,           // Unique, required
  password: String,        // Hashed with bcrypt
  avatar: String,          // Cloudinary URL
  bio: String,             // Max 200 chars
  isVerified: Boolean,     // Email verified
  status: String,          // "online" | "offline"
  lastSeen: Date,
  friends: [ObjectId],     // Ref: User
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Schema

```javascript
{
  type: String,            // "direct" | "group"
  name: String,            // Required for groups
  avatar: String,          // Group avatar
  participants: [ObjectId], // Ref: User
  admins: [ObjectId],      // Ref: User (for groups)
  lastMessage: ObjectId,   // Ref: Message
  lastMessageAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Schema

```javascript
{
  chat: ObjectId,          // Ref: Chat
  sender: ObjectId,        // Ref: User
  content: String,
  type: String,            // "text" | "image" | "file"
  attachments: [{
    url: String,
    type: String,
    name: String
  }],
  readBy: [ObjectId],      // Ref: User
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication

The API uses JWT-based authentication with access and refresh tokens:

- **Access Token**: Short-lived (15 min), stored in httpOnly cookie
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie + Redis

### Token Flow

1. User logs in -> Receives access + refresh tokens in cookies
2. Access token expires -> Frontend calls `/api/auth/refresh`
3. Server validates refresh token against Redis hash
4. New access token issued

### Protected Routes

Protected routes use the `authValidator` middleware which:
1. Extracts access token from cookies
2. Verifies JWT signature and expiry
3. Attaches user object to `req.user`

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "errors": []
  }
}
```

### Standard Success Response

```json
{
  "status": 200,
  "data": { ... },
  "message": "Success message",
  "success": true
}
```

### Common Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized / Token Invalid |
| 403 | Forbidden / Insufficient Permissions |
| 404 | Resource Not Found |
| 409 | Conflict (e.g., duplicate email) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

## Rate Limiting

OTP endpoints are rate-limited using Redis:
- Max 3 OTP requests per email per 5 minutes
- Stored with key pattern: `register:ratelimit:{email}`

## Scripts

```bash
npm start           # Start production server
npm run dev         # Start with nodemon (hot reload)
npm run worker:email # Start email background worker
```

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with expiry
- HttpOnly cookies for token storage
- Helmet security headers
- CORS with whitelist
- Input validation with express-validator
- Rate limiting on sensitive endpoints
- Socket.IO authentication middleware
