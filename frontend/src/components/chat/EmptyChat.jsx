import { motion } from "framer-motion";
import { MessageCircle, Sparkles, Coffee, Briefcase, Hand } from "lucide-react";

const conversationStarters = [
  { icon: Hand, label: "Hi there!", emoji: "👋" },
  { icon: Sparkles, label: "Excited to connect!", emoji: "✨" },
  { icon: Coffee, label: "How is your day?", emoji: "☕" },
  { icon: Briefcase, label: "Discuss Work", emoji: "💼" },
];

const EmptyChat = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Illustration */}
        <motion.div
          className="mx-auto w-32 h-32 mb-6 rounded-2xl bg-muted/30 flex items-center justify-center"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="relative">
            <MessageCircle className="h-16 w-16 text-primary/30" />
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-primary/20 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          It's quiet here...
        </h2>
        <p className="text-muted-foreground mb-8">
          No messages yet. Break the ice! Pick a starter below or type your own
          to start the conversation.
        </p>

        {/* Conversation Starters */}
        <div className="flex flex-wrap justify-center gap-3">
          {conversationStarters.map((starter, index) => (
            <motion.button
              key={starter.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/50 hover:bg-muted border border-border transition-colors"
            >
              <span>{starter.emoji}</span>
              <span className="text-sm font-medium text-foreground">
                {starter.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default EmptyChat;
