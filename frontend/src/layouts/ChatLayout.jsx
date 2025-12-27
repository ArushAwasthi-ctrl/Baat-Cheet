import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import ContactInfoPanel from "@/components/chat/ContactInfoPanel";
import NewChatModal from "@/components/chat/NewChatModal";
import GroupChatModal from "@/components/chat/GroupChatModal";
import { useSelector, useDispatch } from "react-redux";
import { toggleGroupInfo, setGroupInfoOpen } from "@/store/slices/uiSlice";
import { fetchChats, setSelectedChat } from "@/store/slices/chatSlice";
import { useSocket } from "@/hooks/useSocket";

const ChatLayout = () => {
  const dispatch = useDispatch();
  const { groupInfoOpen, sidebarOpen } = useSelector((state) => state.ui);
  const { selectedChat } = useSelector((state) => state.chats);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  // Initialize socket connection
  const { isConnected, joinChat, leaveChat } = useSocket();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch chats on mount
  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  // Join/leave chat rooms when selected chat changes
  useEffect(() => {
    if (selectedChat?._id && isConnected) {
      joinChat(selectedChat._id);
    }
  }, [selectedChat?._id, isConnected, joinChat]);

  const handleSelectChat = (chat) => {
    dispatch(setSelectedChat(chat));
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  };

  const handleBackToChats = () => {
    setShowMobileSidebar(true);
    dispatch(setGroupInfoOpen(false));
  };

  const handleToggleInfo = () => {
    if (isMobile && groupInfoOpen) {
      dispatch(setGroupInfoOpen(false));
    } else {
      dispatch(toggleGroupInfo());
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        <AnimatePresence mode="wait">
          {showMobileSidebar ? (
            <motion.div
              key="sidebar"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <ChatSidebar
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
              />
            </motion.div>
          ) : groupInfoOpen && selectedChat ? (
            <motion.div
              key="info"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <ContactInfoPanel
                chat={selectedChat}
                onClose={() => dispatch(setGroupInfoOpen(false))}
                onBack={handleBackToChats}
                isMobile={true}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <ChatArea
                chat={selectedChat}
                onToggleInfo={handleToggleInfo}
                onBack={handleBackToChats}
                isMobile={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <NewChatModal />
        <GroupChatModal />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full border-r border-border shrink-0 overflow-hidden hidden md:block"
          >
            <ChatSidebar
              selectedChat={selectedChat}
              onSelectChat={handleSelectChat}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 h-full flex flex-col min-w-0">
        <ChatArea
          chat={selectedChat}
          onToggleInfo={handleToggleInfo}
        />
      </main>

      {/* Contact/Group Info Panel */}
      <AnimatePresence mode="wait">
        {groupInfoOpen && selectedChat && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full border-l border-border shrink-0 overflow-hidden hidden lg:block"
          >
            <ContactInfoPanel
              chat={selectedChat}
              onClose={() => dispatch(toggleGroupInfo())}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Modals */}
      <NewChatModal />
      <GroupChatModal />
    </div>
  );
};

export default ChatLayout;
