import { useState, useEffect, useCallback } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { X, Search, Loader2, UserPlus, Users } from "lucide-react";
import { cn, debounce } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { closeModal, openModal } from "@/store/slices/uiSlice";
import { createDirectChat } from "@/store/slices/chatSlice";
import userService from "@/services/userService";

const NewChatModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const { isLoading: isCreatingChat } = useSelector((state) => state.chats);

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);

  const isOpen = activeModal === "newChat";

  // Debounced search function
  const searchUsers = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setUsers([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        setError(null);
        const response = await userService.searchUsers(query);
        // Filter out current user from search results
        const allUsers = response.data?.users || [];
        setUsers(allUsers.filter((u) => u._id !== user?._id));
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search users");
        setUsers([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (isOpen && searchQuery) {
      searchUsers(searchQuery);
    }
  }, [searchQuery, isOpen, searchUsers]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setUsers([]);
      setSelectedUser(null);
      setError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleStartChat = async (targetUser) => {
    setSelectedUser(targetUser);
    try {
      await dispatch(createDirectChat(targetUser._id)).unwrap();
      handleClose();
    } catch (err) {
      console.error("Failed to create chat:", err);
      setError("Failed to start chat. Please try again.");
      setSelectedUser(null);
    }
  };

  const handleCreateGroup = () => {
    dispatch(openModal({ modal: "newGroup" }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              New Conversation
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-2 border-b border-border">
            <button
              onClick={handleCreateGroup}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
            >
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Create a Group</p>
                <p className="text-xs text-muted-foreground">
                  Start a group conversation
                </p>
              </div>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* User List */}
          <div className="max-h-80 overflow-y-auto">
            {!searchQuery && !isSearching && users.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  Search for users to start a conversation
                </p>
              </div>
            )}

            {searchQuery && !isSearching && users.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No users found</p>
              </div>
            )}

            {users.map((targetUser) => (
              <motion.button
                key={targetUser._id}
                onClick={() => handleStartChat(targetUser)}
                disabled={isCreatingChat && selectedUser?._id === targetUser._id}
                className={cn(
                  "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0",
                  isCreatingChat &&
                    selectedUser?._id === targetUser._id &&
                    "opacity-50"
                )}
                whileHover={{ x: 4 }}
              >
                <div className="relative">
                  <Avatar
                    name={targetUser.username}
                    src={targetUser.avatar}
                    size="md"
                  />
                  {targetUser.status === "online" && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {targetUser.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {targetUser.email}
                  </p>
                </div>
                {isCreatingChat && selectedUser?._id === targetUser._id && (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal;
