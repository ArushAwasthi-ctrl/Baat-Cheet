# Baat Cheet - Implementation Phases Guide

## Plan File Location
**Full Plan:** `C:\Users\Arush\.claude\plans\scalable-dazzling-grove.md`

## Deployment Info
- **Frontend:** Vercel - https://baat-cheet-jet.vercel.app
- **Backend:** Render - https://baat-cheet-backend-ksdj.onrender.com

---

## Phase 0: Urgent Production Bugs [COMPLETED]

### 0.1 Fix Cookie/Auth Issues [DONE]
- Fixed CORS bypass in `backend/app.js`
- Fixed cookie clearing options in `backend/controllers/auth-controller.js`

### 0.2 Fix Vercel 404 Errors [DONE]
- Created `frontend/vercel.json` with SPA rewrites

### 0.3 Fix Socket Connection [DEPENDS ON 0.1]
- Will work once cookies are properly set

### 0.4 Fix Email Service [DONE]
- Added worker import in `backend/index.js`

---

## Phase 1: Security Fixes

### 1.1 Fix CORS Misconfiguration [DONE]
**File:** `backend/app.js`
- Removed fallback that allowed all origins in production
- Now properly rejects unauthorized origins

### 1.2 Hash OTP Before Storing in Redis [DONE]
**File:** `backend/controllers/auth-controller.js`

**What to do:**
1. hashOTP helper function already added (line 45-47)
2. Update `registerUser` function to hash OTP before storing:
```javascript
const otp = generateOTP();
const hashedOtp = hashOTP(otp);
// Store hashedOtp in Redis, send plain otp to email
```
3. Update `verifyOtp` to compare hashed values:
```javascript
if (hashOTP(otp) !== parsedUserData.otp) throw new ApiError(400, "Invalid OTP");
```
4. Update `resendEmailVerificationOTP` same as registerUser
5. Update `forgotPassword` to hash OTP
6. Update `verifyForgotPasswordOtp` to compare hashed values

### 1.3 Fix Cookie Clearing [DONE]
**File:** `backend/controllers/auth-controller.js`
- Created `clearCookieOptions` without maxAge
- Updated logout to use clearCookieOptions

### 1.4 Handle Socket.IO Token Expiry [OPTIONAL - COMPLEX]
**Files:**
- `backend/socket/index.js`
- `frontend/src/services/socketService.js`

**What to do:**
- Add server-side event to notify client before token expires
- Frontend refreshes token proactively

### 1.5 Clean Up Password Hashing Code [DONE]
**File:** `backend/models/Users.js`
- Removed commented pre-save hook

---

## Phase 2: Bug Fixes

### 2.1 Fix Memory Leak in useSocket Hook [DONE]
**File:** `frontend/src/hooks/useSocket.js`

**What to do:**
1. Expose `leaveChat` method (currently commented out on line 52)
2. Track joined chat rooms
3. Add cleanup in useEffect when selectedChat changes:
```javascript
useEffect(() => {
  if (previousChatId) {
    socketService.leaveChat(previousChatId);
  }
  if (currentChatId) {
    socketService.joinChat(currentChatId);
  }
  return () => {
    if (currentChatId) {
      socketService.leaveChat(currentChatId);
    }
  };
}, [currentChatId]);
```

### 2.2 Fix Race Condition in ChatPage Auth Check [DONE]
**File:** `frontend/src/pages/ChatPage.jsx`

**What to do:**
Create a ProtectedRoute wrapper component:
```javascript
// frontend/src/components/shared/ProtectedRoute.jsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!isAuthenticated) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch {}
      }
      setChecked(true);
    };
    check();
  }, []);

  if (!checked || isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};
```

### 2.3 Remove Console Logging [DONE]
- Removed from `frontend/src/services/socketService.js`
- Removed from `backend/socket/index.js`
- Removed from `frontend/src/components/chat/*.jsx`

### 2.4 Fix Redux Store Import Anti-pattern [OPTIONAL]
**File:** `frontend/src/services/socketService.js`
- Use dependency injection instead of direct store import
- Pass dispatch function during initialization

### 2.5 Add Frontend Input Validation [DONE]
**File:** `frontend/src/components/chat/ChatArea.jsx`

**What to do:**
```javascript
const handleSend = async () => {
  const content = message.trim();
  if (!content) return;

  // Add validation
  if (content.length > 5000) {
    toast.error("Message too long (max 5000 characters)");
    return;
  }

  // ... rest of send logic
};
```

---

## Phase 3: Code Quality

### 3.1 Add Error Boundaries [DONE]
**Create:** `frontend/src/components/shared/ErrorBoundary.jsx`

```javascript
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
            <p className="text-muted-foreground mt-2">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Modify:** `frontend/src/layouts/ChatLayout.jsx`
- Wrap ChatSidebar, ChatArea, ContactInfoPanel with ErrorBoundary

---

## Phase 4: Features

### 4.1 Implement User Account Deletion [DONE]
**Files:**
- `backend/controllers/users-controller.js`
- `backend/routes/users-routes.js`
- Frontend: Add delete account button in settings

**Backend Implementation:**
```javascript
// In users-controller.js
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 1. Remove user from all chats
  await Chat.updateMany(
    { participants: userId },
    { $pull: { participants: userId, admins: userId } }
  );

  // 2. Delete chats where user was the only participant
  await Chat.deleteMany({ participants: { $size: 0 } });

  // 3. Delete or anonymize user's messages
  await Message.updateMany(
    { sender: userId },
    { $set: { sender: null, content: "[Deleted]" } }
  );

  // 4. Clear Redis tokens
  await redisClient.del(`refresh:${userId}`);

  // 5. Delete user
  await User.findByIdAndDelete(userId);

  // 6. Clear cookies
  res.clearCookie("accessToken", clearCookieOptions)
     .clearCookie("refreshToken", clearCookieOptions);

  return res.status(200).json(new ApiResponse(200, null, "Account deleted"));
});
```

**Route:**
```javascript
router.delete("/me", authMiddleware, deleteAccount);
```

### 4.2 Complete File Attachments [TODO - COMPLEX]
**Files:**
- `backend/controllers/upload-controller.js` (create)
- `backend/routes/upload-routes.js` (create)
- `frontend/src/components/chat/ChatArea.jsx`

**Backend:**
- Create Cloudinary upload endpoint
- Validate file type and size (max 10MB)

**Frontend:**
- Add file picker button
- Show upload progress
- Display attachments in messages

### 4.3 Complete Emoji Picker [DONE]
**File:** `frontend/src/components/chat/ChatArea.jsx`

**What to do:**
1. Install emoji-mart: `npm install @emoji-mart/react @emoji-mart/data`
2. Add emoji picker component:
```javascript
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// In ChatArea component
const [showEmojiPicker, setShowEmojiPicker] = useState(false);

const handleEmojiSelect = (emoji) => {
  setMessage(prev => prev + emoji.native);
  setShowEmojiPicker(false);
};

// In JSX, replace the "coming soon" toast:
<Button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
  <Smile className="h-5 w-5" />
</Button>
{showEmojiPicker && (
  <div className="absolute bottom-full right-0 mb-2">
    <Picker data={data} onEmojiSelect={handleEmojiSelect} />
  </div>
)}
```

---

## Quick Status Summary

| Phase | Task | Status |
|-------|------|--------|
| 0.1 | Cookie/Auth Issues | DONE |
| 0.2 | Vercel 404 | DONE |
| 0.4 | Email Service | DONE |
| 1.1 | CORS Fix | DONE |
| 1.2 | Hash OTP | DONE |
| 1.3 | Cookie Clearing | DONE |
| 1.5 | Password Hook Cleanup | DONE |
| 2.1 | useSocket Memory Leak | DONE |
| 2.2 | ChatPage Race Condition | DONE |
| 2.3 | Console Logging | DONE |
| 2.5 | Input Validation | DONE |
| 3.1 | Error Boundaries | DONE |
| 4.1 | Account Deletion | DONE |
| 4.3 | Emoji Picker | DONE |

---

## Environment Variables Required

### Backend (Render)
```
NODE_ENV=production
CORS_ORIGINS=https://baat-cheet-jet.vercel.app
MONGODB_URI=<your-mongodb-uri>
REDIS_URL=<your-redis-url>
ACCESS_TOKEN_SECRET=<secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=<secret>
REFRESH_TOKEN_EXPIRY=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=<email>
SMTP_PASSWORD=<app-password>
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
```

### Frontend (Vercel)
```
VITE_API_URL=https://baat-cheet-backend-ksdj.onrender.com
```

---

## Next Steps (Priority Order)

All planned implementation phases are complete! Future enhancements to consider:

1. **4.2** - Complete File Attachments (upload images/files)
2. **1.4** - Handle Socket.IO Token Expiry (optional, complex)
3. **2.4** - Fix Redux Store Import Anti-pattern (optional refactor)
4. Voice & Video Calls integration
5. Push notifications
