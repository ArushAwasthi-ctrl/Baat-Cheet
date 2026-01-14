import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleConnectionChange = (event) => {
      const { connected } = event.detail;
      setIsConnected(connected);

      if (!connected) {
        setShowBanner(true);
      } else {
        // Show connected briefly then hide
        setTimeout(() => setShowBanner(false), 2000);
      }
    };

    window.addEventListener("socket:connection-change", handleConnectionChange);

    // Also listen for browser online/offline events
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => {
      setIsConnected(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("socket:connection-change", handleConnectionChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium ${
            isConnected
              ? "bg-green-500 text-white"
              : "bg-yellow-500 text-yellow-900"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>Connecting... Please wait</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionStatus;
