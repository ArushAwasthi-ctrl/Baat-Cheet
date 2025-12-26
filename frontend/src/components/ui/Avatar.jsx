import { cn, getInitials } from "@/lib/utils";

const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-20 w-20 text-xl",
};

const Avatar = ({ src, name, size = "md", className, onClick }) => {
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        onClick={onClick}
        className={cn(
          "rounded-full object-cover bg-muted",
          sizeClasses[size],
          onClick && "cursor-pointer",
          className
        )}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center",
        sizeClasses[size],
        onClick && "cursor-pointer",
        className
      )}
    >
      {initials}
    </div>
  );
};

export default Avatar;
