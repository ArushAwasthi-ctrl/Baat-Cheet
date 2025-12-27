# Baat Cheet - Backend Documentation

## For Interview Preparation

This document covers the complete backend architecture, database design, authentication, API design, and all implementation details you need to explain in interviews.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Why](#2-tech-stack--why)
3. [Folder Structure](#3-folder-structure)
4. [Database Design](#4-database-design)
5. [Authentication System](#5-authentication-system)
6. [API Design](#6-api-design)
7. [Middleware](#7-middleware)
8. [Error Handling](#8-error-handling)
9. [Email Queue System](#9-email-queue-system)
10. [Redis Usage](#10-redis-usage)
11. [Security Measures](#11-security-measures)
12. [Common Interview Questions](#12-common-interview-questions)

---

## 1. Project Overview

**Baat Cheet Backend** is a RESTful API server that powers the chat application. It handles:

- User authentication (registration, login, OTP verification)
- JWT-based session management
- Direct and group chat management
- Message CRUD operations
- User search and profile management
- Email notifications via queue system

### Frontend Integration

The backend integrates seamlessly with the React frontend:
- **CORS Configuration**: Configured to accept requests from the frontend origin
- **Cookie-based Auth**: httpOnly cookies for secure token storage
- **Auto-refresh**: Frontend interceptors handle token refresh automatically
- **Avatar Generation**: Uses DiceBear API on frontend, stores URLs in backend

---

## 2. Tech Stack & Why

### Core Framework

| Technology | Version | Why We Chose It |
|------------|---------|-----------------|
| **Node.js** | 18+ | Event-driven, non-blocking I/O perfect for real-time apps, JavaScript everywhere |
| **Express.js** | 4.x | Minimal, flexible, huge middleware ecosystem |

### Database

| Technology | Why |
|------------|-----|
| **MongoDB** | Document-based (natural for chats/messages), Flexible schema, Horizontal scaling |
| **Mongoose** | Schema validation, Middleware hooks, Query building |

### Caching & Sessions

| Technology | Why |
|------------|-----|
| **Redis** | In-memory speed, TTL for sessions, Rate limiting, Job queues |
| **ioredis** | Better performance than node-redis, Cluster support |

### Authentication

| Technology | Why |
|------------|-----|
| **JWT** | Stateless authentication, Can store user data in token, No session lookup needed |
| **bcrypt** | Industry standard for password hashing, Configurable salt rounds |

### Job Queue

| Technology | Why |
|------------|-----|
| **BullMQ** | Redis-backed, Retry logic, Job scheduling, Better than Bull |

### Email

| Technology | Why |
|------------|-----|
| **Nodemailer** | SMTP support, Multiple providers, Attachments |
| **Mailgen** | Beautiful HTML email templates |

### Validation

| Technology | Why |
|------------|-----|
| **express-validator** | Middleware-based, Chain API, Sanitization |

### Security

| Technology | Why |
|------------|-----|
| **Helmet** | Security headers, XSS protection, CSP |
| **cors** | Cross-origin configuration |
| **cookie-parser** | httpOnly cookie parsing |

---

## 3. Folder Structure

```
backend/
├── app.js                    # Express app configuration
├── index.js                  # Server entry point
│
├── controllers/              # Business logic
│   ├── auth-controller.js    # Registration, login, logout, tokens
│   ├── users-controller.js   # Profile, search
│   ├── chats-controller.js   # Chat CRUD, members
│   └── messages-controller.js # Send, fetch, read receipts
│
├── models/                   # MongoDB schemas
│   ├── Users.js              # User schema + methods
│   ├── Chats.js              # Chat schema
│   └── Messages.js           # Message schema
│
├── routes/                   # API endpoints
│   ├── auth-routes.js
│   ├── users-routes.js
│   ├── chats-routes.js
│   └── messages-routes.js
│
├── middlewares/
│   ├── auth-middleware.js    # JWT verification
│   └── validator-middleware.js # Validation error handler
│
├── validators/
│   └── validate.js           # All validation rules
│
├── utils/
│   ├── asyncHandler.js       # Async error wrapper
│   ├── api-error.js          # Custom error class
│   ├── api-response.js       # Response formatter
│   ├── escapeRegex.js        # Regex injection prevention
│   └── mailgen.js            # Email generation
│
├── redis/
│   └── redisClient.js        # Redis connection
│
├── db/
│   └── dbCall.js             # MongoDB connection
│
├── queues/
│   └── email.queue.js        # Email job queue
│
├── workers/
│   └── email.worker.js       # Email processing worker
│
└── constants/
    └── projections.js        # Field selection constants
```

---

## 4. Database Design

### Why MongoDB?

1. **Document Model**: A chat message is naturally a document with nested attachments
2. **Flexible Schema**: Easy to add fields without migrations
3. **Scaling**: Sharding for horizontal scaling
4. **Aggregation**: Powerful queries for analytics

### Users Collection

```javascript
{
  _id: ObjectId,
  username: String,        // unique, indexed, 3-30 chars
  email: String,           // unique, indexed, lowercase
  password: String,        // bcrypt hashed
  avatar: String,          // URL, has default
  bio: String,             // max 150 chars
  isVerified: Boolean,     // email verification status
  lastSeen: Date,          // indexed for queries
  status: "online" | "offline",
  friends: [ObjectId],     // future feature
  createdAt: Date,
  updatedAt: Date
}

// Indexes for performance:
// - username: unique
// - email: unique
// - lastSeen: for sorting online users
```

### Chats Collection

```javascript
{
  _id: ObjectId,
  type: "direct" | "group",
  name: String,            // null for direct chats
  avatar: String,          // group avatar
  participants: [ObjectId], // references Users
  admins: [ObjectId],      // subset of participants (group only)
  lastMessage: ObjectId,   // references Messages
  lastMessageAt: Date,     // for sorting
  createdAt: Date,
  updatedAt: Date
}

// Compound index for fast "my chats" query:
// { participants: 1, lastMessageAt: -1 }
```

### Messages Collection

```javascript
{
  _id: ObjectId,
  chat: ObjectId,          // references Chats
  sender: ObjectId,        // references Users
  content: String,         // message text
  type: "text" | "image" | "file",
  attachments: [{
    url: String,           // Cloudinary URL
    type: "image" | "file",
    size: Number,          // bytes
    fileName: String
  }],
  readBy: [ObjectId],      // users who read this
  createdAt: Date,
  updatedAt: Date
}

// Index for message pagination:
// { chat: 1, createdAt: -1 }
```

### Relationships Explained

```
┌─────────────┐         ┌─────────────┐
│    Users    │◄────────│    Chats    │
│             │         │             │
│  _id        │    ┌───►│ participants│
│  username   │    │    │ admins      │
│  email      │    │    │ lastMessage │───┐
└─────────────┘    │    └─────────────┘   │
       ▲           │                       │
       │           │    ┌─────────────┐    │
       │           │    │  Messages   │◄───┘
       │           │    │             │
       └───────────┼────│ sender      │
                   │    │ chat        │
                   └────│ readBy      │
                        └─────────────┘
```

### Interview Question: Why not SQL?

> "Chat data is naturally document-shaped (messages with nested attachments). MongoDB's flexible schema lets us add features without migrations. For a chat app where most queries are by chat ID or user ID, document stores perform well. However, for complex joins or transactions across collections, SQL would be better."

---

## 5. Authentication System

### JWT Token Strategy

We use two tokens:

| Token | Purpose | Storage | Expiry |
|-------|---------|---------|--------|
| **Access Token** | API authorization | httpOnly cookie | 15 minutes |
| **Refresh Token** | Get new access token | httpOnly cookie + Redis hash | 7 days |

### Why Two Tokens?

1. **Short-lived access token**: If stolen, limited damage (15 min)
2. **Long-lived refresh token**: Better UX (don't login every 15 min)
3. **Server-side revocation**: Refresh token hash in Redis can be deleted

### Registration Flow

```
1. POST /api/auth/register
   Body: { username, email, password }

2. Server:
   - Check if user exists (409 Conflict if yes)
   - Check rate limit in Redis (429 if exceeded)
   - Generate 6-digit OTP (crypto.randomInt)
   - Store in Redis: register:{email} = { userData, otp }, TTL 5 min
   - Queue OTP email via BullMQ
   - Return 200 "OTP sent"

3. POST /api/auth/verify-otp
   Body: { email, otp }

4. Server:
   - Get temp data from Redis
   - Validate OTP matches
   - Hash password: bcrypt.hash(password, 10)
   - Create user in MongoDB (isVerified: true)
   - Generate tokens
   - Hash refresh token: SHA256(token)
   - Store hash in Redis: refresh:{userId}, TTL 7 days
   - Set cookies (httpOnly, secure, sameSite: strict)
   - Delete temp data from Redis
   - Return 201 with user data
```

### Login Flow

```
1. POST /api/auth/login
   Body: { email, password }

2. Server:
   - Find user by email
   - Check isVerified (401 if not)
   - Compare password: bcrypt.compare(password, hash)
   - Update status to "online"
   - Generate tokens
   - Store hashed refresh token in Redis
   - Set cookies
   - Return 200 with user data
```

### Token Refresh Flow

```
1. POST /api/auth/refresh
   Cookie: refreshToken

2. Server:
   - Extract token from cookie
   - Verify JWT signature
   - Get stored hash from Redis: refresh:{userId}
   - Compare: SHA256(token) === storedHash
   - If mismatch: possible token theft! Return 401
   - Generate new access token only
   - Set new access token cookie
   - Return 200
```

### Password Reset Flow

```
1. POST /api/auth/forgotpassword
   Body: { email }

2. Server:
   - Find user
   - Check rate limit
   - Generate OTP
   - Store in Redis: reset:{email}, TTL 5 min
   - Queue reset email
   - Return 200

3. POST /api/auth/verify-forgotpassword-otp
   Body: { email, otp, newPassword }

4. Server:
   - Validate OTP
   - Hash new password
   - Update in MongoDB
   - Clean up Redis
   - Return 200
```

### Code Example: Token Generation

```javascript
// In Users model
userSchema.methods.createAccessToken = function() {
  return jwt.sign(
    { userId: this._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.createRefreshToken = function() {
  return jwt.sign(
    { userId: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};
```

---

## 6. API Design

### RESTful Principles

| Principle | Implementation |
|-----------|----------------|
| **Stateless** | Each request contains all info (JWT in cookie) |
| **Resource-based URLs** | `/api/chats`, `/api/messages` |
| **HTTP Methods** | GET (read), POST (create), PUT (update), DELETE (remove) |
| **Standard Status Codes** | 200, 201, 400, 401, 403, 404, 422, 500 |

### Response Format

```javascript
// Success Response
{
  status: 200,
  data: { /* payload */ },
  message: "Success message",
  success: true
}

// Error Response
{
  error: {
    message: "Error description",
    code: "ERROR_CODE",
    errors: [{ field: "specific error" }]
  }
}
```

### Cursor-Based Pagination

**Why not offset pagination?**

Offset pagination (`SKIP 1000 LIMIT 20`) is slow for large datasets because the database still scans skipped documents.

**Cursor pagination** uses the last item's ID or timestamp:

```javascript
// Request
GET /api/messages/chatId?cursor=2024-01-15T10:30:00Z&limit=20

// Controller
const messages = await Message.find({
  chat: chatId,
  createdAt: { $lt: new Date(cursor) }  // Before cursor
})
.sort({ createdAt: -1 })  // Newest first
.limit(limit + 1);        // +1 to check hasMore

const hasMore = messages.length > limit;
if (hasMore) messages.pop();  // Remove extra

// Response
{
  data: {
    messages: [...],
    nextCursor: messages[messages.length - 1].createdAt,
    hasMore: true
  }
}
```

### Complete API Reference

#### Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Start registration |
| `/api/auth/verify-otp` | POST | No | Complete registration |
| `/api/auth/resend-verify-otp` | POST | No | Resend OTP |
| `/api/auth/login` | POST | No | Login |
| `/api/auth/logout` | GET | Yes | Logout |
| `/api/auth/refresh` | POST | No | Refresh access token |
| `/api/auth/forgotpassword` | POST | No | Request password reset |
| `/api/auth/verify-forgotpassword-otp` | POST | No | Complete password reset |

#### Users

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users/me` | GET | Yes | Get current user |
| `/api/users` | GET | Yes | Search users (pagination) |
| `/api/users/:id` | GET | Yes | Get user by ID |
| `/api/users/profile` | PUT | Yes | Update profile |

#### Chats

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/chats` | GET | Yes | Get my chats (pagination) |
| `/api/chats` | POST | Yes | Create/get direct chat |
| `/api/chats/group` | POST | Yes | Create group chat |
| `/api/chats/:id` | GET | Yes | Get chat by ID |
| `/api/chats/:id` | POST | Yes | Update group info |
| `/api/chats/:id/members/add` | POST | Yes | Add members (admin) |
| `/api/chats/:id/members/remove` | POST | Yes | Remove members (admin) |
| `/api/chats/:id/members/promote` | POST | Yes | Promote to admin |

#### Messages

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/messages` | POST | Yes | Send message |
| `/api/messages/:chatId` | GET | Yes | Get messages (pagination) |
| `/api/messages/:chatId/mark-read` | POST | Yes | Mark as read |

---

## 7. Middleware

### Authentication Middleware

```javascript
// auth-middleware.js
export const authValidator = asyncHandler(async (req, res, next) => {
  // 1. Get token from cookie
  const token = req.cookies?.accessToken;
  if (!token) {
    throw new ApiError(401, "Access token required");
  }

  // 2. Verify token
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3. Get user from database
    const user = await User.findById(decoded.userId)
      .select("-password")
      .lean();

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // 4. Attach to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired");
    }
    throw new ApiError(401, "Invalid token");
  }
});
```

### Validation Middleware

```javascript
// validator-middleware.js
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      [err.path]: err.msg
    }));

    return res.status(422).json({
      error: {
        message: "Validation failed",
        errors: extractedErrors
      }
    });
  }

  next();
};
```

### Request Validation Example

```javascript
// validators/validate.js
export const createGroupChatValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Group name is required")
    .isLength({ min: 3, max: 50 }).withMessage("Name must be 3-50 characters"),

  body("participants")
    .isArray({ min: 2 }).withMessage("At least 2 participants required")
    .custom((value) => {
      return value.every(id => mongoose.Types.ObjectId.isValid(id));
    }).withMessage("Invalid participant ID"),

  validate  // Middleware to check errors
];

// In routes:
router.post("/group", authValidator, createGroupChatValidator, createGroupChat);
```

---

## 8. Error Handling

### Custom Error Class

```javascript
// api-error.js
class ApiError extends Error {
  constructor(status, message, success = false, errors = [], stack = "") {
    super(message);
    this.status = status;
    this.success = success;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Usage:
throw new ApiError(404, "Chat not found");
throw new ApiError(403, "You are not an admin", false, [{ role: "Admin required" }]);
```

### Async Handler Wrapper

```javascript
// asyncHandler.js
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage - no try-catch needed:
export const getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id });
  res.json(new ApiResponse(200, { chats }, "Success"));
});
```

### Global Error Handler

```javascript
// app.js
app.use((err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    error: {
      message: err.message || "Internal Server Error",
      code: err.code || "INTERNAL_ERROR",
      errors: err.errors || []
    }
  });
});
```

### Error Flow

```
Controller throws ApiError
        ↓
asyncHandler catches it
        ↓
Passes to next(error)
        ↓
Global error handler formats response
        ↓
Client receives standardized error
```

---

## 9. Email Queue System

### Why Queue Emails?

1. **Non-blocking**: Don't wait for SMTP response
2. **Retry logic**: Automatic retries on failure
3. **Separation**: Email worker runs separately
4. **Scalability**: Multiple workers can process queue

### Architecture

```
┌─────────────┐     ┌─────────┐     ┌──────────────┐
│ Controller  │────►│  Redis  │◄────│ Email Worker │
│ (Producer)  │     │ (Queue) │     │ (Consumer)   │
└─────────────┘     └─────────┘     └──────────────┘
```

### Queue Setup

```javascript
// email.queue.js
import { Queue } from "bullmq";
import redisClient from "../redis/redisClient.js";

export const emailQueue = new Queue("sendMail", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 1000  // 1s, then 2s
    },
    removeOnComplete: true,
    removeOnFail: true
  }
});
```

### Worker Process

```javascript
// email.worker.js
import { Worker } from "bullmq";
import { sendEmail } from "../utils/mailgen.js";

const emailWorker = new Worker(
  "sendMail",
  async (job) => {
    const { email, subject, mailGenContent } = job.data;
    await sendEmail({ email, subject, mailGenContent });
  },
  { connection: redisClient }
);

emailWorker.on("completed", (job) => {
  console.log(`Email sent: ${job.id}`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`Email failed: ${job.id}`, error);
});
```

### Usage in Controller

```javascript
// auth-controller.js
import { emailQueue } from "../queues/email.queue.js";

// Add job to queue (returns immediately)
await emailQueue.add("sendMail", {
  email: user.email,
  subject: "Verify Your Email",
  mailGenContent: OTPVerificationMailGenContent(user.username, otp)
});
```

### Running the Worker

```bash
# Start worker separately
npm run worker:email

# In package.json:
"scripts": {
  "worker:email": "node workers/email.worker.js"
}
```

---

## 10. Redis Usage

### Connection Setup

```javascript
// redisClient.js
import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,  // Required for BullMQ
  enableReadyCheck: false
});
```

### Data Patterns

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `register:{email}` | Temp user data + OTP | 5 min |
| `register:ratelimit:{email}` | Rate limit flag | 1 min |
| `refresh:{userId}` | Hashed refresh token | 7 days |
| `reset:{email}` | Password reset OTP | 5 min |
| `reset:rateLimit:{email}` | Rate limit for reset | 1 min |

### Example: Rate Limiting

```javascript
const rateLimitKey = `register:ratelimit:${email}`;

// Check if rate limited
const isRateLimited = await redisClient.exists(rateLimitKey);
if (isRateLimited) {
  throw new ApiError(429, "Please wait before requesting another OTP");
}

// Set rate limit
await redisClient.set(rateLimitKey, "1", "EX", 60);  // 60 seconds
```

### Example: Token Storage

```javascript
// Store hashed refresh token
const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
await redisClient.set(`refresh:${userId}`, hash, "EX", 60 * 60 * 24 * 7);

// Validate on refresh
const storedHash = await redisClient.get(`refresh:${userId}`);
const requestHash = crypto.createHash("sha256").update(token).digest("hex");

if (storedHash !== requestHash) {
  // Token reuse attack detected!
  throw new ApiError(401, "Invalid refresh token");
}
```

---

## 11. Security Measures

### 1. Password Hashing

```javascript
// bcrypt with salt rounds = 10
const hashedPassword = await bcrypt.hash(password, 10);

// Comparison
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

### 2. JWT Security

- **Short expiry** for access tokens (15 min)
- **httpOnly cookies** prevent XSS access
- **Secure flag** in production (HTTPS only)
- **SameSite: strict** prevents CSRF
- **Refresh token rotation** (optional enhancement)

### 3. Input Validation

```javascript
// express-validator sanitization
body("email")
  .trim()
  .toLowerCase()
  .isEmail()
  .normalizeEmail()
```

### 4. Regex Injection Prevention

```javascript
// escapeRegex.js
export const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Usage in search
const safeQuery = escapeRegex(searchQuery);
const users = await User.find({
  username: { $regex: safeQuery, $options: "i" }
});
```

### 5. Security Headers (Helmet)

```javascript
app.use(helmet());
// Sets: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, etc.
```

### 6. CORS Configuration

```javascript
const allowedOrigins = process.env.CORS_ORIGINS.split(",");

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,  // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
```

### 7. Rate Limiting

- OTP requests: 1 per minute per email
- Uses Redis with TTL keys

---

## 12. Common Interview Questions

### Q1: Why Node.js for a chat application?

> "Node.js is event-driven and non-blocking, making it ideal for I/O-heavy applications like chat. A single Node process can handle thousands of concurrent connections because it doesn't block while waiting for database or network operations."

### Q2: Explain the event loop

> "The event loop is what allows Node.js to perform non-blocking I/O. When an async operation (like database query) is initiated, Node registers a callback and continues executing. When the operation completes, the callback is added to a queue. The event loop continuously checks this queue and executes callbacks when the call stack is empty."

### Q3: What is middleware in Express?

> "Middleware are functions that have access to request, response, and next. They can modify req/res, end the request cycle, or call next() to pass control to the next middleware. Examples: authentication, logging, error handling, parsing request body."

### Q4: Why use bcrypt over SHA256 for passwords?

> "bcrypt is specifically designed for password hashing. It's intentionally slow (configurable salt rounds) which makes brute-force attacks expensive. SHA256 is fast, which is bad for passwords. bcrypt also automatically handles salting."

### Q5: Explain JWT vs Session authentication

| JWT | Sessions |
|-----|----------|
| Stateless - token contains all info | Stateful - requires server storage |
| Scales horizontally easily | Need shared session store for multiple servers |
| Can't be invalidated easily | Can logout by deleting session |
| Larger payload size | Small session ID |

> "We use JWT because it's stateless and works well with microservices. We mitigate the 'can't invalidate' issue by using short-lived access tokens and storing refresh token hashes in Redis."

### Q6: What is SQL Injection and how do you prevent it?

> "SQL injection is inserting malicious SQL via user input. With MongoDB, we have NoSQL injection. We prevent it by: (1) using Mongoose which parameterizes queries, (2) validating input types, (3) escaping regex special characters for search queries."

### Q7: Why cursor pagination over offset?

> "Offset pagination (SKIP N) is slow for large datasets because the database still scans skipped documents. Cursor pagination uses an indexed field (like timestamp) to directly seek to the position. It's O(1) vs O(N)."

### Q8: Explain the N+1 query problem

> "When fetching a list of items and then fetching related data for each item in a loop, you make N+1 queries (1 for the list, N for each item). Solution: use .populate() in Mongoose to fetch related data in a single query."

```javascript
// Bad: N+1 queries
const chats = await Chat.find({ user: userId });
for (const chat of chats) {
  chat.messages = await Message.find({ chat: chat._id });
}

// Good: Single query with populate
const chats = await Chat.find({ user: userId }).populate("lastMessage");
```

### Q9: How do you handle concurrent updates?

> "For chat read receipts, we use MongoDB's $addToSet which is atomic - it won't add duplicates even with concurrent requests. For more complex cases, we'd use optimistic locking with version fields or MongoDB transactions."

### Q10: What's the difference between authentication and authorization?

> "Authentication verifies WHO you are (login with password). Authorization verifies WHAT you can do (is this user an admin of this group?). Our auth middleware handles authentication. The controller logic handles authorization (checking if user is in chat, is admin, etc.)."

### Q11: How would you scale this backend?

> 1. **Horizontal scaling**: Run multiple Node instances behind a load balancer
> 2. **Redis cluster**: For session storage across instances
> 3. **MongoDB replica set**: For read scaling and high availability
> 4. **Message queue**: Already using BullMQ for emails, can add more workers
> 5. **CDN**: For static assets and file attachments
> 6. **Caching**: Cache frequently accessed data in Redis

### Q12: What would you add for real-time features?

> "Socket.IO for WebSocket connections. On message send, emit to all participants' sockets. Use Redis pub/sub for cross-server communication. Track online status via socket connections."

### Q13: How does the frontend handle loading states?

> "The frontend uses multiple loading strategies: (1) A premium PageLoader with animated gradient orbs during initial auth checks and page loads, (2) Skeleton components with CSS shimmer animations for content placeholders, (3) Redux loading states for API calls. This provides a smooth, polished user experience."

### Q14: Why email-only authentication without social login?

> "We chose email-only authentication with OTP verification for simplicity and security. It eliminates OAuth provider dependencies, reduces attack surface, and works universally. The OTP system provides 2FA-like security without requiring users to set up an authenticator app."

---

## Environment Variables Reference

```env
# Server
NODE_ENV=production
PORT=9990

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/baatcheet

# Redis
REDIS_URL=redis://user:pass@host:port

# JWT
ACCESS_TOKEN_SECRET=your-secret-key
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRY=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password
SMTP_FROM="Baat Cheet" <your-email@gmail.com>

# CORS
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
```

---

## Key Files to Review Before Interview

1. `controllers/auth-controller.js` - Full auth logic
2. `models/Users.js` - Schema + JWT methods
3. `middlewares/auth-middleware.js` - Token verification
4. `utils/asyncHandler.js` - Error handling pattern
5. `queues/email.queue.js` - Job queue setup
6. `app.js` - Middleware configuration

---

## Quick Commands

```bash
# Development
npm run dev          # Start with nodemon

# Production
npm start            # Start server

# Worker
npm run worker:email # Start email worker
```

---

---

## Frontend-Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React 19 + Vite + Redux Toolkit + Tailwind CSS v4              │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │ AuthLayout│  │ ChatLayout│  │ PageLoader│  │ Skeletons │    │
│  │Split-screen│  │ Responsive│  │ Animated  │  │ Shimmer   │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│                           │                                      │
│                    Redux + Axios                                 │
│                    (Auto token refresh)                          │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTP + httpOnly Cookies
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  Node.js + Express + MongoDB + Redis + BullMQ                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │   Auth    │  │   Chats   │  │ Messages  │  │   Users   │    │
│  │ JWT+OTP   │  │  Groups   │  │  CRUD     │  │  Search   │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                   │
│         ▼                 ▼                 ▼                   │
│    ┌─────────┐      ┌─────────┐      ┌───────────┐             │
│    │ MongoDB │      │  Redis  │      │ Email Queue│             │
│    │  Data   │      │Sessions │      │  BullMQ   │             │
│    └─────────┘      └─────────┘      └───────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Key Integration Points

| Component | Frontend | Backend |
|-----------|----------|---------|
| **Authentication** | Login/Signup forms, OTP input | JWT generation, OTP verification, Redis sessions |
| **Loading States** | PageLoader, Skeletons | Async responses, proper status codes |
| **Error Handling** | Toast notifications, form errors | ApiError class, validation middleware |
| **Data Fetching** | Redux async thunks | RESTful endpoints with pagination |

---

*Good luck with your interviews!*
