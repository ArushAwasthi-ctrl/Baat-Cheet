/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import socketService from "../services/socketService";

export const useSocket = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Initialize state based on current socket connection status
  const [isConnected, setIsConnected] = useState(() => {
    return socketService.socket?.connected ?? false;
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Connect socket when authenticated
      const socket = socketService.connect();

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      // Sync initial state via event handlers (avoid direct setState in effect)
      if (socket.connected) {
        handleConnect();
      }

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
      };
    } else {
      // Disconnect when not authenticated
      socketService.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  return {
    isConnected,
    socket: socketService.socket,
    joinChat: socketService.joinChat.bind(socketService),
    // leaveChat: socketService.leaveChat.bind(socketService), // Unused - commented out
    startTyping: socketService.startTyping.bind(socketService),
    stopTyping: socketService.stopTyping.bind(socketService),
    markAsRead: socketService.markAsRead.bind(socketService),
  };
};

export const useTypingIndicator = (chatId) => {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (!chatId) return;

    const handleTypingStart = (event) => {
      const { chatId: typingChatId, userId, username } = event.detail;
      if (typingChatId === chatId) {
        setTypingUsers((prev) => {
          if (prev.find((u) => u.userId === userId)) return prev;
          return [...prev, { userId, username }];
        });
      }
    };

    const handleTypingStop = (event) => {
      const { chatId: typingChatId, userId } = event.detail;
      if (typingChatId === chatId) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      }
    };

    window.addEventListener("user:typing", handleTypingStart);
    window.addEventListener("user:stopped-typing", handleTypingStop);

    return () => {
      window.removeEventListener("user:typing", handleTypingStart);
      window.removeEventListener("user:stopped-typing", handleTypingStop);
    };
  }, [chatId]);

  return typingUsers;
};

export const useUserStatus = () => {
  const [userStatuses, setUserStatuses] = useState({});

  useEffect(() => {
    const handleStatusChange = (event) => {
      const { userId, status, lastSeen } = event.detail;
      setUserStatuses((prev) => ({
        ...prev,
        [userId]: { status, lastSeen },
      }));
    };

    window.addEventListener("user:status-change", handleStatusChange);

    return () => {
      window.removeEventListener("user:status-change", handleStatusChange);
    };
  }, []);

  const getUserStatus = useCallback(
    (userId) => {
      return userStatuses[userId] || { status: "offline", lastSeen: null };
    },
    [userStatuses]
  );

  return { userStatuses, getUserStatus };
};

export default useSocket;
