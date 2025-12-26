import { motion } from "framer-motion";
import { Link } from "react-router";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Back to Home */}
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to home
      </Link>

      {/* Auth Card */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Card */}
        <motion.div
          className="glass-card rounded-2xl p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {/* Title */}
          {title && (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
          )}

          {/* Content */}
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
