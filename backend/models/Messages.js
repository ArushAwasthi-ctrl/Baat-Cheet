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
  },
  { timestamps: true },
);

// Index on chat + createdAt for fast pagination when loading messages in a chat
MessageSchema.index({ chat: 1, createdAt: -1 });

const Message = mongoose.model("Message", MessageSchema);
export default Message;
