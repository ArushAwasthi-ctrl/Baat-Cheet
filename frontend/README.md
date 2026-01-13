# Baat Cheet - Frontend Documentation

A modern real-time chat application frontend built with React, Vite, Redux Toolkit, and Tailwind CSS.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [State Management](#state-management)
- [Services](#services)
- [Components](#components)
- [Hooks](#hooks)
- [Routing](#routing)
- [Styling](#styling)
- [Features](#features)

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI library |
| **Vite** | Build tool & dev server |
| **Redux Toolkit** | State management |
| **React Router v7** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **Radix UI** | Accessible UI primitives |
| **Framer Motion** | Animations |
| **Socket.IO Client** | Real-time communication |
| **Axios** | HTTP client |
| **React Hook Form** | Form handling |
| **Sonner** | Toast notifications |
| **Lucide React** | Icon library |
| **next-themes** | Dark/light mode |

## Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── chat/            # Chat-specific components
│   │   │   ├── ChatArea.jsx
│   │   │   ├── ChatSidebar.jsx
│   │   │   ├── ContactInfoPanel.jsx
│   │   │   ├── EmptyChat.jsx
│   │   │   ├── GroupChatModal.jsx
│   │   │   └── NewChatModal.jsx
│   │   ├── shared/          # Reusable components
│   │   │   ├── PageLoader.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   └── ThemeToggle.jsx
│   │   └── ui/              # UI kit components
│   │       ├── Avatar.jsx
│   │       ├── Button.jsx
│   │       └── Input.jsx
│   ├── hooks/               # Custom React hooks
│   │   └── useSocket.js
│   ├── layouts/             # Layout wrappers
│   │   ├── AuthLayout.jsx
│   │   └── ChatLayout.jsx
│   ├── lib/                 # Utilities
│   │   └── utils.js
│   ├── pages/               # Route pages
│   │   ├── ChatPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   └── VerifyOtpPage.jsx
│   ├── services/            # API & socket services
│   │   ├── api.js           # Axios instance
│   │   ├── authService.js
│   │   ├── chatService.js
│   │   ├── messageService.js
│   │   ├── socketService.js
│   │   └── userService.js
│   ├── store/               # Redux store
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── chatSlice.js
│   │   │   ├── messageSlice.js
│   │   │   └── uiSlice.js
│   │   └── store.js
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── jsconfig.json            # Path aliases
└── package.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:9990
```

For production:
```env
VITE_API_URL=https://your-api-domain.com
```

## Architecture

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Components │────▶│   Redux     │────▶│  Services   │
│             │◀────│   Store     │◀────│  (API/WS)   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                    ┌─────▼─────┐
                    │  Backend  │
                    │   API     │
                    └───────────┘
```

### Component Hierarchy

```
App
├── ThemeProvider
│   └── BrowserRouter
│       ├── AuthLayout (protected: false)
│       │   ├── LoginPage
│       │   ├── SignupPage
│       │   ├── VerifyOtpPage
│       │   └── ForgotPasswordPage
│       ├── ChatLayout (protected: true)
│       │   └── ChatPage
│       │       ├── ChatSidebar
│       │       ├── ChatArea
│       │       └── ContactInfoPanel
│       └── LandingPage
```

## State Management

### Redux Slices

#### authSlice
Manages authentication state.

```javascript
// State
{
  user: null | User,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null,
  registrationEmail: string | null,  // For OTP flow
  resetEmail: string | null          // For password reset
}

// Actions
login(credentials)
register(data)
verifyOtp(data)
resendOtp(data)
forgotPassword(data)
resetPassword(data)
logout()
getCurrentUser()
clearError()
setRegistrationEmail(email)
setResetEmail(email)
updateUser(userData)
```

#### chatSlice
Manages chats and selected chat state.

```javascript
// State
{
  chats: Chat[],
  selectedChat: Chat | null,
  isLoading: boolean,
  isFetchingMore: boolean,
  error: string | null,
  nextCursor: string | null,
  hasMore: boolean
}

// Async Actions
fetchChats({ cursor, limit })
fetchChatById(chatId)
createDirectChat(participantId)
createGroupChat({ name, description, participants })
updateGroupInfo({ chatId, name, description })
addMembersToGroup({ chatId, memberIds })
removeMembersFromGroup({ chatId, memberIds })
promoteToAdmin({ chatId, memberId })
leaveGroup(chatId)
deleteChat(chatId)

// Sync Actions
setSelectedChat(chat)
clearSelectedChat()
clearChats()
updateChatLastMessage({ chatId, message })
incrementUnreadCount({ chatId })
resetUnreadCount({ chatId })
addChat(chat)
removeChat(chatId)
updateChat(chat)
```

#### messageSlice
Manages messages organized by chat.

```javascript
// State
{
  messagesByChat: { [chatId]: Message[] },
  loadingByChat: { [chatId]: boolean },
  paginationByChat: { [chatId]: { nextCursor, hasMore } },
  isSending: boolean,
  sendError: string | null,
  error: string | null
}

// Async Actions
fetchMessages({ chatId, cursor, limit })
sendMessage({ chatId, content, type, attachments })
markMessagesAsRead(chatId)

// Sync Actions
clearMessages(chatId?)
addMessage({ chatId, message })
updateMessageStatus({ chatId, messageId, status })
markChatMessagesAsRead({ chatId })
```

#### uiSlice
Manages UI state (modals, panels, etc.).

```javascript
// State
{
  activeModal: string | null,  // 'newChat', 'newGroup', etc.
  modalData: any,
  isSidebarOpen: boolean,
  isInfoPanelOpen: boolean
}

// Actions
openModal({ modal, data })
closeModal()
toggleSidebar()
toggleInfoPanel()
setInfoPanelOpen(boolean)
```

## Services

### API Service (`api.js`)

Axios instance with interceptors for:
- Automatic token refresh on 401 errors
- Request/response transformation
- Error handling

```javascript
import api from '@/services/api';

// All requests include credentials (cookies)
const response = await api.get('/api/users/me');
```

### Auth Service (`authService.js`)

```javascript
authService.login({ email, password })
authService.register({ username, email, password })
authService.verifyOtp({ email, otp })
authService.resendOtp({ email, username, password })
authService.forgotPassword({ email })
authService.resetPassword({ email, otp, newPassword })
authService.logout()
authService.refreshToken()
authService.getCurrentUser()
```

### Chat Service (`chatService.js`)

```javascript
chatService.getUserChats(cursor, limit)
chatService.getChatById(chatId)
chatService.createOrGetDirectChat(userId)
chatService.createGroupChat({ name, description, participants })
chatService.updateGroupInfo(chatId, { name, description })
chatService.addMembers(chatId, memberIds)
chatService.removeMembers(chatId, memberIds)
chatService.promoteToAdmin(chatId, memberId)
chatService.leaveGroup(chatId)
chatService.deleteChat(chatId)
```

### Message Service (`messageService.js`)

```javascript
messageService.getMessages(chatId, cursor, limit)
messageService.sendMessage(chatId, { content, type, attachments })
messageService.markAsRead(chatId)
```

### Socket Service (`socketService.js`)

Singleton class managing Socket.IO connection.

```javascript
import socketService from '@/services/socketService';

// Connect (called in ChatLayout)
socketService.connect();

// Join/leave chat rooms
socketService.joinChat(chatId);
socketService.leaveChat(chatId);

// Typing indicators
socketService.startTyping(chatId);
socketService.stopTyping(chatId);

// Read receipts
socketService.markAsRead(chatId, messageId);

// Disconnect
socketService.disconnect();
```

### User Service (`userService.js`)

```javascript
userService.searchUsers(query, page, limit)
userService.getUserById(userId)
userService.updateProfile(formData)
```

## Components

### Chat Components

#### ChatSidebar
- Displays list of user's chats
- Search functionality
- New chat/group buttons
- Unread message badges
- Last message preview

#### ChatArea
- Message display with date groupings
- Message input with typing indicator
- Load more (pagination)
- Read receipts (single/double check)
- Responsive design

#### ContactInfoPanel
- User/group info display
- Group member list
- Admin actions (for group admins)
- Leave group functionality
- Quick actions (mute, search, etc.)

#### NewChatModal
- User search
- Create direct chat
- Navigate to group creation

#### GroupChatModal
- Multi-step wizard
- Member selection (minimum 2 members required)
- Group name/description
- Member preview

### UI Components

#### Avatar
Customizable avatar with fallback initials.

```jsx
<Avatar
  name="John Doe"
  src="/avatar.jpg"
  size="md"  // xs, sm, md, lg, xl, 2xl
/>
```

#### Button
Styled button with variants.

```jsx
<Button variant="primary" size="md" isLoading={false}>
  Click me
</Button>
```

#### Input
Form input with icon support.

```jsx
<Input
  type="email"
  placeholder="Enter email"
  icon={<Mail />}
  error="Invalid email"
/>
```

### Shared Components

#### PageLoader
Full-page loading spinner.

#### Skeleton
Loading placeholder for content.

#### ThemeToggle
Dark/light mode toggle button.

## Hooks

### useSocket

Custom hook for socket event handling.

```javascript
import { useTypingIndicator, useOnlineStatus } from '@/hooks/useSocket';

// In component
const typingUsers = useTypingIndicator(chatId);
const onlineUsers = useOnlineStatus();
```

## Routing

### Route Configuration

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/` | LandingPage | No | Landing page |
| `/login` | LoginPage | No | User login |
| `/signup` | SignupPage | No | User registration |
| `/verify-otp` | VerifyOtpPage | No | OTP verification |
| `/forgot-password` | ForgotPasswordPage | No | Password reset |
| `/chat` | ChatPage | Yes | Main chat interface |
| `/chat/:chatId` | ChatPage | Yes | Specific chat |

### Protected Routes

`ChatLayout` wraps protected routes and:
1. Checks authentication status
2. Fetches current user if not loaded
3. Initializes socket connection
4. Redirects to login if unauthenticated

## Styling

### Tailwind Configuration

The project uses Tailwind CSS with:
- Custom color scheme via CSS variables
- Dark mode support (`class` strategy)
- Custom animations
- Responsive breakpoints

### Theme Variables

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --primary: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  /* ... more variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode overrides */
}
```

### Utility Functions

```javascript
import { cn, formatMessageTime, debounce } from '@/lib/utils';

// Merge class names conditionally
cn('base-class', condition && 'conditional-class');

// Format message timestamps
formatMessageTime(new Date()); // "2:30 PM" or "Yesterday"

// Debounce function calls
const debouncedSearch = debounce(searchFn, 300);
```

## Features

### Real-time Messaging
- Instant message delivery via Socket.IO
- Typing indicators
- Read receipts
- Online/offline status

### Chat Types
- Direct (1-to-1) chats
- Group chats with admin controls

### Group Management
- Create groups with 2+ members
- Add/remove members (admin only)
- Promote members to admin
- Leave group
- Delete group (admin only)

### Authentication
- Email/password registration
- OTP email verification
- Password reset flow
- Automatic token refresh
- Persistent sessions

### UI/UX
- Dark/light theme
- Responsive design (mobile-first)
- Loading states and skeletons
- Toast notifications
- Smooth animations

### Message Features
- Text messages
- Message timestamps
- Date dividers
- Load older messages (pagination)
- Auto-scroll to new messages

## Scripts

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations

- Lazy loading of routes
- Debounced search inputs
- Optimistic UI updates
- Image lazy loading
- Bundle splitting by route
