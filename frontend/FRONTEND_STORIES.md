# Baat Cheet - Frontend Stories & Implementation Guide

**Version:** 1.0
**Author:** Arush Awasthi
**Stack:** React 19 + Vite 7 + Tailwind CSS 4 + shadcn/ui + Framer Motion + Redux Toolkit

---

## Table of Contents

1. [Design System & Theme](#1-design-system--theme)
2. [Component Library](#2-component-library)
3. [User Stories by Epic](#3-user-stories-by-epic)
4. [Page Specifications](#4-page-specifications)
5. [Animation & Effects Guide](#5-animation--effects-guide)
6. [Performance Optimizations](#6-performance-optimizations)
7. [Redux Store Architecture](#7-redux-store-architecture)
8. [API Service Layer](#8-api-service-layer)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. Design System & Theme

### 1.1 Color Palette

```css
/* Primary Brand Colors - Modern Purple/Violet Theme */
--primary: 262 83% 58%;           /* Vibrant purple #7C3AED */
--primary-hover: 262 83% 48%;     /* Darker purple on hover */
--primary-foreground: 0 0% 100%;  /* White text on primary */

/* Semantic Colors */
--success: 142 76% 36%;           /* Green #22C55E */
--warning: 38 92% 50%;            /* Amber #F59E0B */
--destructive: 0 84% 60%;         /* Red #EF4444 */
--info: 199 89% 48%;              /* Blue #0EA5E9 */

/* Neutral Grays */
--background: 0 0% 100%;          /* Pure white */
--foreground: 222 47% 11%;        /* Near black text */
--muted: 210 40% 96%;             /* Light gray backgrounds */
--muted-foreground: 215 16% 47%;  /* Gray text */
--border: 214 32% 91%;            /* Subtle borders */

/* Dark Mode */
--background-dark: 222 47% 11%;   /* Dark navy */
--foreground-dark: 210 40% 98%;   /* Off-white text */
--card-dark: 222 47% 15%;         /* Slightly lighter cards */
```

### 1.2 Typography Scale

```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Type Scale */
--text-xs: 0.75rem;      /* 12px - Timestamps, badges */
--text-sm: 0.875rem;     /* 14px - Secondary text, labels */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Subheadings */
--text-xl: 1.25rem;      /* 20px - Card titles */
--text-2xl: 1.5rem;      /* 24px - Section headings */
--text-3xl: 1.875rem;    /* 30px - Page titles */
--text-4xl: 2.25rem;     /* 36px - Hero text */
--text-5xl: 3rem;        /* 48px - Landing hero */
```

### 1.3 Spacing & Layout

```css
/* Spacing Scale (4px base) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */

/* Border Radius */
--radius-sm: 0.375rem;  /* 6px - Buttons, inputs */
--radius-md: 0.5rem;    /* 8px - Cards, modals */
--radius-lg: 0.75rem;   /* 12px - Large containers */
--radius-xl: 1rem;      /* 16px - Hero sections */
--radius-full: 9999px;  /* Pills, avatars */
```

### 1.4 Shadows & Elevation

```css
/* Shadow Scale */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-glow: 0 0 20px rgb(124 58 237 / 0.3);  /* Primary glow effect */

/* Glass Effect */
--glass-bg: rgba(255, 255, 255, 0.7);
--glass-border: rgba(255, 255, 255, 0.3);
backdrop-filter: blur(12px);
```

---

## 2. Component Library

### 2.1 Atomic Components (shadcn/ui based)

| Component | Variants | Description |
|-----------|----------|-------------|
| **Button** | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` | Primary action buttons with loading states |
| **Input** | `default`, `error`, `success` | Form inputs with validation states |
| **Textarea** | `default`, `resize` | Multiline text input |
| **Avatar** | `sm`, `md`, `lg`, `xl` | User profile images with fallback |
| **Badge** | `default`, `secondary`, `destructive`, `outline` | Status indicators |
| **Card** | `default`, `interactive`, `glass` | Content containers |
| **Dialog/Modal** | `default`, `sheet`, `alert` | Overlay dialogs |
| **Dropdown** | `default`, `context` | Menu dropdowns |
| **Tooltip** | `default`, `arrow` | Hover information |
| **Skeleton** | `text`, `avatar`, `card` | Loading placeholders |
| **Toast** | `default`, `success`, `error`, `warning` | Notification popups |
| **Switch** | `default` | Toggle switches |
| **Tabs** | `default`, `pills` | Tab navigation |
| **ScrollArea** | `default`, `horizontal` | Custom scrollbars |

### 2.2 Composite Components

```
src/components/
├── ui/                          # shadcn primitives
│   ├── button.jsx
│   ├── input.jsx
│   ├── avatar.jsx
│   ├── badge.jsx
│   ├── card.jsx
│   ├── dialog.jsx
│   ├── dropdown-menu.jsx
│   ├── tooltip.jsx
│   ├── skeleton.jsx
│   ├── toast.jsx
│   ├── tabs.jsx
│   └── scroll-area.jsx
│
├── shared/                      # App-specific shared components
│   ├── Logo.jsx                 # Animated logo component
│   ├── ThemeToggle.jsx          # Dark/light mode switch
│   ├── UserAvatar.jsx           # Avatar with online indicator
│   ├── LoadingSpinner.jsx       # Global loader
│   ├── EmptyState.jsx           # No data illustrations
│   ├── ErrorBoundary.jsx        # Error fallback UI
│   ├── ProtectedRoute.jsx       # Auth route wrapper
│   └── SEOHead.jsx              # Meta tags component
│
├── auth/                        # Authentication components
│   ├── LoginForm.jsx
│   ├── SignupForm.jsx
│   ├── OTPInput.jsx             # 6-digit OTP input
│   ├── ForgotPasswordForm.jsx
│   ├── SocialAuthButtons.jsx
│   └── AuthCard.jsx             # Wrapper with animations
│
├── chat/                        # Chat feature components
│   ├── ChatSidebar.jsx          # Left sidebar with chat list
│   ├── ChatList.jsx             # List of conversations
│   ├── ChatListItem.jsx         # Individual chat preview
│   ├── ChatSearch.jsx           # Search chats input
│   ├── ChatHeader.jsx           # Active chat header
│   ├── ChatMessages.jsx         # Messages container
│   ├── MessageBubble.jsx        # Individual message
│   ├── MessageInput.jsx         # Compose message area
│   ├── TypingIndicator.jsx      # "User is typing..."
│   ├── MessageStatus.jsx        # Sent/delivered/read icons
│   ├── AttachmentPreview.jsx    # File/image preview
│   ├── ImageGallery.jsx         # Full-screen image viewer
│   └── EmojiPicker.jsx          # Emoji selection
│
├── group/                       # Group chat components
│   ├── CreateGroupModal.jsx
│   ├── GroupInfo.jsx            # Group details sidebar
│   ├── MemberList.jsx           # Group members list
│   ├── MemberItem.jsx           # Individual member row
│   ├── AddMembersModal.jsx
│   └── GroupSettings.jsx
│
├── user/                        # User-related components
│   ├── UserSearch.jsx           # Search users to chat
│   ├── UserCard.jsx             # User preview card
│   ├── ProfileHeader.jsx        # Profile page header
│   ├── ProfileForm.jsx          # Edit profile form
│   └── OnlineStatus.jsx         # Online/offline dot
│
└── landing/                     # Landing page components
    ├── Hero.jsx                 # Main hero section
    ├── Features.jsx             # Feature showcase
    ├── HowItWorks.jsx           # Steps section
    ├── Testimonials.jsx         # Social proof
    ├── CTA.jsx                  # Call to action
    └── Footer.jsx
```

---

## 3. User Stories by Epic

### Epic 1: Authentication

#### Story 1.1: User Registration
```
AS A new user
I WANT TO create an account with email verification
SO THAT I can securely access the chat application

ACCEPTANCE CRITERIA:
- [ ] User can enter email, username (3-20 chars), and password (8+ chars)
- [ ] Real-time validation shows errors as user types
- [ ] Password strength indicator (weak/medium/strong)
- [ ] Show/hide password toggle
- [ ] Submit button disabled until form is valid
- [ ] Loading state during submission
- [ ] Success: redirect to OTP verification page
- [ ] Error: show inline error message with shake animation

UI SPECS:
- Form centered on screen with glass card effect
- Animated logo above form
- Social login buttons (future: Google, GitHub)
- "Already have account?" link to login
- Smooth page transition animations
```

#### Story 1.2: OTP Verification
```
AS A user who just registered
I WANT TO verify my email with OTP
SO THAT my account is activated

ACCEPTANCE CRITERIA:
- [ ] 6 individual digit inputs with auto-focus progression
- [ ] Paste support for full OTP code
- [ ] Countdown timer for OTP expiry (5 minutes)
- [ ] "Resend OTP" button appears after 60 seconds
- [ ] Rate limiting feedback if resend is blocked
- [ ] Auto-submit when all 6 digits entered
- [ ] Success: redirect to chat with welcome toast
- [ ] Error: shake animation + clear inputs

UI SPECS:
- Large centered OTP boxes with focus ring
- Email address shown (partially masked)
- Animated success checkmark on completion
- Confetti effect on successful verification
```

#### Story 1.3: User Login
```
AS A registered user
I WANT TO log into my account
SO THAT I can access my chats

ACCEPTANCE CRITERIA:
- [ ] Email and password fields with validation
- [ ] "Remember me" checkbox
- [ ] "Forgot password?" link
- [ ] Loading spinner on submit button
- [ ] Success: redirect to /chat
- [ ] Error: inline message + shake effect
- [ ] Redirect authenticated users away from login

UI SPECS:
- Same card style as registration
- Smooth transition between login/signup
- Focus states with primary color ring
```

#### Story 1.4: Forgot Password Flow
```
AS A user who forgot password
I WANT TO reset it via email
SO THAT I can regain access

ACCEPTANCE CRITERIA:
- [ ] Step 1: Enter email → send OTP
- [ ] Step 2: Enter OTP (same as verification)
- [ ] Step 3: Enter new password (with strength meter)
- [ ] Progress indicator showing current step
- [ ] Success: redirect to login with success toast
- [ ] Back navigation between steps

UI SPECS:
- Multi-step form with slide animations
- Step progress dots at top
- Animated transitions between steps
```

#### Story 1.5: Logout
```
AS A logged-in user
I WANT TO logout securely
SO THAT my session is terminated

ACCEPTANCE CRITERIA:
- [ ] Logout option in user dropdown menu
- [ ] Confirmation modal before logout
- [ ] Clear all local state and cookies
- [ ] Redirect to landing page
- [ ] "Goodbye" toast message
```

---

### Epic 2: Chat Interface

#### Story 2.1: Chat Sidebar
```
AS A user
I WANT TO see all my conversations in a sidebar
SO THAT I can navigate between chats

ACCEPTANCE CRITERIA:
- [ ] List of chats sorted by last message time
- [ ] Each item shows: avatar, name, last message preview, timestamp
- [ ] Unread message count badge
- [ ] Online status indicator on avatars
- [ ] Search/filter chats by name
- [ ] "New Chat" button to start conversation
- [ ] Active chat highlighted
- [ ] Infinite scroll with lazy loading
- [ ] Pull-to-refresh on mobile
- [ ] Skeleton loading states

UI SPECS:
- Fixed width sidebar (320px desktop, full on mobile)
- Glassmorphism header with search
- Smooth hover effects on chat items
- Slide-in animation for new chats
- Collapsible on mobile with hamburger
```

#### Story 2.2: Chat List Item
```
AS A user
I WANT TO see chat previews
SO THAT I can quickly identify conversations

ACCEPTANCE CRITERIA:
- [ ] Show avatar (group icon for groups)
- [ ] Display name (or "Group: name" for groups)
- [ ] Last message truncated (40 chars max)
- [ ] Show "You: " prefix if sent by current user
- [ ] Relative timestamp (now, 5m, 2h, Yesterday, date)
- [ ] Typing indicator replaces last message when active
- [ ] Unread count badge (max "99+")
- [ ] Muted indicator icon if muted
- [ ] Long press/right-click context menu

UI SPECS:
- 72px height per item
- Subtle divider between items
- Hover background color change
- Active state with primary color accent
- Badge positioned top-right of avatar
```

#### Story 2.3: Message View
```
AS A user
I WANT TO see messages in a conversation
SO THAT I can read the chat history

ACCEPTANCE CRITERIA:
- [ ] Messages grouped by date with dividers
- [ ] Own messages right-aligned (primary color)
- [ ] Others' messages left-aligned (gray)
- [ ] Show sender name in group chats
- [ ] Avatar shown for other users (not own)
- [ ] Message status icons (sent/delivered/read)
- [ ] Timestamp on hover or tap
- [ ] Image messages with lightbox
- [ ] File messages with download link
- [ ] Link previews (future enhancement)
- [ ] Infinite scroll upward for history
- [ ] "Jump to bottom" FAB when scrolled up
- [ ] New message indicator when not at bottom
- [ ] Smooth scroll animations

UI SPECS:
- Messages take max 70% width
- Rounded bubble corners (different for first/last in group)
- Subtle shadow on message bubbles
- Skeleton loaders while fetching
- Empty state for new chats
- Scroll-to-bottom on send
```

#### Story 2.4: Message Input
```
AS A user
I WANT TO compose and send messages
SO THAT I can communicate with others

ACCEPTANCE CRITERIA:
- [ ] Auto-expanding textarea (max 5 rows)
- [ ] Emoji picker button
- [ ] Attachment button (images, files)
- [ ] Send button (enabled when content exists)
- [ ] Keyboard shortcuts: Enter to send, Shift+Enter for newline
- [ ] Character counter near limit (5000 chars)
- [ ] File preview before sending
- [ ] Multiple file selection
- [ ] Drag and drop file upload
- [ ] Optimistic UI: show message immediately
- [ ] Retry on failure

UI SPECS:
- Sticky at bottom of chat
- Glassmorphism background
- Primary color send button
- Subtle border-top
- Smooth height transitions
- Attachment preview carousel
```

#### Story 2.5: Typing Indicator
```
AS A user
I WANT TO see when others are typing
SO THAT I know a response is coming

ACCEPTANCE CRITERIA:
- [ ] Show "User is typing..." below messages
- [ ] Animated dots (bouncing)
- [ ] Multiple users: "User1, User2 are typing..."
- [ ] Auto-hide after 3 seconds of no activity
- [ ] Don't show own typing indicator

UI SPECS:
- Small text with muted color
- Three dots with staggered bounce animation
- Fade in/out transitions
```

#### Story 2.6: Read Receipts
```
AS A user
I WANT TO see message read status
SO THAT I know if my message was seen

ACCEPTANCE CRITERIA:
- [ ] Single check: sent
- [ ] Double check: delivered
- [ ] Double check (primary color): read
- [ ] Show only on own messages
- [ ] Group chats: show "Seen by X" on tap

UI SPECS:
- Small icons (12px) below message
- Animate from single to double check
- Color change animation for read
```

---

### Epic 3: Chat Management

#### Story 3.1: Start New Chat
```
AS A user
I WANT TO start a conversation with someone
SO THAT I can message them

ACCEPTANCE CRITERIA:
- [ ] Search users by username or email
- [ ] Debounced search (300ms delay)
- [ ] Show user results with avatar, username, status
- [ ] Click user to start/open direct chat
- [ ] Loading states during search
- [ ] Empty state if no results
- [ ] Recent contacts shown by default

UI SPECS:
- Slide-out panel or modal
- Search input with icon
- User list with hover effects
- Smooth panel animation
```

#### Story 3.2: Create Group Chat
```
AS A user
I WANT TO create a group chat
SO THAT I can message multiple people

ACCEPTANCE CRITERIA:
- [ ] Step 1: Add group name (3-50 chars)
- [ ] Optional: Upload group avatar
- [ ] Step 2: Search and select members (min 2)
- [ ] Selected members shown as chips
- [ ] Remove members by clicking X on chip
- [ ] Create button enabled with valid inputs
- [ ] Success: open new group chat
- [ ] Creator is automatically admin

UI SPECS:
- Multi-step modal with transitions
- Avatar upload with preview
- Member chips with avatars
- Selected count indicator
- Animated step transitions
```

#### Story 3.3: Group Info Panel
```
AS A user
I WANT TO view and manage group details
SO THAT I can see members and settings

ACCEPTANCE CRITERIA:
- [ ] Show group avatar (large, editable if admin)
- [ ] Group name (editable if admin)
- [ ] Member count
- [ ] List all members with roles (Admin badge)
- [ ] Admin actions: add/remove members, promote to admin
- [ ] Leave group option
- [ ] Created date
- [ ] Shared media gallery (future)

UI SPECS:
- Right sidebar panel (350px)
- Slide-in animation
- Sections with collapsible headers
- Member list with actions dropdown
```

#### Story 3.4: Add/Remove Members
```
AS A group admin
I WANT TO manage group membership
SO THAT I can control who's in the group

ACCEPTANCE CRITERIA:
- [ ] "Add Members" opens user search modal
- [ ] Exclude existing members from search
- [ ] Multi-select members to add
- [ ] Confirm before adding
- [ ] "Remove" option in member dropdown
- [ ] Confirm before removing
- [ ] Toast notifications for actions
- [ ] Can't remove yourself if sole admin

UI SPECS:
- Modal for adding members
- Dropdown menu for member actions
- Confirmation dialogs
- Success/error toasts
```

#### Story 3.5: Promote to Admin
```
AS A group admin
I WANT TO promote members to admin
SO THAT they can help manage the group

ACCEPTANCE CRITERIA:
- [ ] "Make Admin" option in member dropdown
- [ ] Confirmation dialog
- [ ] Admin badge appears after promotion
- [ ] New admin gets notification

UI SPECS:
- Crown icon for admin badge
- Animated badge appearance
```

---

### Epic 4: User Profile

#### Story 4.1: View Profile
```
AS A user
I WANT TO view my profile
SO THAT I can see my information

ACCEPTANCE CRITERIA:
- [ ] Large avatar (click to change)
- [ ] Username display
- [ ] Email display
- [ ] Bio text
- [ ] Account created date
- [ ] Edit profile button
- [ ] Logout button

UI SPECS:
- Full page on mobile, modal on desktop
- Avatar with camera overlay on hover
- Clean typography hierarchy
```

#### Story 4.2: Edit Profile
```
AS A user
I WANT TO edit my profile
SO THAT I can update my information

ACCEPTANCE CRITERIA:
- [ ] Change avatar (upload new image)
- [ ] Edit username (unique validation)
- [ ] Edit bio (max 200 chars)
- [ ] Real-time validation
- [ ] Save changes button
- [ ] Cancel/discard changes
- [ ] Unsaved changes warning on navigation

UI SPECS:
- Inline editing or modal form
- Image cropper for avatar
- Character counter for bio
- Save button states (disabled, loading, enabled)
```

---

### Epic 5: Landing & Marketing

#### Story 5.1: Landing Page
```
AS A visitor
I WANT TO see an attractive landing page
SO THAT I understand the product

ACCEPTANCE CRITERIA:
- [ ] Hero section with tagline and CTA
- [ ] Animated mockup/illustration
- [ ] Feature highlights (3-4 key features)
- [ ] How it works steps
- [ ] Testimonials/social proof
- [ ] Final CTA section
- [ ] Footer with links
- [ ] Responsive design
- [ ] Fast loading (<3s)

UI SPECS:
- Full viewport hero
- Gradient backgrounds
- Floating/parallax elements
- Scroll-triggered animations
- Smooth scroll navigation
```

---

### Epic 6: Settings & Preferences

#### Story 6.1: Theme Toggle
```
AS A user
I WANT TO switch between light and dark mode
SO THAT I can customize my experience

ACCEPTANCE CRITERIA:
- [ ] Toggle in header/settings
- [ ] Persist preference in localStorage
- [ ] Respect system preference by default
- [ ] Smooth transition animation
- [ ] Sun/moon icon toggle

UI SPECS:
- Animated icon transition
- Whole-page color transition (200ms)
```

#### Story 6.2: Notification Settings
```
AS A user
I WANT TO manage notification preferences
SO THAT I control what alerts I receive

ACCEPTANCE CRITERIA:
- [ ] Toggle for push notifications
- [ ] Toggle for sound
- [ ] Toggle for message previews
- [ ] Per-chat mute option (in chat menu)

UI SPECS:
- Settings page section
- Toggle switches with labels
- Descriptive helper text
```

---

## 4. Page Specifications

### 4.1 Route Structure

```javascript
const routes = [
  // Public Routes
  { path: "/", element: <LandingPage />, public: true },
  { path: "/login", element: <LoginPage />, public: true },
  { path: "/signup", element: <SignupPage />, public: true },
  { path: "/verify-otp", element: <OTPVerificationPage />, public: true },
  { path: "/forgot-password", element: <ForgotPasswordPage />, public: true },

  // Protected Routes (require auth)
  { path: "/chat", element: <ChatLayout />, children: [
    { index: true, element: <NoChatSelected /> },
    { path: ":chatId", element: <ChatView /> },
  ]},
  { path: "/profile", element: <ProfilePage /> },
  { path: "/settings", element: <SettingsPage /> },

  // Catch-all
  { path: "*", element: <NotFoundPage /> },
];
```

### 4.2 Page Layouts

```
┌─────────────────────────────────────────────────────────────┐
│  LANDING PAGE                                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Header: Logo | Features | About | Login | Signup    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              HERO SECTION                           │   │
│  │     "Real-time chat, reimagined"                    │   │
│  │          [Get Started]  [Learn More]                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Features Grid (3 columns)                          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  How It Works (3 steps)                             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CTA Section                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Footer                                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AUTH PAGES (Login/Signup/OTP)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           ┌─────────────────────────┐                       │
│           │      ✦ Logo ✦           │                       │
│           ├─────────────────────────┤                       │
│           │                         │                       │
│           │    Auth Form Card       │                       │
│           │    (Glass effect)       │                       │
│           │                         │                       │
│           │    [Email Input    ]    │                       │
│           │    [Password Input ]    │                       │
│           │    [    Submit     ]    │                       │
│           │                         │                       │
│           │    Links to other       │                       │
│           │    auth pages           │                       │
│           │                         │                       │
│           └─────────────────────────┘                       │
│                                                             │
│              Animated background                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CHAT PAGE LAYOUT                                           │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┬────────────────────────────────┬─────────────┐ │
│ │          │  Chat Header                   │             │ │
│ │          │  [Avatar] Name    [•••]        │   Group     │ │
│ │  SIDEBAR │────────────────────────────────│   Info      │ │
│ │          │                                │   Panel     │ │
│ │  Search  │                                │  (toggle)   │ │
│ │  ─────── │     MESSAGE AREA               │             │ │
│ │  Chat 1  │     (Infinite scroll)          │  Members    │ │
│ │  Chat 2  │                                │  List       │ │
│ │  Chat 3  │                                │             │ │
│ │  Chat 4  │                                │             │ │
│ │  ...     │                                │             │ │
│ │          │────────────────────────────────│             │ │
│ │  [+ New] │  [📎] [Message input...] [➤]   │             │ │
│ └──────────┴────────────────────────────────┴─────────────┘ │
└─────────────────────────────────────────────────────────────┘
   320px          Flexible                      350px
```

---

## 5. Animation & Effects Guide

### 5.1 Page Transitions

```jsx
// Using Framer Motion AnimatePresence
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};
```

### 5.2 Component Animations

```javascript
// Staggered list items
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

// Message bubble entrance
const messageBubble = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { type: "spring", stiffness: 500, damping: 30 },
};

// Button hover effects
const buttonHover = {
  scale: 1.02,
  transition: { type: "spring", stiffness: 400 },
};

// Card hover lift
const cardHover = {
  y: -4,
  boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
};

// Shake animation (for errors)
const shake = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.5 },
};

// Fade in on scroll
const fadeInOnScroll = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
};
```

### 5.3 Micro-interactions

```javascript
// Typing indicator dots
const typingDot = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 0.1,
    },
  },
};

// Send button pulse
const sendPulse = {
  scale: [1, 1.1, 1],
  transition: { duration: 0.2 },
};

// Online status pulse
const onlinePulse = {
  scale: [1, 1.2, 1],
  opacity: [1, 0.8, 1],
  transition: { duration: 2, repeat: Infinity },
};

// Unread badge bounce
const badgeBounce = {
  scale: [1, 1.3, 1],
  transition: { duration: 0.3 },
};

// Avatar hover glow
const avatarGlow = {
  boxShadow: "0 0 20px rgba(124, 58, 237, 0.5)",
};

// Toast slide in
const toastSlide = {
  initial: { opacity: 0, y: -50, x: 50 },
  animate: { opacity: 1, y: 0, x: 0 },
  exit: { opacity: 0, x: 100 },
};
```

### 5.4 Background Effects

```css
/* Animated gradient background (landing page) */
.gradient-bg {
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Floating particles */
.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(124, 58, 237, 0.3);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* Glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

---

## 6. Performance Optimizations

### 6.1 Code Splitting & Lazy Loading

```javascript
// Lazy load pages
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

// Lazy load heavy components
const EmojiPicker = lazy(() => import("@/components/chat/EmojiPicker"));
const ImageGallery = lazy(() => import("@/components/chat/ImageGallery"));
const GroupSettings = lazy(() => import("@/components/group/GroupSettings"));

// Suspense wrapper
<Suspense fallback={<PageSkeleton />}>
  <Routes>...</Routes>
</Suspense>
```

### 6.2 Infinite Scroll Implementation

```javascript
// Chat list infinite scroll
const useChatListInfiniteScroll = () => {
  const [chats, setChats] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const response = await chatService.getChats({ cursor, limit: 20 });

    setChats(prev => [...prev, ...response.data]);
    setCursor(response.nextCursor);
    setHasMore(response.hasMore);
    setLoading(false);
  }, [cursor, hasMore, loading]);

  return { chats, loadMore, hasMore, loading };
};

// Messages infinite scroll (reverse - load older on top)
const useMessagesInfiniteScroll = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);

  const loadOlder = useCallback(async () => {
    const scrollHeight = containerRef.current?.scrollHeight;

    const response = await messageService.getMessages(chatId, { cursor });

    setMessages(prev => [...response.data, ...prev]);
    setCursor(response.nextCursor);
    setHasMore(response.hasMore);

    // Maintain scroll position
    requestAnimationFrame(() => {
      const newScrollHeight = containerRef.current?.scrollHeight;
      containerRef.current.scrollTop = newScrollHeight - scrollHeight;
    });
  }, [chatId, cursor]);

  return { messages, loadOlder, hasMore, containerRef };
};
```

### 6.3 Virtualized Lists

```javascript
// For very long message lists, use virtualization
import { useVirtualizer } from "@tanstack/react-virtual";

const VirtualizedMessageList = ({ messages }) => {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated message height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <MessageBubble
            key={virtualRow.key}
            message={messages[virtualRow.index]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### 6.4 Image Optimization

```javascript
// Lazy load images with blur placeholder
const LazyImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "100px" }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder */}
      <div
        className={cn(
          "absolute inset-0 bg-muted animate-pulse",
          loaded && "opacity-0 transition-opacity"
        )}
      />
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
};
```

### 6.5 Debouncing & Throttling

```javascript
// Search debouncing
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Usage in search
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchUsers(debouncedSearch);
  }
}, [debouncedSearch]);

// Scroll throttling
const useThrottle = (callback, delay = 100) => {
  const lastCall = useRef(0);

  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
    }
  }, [callback, delay]);
};
```

### 6.6 Memoization

```javascript
// Memoize expensive computations
const sortedChats = useMemo(() => {
  return [...chats].sort((a, b) =>
    new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );
}, [chats]);

// Memoize components
const MessageBubble = memo(({ message, isOwn }) => {
  // Component implementation
});

// Memoize callbacks
const handleSendMessage = useCallback((content) => {
  dispatch(sendMessage({ chatId, content }));
}, [chatId, dispatch]);
```

---

## 7. Redux Store Architecture

### 7.1 Store Structure

```javascript
// store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import chatReducer from "./slices/chatSlice";
import messageReducer from "./slices/messageSlice";
import userReducer from "./slices/userSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chats: chatReducer,
    messages: messageReducer,
    users: userReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // For handling Dates
    }),
});

/*
Store Shape:
{
  auth: {
    user: { _id, username, email, avatar, bio, status } | null,
    isAuthenticated: boolean,
    loading: boolean,
    error: string | null,
  },
  chats: {
    list: Chat[],
    activeId: string | null,
    loading: boolean,
    error: string | null,
    cursor: string | null,
    hasMore: boolean,
  },
  messages: {
    byChat: {
      [chatId]: {
        items: Message[],
        cursor: string | null,
        hasMore: boolean,
        loading: boolean,
      }
    },
    sending: { [tempId]: Message }, // Optimistic updates
  },
  users: {
    searchResults: User[],
    searchLoading: boolean,
    profiles: { [userId]: User }, // Cached profiles
  },
  ui: {
    theme: "light" | "dark" | "system",
    sidebarOpen: boolean,
    groupInfoOpen: boolean,
    activeModal: string | null,
    toasts: Toast[],
  },
}
*/
```

### 7.2 Slice Definitions

```javascript
// store/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "@/services/authService";

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const register = createAsyncThunk("auth/register", async (data, { rejectWithValue }) => {
  try {
    const response = await authService.register(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Registration failed");
  }
});

export const verifyOtp = createAsyncThunk("auth/verifyOtp", async (data, { rejectWithValue }) => {
  try {
    const response = await authService.verifyOtp(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Verification failed");
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await authService.logout();
});

export const getCurrentUser = createAsyncThunk("auth/getCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const response = await authService.getCurrentUser();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: true, // Start true for initial auth check
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify OTP
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
```

```javascript
// store/slices/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import chatService from "@/services/chatService";

export const fetchChats = createAsyncThunk(
  "chats/fetchChats",
  async ({ cursor } = {}, { rejectWithValue }) => {
    try {
      const response = await chatService.getChats({ cursor, limit: 20 });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createDirectChat = createAsyncThunk(
  "chats/createDirect",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await chatService.createDirectChat(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createGroupChat = createAsyncThunk(
  "chats/createGroup",
  async (data, { rejectWithValue }) => {
    try {
      const response = await chatService.createGroupChat(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chats",
  initialState: {
    list: [],
    activeId: null,
    loading: false,
    error: null,
    cursor: null,
    hasMore: true,
  },
  reducers: {
    setActiveChat: (state, action) => {
      state.activeId = action.payload;
    },
    updateChatLastMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chat = state.list.find((c) => c._id === chatId);
      if (chat) {
        chat.lastMessage = message;
        chat.lastMessageAt = message.createdAt;
        // Re-sort to move to top
        state.list.sort((a, b) =>
          new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
      }
    },
    addChat: (state, action) => {
      // Add new chat to beginning of list
      state.list.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.cursor
          ? [...state.list, ...action.payload.chats]
          : action.payload.chats;
        state.cursor = action.payload.nextCursor;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(createDirectChat.fulfilled, (state, action) => {
        // Check if chat already exists
        const exists = state.list.find((c) => c._id === action.payload._id);
        if (!exists) {
          state.list.unshift(action.payload);
        }
        state.activeId = action.payload._id;
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.activeId = action.payload._id;
      });
  },
});

export const { setActiveChat, updateChatLastMessage, addChat } = chatSlice.actions;
export default chatSlice.reducer;
```

```javascript
// store/slices/messageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import messageService from "@/services/messageService";
import { updateChatLastMessage } from "./chatSlice";

export const fetchMessages = createAsyncThunk(
  "messages/fetch",
  async ({ chatId, cursor }, { rejectWithValue }) => {
    try {
      const response = await messageService.getMessages(chatId, { cursor });
      return { chatId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "messages/send",
  async ({ chatId, content, attachments, tempId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await messageService.sendMessage({ chatId, content, attachments });
      // Update chat's last message
      dispatch(updateChatLastMessage({ chatId, message: response.data }));
      return { chatId, message: response.data, tempId };
    } catch (error) {
      return rejectWithValue({ error: error.response?.data?.message, tempId, chatId });
    }
  }
);

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    byChat: {},
    sending: {},
  },
  reducers: {
    addOptimisticMessage: (state, action) => {
      const { chatId, message, tempId } = action.payload;
      if (!state.byChat[chatId]) {
        state.byChat[chatId] = { items: [], cursor: null, hasMore: true, loading: false };
      }
      state.byChat[chatId].items.push(message);
      state.sending[tempId] = message;
    },
    receiveMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.byChat[chatId]) {
        state.byChat[chatId] = { items: [], cursor: null, hasMore: true, loading: false };
      }
      // Avoid duplicates
      const exists = state.byChat[chatId].items.find((m) => m._id === message._id);
      if (!exists) {
        state.byChat[chatId].items.push(message);
      }
    },
    clearChatMessages: (state, action) => {
      delete state.byChat[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        const chatId = action.meta.arg.chatId;
        if (!state.byChat[chatId]) {
          state.byChat[chatId] = { items: [], cursor: null, hasMore: true, loading: true };
        } else {
          state.byChat[chatId].loading = true;
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { chatId, messages, nextCursor, hasMore } = action.payload;
        const existing = state.byChat[chatId]?.items || [];
        // Prepend older messages (since we load older on scroll up)
        state.byChat[chatId] = {
          items: [...messages, ...existing],
          cursor: nextCursor,
          hasMore,
          loading: false,
        };
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { chatId, message, tempId } = action.payload;
        // Replace optimistic message with real one
        const items = state.byChat[chatId]?.items || [];
        const index = items.findIndex((m) => m._id === tempId);
        if (index !== -1) {
          items[index] = message;
        }
        delete state.sending[tempId];
      })
      .addCase(sendMessage.rejected, (state, action) => {
        const { tempId, chatId } = action.payload;
        // Mark message as failed
        const items = state.byChat[chatId]?.items || [];
        const msg = items.find((m) => m._id === tempId);
        if (msg) {
          msg.failed = true;
        }
        delete state.sending[tempId];
      });
  },
});

export const { addOptimisticMessage, receiveMessage, clearChatMessages } = messageSlice.actions;
export default messageSlice.reducer;
```

```javascript
// store/slices/uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: getInitialTheme(),
    sidebarOpen: true,
    groupInfoOpen: false,
    activeModal: null,
    toasts: [],
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
      document.documentElement.classList.toggle("dark", action.payload === "dark");
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleGroupInfo: (state) => {
      state.groupInfoOpen = !state.groupInfoOpen;
    },
    openModal: (state, action) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    addToast: (state, action) => {
      state.toasts.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleGroupInfo,
  openModal,
  closeModal,
  addToast,
  removeToast,
} = uiSlice.actions;
export default uiSlice.reducer;
```

---

## 8. API Service Layer

### 8.1 Base API Configuration

```javascript
// services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9990",
  withCredentials: true, // Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/api/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 8.2 Service Modules

```javascript
// services/authService.js
import api from "./api";

const authService = {
  register: (data) => api.post("/api/auth/register", data),
  verifyOtp: (data) => api.post("/api/auth/verify-otp", data),
  resendOtp: (data) => api.post("/api/auth/resend-verify-otp", data),
  login: (data) => api.post("/api/auth/login", data),
  logout: () => api.get("/api/auth/logout"),
  forgotPassword: (data) => api.post("/api/auth/forgotpassword", data),
  resetPassword: (data) => api.post("/api/auth/verify-forgotpassword-otp", data),
  getCurrentUser: () => api.get("/api/users/me"),
};

export default authService;
```

```javascript
// services/chatService.js
import api from "./api";

const chatService = {
  getChats: (params) => api.get("/api/chats", { params }),
  getChatById: (chatId) => api.get(`/api/chats/${chatId}`),
  createDirectChat: (userId) => api.post("/api/chats", { userId }),
  createGroupChat: (data) => api.post("/api/chats/group", data),
  updateGroup: (chatId, data) => api.post(`/api/chats/${chatId}`, data),
  addMembers: (chatId, members) => api.post(`/api/chats/${chatId}/members/add`, { members }),
  removeMembers: (chatId, members) => api.post(`/api/chats/${chatId}/members/remove`, { members }),
  promoteToAdmin: (chatId, memberId) => api.post(`/api/chats/${chatId}/members/promote`, { memberId }),
};

export default chatService;
```

```javascript
// services/messageService.js
import api from "./api";

const messageService = {
  getMessages: (chatId, params) => api.get(`/api/messages/${chatId}`, { params }),
  sendMessage: (data) => api.post("/api/messages", data),
  markAsRead: (chatId) => api.post(`/api/messages/${chatId}/mark-read`),
};

export default messageService;
```

```javascript
// services/userService.js
import api from "./api";

const userService = {
  searchUsers: (params) => api.get("/api/users", { params }),
  getUserById: (userId) => api.get(`/api/users/${userId}`),
  updateProfile: (data) => api.put("/api/users/profile", data),
};

export default userService;
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Current)
- [x] Vite + React setup
- [x] Tailwind CSS configuration
- [x] Redux store skeleton
- [x] API service base
- [ ] **Fix Redux store bug**
- [ ] Setup shadcn/ui components
- [ ] Configure theme system
- [ ] Setup routing structure

### Phase 2: Authentication UI
- [ ] Landing page with hero
- [ ] Login page
- [ ] Signup page
- [ ] OTP verification page
- [ ] Forgot password flow
- [ ] Protected route wrapper
- [ ] Auth state persistence

### Phase 3: Chat Core
- [ ] Chat layout (sidebar + main)
- [ ] Chat list with infinite scroll
- [ ] Chat search
- [ ] Message view with infinite scroll
- [ ] Message input with attachments
- [ ] New chat modal

### Phase 4: Group Features
- [ ] Create group modal
- [ ] Group info panel
- [ ] Member management
- [ ] Admin actions

### Phase 5: User Features
- [ ] Profile page
- [ ] Edit profile
- [ ] Settings page
- [ ] Theme toggle

### Phase 6: Polish & Optimization
- [ ] All animations
- [ ] Loading states
- [ ] Error boundaries
- [ ] Performance optimizations
- [ ] Accessibility audit
- [ ] Mobile responsiveness

### Phase 7: Real-time (Future - Socket.IO)
- [ ] Socket connection management
- [ ] Real-time message delivery
- [ ] Typing indicators
- [ ] Online presence
- [ ] Read receipts live update

---

## Quick Start Commands

```bash
# Install dependencies
cd frontend && npm install

# Install shadcn/ui CLI
npx shadcn@latest init

# Add common components
npx shadcn@latest add button input card avatar badge dialog dropdown-menu tooltip tabs scroll-area skeleton toast

# Start development
npm run dev

# Build for production
npm run build
```

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Next Review:** After Phase 2 completion
