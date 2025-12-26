import { motion } from "framer-motion";
import { SearchX, Sparkles, User, Archive } from "lucide-react";

const suggestions = [
  { icon: Sparkles, label: "Check spelling" },
  { icon: User, label: "Search by user name" },
  { icon: Archive, label: "Browse Archived Chats" },
];

const NoSearchResults = ({ query, onClearSearch }) => {
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
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <SearchX className="h-16 w-16 text-muted-foreground/50" />
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          No matches found
        </h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find anything matching{" "}
          <span className="font-medium text-foreground">'{query}'</span> in your
          chats or contacts.
        </p>

        {/* Clear Search Button */}
        <motion.button
          onClick={onClearSearch}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium mb-8"
        >
          <SearchX className="h-4 w-4" />
          Clear Search
        </motion.button>

        {/* Suggestions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
            You might want to try
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted border border-border transition-colors"
              >
                <suggestion.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{suggestion.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NoSearchResults;
