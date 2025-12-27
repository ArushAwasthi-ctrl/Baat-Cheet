import { useState } from "react";
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);

  if (src && !imageError) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "relative rounded-full bg-primary/10 flex items-center justify-center overflow-hidden",
          sizeClasses[size],
          onClick && "cursor-pointer",
          className
        )}
      >
        {/* Fallback initials shown while loading */}
        {!imageLoaded && (
          <span className="absolute inset-0 flex items-center justify-center text-primary font-medium">
            {initials}
          </span>
        )}
        <img
          src={src}
          alt={name || "Avatar"}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={cn(
            "rounded-full object-cover w-full h-full transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center shrink-0",
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
