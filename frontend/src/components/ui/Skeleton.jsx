import { cn } from "@/lib/utils";

/**
 * Premium Skeleton Component
 * A smooth, animated loading placeholder with various preset shapes
 */

// Base Skeleton with shimmer animation
const Skeleton = ({ className, variant = "shimmer", ...props }) => {
  return (
    <div
      className={cn(
        variant === "pulse" ? "skeleton-pulse" : "skeleton",
        className
      )}
      {...props}
    />
  );
};

// Text line skeleton
const SkeletonText = ({ lines = 1, className, lastLineWidth = "75%" }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 && lines > 1 ? lastLineWidth : "100%",
          }}
        />
      ))}
    </div>
  );
};

// Circle skeleton (for avatars)
const SkeletonCircle = ({ size = "md", className }) => {
  const sizes = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
    "2xl": "h-20 w-20",
  };

  return (
    <Skeleton
      className={cn("rounded-full", sizes[size] || sizes.md, className)}
    />
  );
};

// Card skeleton
const SkeletonCard = ({ className }) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <SkeletonCircle size="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
};

// Chat message skeleton
const SkeletonChatMessage = ({ isOwn = false, className }) => {
  return (
    <div
      className={cn(
        "flex gap-3",
        isOwn ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      {!isOwn && <SkeletonCircle size="md" />}
      <div
        className={cn(
          "space-y-2 max-w-[70%]",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <Skeleton
          className={cn(
            "h-12 rounded-2xl",
            isOwn
              ? "rounded-br-md w-48"
              : "rounded-bl-md w-56"
          )}
        />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
};

// Chat list item skeleton
const SkeletonChatItem = ({ className }) => {
  return (
    <div className={cn("flex items-center gap-3 p-3", className)}>
      <SkeletonCircle size="lg" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
};

// Chat list skeleton (multiple items)
const SkeletonChatList = ({ count = 5, className }) => {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChatItem key={i} />
      ))}
    </div>
  );
};

// Messages skeleton (chat conversation)
const SkeletonMessages = ({ count = 6, className }) => {
  return (
    <div className={cn("space-y-4 p-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChatMessage key={i} isOwn={i % 3 === 0} />
      ))}
    </div>
  );
};

// User profile skeleton
const SkeletonProfile = ({ className }) => {
  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <SkeletonCircle size="2xl" />
      <div className="space-y-2 w-full max-w-[200px]">
        <Skeleton className="h-5 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
      <Skeleton className="h-10 w-full max-w-[200px] rounded-lg" />
    </div>
  );
};

// Contact info panel skeleton
const SkeletonContactInfo = ({ className }) => {
  return (
    <div className={cn("space-y-6 p-4", className)}>
      <SkeletonProfile />
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Image skeleton with aspect ratio
const SkeletonImage = ({ aspectRatio = "square", className }) => {
  const ratios = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[2/1]",
  };

  return (
    <Skeleton
      className={cn("w-full", ratios[aspectRatio] || ratios.square, className)}
    />
  );
};

// Button skeleton
const SkeletonButton = ({ size = "default", className }) => {
  const sizes = {
    sm: "h-8 w-20",
    default: "h-10 w-24",
    lg: "h-12 w-32",
  };

  return (
    <Skeleton
      className={cn("rounded-lg", sizes[size] || sizes.default, className)}
    />
  );
};

// Input skeleton
const SkeletonInput = ({ className }) => {
  return <Skeleton className={cn("h-10 w-full rounded-lg", className)} />;
};

// Sidebar skeleton
const SkeletonSidebar = ({ className }) => {
  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <SkeletonInput />
      </div>
      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
        ))}
      </div>
      {/* List */}
      <div className="flex-1 overflow-hidden">
        <SkeletonChatList count={8} />
      </div>
    </div>
  );
};

// Full chat layout skeleton
const SkeletonChatLayout = ({ className }) => {
  return (
    <div className={cn("h-screen flex", className)}>
      {/* Sidebar */}
      <div className="w-80 border-r border-border hidden md:block">
        <SkeletonSidebar />
      </div>
      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border px-4 flex items-center gap-3">
          <SkeletonCircle size="md" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <SkeletonMessages count={8} />
        </div>
        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonChatMessage,
  SkeletonChatItem,
  SkeletonChatList,
  SkeletonMessages,
  SkeletonProfile,
  SkeletonContactInfo,
  SkeletonImage,
  SkeletonButton,
  SkeletonInput,
  SkeletonSidebar,
  SkeletonChatLayout,
};

export default Skeleton;
