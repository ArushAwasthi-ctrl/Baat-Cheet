// motion is used throughout the file in JSX
// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useSpring } from "framer-motion";
import { Link } from "react-router";
import {
  MessageCircle,
  Users,
  Shield,
  Zap,
  Globe,
  Lock,
  Check,
  ArrowRight,
  Github,
  Mail,
  Menu,
  X,
  Twitter,
  Linkedin,
  Heart,
  Code2,
  Database,
  Cpu,
  Radio,
  Palette,
  Bot,
} from "lucide-react";
import { useState } from "react";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/Button";

// Features data
const features = [
  {
    icon: MessageCircle,
    title: "Real-time Messaging",
    description:
      "Instant message delivery with typing indicators and read receipts. Never miss a beat in your conversations.",
  },
  {
    icon: Users,
    title: "Group Chats",
    description:
      "Create groups, add members, and manage your communities with powerful admin controls.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "End-to-end encryption and secure authentication keep your conversations private and safe.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Built with performance in mind. Experience seamless, lag-free communication.",
  },
  {
    icon: Globe,
    title: "Access Anywhere",
    description:
      "Available on web and mobile. Stay connected with your friends and teams from any device.",
  },
  {
    icon: Lock,
    title: "Data Protection",
    description:
      "Your data is yours. We prioritize privacy with strict data protection policies.",
  },
];

// How it works steps
const steps = [
  {
    step: "01",
    title: "Create Account",
    description: "Sign up in seconds with your email. Verify with OTP and you're ready to go.",
  },
  {
    step: "02",
    title: "Find Friends",
    description: "Search for users or invite friends via email. Start conversations instantly.",
  },
  {
    step: "03",
    title: "Start Chatting",
    description: "Send messages, share files, create groups. Experience seamless communication.",
  },
];

// Tech Stack data
const techStack = [
  {
    icon: Code2,
    name: "React 19",
    description: "Latest React with concurrent features and Vite for lightning-fast HMR.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Radio,
    name: "Socket.IO",
    description: "Real-time bidirectional communication for instant message delivery.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Database,
    name: "MongoDB + Redis",
    description: "Document database with Redis caching for sub-millisecond performance.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Bot,
    name: "AI Powered",
    description: "Groq Llama 3.1 for chat summaries and in-chat AI assistant.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Palette,
    name: "Tailwind CSS v4",
    description: "Utility-first CSS with dark/light theming via CSS custom properties.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Cpu,
    name: "BullMQ Workers",
    description: "Background job processing for AI tasks and email delivery.",
    color: "from-indigo-500 to-blue-500",
  },
];

// Enhanced animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

// Header Component
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
      {/* Scroll Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 origin-left"
        style={{ scaleX }}
      />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </a>
          <a
            href="#tech-stack"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tech Stack
          </a>
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-foreground"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-border bg-background"
        >
          <div className="flex flex-col gap-4 p-4">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#tech-stack"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tech Stack
            </a>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                Sign In
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};

// Floating message bubble component
const FloatingMessage = ({ children, className, delay = 0, duration = 6 }) => (
  <motion.div
    className={`absolute hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/80 backdrop-blur-sm border border-border shadow-lg ${className}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: [0, 1, 1, 0],
      scale: [0.8, 1, 1, 0.8],
      y: [0, -15, -15, 0],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      repeatDelay: 1,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

// Floating phone mockup component
const FloatingPhone = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute hidden lg:block ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{
      opacity: 1,
      y: [0, -20, 0],
      rotate: [0, 3, 0, -3, 0],
    }}
    transition={{
      opacity: { duration: 0.5, delay },
      y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
      rotate: { duration: 8, repeat: Infinity, ease: "easeInOut", delay }
    }}
  >
    <div className="relative w-[180px] h-[360px] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2.5rem] p-2 shadow-2xl shadow-black/20">
      {/* Phone notch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full" />
      {/* Phone screen */}
      <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-violet-500/20 to-purple-600/20 overflow-hidden">
        {/* Chat UI mockup */}
        <div className="p-3 pt-8 space-y-2">
          <div className="flex justify-end">
            <div className="bg-violet-500/80 text-white text-[10px] px-3 py-1.5 rounded-xl rounded-tr-sm max-w-[80%]">
              Hey! How are you?
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-white/20 text-white text-[10px] px-3 py-1.5 rounded-xl rounded-tl-sm max-w-[80%]">
              I'm doing great!
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-violet-500/80 text-white text-[10px] px-3 py-1.5 rounded-xl rounded-tr-sm max-w-[80%]">
              Let's catch up soon
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Hero Section with improved gradients
const Hero = () => {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center py-20 px-4 text-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Primary gradient orb */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-full blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Floating animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating phones */}
        <FloatingPhone className="top-[15%] left-[5%] opacity-60" delay={0} />
        <FloatingPhone className="top-[20%] right-[8%] opacity-50 scale-75" delay={2} />

        {/* Floating message bubbles */}
        <FloatingMessage
          className="top-[25%] left-[15%] text-sm text-foreground/80"
          delay={0}
          duration={5}
        >
          <MessageCircle className="h-4 w-4 text-violet-500" />
          <span>Hey there!</span>
        </FloatingMessage>

        <FloatingMessage
          className="top-[35%] right-[12%] text-sm text-foreground/80"
          delay={1.5}
          duration={6}
        >
          <Heart className="h-4 w-4 text-pink-500" />
          <span>Love this app!</span>
        </FloatingMessage>

        <FloatingMessage
          className="bottom-[30%] left-[8%] text-sm text-foreground/80"
          delay={3}
          duration={5.5}
        >
          <Users className="h-4 w-4 text-cyan-500" />
          <span>Group chat</span>
        </FloatingMessage>

        <FloatingMessage
          className="bottom-[25%] right-[15%] text-sm text-foreground/80"
          delay={2}
          duration={6.5}
        >
          <Zap className="h-4 w-4 text-yellow-500" />
          <span>So fast!</span>
        </FloatingMessage>

        {/* Floating decorative icons */}
        <motion.div
          className="absolute top-[45%] left-[3%] hidden md:block"
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm">
            <MessageCircle className="h-6 w-6 text-violet-500/70" />
          </div>
        </motion.div>

        <motion.div
          className="absolute top-[55%] right-[5%] hidden md:block"
          animate={{
            y: [0, 25, 0],
            rotate: [0, -15, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-sm">
            <Heart className="h-6 w-6 text-pink-500/70" />
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-[40%] left-[12%] hidden md:block"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm">
            <Globe className="h-5 w-5 text-cyan-500/70" />
          </div>
        </motion.div>

        <motion.div
          className="absolute top-[30%] right-[25%] hidden lg:block"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <div className="p-2 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-green-500/70" />
          </div>
        </motion.div>

        {/* Animated circles/dots */}
        <motion.div
          className="absolute top-[20%] left-[30%] w-2 h-2 rounded-full bg-violet-500/40 hidden md:block"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[60%] right-[20%] w-3 h-3 rounded-full bg-pink-500/30 hidden md:block"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[35%] right-[30%] w-2 h-2 rounded-full bg-cyan-500/40 hidden md:block"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-5xl space-y-8"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/50 text-sm text-muted-foreground"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Now with real-time messaging
        </motion.div>

        {/* Main Headline with character reveal */}
        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          <span className="block text-foreground">
            {"Where".split("").map((char, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
              >
                {char}
              </motion.span>
            ))}
          </span>
          <motion.span
            className="block bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Conversations
          </motion.span>
          <span className="block text-foreground">
            {"Come Alive".split("").map((char, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.04, duration: 0.4 }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </span>
        </h1>

        {/* Subtitle with blur fade-in */}
        <motion.p
          className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl"
          initial={{ opacity: 0, filter: "blur(8px)", y: 15 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
        >
          Connect with friends, family, and teams through{" "}
          <span className="font-semibold text-foreground">instant messaging</span>.
          Create groups, share moments, and never miss a conversation.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link to="/signup">
            <Button size="lg" className="gap-2 px-8 shadow-lg shadow-primary/25">
              Start Chatting Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="px-8">
              Sign In
            </Button>
          </Link>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Free forever</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Instant setup</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ delay: 1, y: { duration: 2, repeat: Infinity } }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
        </div>
      </motion.div>
    </section>
  );
};

// Features Section with gradient cards
const Features = () => {
  return (
    <section id="features" className="relative py-24 px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
              connect
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powerful features designed to make your communication seamless and enjoyable.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 overflow-hidden"
              variants={fadeInUp}
              whileHover={{
                y: -8,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
            >
              {/* Gradient glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <motion.div
                className="relative mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-3 text-primary"
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
              >
                <feature.icon className="h-6 w-6" />
              </motion.div>
              <h3 className="relative mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="relative text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4">
            Get started in{" "}
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              3 simple steps
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Start chatting with your friends and family in minutes.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((item, index) => (
            <motion.div
              key={index}
              className="relative text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              {/* Step Number with animated entrance */}
              <motion.div
                className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/50 text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: index * 0.2,
                }}
              >
                {item.step}
              </motion.div>

              {/* Animated Connector Line */}
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.2, duration: 0.6 }}
                  style={{ transformOrigin: "left" }}
                />
              )}

              <h3 className="mb-2 text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Tech Stack Showcase Section
const TechStackShowcase = () => {
  return (
    <section id="tech-stack" className="relative py-24 px-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4">
            Powered by{" "}
            <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
              modern tech
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Built with cutting-edge tools for performance, scalability, and developer experience.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {techStack.map((tech, index) => (
            <motion.div
              key={index}
              className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
            >
              {/* Animated gradient border on hover */}
              <div className={`absolute inset-0 bg-gradient-to-r ${tech.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`} />

              <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${tech.color} p-3 text-white shadow-lg`}>
                <tech.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{tech.name}</h3>
              <p className="text-sm text-muted-foreground">{tech.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section with gradient
const CTA = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 200%" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/20 to-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="mx-auto max-w-4xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-6">
          Ready to start your{" "}
          <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
            conversation
          </span>
          ?
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
          Experience seamless, real-time communication powered by modern tech and AI.
          Sign up today — it's free forever.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="gap-2 px-8 shadow-lg shadow-primary/25">
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

// Footer - Improved
const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "How It Works", href: "#how-it-works" },
      { name: "Tech Stack", href: "#tech-stack" },
      { name: "Pricing", href: "#" },
    ],
    company: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Press", href: "#" },
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
    ],
  };

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Connect with friends, family, and teams through instant messaging.
            </p>
            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              <a
                href="#"
                className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Baat Cheet. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <TechStackShowcase />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
