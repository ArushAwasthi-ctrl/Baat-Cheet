import { useState, useMemo } from "react";
// eslint-disable-next-line no-unused-vars
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
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  UserPlus,
  Edit3,
  Moon,
  Sun,
  LogOut,
  Bell,
  Lock,
  HelpCircle,
  Camera,
  Check,
  X,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";
import Avatar from "@/components/ui/Avatar";
import { openModal, toggleTheme } from "@/store/slices/uiSlice";
import { resetUnreadCount } from "@/store/slices/chatSlice";
import { logout, updateUser } from "@/store/slices/authSlice";
import userService from "@/services/userService";
import { toast } from "sonner";

// Show coming soon toast helper
const showComingSoon = (feature) => {
  toast.info(`${feature} coming soon!`, {
    duration: 2000,
  });
};

const navItems = [
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

// Calls Tab Component
const CallsTab = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <PhoneCall className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">Calls Coming Soon</h3>
      <p className="text-sm text-muted-foreground max-w-[200px]">
        Voice and video calls will be available in a future update.
      </p>
      <button
        onClick={() => showComingSoon("Voice & video calls")}
        className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
      >
        Notify Me
      </button>
    </div>
  );
};

// Contacts Tab Component
const ContactsTab = ({ onStartChat }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await userService.searchUsers(query);
      const users = response.data?.users || [];
      // Filter out current user
      setSearchResults(users.filter((u) => u._id !== user?._id));
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-2">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-1">
            {searchResults.map((contact) => (
              <motion.button
                key={contact._id}
                onClick={() => onStartChat && onStartChat(contact)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Avatar
                  name={contact.username}
                  src={contact.avatar}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {contact.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.bio || "No bio"}
                  </p>
                </div>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        ) : hasSearched && searchQuery.length >= 2 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Find People</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Search for users by their username to start a conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ user, onLogout }) => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.ui);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!username.trim()) return;

    setIsSaving(true);
    try {
      const response = await userService.updateProfile({
        username: username.trim(),
        bio: bio.trim(),
      });
      dispatch(updateUser(response.data?.user || response.data));
      setIsEditing(false);
    } catch {
      // Profile update failed silently - user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setUsername(user?.username || "");
    setBio(user?.bio || "");
    setIsEditing(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Profile Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              name={user?.username || "User"}
              src={user?.avatar}
              size="xl"
            />
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Bio"
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground truncate">
                    {user?.username || "User"}
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded hover:bg-muted/50 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.bio || "No bio yet"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="p-2">
        {/* Theme Toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="flex-1 text-left text-sm text-foreground">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => showComingSoon("Notification settings")}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left text-sm text-foreground">
            Notifications
          </span>
        </button>

        {/* Privacy */}
        <button
          onClick={() => showComingSoon("Privacy settings")}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Lock className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left text-sm text-foreground">
            Privacy
          </span>
        </button>

        {/* Help */}
        <button
          onClick={() => showComingSoon("Help & Support")}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left text-sm text-foreground">
            Help & Support
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span className="flex-1 text-left text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

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
  }, [chats, searchQuery, filter, user?._id, getChatDisplayName]);

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

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleStartChatFromContact = (contact) => {
    // Switch to chats tab and open new chat modal with preselected user
    setActiveTab("chats");
    dispatch(openModal({ modal: "newChat", data: { selectedUser: contact } }));
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "calls":
        return <CallsTab />;
      case "contacts":
        return <ContactsTab onStartChat={handleStartChatFromContact} />;
      case "settings":
        return <SettingsTab user={user} onLogout={handleLogout} />;
      default:
        return (
          <>
            {/* Search - Only for Chats tab */}
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

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-2 mt-3">
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
                      <div className="relative shrink-0">
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
                              "text-xs shrink-0 ml-2",
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
                            <span className="ml-2 min-w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full px-1.5 shrink-0">
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
          </>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          {activeTab === "chats" && (
            <button
              onClick={handleNewChat}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              title="New Chat"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          {activeTab !== "settings" && <ThemeToggle />}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 border-b border-border">
        <div className="flex gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors",
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="hidden sm:block">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Current User - Only show for non-settings tabs */}
      {activeTab !== "settings" && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar name={user?.username || "User"} src={user?.avatar} size="md" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {user?.username || "User"}
              </p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <button
              onClick={() => setActiveTab("settings")}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
