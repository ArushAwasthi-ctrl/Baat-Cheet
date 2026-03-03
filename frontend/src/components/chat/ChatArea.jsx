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
  X,
  FileText,
  Download,
  Pencil,
  Trash2,
  Reply,
  CornerUpRight,
  Sparkles,
} from "lucide-react";
import { cn, formatMessageTime } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import EmptyChat from "@/components/chat/EmptyChat";
import {
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage as editMessageThunk,
  deleteMessage as deleteMessageThunk,
  toggleReaction,
} from "@/store/slices/messageSlice";
import messageService from "@/services/messageService";
import { updateChatLastMessage } from "@/store/slices/chatSlice";
import { requestSummary, clearSummary } from "@/store/slices/aiSlice";
import { useTypingIndicator, useUserStatus } from "@/hooks/useSocket";
import socketService from "@/services/socketService";
import { toast } from "sonner";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const ChatArea = ({ chat, onToggleInfo, onBack, isMobile = false }) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const contextMenuRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { messagesByChat, loadingByChat, paginationByChat, isSending } =
    useSelector((state) => state.messages);

  // Get typing users for this chat
  const typingUsers = useTypingIndicator(chat?._id);

  // Get real-time user status
  const { getUserStatus } = useUserStatus();

  const messages = chat ? messagesByChat[chat._id] || [] : [];
  const isLoadingMessages = chat ? loadingByChat[chat._id] : false;
  const pagination = chat ? paginationByChat[chat._id] : null;

  // AI state
  const {
    summariesByChat,
    streamingByChat,
    isRequestingSummary,
    aiTypingByChat,
    aiStreamByChat,
  } = useSelector((state) => state.ai);
  const currentSummary = chat ? summariesByChat[chat._id] : null;
  const streamingSummary = chat ? streamingByChat[chat._id] : null;
  const isAiTyping = chat ? aiTypingByChat[chat._id] : false;
  const aiStreamText = chat ? aiStreamByChat[chat._id] : null;
  const [showSummary, setShowSummary] = useState(false);

  // Helper to get chat display name
  const getChatDisplayName = () => {
    if (!chat) return "";
    if (chat.type === "group") {
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
    if (chat.type === "group") {
      return chat.avatar || null;
    }
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.avatar || null;
  };

  // Helper to check if other user is online
  const isOtherUserOnline = () => {
    if (!chat || chat.type === "group") return false;
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    if (!otherParticipant) return false;
    // Check real-time status first, fallback to static chat data
    const realTimeStatus = getUserStatus(otherParticipant._id);
    return realTimeStatus.status === "online" || otherParticipant?.status === "online";
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

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
    }
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu]);

  // Handle right-click context menu on messages
  const handleMessageContextMenu = (e, msg) => {
    e.preventDefault();
    if (msg.isDeleted) return;
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 250);
    setContextMenu({ x, y, message: msg });
  };

  // Start editing a message
  const startEditMessage = (msg) => {
    setEditingMessage(msg);
    setMessage(msg.content || "");
    setReplyingTo(null);
    setContextMenu(null);
    inputRef.current?.focus();
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingMessage(null);
    setMessage("");
  };

  // Handle delete message
  const handleDeleteMessage = async (msg) => {
    setContextMenu(null);
    try {
      await dispatch(deleteMessageThunk({ messageId: msg._id })).unwrap();
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error || "Failed to delete message");
    }
  };

  // Start replying to a message
  const startReply = (msg) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    setContextMenu(null);
    inputRef.current?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Handle reaction
  const handleReaction = async (msg, emoji) => {
    setHoveredMessageId(null);
    try {
      await dispatch(toggleReaction({ messageId: msg._id, emoji })).unwrap();
    } catch (error) {
      toast.error(error || "Failed to react");
    }
  };

  // Quick reaction emojis
  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

  // Handle search
  const handleSearch = useCallback(
    async (query) => {
      if (!query.trim() || !chat?._id) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await messageService.searchInChat(chat._id, query);
        setSearchResults(response.data?.messages || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [chat?._id]
  );

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, handleSearch]);

  // Handle AI Catch-Up summary
  const handleCatchUp = async () => {
    if (!chat?._id) return;
    setShowSummary(true);
    try {
      await dispatch(requestSummary({ chatId: chat._id })).unwrap();
    } catch (err) {
      toast.error(err || "Failed to generate summary");
    }
  };

  // Scroll to a specific message
  const scrollToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/10");
      setTimeout(() => el.classList.remove("bg-primary/10"), 2000);
    }
  };

  // Reset edit/reply when chat changes
  useEffect(() => {
    setEditingMessage(null);
    setReplyingTo(null);
    setMessage("");
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  }, [chat?._id]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = [];

    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: File type not allowed`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File too large (max 10MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (selectedFiles.length + validFiles.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    // Generate previews for images
    const newPreviews = validFiles.map((file) => {
      if (file.type.startsWith("image/")) {
        return { file, url: URL.createObjectURL(file), type: "image" };
      }
      return { file, url: null, type: "file" };
    });
    setFilePreviews((prev) => [...prev, ...newPreviews]);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Remove a selected file
  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      // Revoke object URL to prevent memory leaks
      if (prev[index]?.url) URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Cleanup file preview URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    inputRef.current?.focus();
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = async () => {
    const hasContent = message.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    if ((!hasContent && !hasFiles) || !chat?._id || isSending) return;

    const content = message.trim();

    // Validate message length
    if (content.length > 5000) {
      toast.error("Message too long (max 5000 characters)");
      return;
    }

    // Handle edit mode
    if (editingMessage) {
      setMessage("");
      setEditingMessage(null);
      try {
        await dispatch(
          editMessageThunk({ messageId: editingMessage._id, content })
        ).unwrap();
        toast.success("Message edited");
      } catch (error) {
        toast.error(error || "Failed to edit message");
      }
      inputRef.current?.focus();
      return;
    }

    setMessage("");
    const filesToSend = [...selectedFiles];
    const currentReplyTo = replyingTo;
    setSelectedFiles([]);
    setFilePreviews((prev) => {
      prev.forEach((p) => { if (p.url) URL.revokeObjectURL(p.url); });
      return [];
    });
    setReplyingTo(null);

    try {
      const result = await dispatch(
        sendMessage({
          chatId: chat._id,
          content: content || undefined,
          files: filesToSend,
          replyTo: currentReplyTo?._id || null,
        })
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
      if (content) setMessage(content);
      if (currentReplyTo) setReplyingTo(currentReplyTo);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      if (editingMessage) cancelEdit();
      if (replyingTo) cancelReply();
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
            onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); setSearchResults([]); }}
            className={cn(
              "p-2 rounded-lg hover:bg-muted/50 transition-colors",
              showSearch && "bg-primary/10 text-primary"
            )}
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={handleCatchUp}
            disabled={isRequestingSummary}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-1"
            title="Catch up on unread messages"
          >
            <Sparkles className={cn("h-5 w-5", isRequestingSummary && "animate-pulse text-primary")} />
            <span className="text-xs font-medium text-muted-foreground sm:hidden">
              {isRequestingSummary ? "..." : "Catch Up"}
            </span>
          </button>
          <button
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={onToggleInfo}
          >
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border bg-card/50 overflow-hidden"
          >
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in conversation..."
                  className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((result) => (
                    <button
                      key={result._id}
                      onClick={() => { scrollToMessage(result._id); setShowSearch(false); }}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">
                        {result.sender?.username} · {formatMessageTime(result.createdAt)}
                      </p>
                      <p className="text-sm truncate">{result.content}</p>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && !isSearching && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">No results found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Catch-Up Summary Panel */}
      <AnimatePresence>
        {showSummary && (currentSummary || streamingSummary) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border bg-primary/5 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">AI Catch-Up Summary</span>
                </div>
                <button
                  onClick={() => { setShowSummary(false); dispatch(clearSummary(chat._id)); }}
                  className="p-1 rounded hover:bg-muted/50"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {streamingSummary || currentSummary}
                {streamingSummary && <span className="animate-pulse">|</span>}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              {msgs.map((msg) => {
                const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
                return (
                <motion.div
                  key={msg._id}
                  id={`msg-${msg._id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex mb-3 group/msg transition-colors duration-500 rounded-lg",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                  onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                  onMouseEnter={() => setHoveredMessageId(msg._id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <div
                    className={cn(
                      "flex gap-2 max-w-[85%] sm:max-w-[70%] relative",
                      isOwn && "flex-row-reverse"
                    )}
                  >
                    {!isOwn && (
                        <Avatar
                          name={msg.sender?.username || "User"}
                          src={msg.sender?.avatar}
                          size="sm"
                        />
                      )}
                    <div className="relative">
                      {/* Hover action buttons */}
                      {!msg.isDeleted && hoveredMessageId === msg._id && (
                        <div className={cn(
                          "absolute -top-8 z-10 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-lg p-0.5",
                          isOwn ? "right-0" : "left-0"
                        )}>
                          <button
                            onClick={() => startReply(msg)}
                            className="p-1.5 rounded hover:bg-muted/50 transition-colors"
                            title="Reply"
                          >
                            <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          {quickReactions.slice(0, 3).map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg, emoji)}
                              className="p-1 rounded hover:bg-muted/50 transition-colors text-sm"
                            >
                              {emoji}
                            </button>
                          ))}
                          {isOwn && (
                            <>
                              <button
                                onClick={() => startEditMessage(msg)}
                                className="p-1.5 rounded hover:bg-muted/50 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg)}
                                className="p-1.5 rounded hover:bg-muted/50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Reply reference */}
                      {msg.replyTo && !msg.isDeleted && (
                        <button
                          onClick={() => scrollToMessage(msg.replyTo._id)}
                          className={cn(
                            "w-full mb-1 p-2 rounded-xl text-left text-xs border-l-2 border-primary/50",
                            isOwn ? "bg-primary/20" : "bg-muted/80"
                          )}
                        >
                          <p className="font-medium text-primary/80 truncate">
                            {msg.replyTo.sender?.username || "User"}
                          </p>
                          <p className="truncate text-muted-foreground">
                            {msg.replyTo.isDeleted ? "This message was deleted" : msg.replyTo.content}
                          </p>
                        </button>
                      )}

                      {/* Attachments */}
                      {msg.attachments?.length > 0 && !msg.isDeleted && (() => {
                        const images = msg.attachments.filter(a => a.type === "image");
                        const files = msg.attachments.filter(a => a.type !== "image");
                        const imageCount = images.length;

                        return (
                          <>
                            {imageCount > 0 && (
                              <div className={cn(
                                "mb-2",
                                imageCount === 1 ? "" : "grid grid-cols-2 gap-1"
                              )}>
                                {images.map((attachment, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "rounded-xl overflow-hidden",
                                      imageCount >= 3 && idx === imageCount - 1 && imageCount % 2 !== 0
                                        ? "col-span-2" : ""
                                    )}
                                  >
                                    <img
                                      src={attachment.url}
                                      alt={attachment.fileName || "Shared"}
                                      className={cn(
                                        "w-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity",
                                        imageCount === 1 ? "max-h-[400px]" : "max-h-[200px]"
                                      )}
                                      onClick={() => window.open(attachment.url, "_blank")}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                            {files.map((attachment, idx) => (
                              <div
                                key={`file-${idx}`}
                                className="mb-2 rounded-xl overflow-hidden"
                              >
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <FileText className="h-8 w-8 text-primary shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate text-foreground">
                                      {attachment.fileName || "File"}
                                    </p>
                                    {attachment.size && (
                                      <p className="text-xs text-muted-foreground">
                                        {(attachment.size / 1024).toFixed(1)} KB
                                      </p>
                                    )}
                                  </div>
                                  <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                                </a>
                              </div>
                            ))}
                          </>
                        );
                      })()}

                      {/* Message bubble */}
                      {(() => {
                        const isAiMessage = msg.sender?.username === "AI Assistant";
                        return (
                          <div
                            className={cn(
                              "px-4 py-2.5 rounded-2xl",
                              msg.isDeleted
                                ? "bg-muted/50 italic"
                                : isAiMessage
                                  ? "bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-bl-md"
                                  : isOwn
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted rounded-bl-md"
                            )}
                          >
                            {isAiMessage && (
                              <div className="flex items-center gap-1 mb-1">
                                <Sparkles className="h-3 w-3 text-primary" />
                                <span className="text-xs font-medium text-primary">AI Assistant</span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                        );
                      })()}

                      {/* Reactions display */}
                      {msg.reactions?.length > 0 && (
                        <div className={cn(
                          "flex flex-wrap gap-1 mt-1",
                          isOwn && "justify-end"
                        )}>
                          {msg.reactions.map((reaction, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleReaction(msg, reaction.emoji)}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
                                reaction.users?.some((u) => (u._id || u) === user?._id)
                                  ? "border-primary/50 bg-primary/10"
                                  : "border-border bg-card hover:bg-muted/50"
                              )}
                              title={`${reaction.users?.length || 0} reaction(s)`}
                            >
                              <span>{reaction.emoji}</span>
                              {reaction.users?.length > 0 && (
                                <span className="text-muted-foreground">{reaction.users.length}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Timestamp + edited + read status */}
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-1 text-xs text-muted-foreground",
                          isOwn && "justify-end"
                        )}
                      >
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {msg.isEdited && !msg.isDeleted && (
                          <span className="text-muted-foreground/70">(edited)</span>
                        )}
                        {isOwn && (
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
                );
              })}
            </div>
          ))}
        </AnimatePresence>

        {/* AI Typing Indicator */}
        {isAiTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4"
          >
            <div className="px-4 py-3 rounded-2xl bg-linear-to-r from-primary/10 to-primary/5 rounded-bl-md">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="text-xs text-primary">AI is thinking...</span>
              </div>
              {aiStreamText && (
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                  {aiStreamText}
                  <span className="animate-pulse">|</span>
                </p>
              )}
            </div>
          </motion.div>
        )}

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

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[160px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => startReply(contextMenu.message)}
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors"
            >
              <Reply className="h-4 w-4" /> Reply
            </button>
            {(contextMenu.message.sender?._id === user?._id || contextMenu.message.sender === user?._id) && (
              <>
                <button
                  onClick={() => startEditMessage(contextMenu.message)}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteMessage(contextMenu.message)}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </>
            )}
            <div className="border-t border-border my-1" />
            <div className="px-3 py-1.5 flex items-center gap-1">
              {quickReactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { handleReaction(contextMenu.message, emoji); setContextMenu(null); }}
                  className="p-1.5 rounded hover:bg-muted/50 transition-colors text-base"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Bar */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-card/50 overflow-hidden"
          >
            <div className="px-4 py-2 flex items-center gap-3">
              <CornerUpRight className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary">
                  Replying to {replyingTo.sender?.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {replyingTo.content || "Attachment"}
                </p>
              </div>
              <button onClick={cancelReply} className="p-1 rounded hover:bg-muted/50">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Bar */}
      <AnimatePresence>
        {editingMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-card/50 overflow-hidden"
          >
            <div className="px-4 py-2 flex items-center gap-3">
              <Pencil className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-500">Editing message</p>
                <p className="text-xs text-muted-foreground truncate">
                  {editingMessage.content}
                </p>
              </div>
              <button onClick={cancelEdit} className="p-1 rounded hover:bg-muted/50">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Preview Bar */}
      {filePreviews.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-card/50 flex gap-2 overflow-x-auto">
          {filePreviews.map((preview, index) => (
            <div key={index} className="relative shrink-0 group">
              {preview.type === "image" ? (
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="h-16 w-16 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="h-16 w-16 flex flex-col items-center justify-center rounded-lg border border-border bg-muted/50">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground truncate max-w-[56px] mt-0.5">
                    {preview.file.name.split(".").pop()}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "p-2.5 rounded-full hover:bg-muted/50 transition-colors",
              selectedFiles.length > 0 && "text-primary"
            )}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1 relative">
            {message.toLowerCase().includes("@ai") && (
              <div className="absolute -top-7 left-4 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded inline-block">
                AI will respond to your message
              </div>
            )}
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
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors",
                showEmojiPicker
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {showEmojiPicker ? (
                <X className="h-5 w-5" />
              ) : (
                <Smile className="h-5 w-5" />
              )}
            </button>

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  ref={emojiPickerRef}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full right-0 mb-2 z-50"
                >
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="auto"
                    previewPosition="none"
                    skinTonePosition="search"
                    maxFrequentRows={2}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            onClick={handleSend}
            disabled={(!message.trim() && selectedFiles.length === 0) || isSending}
            className={cn(
              "p-2.5 rounded-full transition-colors",
              (message.trim() || selectedFiles.length > 0) && !isSending
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
