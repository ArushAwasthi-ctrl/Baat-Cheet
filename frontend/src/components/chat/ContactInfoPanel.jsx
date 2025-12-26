import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import {
  X,
  User,
  Bell,
  BellOff,
  Search,
  Ban,
  FileText,
  ChevronRight,
  Users,
  LogOut,
  UserPlus,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const ContactInfoPanel = ({ chat, onClose }) => {
  const { user } = useSelector((state) => state.auth);

  // Mock shared media - will be replaced with real data when file attachments are implemented
  const sharedMedia = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200",
    "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=200",
    "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=200",
    "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=200",
    "https://images.unsplash.com/photo-1614851099511-773084f6911d?w=200",
  ];

  // Mock shared files
  const sharedFiles = [
    { name: "Project_Specs_v2.pdf", size: "2.4 MB", time: "2 hrs ago" },
    { name: "Design_System.fig", size: "15 MB", time: "Yesterday" },
  ];

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
    { icon: User, label: "Profile", onClick: () => {} },
    { icon: BellOff, label: "Mute", onClick: () => {} },
    { icon: Search, label: "Search", onClick: () => {} },
  ];

  // Check if current user is admin (for groups)
  const isCurrentUserAdmin = chat.isGroup
    ? chat.admins?.some((a) => a._id === user?._id || a === user?._id)
    : false;

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border">
        <h3 className="font-semibold text-foreground">
          {chat.isGroup ? "Group Info" : "Contact Info"}
        </h3>
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
                <button className="text-xs text-primary hover:underline flex items-center gap-1">
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

        {/* Shared Media */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Shared Media</h4>
            <button className="text-xs text-primary hover:underline">
              View All
            </button>
          </div>

          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={8}
            slidesPerView={2.5}
            className="!-mx-1 !px-1"
          >
            {sharedMedia.map((src, index) => (
              <SwiperSlide key={index}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                >
                  <img
                    src={src}
                    alt={`Shared ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === sharedMedia.length - 1 && sharedMedia.length > 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-medium">+12</span>
                    </div>
                  )}
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Shared Files */}
        <div className="p-4 border-b border-border">
          <h4 className="font-medium text-foreground mb-3">Files & Docs</h4>
          <div className="space-y-2">
            {sharedFiles.map((file, index) => (
              <motion.div
                key={index}
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file.size} - {file.time}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-4 space-y-2">
          {chat.isGroup ? (
            <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Leave Group</span>
            </button>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
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
