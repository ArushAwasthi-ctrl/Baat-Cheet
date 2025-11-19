import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    // "direct" for 1-to-1 chats, "group" for group conversations
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
      required: true,
    },
    // Human-readable name for group chats (null/undefined for direct chats)
    name: {
      type: String,
      trim: true,
    },
    // Optional avatar / group picture
    avatar: {
      type: String,
    },
    // All participants in the chat (for direct chats: exactly 2 users)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // Subset of participants with admin privileges (only used for group chats)
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Reference to the latest message (used for sidebar preview)
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    // When the last message was sent (used to sort chats by activity)
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Index on participants + lastMessageAt for fast "my chats" queries sorted by recent activity
ChatSchema.index({ participants: 1, lastMessageAt: -1 });

const Chat = mongoose.model("Chat", ChatSchema);
export default Chat;
