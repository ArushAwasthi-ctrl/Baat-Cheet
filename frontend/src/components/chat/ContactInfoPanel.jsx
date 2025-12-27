import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import {
  X,
  User,
  Bell,
  BellOff,
  Search,
  Ban,
  Users,
  LogOut,
  UserPlus,
  Crown,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { toast } from "sonner";

const ContactInfoPanel = ({ chat, onClose, onBack, isMobile = false }) => {
  const { user } = useSelector((state) => state.auth);

  // Show coming soon toast for unavailable features
  const showComingSoon = (feature) => {
    toast.info(`${feature} coming soon!`, {
      duration: 2000,
    });
  };

  // Helper to get display name
  const getDisplayName = () => {
    if (chat.isGroup) {
      return chat.name;
    }
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.username || "Unknown User";
  };

  // Helper to get avatar
  const getAvatar = () => {
    if (chat.isGroup) {
      return chat.avatar || null;
    }
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.avatar || null;
  };

  // Helper to check online status
  const isOnline = () => {
    if (chat.isGroup) return false;
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.status === "online";
  };

  // Get other participant's bio (for direct chats)
  const getBio = () => {
    if (chat.isGroup) {
      return chat.description || `${chat.participants?.length || 0} members`;
    }
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user?._id
    );
    return otherParticipant?.bio || "No bio available";
  };

  const actions = [
    { icon: User, label: "Profile", onClick: () => showComingSoon("View profile") },
    { icon: BellOff, label: "Mute", onClick: () => showComingSoon("Mute notifications") },
    { icon: Search, label: "Search", onClick: () => showComingSoon("Search in chat") },
  ];

  // Check if current user is admin (for groups)
  const isCurrentUserAdmin = chat.isGroup
    ? chat.admins?.some((a) => a._id === user?._id || a === user?._id)
    : false;

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          <h3 className="font-semibold text-foreground">
            {chat.isGroup ? "Group Info" : "Contact Info"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="p-6 text-center border-b border-border">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative inline-block"
          >
            {chat.isGroup ? (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-10 w-10 text-primary" />
              </div>
            ) : (
              <Avatar name={getDisplayName()} src={getAvatar()} size="2xl" />
            )}
            {isOnline() && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-3 border-card rounded-full" />
            )}
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mt-4">
            {getDisplayName()}
          </h2>
          <p className="text-sm text-muted-foreground">{getBio()}</p>
        </div>

        {/* Quick Actions */}
        <div className="p-4 flex justify-center gap-6 border-b border-border">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="p-3 rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
                <action.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Group Members Section (only for groups) */}
        {chat.isGroup && chat.participants && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">
                {chat.participants.length} Members
              </h4>
              {isCurrentUserAdmin && (
                <button
                  onClick={() => showComingSoon("Add members")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  Add
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chat.participants.map((participant) => {
                const isAdmin = chat.admins?.some(
                  (a) => a._id === participant._id || a === participant._id
                );
                const isMe = participant._id === user?._id;
                return (
                  <div
                    key={participant._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar
                        name={participant.username}
                        src={participant.avatar}
                        size="sm"
                      />
                      {participant.status === "online" && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {participant.username}
                        {isMe && " (You)"}
                      </p>
                      {isAdmin && (
                        <p className="text-xs text-primary flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Admin
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="p-4 space-y-2">
          {chat.isGroup ? (
            <button
              onClick={() => showComingSoon("Leave group")}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Leave Group</span>
            </button>
          ) : (
            <button
              onClick={() => showComingSoon("Block contact")}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Ban className="h-5 w-5" />
              <span className="font-medium">Block Contact</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactInfoPanel;
