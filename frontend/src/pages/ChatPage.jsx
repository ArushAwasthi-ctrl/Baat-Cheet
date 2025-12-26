import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import ChatLayout from "@/layouts/ChatLayout";
import { getCurrentUser } from "@/store/slices/authSlice";

const ChatPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check auth on mount
    if (!user && !isLoading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user, isLoading]);

  useEffect(() => {
    // Redirect to login if not authenticated after loading
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <ChatLayout />;
};

export default ChatPage;
