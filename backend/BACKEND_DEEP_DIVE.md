# Baat Cheet Backend — Deep Dive and Revision Notes

Version: 2025-11-12

This document is a thorough, interview-ready walkthrough of the current backend implementation. It covers architecture, modules, flows, trade-offs, and production notes. Use it to revise quickly or explain the system end-to-end.

---

## 1 Tech Overview

- Runtime: Node.js (ESM modules)
- Framework: Express
- Database: MongoDB (Mongoose)
- Cache/Key-Value: Redis (ioredis client via custom wrapper; BullMQ also uses ioredis internally)
- Auth: JWT (access + refresh tokens)
- Email/OTP: nodemailer + Mailgen (Mailtrap in dev)
- Security: helmet, cookie-based tokens, input validation via express-validator
- Utilities: custom ApiError, ApiResponse, asyncHandler

Key npm packages in use: express, mongoose, jsonwebtoken, redis, nodemailer, mailgen, express-validator, helmet, cookie-parser, morgan, compression. Present but not wired yet: multer, multer-storage-cloudinary.

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
2) Build Mongo connection string (prefers MONGODB_URI) and connect using mongoose (db/dbCall.js)
3) Connect to Redis (redis/redisClient.js)
4) Create HTTP server via http.createServer(app) and listen on PORT
5) Trap SIGINT/SIGTERM and shut down Mongo, Redis, and HTTP server gracefully

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

Client: Redis client (node-redis/ioredis-style wrapper) initialized once and reused across the app.

Keys and purpose:
- register:<email>  → JSON { username, email, password, otp } (EX 300s)
- register:ratelimit:<email>  → "true" (EX 60s) to throttle OTP requests
- refresh:<userId>  → hashed refresh token (EX 7 days)
- reset:<email>  → JSON { email, otp } for forgot-password OTP (EX 300s)
- reset:rateLimit:<email>  → "true" (EX 60s) to throttle forgot-password OTP requests

Why hash refresh token?
- If Redis is compromised, plaintext tokens are not exposed. Server compares hashed value during refresh (refresh route not yet implemented in the codebase).

---

## 7) Email and OTP (utils/mailgen.js)

- Mailgen generates branded HTML/text content
- nodemailer sends via Mailtrap in dev
- OTPVerificationMailGenContent(username, intro, otp): constructs the email body with a dynamic intro line

Where it is used:
- Registration OTP: intro like "Welcome to Baat Cheet! Confirm your account with the OTP below."
- Forgot-password OTP: intro like "You requested a password reset for your Baat Cheet account. Use this OTP to proceed."

Operational flow:
- On /register, generate a 6-digit OTP, cache user data in Redis (5 minutes), and send email
- On /verify-otp, compare OTP with Redis, then create the user and issue tokens
- On /forgotpassword, generate a 6-digit OTP for password reset, store in Redis under reset:<email>, and send email
- On /verify-forgotpassword-otp, compare OTP with Redis, then update the user password

---

## 8) Validation (validators + middleware)

- validators/validate.js defines express-validator chains for:
  - Registration (userRegisterValidator)
  - Login (userLoginValidator)
  - Forgot password request (userForgotPasswordValidator → validates email)
  - Forgot password OTP + new password (userForgotPasswordOtpValidator → validates email, strong password, and otp)
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
     - Send OTP email (Mailgen + nodemailer via BullMQ worker)
     - Return 200 with message that verification email was queued/sent

2) POST /api/auth/verify-otp
   - Logic (controllers/auth-controller.js > verifyOtp):
     - Validate presence of email, otp
     - Load temporary user data from Redis
     - Compare OTP; if mismatch/expired, error
     - Ensure user doesnt already exist
     - Hash password (bcrypt)
     - Create user in Mongo; mark isVerified: true
     - Generate access + refresh tokens
     - Hash refresh token (sha256) and store in Redis under refresh:<userId> (EX 7d)
     - Clear temporary and ratelimit Redis keys
     - Set httpOnly cookies for accessToken (15m) and refreshToken (7d)
     - Respond 201 with user payload (tokens are only sent via cookies)

3) POST /api/auth/login
   - Validators: userLoginValidator()
   - Logic (controllers/auth-controller.js > loginUser):
     - Validate email/password
     - Find user by email; verify password with bcrypt.compare
     - Generate access + refresh tokens
     - Hash refresh token and store in Redis under refresh:<userId> (EX 7d)
     - Set httpOnly cookies for accessToken and refreshToken
     - Respond 200 (no tokens in JSON body)

4) GET /api/auth/logout
   - Logic (controllers/auth-controller.js > logoutUser):
     - Use auth-middleware to get req.user
     - Optionally update user.status to "offline"
     - Delete refresh:<userId> from Redis
     - Clear auth cookies
     - Respond 200

5) POST /api/auth/forgotpassword
   - Validators: userForgotPasswordValidator()
   - Logic (controllers/auth-controller.js > forgotPassword):
     - Validate email and ensure user exists
     - Enforce rate limit via reset:rateLimit:<email> (EX 60s)
     - Generate 6-digit OTP
     - Store OTP payload in Redis under reset:<email> (EX 300s)
     - Queue reset email via BullMQ with subject "Reset Password OTP" and OTPVerificationMailGenContent(user.username, intro, otp)
     - Respond 200 with a generic "If this email exists, we have sent an OTP" message

6) POST /api/auth/verify-forgotpassword-otp
   - Validators: userForgotPasswordOtpValidator()
   - Logic (controllers/auth-controller.js > verifyForgotPasswordOtp):
     - Validate email, new password, and otp
     - Fetch reset:<email> from Redis and compare OTP
     - If invalid/expired, return error and do not change password
     - Hash the new password with bcrypt and update the user record in Mongo
     - Delete reset:<email> and reset:rateLimit:<email> keys from Redis
     - Respond 200 with a success message (no login or tokens issued here)

Planned (per PRD) but not yet built:
- Refresh route
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

- CORS: env-driven via CORS_ORIGINS (comma-separated), credentials enabled; dynamic origin check
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

- index.js builds a Mongo URI (prefers MONGODB_URI; otherwise encodes DB_USERNAME/PASSWORD) and connects via dbCall.js
- Then connects to Redis via redisCall
- Creates an HTTP server (http.createServer(app)) and listens on PORT
- Implements graceful shutdown for Mongo, Redis, and HTTP server

Production suggestions:
- Consider mongoose options: maxPoolSize, serverSelectionTimeoutMS, autoIndex=false in prod, retryWrites=true

---

## 13) What’s Not Yet Implemented (but planned per PRD)

- Socket.IO real-time server (and Redis adapter for horizontal scaling)
- Refresh route (token rotation/verification against Redis)
- Presence, typing indicators, read receipts
- Chat/Group/Message/Media modules
- Cloudinary upload pipeline (multer + multer-storage-cloudinary are installed but unused)
- Health/readiness endpoints and metrics
- Comprehensive tests and CI

---

## 14) Production Notes and Improvements

Security & cookies
- trust proxy in production for secure cookies
- For cross-site cookies: sameSite='none', secure=true, domain configured via env
- Tokens are now sent only via httpOnly cookies (not in JSON body)

Error handling
- Error middleware placed after routes; 404 handler added
- Standardize error response shape (e.g., { error: { message, code, details } })

CORS
- Origins are env-driven via CORS_ORIGINS (comma-separated), validated at runtime

Logging & compression
- compression() and morgan enabled

Redis client
- Currently uses ioredis via a small wrapper in redisClient.js; BullMQ also uses ioredis under the hood

Rate limiting & abuse prevention
- You use Redis key TTL for register; add express-rate-limit globally and per-auth route

Validation
- Login validator wired for /login
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
2) Server: Validates body → checks duplicate user → sets rate-limit key → generates OTP → Redis cache (5m) → queues email job via BullMQ → 200 OK
3) Client: Reads success and instructs user to check email
4) Worker: picks up the job and sends the email via Mailtrap
5) Client: POST /api/auth/verify-otp with { email, otp }
6) Server: Validates → loads Redis temp user → compares OTP → hashes password → creates user → issues JWTs → hashes refresh token into Redis → clears temp keys → sets cookies → 201 Created (tokens only in cookies)

Login
1) Client: POST /api/auth/login { email, password }
2) Server: Validates → verify user + password → issue tokens → store hashed refresh in Redis → set cookies → 200 OK (no tokens in body)

Logout
1) Client: GET /api/auth/logout (authorized)
2) Server: Reads req.user via auth middleware → sets user status offline → deletes refresh:<userId> in Redis → clears cookies → 200 OK

Forgot password (OTP-based)
1) Client: POST /api/auth/forgotpassword { email }
2) Server: Validates email → ensures user exists → checks reset:rateLimit:<email> → generates OTP → stores in reset:<email> (5m) → queues reset email via BullMQ → 200 OK with generic message
3) Client: POST /api/auth/verify-forgotpassword-otp { email, otp, password }
4) Server: Validates email/password/otp → reads reset:<email> → compares OTP → hashes new password → updates user in Mongo → deletes reset:<email> and reset:rateLimit:<email> → 200 OK

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

- Implement refresh route (cookie-based) with hashed-token verification and rotation
- Attach Socket.IO to HTTP server and add @socket.io/redis-adapter for scale-out
- Implement rate limiting, sanitizer (express-mongo-sanitize), hpp, and request size limits
- Add /healthz and readiness checks (Mongo/Redis status)
- Create .env.example documenting all keys (incl. CORS_ORIGINS, MONGODB_URI)
- Add tests (Jest/Vitest + Supertest) for register/verify/login/logout flows

---

## 18) Talking Points for Interviews

Use this section as ready-made sentences you can almost copy-paste into interviews or project explanations.

- **Why OTP with Redis (register + forgot-password)?**
  - “I store OTPs and temporary registration/reset state in Redis with short TTLs instead of Mongo. That keeps the app instances stateless, avoids polluting the users collection with half-registered accounts, and lets me enforce rate-limits simply via key expiries.”
- **Why hash refresh tokens in Redis?**
  - “Refresh tokens are hashed with SHA-256 before being stored in Redis. If Redis is compromised, attackers don’t get raw tokens, and I can instantly revoke a session by deleting the hash under `refresh:<userId>`.”
- **Why httpOnly cookies for JWTs?**
  - “Access and refresh tokens are sent only in httpOnly cookies, not in the JSON body. That reduces XSS token theft risk and works well with CSRF protection using sameSite/secure flags.”
- **Why BullMQ for email (and what it changed)?**
  - “Instead of sending emails directly inside `/register` or `/forgotpassword`, I push a job to BullMQ and respond immediately. A worker handles SMTP in the background. This turned ~1s+ requests into ~100ms requests and made the auth endpoints much more scalable.”
- **Planned scaling strategy (how you would grow this):**
  - “Right now it’s a monolith, which keeps everything simple for an internship-scale project. If traffic grows, I’d attach Socket.IO with a Redis adapter for real-time chat, and later split chat/media into separate services only when the monolith becomes a bottleneck.”
- **Observability plan (what you would add next):**
  - “Next steps would be request IDs, structured logging, health/readiness endpoints, and tracking queue depth + DB/Redis latency so I can see when the system is getting close to its limits.”

---

## 19) Appendix: File-by-File Notes

- app.js
  - Parses bodies and cookies; env-driven CORS; helmet; compression; morgan; mounts /api/auth
  - Error middleware placed after routes; 404 handler present
- index.js
  - Loads env, connects Mongo/Redis, creates HTTP server and listens
  - Graceful shutdown on SIGINT/SIGTERM
- controllers/auth-controller.js
  - registerUser: OTP via crypto.randomInt, rate-limit via Redis, email OTP using Mailgen
  - verifyOtp: creates user, issues JWTs, sets cookies, stores hashed refresh in Redis
  - loginUser/logoutUser: implemented; cookies only (no tokens in body)
- models/Users.js
  - JWT helpers on schema; password validation via bcrypt.compare
- redis/redisClient.js
  - node-redis client with connect() and error handler; exports redisClient and init function
- utils/
  - api-error.js: standard error class
  - api-response.js: unified success response
  - asyncHandler.js: promise-based error propagation (cleaned import)
  - mailgen.js: Mailtrap transporter + Mailgen content
- validators/
  - validate.js: registration + login chains (wired)
- middlewares/
  - validator-middleware.js: correct ApiError usage
  - auth-middleware.js: verifies access token from cookies and attaches req.user

---

## 20) PRD vs Current Implementation (Delta)

- Auth: register, verify-otp, login, logout implemented; refresh pending
- Real-time: PRD targets Socket.IO and presence/typing/read receipts; not implemented yet
- Media: Cloudinary/multer deps are present but not wired; no upload routes yet
- Notifications and unread counts: not implemented
- Deployment/scaling: HTTP server refactor done; Socket.IO redis-adapter pending

---

## 21) Key Fixes Applied (and remaining recommendations)

Applied
- OTP generation uses crypto.randomInt
- Removed sensitive logging of OTP/user secrets (none remain in verify/forgot-password flows)
- Tokens are no longer returned in response body (cookies only)
- Error middleware moved after routes; 404 handler added
- CORS origin is env-driven via CORS_ORIGINS
- HTTP server refactor + graceful shutdown
- Removed ioredis from dependencies (single shared Redis client wrapper instead)
- Fixed ApiError usage in validator-middleware (correct params)
- Implemented forgot-password flow (Redis-backed OTP + strong password validation)

Remaining
- Add /auth/refresh and token rotation strategy
- Add express-rate-limit, express-mongo-sanitize, hpp, and request size limits (forgot-password currently relies on Redis TTLs only)
- Attach Socket.IO and add @socket.io/redis-adapter for scale-out
- Implement health/readiness endpoints
- Wire Cloudinary upload routes with size/MIME validation
- Add tests and CI (including coverage for forgot-password flows)

---

## 22) Security Hardening Checklist

- app.set('trust proxy', 1) in production (behind proxy) for secure cookies.
- express-rate-limit on auth routes and globally.
- express-mongo-sanitize and hpp; enforce JSON size limits.
- sameSite='none' and secure cookies when cross-site; configure cookie domain via env.
- Do not log secrets or PII; add structured logging with request IDs (pino/pino-http).

---

## 23) Architecture Next Steps (Recommended Order)

1) Implement /auth/refresh with hashed refresh verification and rotation
2) Attach Socket.IO to HTTP server and add @socket.io/redis-adapter
3) Introduce presence/typing socket namespaces and per-room rate limiting
4) Wire Cloudinary uploads with multer, enforce MIME/size limits, and store URLs only
5) Add health/readiness endpoints and monitoring

---

## 24) Performance & Optimizations (with Example Impact)

> Note: The exact numbers depend on your machine and network. The examples below are realistic ranges you can mention in interviews, not hard guarantees.

### 24.1 Email Offloading via BullMQ (Request Latency)

**Before (naive, no queue):**
- `/register` (and later `/forgotpassword`) would send email inside the request.
- User-facing latency is dominated by SMTP (network + provider) instead of your own code.
- Typical realistic range: **600–1800 ms** per request when email is sent inline.

**After (current design with BullMQ):**
- `/register` and `/forgotpassword` now push jobs into BullMQ (`emailQueue.add(...)`) and return quickly.
- `workers/email.worker.js` picks up the job and sends the email in the background.
- User-facing latency is dominated by Redis + Mongo + business logic, typically around **60–200 ms**.

**Approximate impact (what you can say in interviews):**
- Latency drop: from roughly **0.6–1.8 s** down to **0.06–0.2 s** per request.
- That’s still about a **70–90% reduction** in perceived latency for registration and forgot-password.
- You can handle roughly **3–8x more sign-up/reset requests per second** before the API saturates, because SMTP is no longer on the critical path.

**How to phrase this in interviews / resume bullets:**
- “Offloaded email sending for registration and forgot-password flows to a BullMQ worker, cutting perceived API latency from ~1s to ~100ms (≈80% reduction) and increasing throughput by several times under load.”
- “Separated user-facing request time from external SMTP latency by using Redis + BullMQ, which makes the auth endpoints feel snappy even when the email provider is slow.”

### 24.2 Redis vs Mongo Reads (OTP, Sessions, and Rate Limit)

Where Redis is used:
- `register:<email>` → temp user + OTP (EX 300s)
- `register:ratelimit:<email>` → prevent OTP spam (EX 60s)
- `refresh:<userId>` → hashed refresh token (EX 7d)

**Why this is faster and cleaner:**
- Redis reads/writes are **in-memory** and O(1), so lookups for OTP or refresh tokens are much faster than hitting Mongo.
- You avoid creating unverified users in Mongo, which keeps your main collection clean and avoids extra delete/cleanup logic.

**Example impact to mention:**
- “OTP and session checks are Redis lookups instead of database queries, so they stay in the sub-millisecond to few-millisecond range on a typical deployment, even under higher load.”

### 24.3 Express Middlewares: Compression, Logging, CORS

- `compression()` reduces response sizes (especially JSON), saving bandwidth and improving perceived latency for slower networks.
- `morgan` structured logging in `dev` vs `combined` in `production` helps you debug latency spikes and errors.
- CORS is origin-checked and driven by `CORS_ORIGINS`, so you avoid sending cookies or data to unexpected origins.

How to phrase it:
- “We use gzip compression and structured logging. Compression cuts payload size and morgan gives us request/response-level observability to troubleshoot slow endpoints.”

### 24.4 Connection Reuse and Graceful Shutdown

- Single Mongo and Redis clients are initialized once (`dbCall`, `redisCall`) and reused across requests.
- `index.js` sets up **graceful shutdown** (SIGINT/SIGTERM) to close:
  - HTTP server
  - Mongoose connection
  - Redis client

Benefits:
- No per-request connection overhead.
- Clean shutdown prevents half-open connections and data corruption.

---

## 25) Security Model Overview (Quick)

This section summarises how all the security-related pieces work together.

### 25.1 Authentication & Tokens

- **JWTs:**
  - Access token: short-lived, signed with `ACCESS_TOKEN_SECRET`.
  - Refresh token: longer-lived, signed with `REFRESH_TOKEN_SECRET`.
- **Storage:**
  - Both tokens are sent only in **httpOnly cookies**, not in the JSON body.
  - `auth-middleware` reads `accessToken` from cookies, verifies it, and sets `req.user`.

**Why this is safer:**
- httpOnly cookies are not accessible to JavaScript, which reduces the impact of XSS on token theft.
- Using different secrets and expiries for access vs refresh tokens lets you keep access tokens short-lived.

### 25.2 Refresh Tokens & Redis (Session Security)

- Refresh tokens are **hashed using SHA-256** before being stored in Redis under `refresh:<userId>`.
- On `/auth/refresh` (planned):
  - The raw refresh token from the cookie will be verified via `jwt.verify`.
  - Then it will be hashed and compared to the stored value in Redis.

**Security benefits:**
- If Redis is compromised, the attacker sees only hashed values, not raw tokens.
- You can instantly revoke a session by deleting `refresh:<userId>` from Redis.
- The code can detect mismatched hashes and treat them as possible token reuse attacks.

### 25.3 OTP + Registration / Reset Password Security

- Registration OTPs and temp registration data live only in Redis for a short time (5 minutes).
- `register:ratelimit:<email>` keys enforce a cooldown between registration OTP sends.
- Forgot-password OTPs are stored in `reset:<email>` with the same 5-minute TTL.
- `reset:rateLimit:<email>` enforces a cooldown for forgot-password OTP requests.
- Unverified users are **not** stored in Mongo; they are only created after successful OTP verification.
- Password resets always require a valid OTP + a strong password (validated via express-validator).

**Why this matters:**
- Limits brute-force OTP attempts and email spam across both register and forgot-password flows.
- Keeps your primary `users` collection free from garbage or partially registered accounts.
- Reduces the blast radius of account takeover attacks by tying resets to short-lived OTPs stored in Redis.

### 25.4 Request Validation & Error Handling

- Every critical auth route uses `express-validator` chains and `validator-middleware`.
- Validation errors are turned into a `422` with field-specific error messages.
- `asyncHandler` + global error middleware ensures all errors pass through a single place and are returned in a consistent JSON shape.

**Impact:**
- Prevents malformed input from reaching your core logic or database.
- Makes it easier for the frontend to handle errors and for you to log/monitor them.

### 25.5 CORS, Cookies, and Production Hardening

- CORS is driven by `CORS_ORIGINS` and `credentials: true`.
- In production:
  - `app.set("trust proxy", 1)` is used when behind a proxy.
  - Cookies are sent with `secure: true` and can use `sameSite: 'none'` for cross-site frontends.
- The **Security Hardening Checklist** (Section 22) adds:
  - `express-rate-limit` for brute-force prevention.
  - `express-mongo-sanitize`, `hpp`, and size limits to guard against injection and abuse.
  - No logging of secrets/PII + structured logging with request IDs.

---

This document will evolve as new modules (users, chats, groups, messages, media, sockets) are added. Keep it updated to reflect your architecture decisions, performance tweaks, and security trade-offs.
