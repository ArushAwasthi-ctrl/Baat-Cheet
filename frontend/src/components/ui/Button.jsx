import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const buttonSizes = {
  default: "h-11 px-5 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-12 px-8 text-lg",
  icon: "h-10 w-10",
};

const Button = forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      disabled,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
