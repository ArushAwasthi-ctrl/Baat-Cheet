import { useState, useEffect, useCallback } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
  X,
  Search,
  Loader2,
  ArrowLeft,
  Check,
  Users,
} from "lucide-react";
import { cn, debounce } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { closeModal } from "@/store/slices/uiSlice";
import { createGroupChat } from "@/store/slices/chatSlice";
import userService from "@/services/userService";

const GroupChatModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { user: currentUser } = useSelector((state) => state.auth);
  const { isLoading: isCreatingChat } = useSelector((state) => state.chats);

  const [step, setStep] = useState(1); // 1: Select members, 2: Group details
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [error, setError] = useState(null);

  const isOpen = activeModal === "newGroup";

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
        setUsers(allUsers.filter((u) => u._id !== currentUser?._id));
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
      setStep(1);
      setSearchQuery("");
      setUsers([]);
      setSelectedMembers([]);
      setGroupName("");
      setGroupDescription("");
      setError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleToggleMember = (user) => {
    setSelectedMembers((prev) => {
      const isSelected = prev.some((m) => m._id === user._id);
      if (isSelected) {
        return prev.filter((m) => m._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const handleNext = () => {
    if (selectedMembers.length < 2) {
      setError("Please select at least 2 members for a group");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    try {
      await dispatch(
        createGroupChat({
          name: groupName.trim(),
          description: groupDescription.trim(),
          participants: selectedMembers.map((m) => m._id),
        })
      ).unwrap();
      handleClose();
    } catch (err) {
      console.error("Failed to create group:", err);
      setError("Failed to create group. Please try again.");
    }
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
          <div className="p-4 border-b border-border flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-foreground flex-1">
              {step === 1 ? "Add Members" : "Group Details"}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Select Members */}
          {step === 1 && (
            <>
              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div className="p-3 border-b border-border">
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((member) => (
                      <motion.button
                        key={member._id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={() => handleToggleMember(member)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm"
                      >
                        <Avatar name={member.username} size="xs" />
                        <span className="text-foreground">
                          {member.username}
                        </span>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Input */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search users to add..."
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

              {/* User List */}
              <div className="max-h-64 overflow-y-auto">
                {!searchQuery && users.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Search for users to add to group</p>
                  </div>
                )}

                {searchQuery && !isSearching && users.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">No users found</p>
                  </div>
                )}

                {users.map((user) => {
                  const isSelected = selectedMembers.some(
                    (m) => m._id === user._id
                  );
                  return (
                    <button
                      key={user._id}
                      onClick={() => handleToggleMember(user)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      <div className="relative">
                        <Avatar
                          name={user.username}
                          src={user.avatar}
                          size="md"
                        />
                        {user.status === "online" && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary-foreground" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <div className="p-4 border-t border-border">
                <button
                  onClick={handleNext}
                  disabled={selectedMembers.length < 2}
                  className={cn(
                    "w-full py-3 rounded-xl font-medium transition-colors",
                    selectedMembers.length >= 2
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  Next ({selectedMembers.length} selected)
                </button>
              </div>
            </>
          )}

          {/* Step 2: Group Details */}
          {step === 2 && (
            <>
              <div className="p-6 space-y-4">
                {/* Group Avatar Placeholder */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                </div>

                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Group Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter group name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                </div>

                {/* Group Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="What's this group about?"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {/* Members Preview */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedMembers.length} member
                    {selectedMembers.length !== 1 ? "s" : ""} selected
                  </p>
                  <div className="flex -space-x-2">
                    {selectedMembers.slice(0, 5).map((member) => (
                      <Avatar
                        key={member._id}
                        name={member.username}
                        src={member.avatar}
                        size="sm"
                        className="border-2 border-card"
                      />
                    ))}
                    {selectedMembers.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground">
                        +{selectedMembers.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <div className="p-4 border-t border-border">
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || isCreatingChat}
                  className={cn(
                    "w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
                    groupName.trim() && !isCreatingChat
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isCreatingChat ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GroupChatModal;
