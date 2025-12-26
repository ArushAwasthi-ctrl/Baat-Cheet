# Baat Cheet Frontend — Deep Dive & Interview Notes

Version: 2025-11-25  
Maintainer: Arush Awasthi  
Scope: React + Vite frontend (landing, auth, chat experience)

---

## 1. Tech Overview

| Layer | Decisions | Rationale |
|-------|-----------|-----------|
| Framework | React 19 + Vite 5 | Fast dev server, future-ready React features |
| Styling | Tailwind CSS 4 + shadcn/ui + custom tokens | Utility speed + component consistency |
| Animations | Framer Motion + tw-animate-css | Page transitions, micro-interactions, loading states |
| State | React Redux Toolkit | Predictable global state, async thunks for API |
| Routing | React Router 7 | Nested routes, loader-friendly, suspense-ready |
| Forms | React Hook Form + Zod | Type-safe validation, great DX |
| HTTP | Axios instance (with interceptors) | Cookie-based auth, centralized error handling |
| Realtime | Socket.IO Client (phase 2) | Matches backend Socket.IO plan |

### Guiding principles
- **UX-first**: landing + auth flows feel premium before diving into chat.
- **Reusable atoms**: buttons, inputs, modals all come from shadcn layer.
- **State isolation**: UI state vs server data vs socket events are separated.
- **Interview-ready narrative**: every choice is defensible (security, DX, scalability).

---

## 2. Folder Structure (Frontend)

```
frontend/
 ┣ src/
 ┃ ┣ assets/          # Static images/icons
 ┃ ┣ components/
 ┃ ┃ ┣ ui/            # shadcn-generated primitives
 ┃ ┃ ┗ shared/        # App-specific atoms (AvatarMenu, Sidebar, etc.)
 ┃ ┣ pages/           # Route-level screens (Landing, Login, Chat, Profile)
 ┃ ┣ layouts/         # Layout shells (AuthLayout, ChatLayout)
 ┃ ┣ store/           # Redux store + slices + thunks
 ┃ ┣ services/        # Axios instance + API modules
 ┃ ┣ hooks/           # Custom hooks (useAuthGuard, useSocket, useToast)
 ┃ ┣ utils/           # helpers (cn, formatDate, sanitizeHTML)
 ┃ ┗ App.jsx, main.jsx, index.css
 ┣ components.json    # shadcn config
 ┣ FRONTEND_DEEP_DIVE.md
 ┗ PRD_BaatCheet_v1.0.md (shared)
```

Folder goals:
- `pages/` own routing and fetch data via hooks.
- `components/ui/` stays pure (no business logic).
- `store/` handles global sessions, chats, messages, UI toggles.
- `services/` is the single place that knows endpoints.

---

## 3. Data & State Flow

### 3.1 Authentication bootstrap
1. `App.jsx` dispatches `checkAuth()` on mount.
2. `authSlice` calls `/api/users/me` via `authService`.
3. While pending, `FullScreenLoader` (Framer Motion fade) blocks the UI.
4. On success: `isAuthenticated = true`, routes unlock. On failure: user stays on landing.

### 3.2 Redux slices (planned)

| Slice | Purpose |
|-------|---------|
| `authSlice` | user info, tokens managed via cookies, thunks: checkAuth/login/logout/register/verifyOtp |
| `chatSlice` | chat list, active chat, pagination cursor, search query |
| `messageSlice` | normalized messages per chat, loading older/ newer batches |
| `socketSlice` | socket connection state, online users, typing indicators |
| `uiSlice` | sidebar visibility, modals, toasts, theme mode |

Async flow: `component → dispatch thunk → service (axios) → reducer`.

### 3.3 Axios / API layer
- `services/api.js`: base URL from `import.meta.env.VITE_API_URL`, `withCredentials: true`.
- Interceptor handles 401 → call `/api/auth/refresh` → retry original request.
- Dedicated services: `authService`, `userService`, `chatService`, `messageService`, `groupService` (later).

---

## 4. Routing Strategy

| Path | Component | Notes |
|------|-----------|-------|
| `/` | LandingPage | Hero, feature cards, CTA buttons |
| `/login` | LoginPage | React Hook Form + shadcn inputs |
| `/signup` | SignupPage | Multi-step (form → OTP) or separate `/verify-otp` |
| `/verify-otp` | VerifyOtpPage | Accepts `email` via state/query |
| `/forgot-password` | ForgotPasswordPage | Email + OTP + new password |
| `/chat` | ChatLayout | ProtectedRoute wrapper, loads chats sidebar |
| `/chat/:chatId` | ChatView | Message list + composer |
| `/profile` | ProfilePage | View/edit own profile, logout |

Implementation notes:
- Use `<ProtectedRoute>` component that checks `auth.isAuthenticated`.
- Wrap `<Routes>` with `<AnimatePresence mode="wait">` for transitions.
- Keep landing/auth layout separate from chat layout for clarity.

---

## 5. UI System (Tailwind + shadcn)

### 5.1 Token strategy
- `index.css` defines CSS variables for colors, pulled into Tailwind via `oklch`.
- `App.css` uses Tailwind v4 `@theme inline` to expose semantic tokens (primary, sidebar, etc.).

### 5.2 shadcn usage plan
Components to generate first:
- button, input, textarea, label, form, select, checkbox, avatar, badge, dropdown-menu, dialog, sheet, toast, tooltip, skeleton.

Rules of thumb:
- Keep `ui/` components stateless.
- Wrap them in `shared/` for project-specific behavior (e.g., `PrimaryButton` that injects icons).
- Use `cn` helper for conditional classes.

### 5.3 Accessibility
- shadcn is built on Radix primitives → keyboard focus, aria attributes built-in.
- For custom pieces (e.g., chat bubbles), follow WAI-ARIA roles (`role="log"` for message list, `aria-live` for announcements).

---

## 6. Animation System (Framer Motion)

| Use case | Technique |
|----------|-----------|
| Page transitions | `<AnimatePresence>` + `<motion.div>` with fade/slide |
| Modals/Drawers | Wrap shadcn Dialog/Sheet content with motion to customize easing |
| Chat sidebar | Animate width/opacity when toggled on mobile |
| Message entry | `layout` prop + staggered children for new messages |
| Typing indicator | Looping keyframes (scale/opacity) |
| Buttons/links | `whileHover`, `whileTap` micro-interactions |

Best practice: keep variants in `motionPresets.js` so they can be reused.

---

## 7. Build Roadmap (Frontend)

1. **Foundation (Week 0)**
   - Redux store + slices skeleton
   - Axios instance + services
   - shadcn primitives
   - Global loader + toast system

2. **Auth Experience (Week 1)**
   - Landing + marketing content
   - Login / Signup / OTP / Forgot forms
   - Form validation, error handling, success states
   - Auth guard + route redirection

3. **Chat Shell (Week 2)**
   - Chat layout with sidebar + message pane
   - Fetch chats list, highlight active chat
   - Message list with infinite scroll stub
   - Message composer (text + attachment button)

4. **Profile & Settings (Week 3)**
   - Profile view/edit page
   - Theme toggle, logout flow
   - Reusable drawers/modals for group info

5. **Enhancements (Week 4+)**
   - Group admin tools, member management
   - Socket.IO integration (online status, typing, instant messaging)
   - Animations polish, skeleton states, accessibility pass

---

## 8. Interview Talking Points (Frontend)

- **Cookie-based auth UX**: “I use an initial `checkAuth` thunk so users either land directly in chats or see a branded hero with CTA—no flash of unauthenticated content.”
- **shadcn rationale**: “Instead of pulling a heavy component lib, I generate only the primitives I need. It keeps bundle size lean and still gives me accessible components built on Radix.”
- **State segregation**: “Redux handles global/auth/chat data, but local UI state stays in components or context. That keeps the store lean and makes it easy to swap in RTK Query later if needed.”
- **Animations**: “Framer Motion drives both macro transitions and micro interactions. For example, when switching chats, the message list crossfades while the sidebar stays pinned, which feels like native apps.”
- **Error UX**: “All thunks funnel errors through a toast system + inline form messages, so users always understand what went wrong—especially with OTP flows.”
- **Scalability**: “The API layer is agnostic of Redux; if I migrate to React Query or SWR, I just swap the consumers.”

---

## 9. Troubleshooting & Tips

| Issue | Fix |
|-------|-----|
| Tailwind v4 rejecting `@apply border-border` | Use raw CSS with `hsl(var(--border))` instead |
| shadcn path aliases failing | Ensure `vite.config.js` + `jsconfig.json` use the same `@` alias |
| Framer Motion flicker on route change | Set `<AnimatePresence mode="wait">` and ensure each page uses `key={location.pathname}` |
| Axios losing cookies | Always set `withCredentials: true` on the axios instance |
| OTP pages losing email in refresh | Persist `email` + `flow` in Redux or `sessionStorage` when navigating between steps |

---

## 10. Next Actions

1. Generate core shadcn components (button/input/form/etc.).
2. Implement Redux store + auth slice + axios services.
3. Build landing + login pages with motion + shadcn.
4. Document component APIs within `components/ui/README` (optional).

This document should evolve as features ship. Treat it like the frontend counterpart to `BACKEND_DEEP_DIVE.md` for quick refreshers before interviews or demos.

