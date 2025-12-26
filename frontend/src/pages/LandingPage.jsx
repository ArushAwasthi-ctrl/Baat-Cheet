import { motion, useScroll, useTransform } from "framer-motion";
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
} from "lucide-react";
import { useState } from "react";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Animated text carousel words
const animatedWords = [
  "Conversations",
  "Connections",
  "Communities",
  "Collaborations",
  "Chats",
  "Conversations",
];

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

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Header Component
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
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

// Hero Section
const Hero = () => {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center py-20 px-4 text-center overflow-hidden">
      {/* Subtle gradient background for dark mode */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-muted/20 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-5xl space-y-8"
      >
        {/* Animated Headline - Sleek gradient style */}
        <div className="space-y-4">
          <motion.h1
            className="text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="block gradient-text">Conversations</span>
            <div className="h-[1.2em] overflow-hidden">
              <motion.div
                animate={{ y: ["0%", "-16.66%", "-33.33%", "-50%", "-66.66%", "-83.33%"] }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                }}
                className="flex flex-col"
              >
                {animatedWords.map((word, index) => (
                  <span
                    key={index}
                    className="block h-[1.2em] leading-[1.2em] gradient-text"
                  >
                    {word}
                  </span>
                ))}
              </motion.div>
            </div>
            <span className="block gradient-text">finally spoken.</span>
          </motion.h1>

          <motion.p
            className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Create, connect, and communicate using the power of{" "}
            <span className="font-semibold text-foreground">real-time messaging</span>.
            Break free from delays and experience seamless conversations.
          </motion.p>
        </div>

        {/* Central Chat Icon/Button - Like reference */}
        <motion.div
          className="pt-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
        >
          <Link to="/signup">
            <motion.div
              className="mx-auto w-24 h-24 rounded-full bg-foreground flex items-center justify-center cursor-pointer shadow-2xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="h-10 w-10 text-background" />
            </motion.div>
          </Link>
          <motion.p
            className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Tap to Start Chatting
          </motion.p>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Check className="h-4 w-4 text-muted-foreground" />
          <span>No credit card required</span>
        </motion.div>
      </motion.div>
    </section>
  );
};

// Features Section
const Features = () => {
  return (
    <section id="features" className="py-24 px-4 border-t border-border">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4 gradient-text">
            Everything you need to connect
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
              className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-muted-foreground/30"
              variants={fadeInUp}
            >
              <div className="mb-4 inline-flex rounded-full bg-muted p-3 text-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
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
    <section id="how-it-works" className="py-24 px-4 border-t border-border">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4 gradient-text">
            Get started in 3 simple steps
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
              {/* Step Number */}
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-lg font-bold text-foreground">
                {item.step}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-px bg-border" />
              )}

              <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTA = () => {
  return (
    <section className="py-24 px-4 border-t border-border">
      <motion.div
        className="mx-auto max-w-4xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-6 gradient-text">
          Ready to start your conversation?
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
          Join thousands of users who are already enjoying seamless communication with Baat
          Cheet. Sign up today and experience the difference.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="gap-2 px-8">
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

// Footer
const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          <Logo size="sm" />

          <div className="flex gap-6">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Globe className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Documentation"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Contact"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 text-center sm:justify-start">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Terms of Service
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sitemap
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Status
          </a>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Baat Cheet. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
