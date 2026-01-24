import { useState, useRef, useEffect, useCallback } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { cn, formatMessageTime } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import EmptyChat from "@/components/chat/EmptyChat";
import {
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
} from "@/store/slices/messageSlice";
import { updateChatLastMessage } from "@/store/slices/chatSlice";
import { useTypingIndicator } from "@/hooks/useSocket";
import socketService from "@/services/socketService";
import { toast } from "sonner";

const ChatArea = ({ chat, onToggleInfo, onBack, isMobile = false }) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { messagesByChat, loadingByChat, paginationByChat, isSending } =
    useSelector((state) => state.messages);

  // Get typing users for this chat
  const typingUsers = useTypingIndicator(chat?._id);

  const messages = chat ? messagesByChat[chat._id] || [] : [];
  const isLoadingMessages = chat ? loadingByChat[chat._id] : false;
  const pagination = chat ? paginationByChat[chat._id] : null;

  // Helper to get chat display name
  const getChatDisplayName = () => {
    if (!chat) return "";
    if (chat.isGroup) {
      return chat.name;
    }
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.username || "Unknown User";
  };

  // Helper to get chat avatar
  const getChatAvatar = () => {
    if (!chat) return null;
    if (chat.isGroup) {
      return chat.avatar || null;
    }
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.avatar || null;
  };

  // Helper to check if other user is online
  const isOtherUserOnline = () => {
    if (!chat || chat.isGroup) return false;
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.status === "online";
  };

  // Fetch messages when chat changes
  useEffect(() => {
    if (chat?._id && !messagesByChat[chat._id]) {
      dispatch(fetchMessages({ chatId: chat._id }));
    }
  }, [chat?._id, dispatch, messagesByChat]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (chat?._id) {
      dispatch(markMessagesAsRead(chat._id));
    }
  }, [chat?._id, dispatch]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when chat changes
  useEffect(() => {
    if (chat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chat]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!chat?._id) return;

    socketService.startTyping(chat._id);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(chat._id);
    }, 2000);
  }, [chat]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (chat?._id) {
        socketService.stopTyping(chat._id);
      }
    };
  }, [chat?._id]);

  // Show coming soon toast for unavailable features
  const showComingSoon = (feature) => {
    toast.info(`${feature} coming soon!`, {
      duration: 2000,
    });
  };

  const handleSend = async () => {
    if (!message.trim() || !chat?._id || isSending) return;

    const content = message.trim();
    setMessage("");

    try {
      const result = await dispatch(
        sendMessage({ chatId: chat._id, content })
      ).unwrap();

      // Update the chat's last message in the sidebar
      if (result.message) {
        dispatch(
          updateChatLastMessage({
            chatId: chat._id,
            message: result.message,
          })
        );
      }
    } catch (error) {
      toast.error(error || "Failed to send message. Please try again.");
      // Restore message on error
      setMessage(content);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLoadMore = () => {
    if (pagination?.hasMore && !isLoadingMessages) {
      dispatch(
        fetchMessages({ chatId: chat._id, cursor: pagination.nextCursor })
      );
    }
  };

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const formatDateDivider = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  if (!chat) {
    return <EmptyChat />;
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 px-2 sm:px-4 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={onToggleInfo}
          >
            <div className="relative">
              <Avatar name={getChatDisplayName()} src={getChatAvatar()} size="md" />
              {isOtherUserOnline() && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                {getChatDisplayName()}
              </h2>
              <p className="text-xs text-green-500">
                {isOtherUserOnline() ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={() => showComingSoon("Voice calls")}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors hidden sm:flex"
          >
            <Phone className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => showComingSoon("Video calls")}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors hidden sm:flex"
          >
            <Video className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => showComingSoon("Message search")}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={onToggleInfo}
          >
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load More Button */}
        {pagination?.hasMore && (
          <div className="flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMessages}
              className="px-4 py-2 text-sm text-primary hover:bg-muted/50 rounded-lg transition-colors"
            >
              {isLoadingMessages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Load earlier messages"
              )}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground mt-2">
              Loading messages...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {/* Messages grouped by date */}
        <AnimatePresence>
          {Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground">
                  {formatDateDivider(date)}
                </span>
              </div>

              {/* Messages for this date */}
              {msgs.map((msg) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex mb-3",
                    msg.sender?._id === user?._id ||
                      msg.sender === user?._id
                      ? "justify-end"
                      : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex gap-2 max-w-[70%]",
                      (msg.sender?._id === user?._id ||
                        msg.sender === user?._id) &&
                        "flex-row-reverse"
                    )}
                  >
                    {msg.sender?._id !== user?._id &&
                      msg.sender !== user?._id && (
                        <Avatar
                          name={msg.sender?.username || "User"}
                          src={msg.sender?.avatar}
                          size="sm"
                        />
                      )}
                    <div>
                      {msg.attachments?.length > 0 &&
                        msg.attachments.map((attachment, idx) => (
                          <div
                            key={idx}
                            className="mb-2 rounded-xl overflow-hidden"
                          >
                            {attachment.type?.startsWith("image") && (
                              <img
                                src={attachment.url}
                                alt="Shared"
                                className="max-w-full h-auto"
                              />
                            )}
                          </div>
                        ))}
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl",
                          msg.sender?._id === user?._id ||
                            msg.sender === user?._id
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-1 text-xs text-muted-foreground",
                          (msg.sender?._id === user?._id ||
                            msg.sender === user?._id) &&
                            "justify-end"
                        )}
                      >
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {(msg.sender?._id === user?._id ||
                          msg.sender === user?._id) && (
                          <span>
                            {msg.status === "read" ||
                            msg.readBy?.length > 0 ? (
                              <CheckCheck className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <Avatar
              name={typingUsers[0]?.username || "User"}
              size="sm"
            />
            <div className="px-4 py-3 rounded-2xl bg-muted rounded-bl-md">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                </div>
                <span className="text-xs text-muted-foreground ml-1">
                  {typingUsers.length === 1
                    ? `${typingUsers[0]?.username} is typing...`
                    : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => showComingSoon("File attachments")}
            className="p-2.5 rounded-full hover:bg-muted/50 transition-colors"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full h-11 px-4 pr-12 rounded-full bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => showComingSoon("Emoji picker")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <motion.button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className={cn(
              "p-2.5 rounded-full transition-colors",
              message.trim() && !isSending
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
