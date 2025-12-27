import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Logo = ({ size = "default", showText = true, className }) => {
  const sizes = {
    sm: { icon: 20, text: "text-lg", container: "h-8 w-8" },
    default: { icon: 24, text: "text-xl", container: "h-10 w-10" },
    lg: { icon: 32, text: "text-2xl", container: "h-12 w-12" },
    xl: { icon: 40, text: "text-3xl", container: "h-16 w-16" },
  };

  const currentSize = sizes[size] || sizes.default;

  return (
    <motion.div
      className={cn("flex items-center gap-2.5", className)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25",
          currentSize.container
        )}
        whileHover={{ scale: 1.05, rotate: -5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {/* Custom Chat Bubble Icon */}
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          {/* Main chat bubble */}
          <path
            d="M12 3C7.03 3 3 6.58 3 11c0 2.12.87 4.04 2.3 5.47L4 21l4.53-1.3C9.97 20.22 10.96 20.5 12 20.5c4.97 0 9-3.58 9-8.5S16.97 3 12 3z"
            fill="currentColor"
            opacity="0.9"
          />
          {/* Dots indicating typing/chat */}
          <circle cx="8" cy="11" r="1.25" fill="rgba(139, 92, 246, 1)" />
          <circle cx="12" cy="11" r="1.25" fill="rgba(139, 92, 246, 1)" />
          <circle cx="16" cy="11" r="1.25" fill="rgba(139, 92, 246, 1)" />
        </svg>
      </motion.div>
      {showText && (
        <motion.div
          className="flex flex-col leading-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span
            className={cn(
              "font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent",
              currentSize.text
            )}
          >
            BaatCheet
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Logo;
