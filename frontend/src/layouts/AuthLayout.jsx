// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Link } from "react-router";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";

const AuthLayout = ({ children, title, subtitle, isSignup = false }) => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Left Side - Branding/Hero Section */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-8 bg-gradient-to-br from-black via-zinc-900 to-neutral-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs - grayscale */}
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-[100px]"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-zinc-500/10 rounded-full blur-[120px]"
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -40, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/3 w-64 h-64 bg-neutral-400/5 rounded-full blur-[80px]"
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Floating shapes - monochrome */}
          <motion.div
            className="absolute top-32 right-20 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/10"
            animate={{
              y: [0, -30, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-40 left-32 w-24 h-24 rounded-full bg-zinc-400/10 backdrop-blur-sm border border-white/5"
            animate={{
              y: [0, 20, 0],
              x: [0, 15, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/2 right-1/4 w-12 h-12 rounded-full bg-neutral-300/10 backdrop-blur-sm"
            animate={{
              y: [0, -40, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Abstract lines/curves - grayscale */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0,50 Q25,30 50,50 T100,50"
              stroke="url(#gradient1)"
              strokeWidth="0.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.path
              d="M0,70 Q35,50 70,70 T100,70"
              stroke="url(#gradient2)"
              strokeWidth="0.3"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 4, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d4d4d8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Link to="/">
            <Logo size="lg" className="text-white" />
          </Link>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.h1
            className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Connect at the{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              speed
            </span>{" "}
            of thought.
          </motion.h1>
          <motion.p
            className="text-lg text-zinc-400 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Join the network for people who value clarity, speed, and meaningful connections.
          </motion.p>

          {/* Social Proof */}
          <motion.div
            className="flex items-center gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex -space-x-3">
              {[
                "https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=e5e5e5",
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=d4d4d4",
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=f5f5f5",
              ].map((avatar, i) => (
                <img
                  key={i}
                  src={avatar}
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-zinc-800 bg-zinc-700"
                />
              ))}
            </div>
            <div className="text-white">
              <p className="font-semibold">1k+ Users</p>
              <p className="text-sm text-zinc-500">Joined this week</p>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} Baat Cheet. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="relative flex-1 flex flex-col min-h-screen lg:min-h-0 bg-background">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <ThemeToggle />
        </div>

        {/* Desktop Theme Toggle */}
        <div className="hidden lg:block absolute top-6 right-6">
          <ThemeToggle />
        </div>

        {/* Back to Home - Desktop */}
        <Link
          to="/"
          className="hidden lg:block absolute top-6 left-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to home
        </Link>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Title */}
            {title && (
              <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">{title}</h1>
                {subtitle && (
                  <p className="text-muted-foreground">
                    {subtitle}{" "}
                    {isSignup ? (
                      <Link to="/login" className="font-medium text-primary hover:underline">
                        Log in
                      </Link>
                    ) : (
                      <Link to="/signup" className="font-medium text-primary hover:underline">
                        Sign up
                      </Link>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Form Content */}
            {children}

            {/* Mobile Footer */}
            <p className="mt-8 text-center text-sm text-muted-foreground lg:hidden">
              &copy; {new Date().getFullYear()} Baat Cheet. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
