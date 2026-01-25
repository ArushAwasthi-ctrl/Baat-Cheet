import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { getCurrentUser } from "@/store/slices/authSlice";
import PageLoader from "./PageLoader";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user && !isAuthenticated) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch {
          // User not authenticated - will redirect below
        }
      }
      setHasCheckedAuth(true);
    };

    checkAuth();
  }, [dispatch, user, isAuthenticated]);

  // Show loading while checking auth
  if (!hasCheckedAuth || isLoading) {
    return <PageLoader />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
