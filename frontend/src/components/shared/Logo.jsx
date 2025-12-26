import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const Logo = ({ size = "default", showText = true, className }) => {
  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-lg", container: "h-8 w-8" },
    default: { icon: "h-6 w-6", text: "text-xl", container: "h-10 w-10" },
    lg: { icon: "h-8 w-8", text: "text-2xl", container: "h-12 w-12" },
    xl: { icon: "h-10 w-10", text: "text-3xl", container: "h-16 w-16" },
  };

  const currentSize = sizes[size] || sizes.default;

  return (
    <motion.div
      className={cn("flex items-center gap-3", className)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={cn(
          "flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg",
          currentSize.container
        )}
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <MessageCircle className={currentSize.icon} />
      </motion.div>
      {showText && (
        <motion.span
          className={cn(
            "font-bold tracking-tight text-foreground",
            currentSize.text
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Baat Cheet
        </motion.span>
      )}
    </motion.div>
  );
};

export default Logo;
