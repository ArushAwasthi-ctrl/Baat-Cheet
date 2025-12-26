import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
  Search,
  MessageSquare,
  Phone,
  Users,
  Settings,
  Plus,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";
import Avatar from "@/components/ui/Avatar";
import { openModal } from "@/store/slices/uiSlice";
import { resetUnreadCount } from "@/store/slices/chatSlice";

const navItems = [
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const ChatSidebar = ({ selectedChat, onSelectChat }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, unread, groups
  const { user } = useSelector((state) => state.auth);
  const { chats, isLoading, error } = useSelector((state) => state.chats);

  // Helper to get chat display name
  const getChatDisplayName = (chat) => {
    if (chat.isGroup) {
      return chat.name;
    }
    // For direct chats, find the other participant
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.username || "Unknown User";
  };

  // Helper to get chat avatar
  const getChatAvatar = (chat) => {
    if (chat.isGroup) {
      return chat.avatar || null;
    }
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.avatar || null;
  };

  // Helper to check if other user is online (for direct chats)
  const isOtherUserOnline = (chat) => {
    if (chat.isGroup) return false;
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.status === "online";
  };

  // Helper to format last message
  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return "No messages yet";
    const msg = chat.lastMessage;
    const senderName =
      msg.sender?._id === user?._id ? "You" : msg.sender?.username || "";
    const prefix = chat.isGroup && senderName ? `${senderName}: ` : "";
    return `${prefix}${msg.content || ""}`;
  };

  // Filter chats based on search and filter type
  const filteredChats = useMemo(() => {
    return (chats || []).filter((chat) => {
      if (!chat) return false;
      const displayName = getChatDisplayName(chat);
      const matchesSearch = displayName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && (chat.unreadCount || 0) > 0) ||
        (filter === "groups" && chat.isGroup);
      return matchesSearch && matchesFilter;
    });
  }, [chats, searchQuery, filter, user?._id]);

  const handleChatSelect = (chat) => {
    onSelectChat(chat);
    // Reset unread count when selecting chat
    if (chat.unreadCount > 0) {
      dispatch(resetUnreadCount({ chatId: chat._id }));
    }
  };

  const handleNewChat = () => {
    dispatch(openModal({ modal: "newChat" }));
  };

  const handleNewGroup = () => {
    dispatch(openModal({ modal: "newGroup" }));
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            title="New Chat"
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 flex gap-2">
        {["all", "unread", "groups"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground mt-2">
              Loading chats...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquare className="h-12 w-12 text-destructive/30 mb-3" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {chats.length === 0
                ? "No chats yet. Start a conversation!"
                : "No chats found"}
            </p>
            {chats.length === 0 && (
              <button
                onClick={handleNewChat}
                className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Start a Chat
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <motion.button
                key={chat._id}
                onClick={() => handleChatSelect(chat)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                  selectedChat?._id === chat._id
                    ? "bg-primary/10"
                    : "hover:bg-muted/50"
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="relative">
                  <Avatar
                    name={getChatDisplayName(chat)}
                    src={getChatAvatar(chat)}
                    size="md"
                  />
                  {isOtherUserOnline(chat) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground truncate">
                      {getChatDisplayName(chat)}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        (chat.unreadCount || 0) > 0
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {chat.lastMessage?.createdAt
                        ? formatRelativeTime(chat.lastMessage.createdAt)
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-sm text-muted-foreground truncate">
                      {getLastMessagePreview(chat)}
                    </span>
                    {(chat.unreadCount || 0) > 0 && (
                      <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full px-1.5">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Current User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={user?.username || "User"} size="md" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {user?.username || "User"}
            </p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
