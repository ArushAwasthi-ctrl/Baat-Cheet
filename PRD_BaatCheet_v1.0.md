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

| Layer | Technology | Purpose |
|-------|-------------|----------|
| Frontend | React + Vite + Tailwind CSS + Redux | UI + state management |
| Backend | Node.js + Express | REST APIs + socket server |
| Database | MongoDB + Mongoose | Store users, chats, messages |
| Cache | Redis | Session, presence, message cache |
| Real-time | Socket.IO | Bidirectional real-time events |
| Media | Cloudinary | File and image storage |
| Deployment | Vercel (frontend), Render/Railway (backend), MongoDB Atlas (DB), Upstash/Render (Redis) | Cloud infrastructure |

---

## 🔄 6. User Flow Summary

### 1️⃣ Authentication Flow
- User signs up → password hashed (bcrypt) → JWT issued → token stored (HTTP-only cookie).

### 2️⃣ Chat Flow
- User connects via Socket.IO with JWT validation.  
- Messages emitted to the server (`send_message`).  
- Server broadcasts to receiver socket rooms → both clients update UI instantly.  
- Message saved in MongoDB for persistence.

### 3️⃣ File Upload Flow
- Client uploads → Cloudinary → returns secure URL → message sent with that URL.

### 4️⃣ Group Management Flow
- Create group → invite users → emit `group_created` → all members receive update.

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

- 🤖 **AI Chat Assistant** (OpenAI API integration)
- 🧠 **Chat Summaries & Sentiment Analysis**
- 🌐 **WebRTC Video & Voice Calls**
- 📩 **Email verification + Push notifications**
- ☁️ **Microservice migration with Redis Pub/Sub**
- 📱 **Mobile-friendly PWA version**

---

## 🧩 10. Folder Structure (Backend Example)

```
/server
 ┣ 📁 config/           # DB, Redis, Cloudinary configs
 ┣ 📁 controllers/      # Business logic
 ┣ 📁 models/           # Mongoose schemas
 ┣ 📁 routes/           # Express routes
 ┣ 📁 sockets/          # Socket.IO event handlers
 ┣ 📁 middlewares/      # Auth, error, validation
 ┣ 📁 utils/            # Helpers
 ┣ 📄 server.js         # Entry point
 ┗ 📄 .env.example
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
| Method | Endpoint | Description | Auth |
|---------|-----------|-------------|------|
| POST | `/api/auth/register` | Register a new user | ❌ |
| POST | `/api/auth/login` | Login and get JWT token | ❌ |
| POST | `/api/auth/logout` | Logout user (clear token) | ✅ |
| GET | `/api/auth/refresh` | Refresh JWT token | ✅ |

---

### 👤 Users (`/api/users`)
| Method | Endpoint | Description | Auth |
|---------|-----------|-------------|------|
| GET | `/api/users` | Get all users or search by name/email | ✅ |
| GET | `/api/users/:id` | Get user profile by ID | ✅ |
| PUT | `/api/users/profile` | Update profile (name, bio, avatar) | ✅ |
| PUT | `/api/users/status` | Update presence/status | ✅ |

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

