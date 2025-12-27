import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import ChatLayout from "@/layouts/ChatLayout";
import { getCurrentUser } from "@/store/slices/authSlice";
import PageLoader from "@/components/shared/PageLoader";

const ChatPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Check auth on mount - always try to get current user on page load
    const checkAuth = async () => {
      try {
        await dispatch(getCurrentUser()).unwrap();
      } catch (error) {
        // User not authenticated
      } finally {
        setHasCheckedAuth(true);
      }
    };

    if (!user) {
      checkAuth();
    } else {
      setHasCheckedAuth(true);
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Only redirect after we've actually checked auth
    if (hasCheckedAuth && !isAuthenticated) {
      navigate("/login");
    }
  }, [hasCheckedAuth, isAuthenticated, navigate]);

  // Show loading while checking auth
  if (!hasCheckedAuth || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <ChatLayout />;
};

export default ChatPage;
