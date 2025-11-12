# Baat Cheet Backend — Deep Dive and Revision Notes

Version: 2025-11-11

This document is a thorough, interview-ready walkthrough of the current backend implementation. It covers architecture, modules, flows, trade-offs, and production notes. Use it to revise quickly or explain the system end-to-end.

---

## 1 Tech Overview

- Runtime: Node.js (ESM modules)
- Framework: Express
- Database: MongoDB (Mongoose)
- Cache/Key-Value: Redis (node-redis client)
- Auth: JWT (access + refresh tokens)
- Email/OTP: nodemailer + Mailgen (Mailtrap in dev)
- Security: helmet, cookie-based tokens, input validation via express-validator
- Utilities: custom ApiError, ApiResponse, asyncHandler

Key npm packages in use: express, mongoose, jsonwebtoken, redis, nodemailer, mailgen, express-validator, helmet, cookie-parser. Present but not wired yet: morgan, compression, multer, multer-storage-cloudinary.

---

## 2) Folder Structure (Current)

- app.js — Express app and middlewares
- index.js — Bootstrap: loads env, connects DB/Redis, starts server
- controllers/
  - auth-controller.js — Register + OTP verification flow
- db/
  - dbCall.js — Mongoose connection helper
- middlewares/
  - validator-middleware.js — Centralizes express-validator error handling
- models/
  - Users.js — User schema + JWT methods
- redis/
  - redisClient.js — Redis client init and export
- routes/
  - auth-routes.js — /api/auth endpoints and validators
- utils/
  - mailgen.js — Mail transporter + Mailgen content
  - api-error.js — Custom error class
  - api-response.js — Standardized success response wrapper
  - asyncHandler.js — Async error wrapper for Express
- validators/
  - validate.js — Request body validators for auth flows
- package.json — Scripts and deps

---

## 3) High-Level Architecture

Monolithic Node/Express app exposing REST APIs. MongoDB persists users, Redis provides caching and rate-limiting, and email OTP onboard users.

Lifecycle on start (index.js):
1) Load env via dotenv
2) Build Mongo connection string and connect using mongoose (db/dbCall.js)
3) Connect to Redis (redis/redisClient.js)
4) Start HTTP server with app.listen(PORT)

Request handling (app.js):
- Parse JSON, URL-encoded, cookies
- CORS configured for localhost:3000 with credentials
- Security via helmet
- Routes under /api/auth
- Error handling middleware (present, but see placement note in Production Notes)

---

## 4) Environment Variables (Required/Used)

- PORT
- DB_USERNAME, DB_PASSWORD, DB_NAME (used to build MongoDB Atlas URI)
  - Recommended: use a single MONGODB_URI in production to avoid URI-encoding issues.
- REDIS_URL
- ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY
- REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY
- MAIL_TRAP_HOST, MAIL_TRAP_PORT, MAIL_TRAP_USERNAME, MAIL_TRAP_PASSWORD

Optional/recommended later:
- CORS_ORIGINS
- NODE_ENV
- COOKIE_DOMAIN

---

## 5) Data Model: User (models/Users.js)

Fields (selected):
- username: unique, trimmed, 3–30 chars
- email: unique, lowercased, trimmed
- password: required
- avatar: optional URL
- bio: max 150
- isVerified: boolean
- lastSeen: Date
- status: enum("online", "offline")
- friends: [ObjectId ref User]

Instance methods:
- createAccessToken(): signs {_id, email} with ACCESS_TOKEN_SECRET and ACCESS_TOKEN_EXPIRY
- createRefreshToken(): signs {_id} with REFRESH_TOKEN_SECRET and REFRESH_TOKEN_EXPIRY

Notes:
- Unique constraints are defined at the schema level; ensure proper indexes in MongoDB.
- No password hashing here (hashing is done during OTP verification).

---

## 6) Redis Usage (redis/redisClient.js)

Client: node-redis createClient({ url: REDIS_URL })

Keys and purpose:
- register:<email> → JSON { username, email, password, otp } (EX 300s)
- register:ratelimit:<email> → "true" (EX 60s) to throttle OTP requests
- refresh:<userId> → hashed refresh token (EX 7 days)

Why hash refresh token?
- If Redis is compromised, plaintext tokens are not exposed. Server compares hashed value during refresh (refresh route not yet implemented in the codebase).

---

## 7) Email and OTP (utils/mailgen.js)

- Mailgen generates branded HTML/text content
- nodemailer sends via Mailtrap in dev
- OTPVerificationMailGenContent(username, otp): constructs the email body

Operational flow:
- On /register, generate a 6-digit OTP, cache user data in Redis (5 minutes), and send email
- On /verify-otp, compare OTP with Redis, then create the user and issue tokens

---

## 8) Validation (validators + middleware)

- validators/validate.js defines express-validator chains for register/login
- middlewares/validator-middleware.js converts validation errors into a 422 ApiError with field-wise messages
- Usage: route chains run validator, then validate middleware, then controller

---

## 9) Controllers and Routes

Routes: routes/auth-routes.js (mounted at /api/auth)

1) POST /api/auth/register
   - Validators: userRegisterValidator()
   - Logic (controllers/auth-controller.js > registerUser):
     - If user exists (email or username), 409
     - Throttle by Redis key register:ratelimit:<email> (60s)
     - Generate 6-digit OTP
     - Cache temp user data in Redis (register:<email>; EX 300s)
     - Send OTP email (Mailgen + nodemailer)
     - Return 200 with message that verification email was sent

2) POST /api/auth/verify-otp
   - Logic (controllers/auth-controller.js > verifyOtp):
     - Validate presence of email, otp
     - Load temporary user data from Redis
     - Compare OTP; if mismatch/expired, error
     - Ensure user doesn’t already exist
     - Hash password (bcrypt)
     - Create user in Mongo; mark isVerified: true
     - Generate access + refresh tokens
     - Hash refresh token (sha256) and store in Redis under refresh:<userId> (EX 7d)
     - Clear temporary and ratelimit Redis keys
     - Set httpOnly cookies for accessToken (15m) and refreshToken (7d)
     - Respond 201 with user payload (also includes tokens — see Production Notes)

Planned (per PRD) but not yet built:
- Login, Refresh, Logout
- Users/Chats/Groups/Messages/Media routes
- Socket.IO real-time layer

---

## 10) Error and Response Conventions

- ApiResponse(status, data, message): standard success shape
- ApiError(status, message, success=false, errors=[]): custom error with stack capture
- asyncHandler(fn): wraps async handlers to forward errors to Express
- app-level error middleware: currently present in app.js

Recommended: keep the error middleware at the very end (after routes) and include a 404 handler for unknown routes.

---

## 11) CORS, Cookies, and Security

- CORS: currently hardcoded to http://localhost:3000 with credentials
- helmet: applied with default policy
- cookie-parser: read/set cookies; verify-otp sets accessToken/refreshToken cookies:
  - httpOnly: true
  - sameSite: strict (good for same-site, adjust to 'none' + secure for cross-site)
  - secure: NODE_ENV === 'production'

Notes for production:
- If frontend is on a different domain, set sameSite: 'none' and secure: true and app.set('trust proxy', 1) behind a proxy.
- Move CORS origins to env (comma-separated) and implement dynamic origin function.
- Add generic request rate limiting (express-rate-limit), request size limits, and sanitation (express-mongo-sanitize, hpp).

---

## 12) Bootstrapping and Database (index.js, db/dbCall.js)

- index.js builds a Mongo URI from DB_USERNAME/PASSWORD/NAME and connects via dbCall.js
- Then connects to Redis via redisCall
- Starts Express via app.listen(PORT)

Production suggestions:
- Prefer MONGODB_URI supplied from env; encode credentials if building manually
- Add graceful shutdown (SIGINT/SIGTERM) to close Mongo, Redis, and HTTP server cleanly
- Consider mongoose options: maxPoolSize, serverSelectionTimeoutMS, autoIndex=false in prod, retryWrites=true

---

## 13) What’s Not Yet Implemented (but planned per PRD)

- Socket.IO real-time server (and Redis adapter for horizontal scaling)
- User login, refresh, logout routes
- Presence, typing indicators, read receipts
- Chat/Group/Message/Media modules
- Cloudinary upload pipeline (multer + multer-storage-cloudinary are installed but unused)
- Logging (morgan/pino), compression
- Health/readiness endpoints and metrics
- Comprehensive tests and CI

---

## 14) Production Notes and Improvements

Security & cookies
- trust proxy in production for secure cookies
- For cross-site cookies: sameSite='none', secure=true, domain configured via env
- Consider moving tokens exclusively to httpOnly cookies; currently verify-otp also returns tokens in response body (less secure)

Error handling
- Place error middleware after routes; add a 404 handler
- Standardize error response shape (e.g., { error: { message, code, details } })

CORS
- Externalize allowed origins (CORS_ORIGINS), allow array, validate at runtime

Logging & compression
- Enable compression() and morgan (or pino) for prod-grade logs

Redis client
- You have both redis and ioredis in dependencies; only redis is used. Remove the unused one or migrate intentionally to ioredis

Rate limiting & abuse prevention
- You use Redis key TTL for register; add express-rate-limit globally and per-auth route

Validation
- Add login validator to login route when you implement it
- Use a unified validation error response format for consistency

Tokens & refresh flow
- Implement /auth/refresh that verifies hashed refresh token from Redis
- Consider token rotation and invalidation strategies

DB schema & indexes
- Ensure unique indexes on email/username are actually created in MongoDB
- Plan indexes for chat/message reads later (compound indexes on participants/timestamps)

DevEx & quality
- ESLint + Prettier (prettier already used) + Husky + lint-staged
- GitHub Actions for lint/test
- .env.example and (optionally) dotenv-safe

---

## 15) Example End-to-End Flows (Current)

Registration with OTP
1) Client: POST /api/auth/register with { username, email, password }
2) Server: Validates body → checks duplicate user → sets rate-limit key → generates OTP → Redis cache (5m) → sends Mailtrap email → 200 OK
3) Client: Reads success and instructs user to check email
4) Client: POST /api/auth/verify-otp with { email, otp }
5) Server: Validates → loads Redis temp user → compares OTP → hashes password → creates user → issues JWTs → hashes refresh token into Redis → clears temp keys → sets cookies → 201 Created with user payload

---

## 16) How to Run Locally

1) Create .env with required variables (see Section 4)
2) Install deps
   - npm install
3) Start dev
   - npm run dev (nodemon)

Optional (recommended):
- Add nodemon.json to ignore build artifacts
- Add morgan and compression in app.js

---

## 17) Suggested Next Steps (Backlog)

- Implement login, refresh, logout routes
- Extract server = http.createServer(app) and attach Socket.IO, plan Redis adapter
- Add global error/404 handlers and move error middleware to end
- Implement rate limiting, sanitizer (express-mongo-sanitize), hpp, and request size limits
- Add CORS_ORIGINS env and dynamic origin function
- Add compression, morgan/pino, and /healthz
- Create .env.example documenting all keys
- Remove unused dependency (ioredis) or migrate to it intentionally
- Add tests (Jest/Vitest + Supertest) for register/verify flows

---

## 18) Talking Points for Interviews

- Why OTP with Redis? Short-lived state in Redis ensures stateless app instances; avoids creating unverified users in DB; reduces email spam via TTL-based rate-limiting
- Why hash refresh tokens in Redis? Limits blast radius if Redis is compromised; server verifies hashed value during refresh
- Why httpOnly cookies for JWTs? Mitigates XSS token theft risk; combine with sameSite/secure flags for CSRF and cross-site
- Planned scaling strategy: Redis-backed Socket.IO adapter for pub/sub across instances; keep monolith initially, evolve to services only when needed
- Observability plan: request IDs, structured logs, health/readiness endpoints, and metrics for DB/Redis latency and queue depths

---

## 19) Appendix: File-by-File Notes

- app.js
  - Parses bodies and cookies; sets CORS and helmet; mounts /api/auth
  - Contains error middleware early — move to after routes
- index.js
  - Loads env, connects Mongo/Redis, starts server
  - Consider creating http server and attaching Socket.IO when real-time is added
- controllers/auth-controller.js
  - registerUser: OTP issuance and rate-limiting via Redis
  - verifyOtp: user creation, password hashing, JWT issuance, cookie setting, refresh token storage
- models/Users.js
  - JWT helpers on schema; maintain expiries via env
- redis/redisClient.js
  - node-redis client with connect() and error handler; exports redisClient and init function
- utils/
  - api-error.js: standard error class
  - api-response.js: unified success response
  - asyncHandler.js: promise-based error propagation
  - mailgen.js: Mailtrap transporter + Mailgen content
- validators/
  - validate.js: registration + login chains (login yet to be wired)
- middlewares/validator-middleware.js
  - Centralized validation error formatting with 422

---

This document will evolve as new modules (users, chats, groups, messages, media, sockets) are added. Keep it updated to reflect your architecture decisions and trade-offs.
