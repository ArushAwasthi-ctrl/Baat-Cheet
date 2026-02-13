import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    // Chat this message belongs to
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    // User who sent the message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Text content of the message (optional if there are attachments)
    content: {
      type: String,
      trim: true,
    },
    // High-level message type (useful for rendering on the frontend)
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    // Optional attachments (e.g., images/files uploaded to Cloudinary)
    attachments: [
      {
        url: { type: String, required: true }, // Cloudinary URL
        type: { type: String, enum: ["image", "file"], required: true },
        size: { type: Number }, // bytes (optional)
        fileName: { type: String }, // optional, for display
      },
    ],
    // Users who have read this message (for read receipts)
    readBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    // Edit & delete tracking
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    originalContent: {
      type: String,
    },
    // Reply reference
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    // Emoji reactions
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
  },
  { timestamps: true },
);

// Index on chat + createdAt for fast pagination when loading messages in a chat
MessageSchema.index({ chat: 1, createdAt: -1 });
// Text index for message search
MessageSchema.index({ content: "text" });
// Index for sender lookups
MessageSchema.index({ sender: 1, chat: 1 });
// Index for unread message queries (readBy + chat)
MessageSchema.index({ chat: 1, readBy: 1 });

const Message = mongoose.model("Message", MessageSchema);
export default Message;
