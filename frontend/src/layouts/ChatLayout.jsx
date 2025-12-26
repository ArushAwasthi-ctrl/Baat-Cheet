import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import ContactInfoPanel from "@/components/chat/ContactInfoPanel";
import NewChatModal from "@/components/chat/NewChatModal";
import GroupChatModal from "@/components/chat/GroupChatModal";
import { useSelector, useDispatch } from "react-redux";
import { toggleGroupInfo } from "@/store/slices/uiSlice";
import { fetchChats, setSelectedChat } from "@/store/slices/chatSlice";

const ChatLayout = () => {
  const dispatch = useDispatch();
  const { groupInfoOpen, sidebarOpen } = useSelector((state) => state.ui);
  const { selectedChat } = useSelector((state) => state.chats);

  // Fetch chats on mount
  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  const handleSelectChat = (chat) => {
    dispatch(setSelectedChat(chat));
  };

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
            className="h-full border-r border-border flex-shrink-0 overflow-hidden"
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
          onToggleInfo={() => dispatch(toggleGroupInfo())}
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
            className="h-full border-l border-border flex-shrink-0 overflow-hidden"
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
