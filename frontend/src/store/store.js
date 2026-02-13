import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import chatReducer from "./slices/chatSlice";
import messageReducer from "./slices/messageSlice";
import friendReducer from "./slices/friendSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    chats: chatReducer,
    messages: messageReducer,
    friends: friendReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["ui/addToast"],
      },
    }),
  devTools: import.meta.env.DEV,
});

export default store;
