# 🗨️ Baat Cheet — Real-Time Chat Application  
**PRD v1.0 (Professional + Developer Hybrid)**  
Prepared by: **Arush Awasthi**  

---

## 🎯 1. Product Overview

**Baat Cheet** is a modern, real-time chat application built using the **MERN Stack** (MongoDB, Express, React, Node.js) with **Redis** and **Socket.IO** for real-time communication.

It’s designed to be a **production-grade, scalable chat platform** supporting:
- Real-time one-to-one and group messaging  
- File & media sharing  
- Online/offline presence tracking  
- Typing indicators  
- Secure JWT authentication  
- Optimized architecture for speed and scalability  

### 🔥 Why this project?
- Demonstrates **system design, scalability, and backend depth** (not just CRUD).  
- Acts as a solid portfolio project for **10–12 LPA SDE/Full Stack roles**.  
- Teaches Redis, WebSockets, and Cloud integration in a real product setup.  

---

## 👥 2. Target Audience

| User Type | Description |
|------------|-------------|
| Regular Users | People who want to chat or share files in real-time |
| Developers | Those learning MERN + Redis + Socket.IO architecture |
| Recruiters | To evaluate Arush’s real-world full-stack engineering capability |

---

## 🧩 3. Core Features

### 👤 User & Authentication
- Signup / Login / Logout with JWT  
- Secure password hashing (bcrypt)  
- User profiles with avatar, bio, and status  
- Cloudinary integration for profile and media uploads  
- Presence status using Redis (online/offline)

### 💬 Chat & Messaging
- 1:1 and group messaging  
- Real-time delivery using **Socket.IO**  
- Message types: text, image, file  
- Message read receipts  
- Typing indicators  
- Chat list with recent message preview  
- Chat search and message filtering  

### 👥 Group Chats
- Create / delete group chats  
- Add / remove members  
- Assign or revoke admin roles  
- Group name and image customization  

### 🧰 File & Media
- Upload files/images via **Cloudinary**  
- Preview before sending  
- Store media URLs in MongoDB  

### 🔔 Notifications
- Real-time notifications for new messages  
- Unread message count per chat  
- Push-style toast or bell icon indicator  

---

## 🏗️ 4. Architecture Overview

### 🧱 System Type
Monolithic architecture — single Node.js + Express server handling REST + WebSocket logic.

### ⚙️ Flow Summary
1. **Client (React)** connects to backend via REST + Socket.IO.  
2. **Backend (Node + Express)** handles:
   - Auth & chat APIs  
   - Socket.IO events for message delivery and presence  
3. **Database (MongoDB)** stores users, chats, messages, and media URLs.  
4. **Redis** acts as:
   - Cache for user sessions and online status  
   - Temporary message store (for scaling in future)  
5. **Cloudinary** stores all media and file uploads.  

### 📊 Data Flow
```
Client → Express REST API → MongoDB (persistent data)
Client ↔ Socket.IO → Redis (real-time events, presence, cache)
File Upload → Cloudinary → MongoDB (URL reference)
```

---

## 🧠 5. Tech Stack

|| Layer | Technology | Purpose |
||-------|-------------|----------|
|| Frontend | React + Vite + Tailwind CSS + TanStack React Query + Framer Motion | UI, async state, and animations |
|| Backend | Node.js + Express | REST APIs (auth now implemented) |
|| Database | MongoDB + Mongoose | Store users, chats, messages (users implemented) |
|| Cache / KV | Redis (Upstash/Render) | OTPs, refresh tokens, rate limits, presence (planned) |
|| Real-time | Socket.IO (planned) | Bidirectional real-time events (chat, presence) |
|| Queues | BullMQ | Offload email sending to worker processes |
|| Email | Nodemailer + Mailgen | HTML emails for OTP and password reset |
|| Media | Cloudinary (planned) | File and image storage |
|| Deployment | Vercel (frontend), Render/Railway (backend), MongoDB Atlas (DB), Upstash/Render (Redis) | Cloud infrastructure |

---

## 🔄 6. User Flow Summary

### 1️⃣ Authentication Flow (implemented)
- User registers → OTP sent via email (BullMQ + Mailgen) → OTP verified → password hashed (bcrypt) → JWT access + refresh tokens issued.
- Tokens are stored in **httpOnly cookies** (no tokens in JSON body).
- Refresh tokens are **hashed** and stored in Redis, keyed by `refresh:<userId>`.
- Refresh endpoint issues a new access token using the refresh token from cookies.

> Status: **Implemented in backend** (`/api/auth/register`, `/verify-otp`, `/login`, `/logout`, `/refresh`, `/forgotpassword`, `/verify-forgotpassword-otp`, `/resend-verify-otp`).

### 2️⃣ Chat Flow
- Planned: User connects via Socket.IO with JWT validation.
- Messages will be emitted to the server (`send_message`).
- Server will broadcast to receiver socket rooms → both clients update UI instantly.
- Messages will be saved in MongoDB for persistence.

> Status: **Planned** (not yet implemented in current codebase; currently only Users + Auth APIs are live).

### 3️⃣ File Upload Flow
- Client uploads → Cloudinary → returns secure URL → message sent with that URL.

### 4️⃣ Group Management Flow
- Planned: Create group → invite users → emit `group_created` → all members receive update.

> Status: **Planned** (no group routes/models yet).

---

## ⚙️ 7. Non-Functional Requirements

| Category | Requirement |
|-----------|--------------|
| Performance | Low-latency (<200ms) message delivery |
| Scalability | Easily extendable with Redis Pub/Sub in future |
| Security | JWT auth, bcrypt hashing, input validation, rate limiting |
| Reliability | Auto-reconnect sockets, message persistence in DB |
| UX | Smooth animations (Framer Motion), optimized rendering with TanStack Query |
| Maintainability | Modular file structure, reusable hooks/components |

---

## 🗺️ 8. Implementation Plan (Phase-Wise)

| Phase | Module | Description |
|--------|---------|-------------|
| Phase 1 | Setup & Auth | Project structure, DB connect, JWT auth |
| Phase 2 | Chat Core | Socket.IO setup, 1:1 messaging |
| Phase 3 | Groups | Group chat logic, admin management |
| Phase 4 | Files | Cloudinary integration, media sharing |
| Phase 5 | UI Polish | Tailwind, Framer Motion, Redux state |
| Phase 6 | Deployment | Vercel + Render setup, environment configs |
| Phase 7 | Extras | Typing, read receipts, AI assistant, WebRTC calls |

---

## 🚀 9. Future Enhancements

- 💬 **Chat + groups + real-time messaging** (Socket.IO + Mongo models for chats/messages)
- 🤖 **AI Chat Assistant** (OpenAI API integration)
- 🧠 **Chat Summaries & Sentiment Analysis**
- 🌐 **WebRTC Video & Voice Calls**
- 📩 **Push notifications** (browser/mobile)
- ☁️ **Microservice migration with Redis Pub/Sub**
- 📱 **Mobile-friendly PWA version**

---

## 🧩 10. Folder Structure (Backend - current)

```
/backend
 ┣ 📁 controllers/        # auth-controller.js (register, OTP, login, logout, refresh, forgot-password)
 ┣ 📁 db/                 # dbCall.js (MongoDB connection)
 ┣ 📁 middlewares/        # auth-middleware.js, validator-middleware.js
 ┣ 📁 models/             # Users.js (user schema + JWT helpers)
 ┣ 📁 queues/             # email.queue.js (BullMQ queue for emails)
 ┣ 📁 redis/              # redisClient.js (Redis connection wrapper)
 ┣ 📁 routes/             # auth-routes.js (auth-related routes)
 ┣ 📁 utils/              # api-error, api-response, asyncHandler, mailgen
 ┣ 📁 validators/         # validate.js (auth validators)
 ┣ 📁 workers/            # email.worker.js (BullMQ worker for sending emails)
 ┣ 📄 app.js              # Express app setup (CORS, helmet, cookies, routes)
 ┣ 📄 index.js            # Server bootstrap (env, DB, Redis, HTTP server)
 ┣ 📄 BACKEND_DEEP_DIVE.md# Deep backend notes + interview prep
 ┗ 📄 package.json        # Backend scripts and dependencies
```

---

## 🏁 11. Project Goals

- ✅ Build a **production-quality** chat app with clean code.  
- ✅ Demonstrate mastery in **MERN, Redis, WebSockets, Cloudinary, JWT**.  
- ✅ Create a **resume-worthy** project reflecting real-world architecture.  
- ✅ Use it as a strong **case study in interviews** for 10–12 LPA offers.

---

**Author:** Arush Awasthi  
**Version:** 1.0  
**Date:** November 2025  
**Status:** Planning → Development Stage  


---

## 🔌 12. API Specification (Full Set)

### 🧍 Authentication (`/api/auth`)
|| Method | Endpoint | Description | Auth | Status |
||---------|-----------|-------------|------|--------|
|| POST | `/api/auth/register` | Register a new user and send OTP via email | ❌ | ✅ Implemented |
|| POST | `/api/auth/resend-verify-otp` | Resend verification OTP with Redis rate limiting | ❌ | ✅ Implemented |
|| POST | `/api/auth/verify-otp` | Verify OTP and complete registration | ❌ | ✅ Implemented |
|| POST | `/api/auth/login` | Login and set JWT tokens in httpOnly cookies | ❌ | ✅ Implemented |
|| GET | `/api/auth/logout` | Logout user (clear cookies, delete refresh in Redis) | ✅ | ✅ Implemented |
|| POST | `/api/auth/refresh` | Refresh access token using refresh token from cookies | ❌ | ✅ Implemented |
|| POST | `/api/auth/forgotpassword` | Send OTP for password reset | ❌ | ✅ Implemented |
|| POST | `/api/auth/verify-forgotpassword-otp` | Verify reset OTP and set new password | ❌ | ✅ Implemented |

---

### 👤 Users (`/api/users`)
|| Method | Endpoint | Description | Auth | Status |
||---------|-----------|-------------|------|--------|
|| GET | `/api/users/me` | Get current logged-in user profile | ✅ | ✅ Implemented |
|| GET | `/api/users` | List/search users with cursor-based pagination (excludes self) | ✅ | ✅ Implemented |
|| GET | `/api/users/:id` | Get user profile by ID | ✅ | Planned |
|| PUT | `/api/users/profile` | Update own profile (username, bio, avatar) | ✅ | Planned |
|| PUT | `/api/users/status` | Update presence/status | ✅ | Planned |

---

### 💬 Chats (`/api/chats`)
| Method | Endpoint | Description | Auth |
|---------|-----------|-------------|------|
| POST | `/api/chats` | Create 1-to-1 chat | ✅ |
| GET | `/api/chats` | Get all chats for logged-in user | ✅ |
| GET | `/api/chats/:id` | Get specific chat details | ✅ |
| DELETE | `/api/chats/:id` | Delete chat | ✅ |

---

### 👥 Groups (`/api/groups`)
| Method | Endpoint | Description | Auth |
|---------|-----------|-------------|------|
| POST | `/api/groups` | Create new group chat | ✅ |
| PUT | `/api/groups/:id` | Update group info (name, image) | ✅ |
| PUT | `/api/groups/:id/add` | Add user to group | ✅ |
| PUT | `/api/groups/:id/remove` | Remove user from group | ✅ |
| DELETE | `/api/groups/:id` | Delete group | ✅ |

---

### 📨 Messages (`/api/messages`)
| Method | Endpoint | Description | Auth |
|---------|-----------|-------------|------|
| POST | `/api/messages` | Send message (text/file) | ✅ |
| GET | `/api/messages/:chatId` | Get all messages of a chat | ✅ |
| PUT | `/api/messages/:id/read` | Mark message as read | ✅ |
| DELETE | `/api/messages/:id` | Delete message | ✅ |

---

### 📁 Media (`/api/media`)
| Method | Endpoint | Description | Auth |
|---------|-----------|-------------|------|
| POST | `/api/media/upload` | Upload file/image to Cloudinary | ✅ |
| DELETE | `/api/media/:publicId` | Delete file/image from Cloudinary | ✅ |

---

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Description | Auth |
|---------|-----------|-------------|------|
| GET | `/api/notifications` | Get all notifications | ✅ |
| PUT | `/api/notifications/read` | Mark notifications as read | ✅ |
| GET | `/api/notifications/unread-count` | Get unread message count | ✅ |

---

