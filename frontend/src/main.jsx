import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider, createBrowserRouter } from "react-router";
import store from "./store/store";
import "./index.css";

// Lazy load pages for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const VerifyOtpPage = lazy(() => import("./pages/VerifyOtpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

// Error Boundary fallback
const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold text-foreground">Oops!</h1>
      <p className="text-muted-foreground">Something went wrong.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
      >
        Reload Page
      </button>
    </div>
  </div>
);

// Route configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
    errorElement: <ErrorFallback />,
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/signup",
    element: (
      <Suspense fallback={<PageLoader />}>
        <SignupPage />
      </Suspense>
    ),
  },
  {
    path: "/verify-otp",
    element: (
      <Suspense fallback={<PageLoader />}>
        <VerifyOtpPage />
      </Suspense>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: "/chat",
    element: (
      <Suspense fallback={<PageLoader />}>
        <ChatPage />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="text-muted-foreground">Page not found</p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go Home
          </a>
        </div>
      </div>
    ),
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
