import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Mail, Lock, AlertCircle } from "lucide-react";
import AuthLayout from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { login, clearError } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    dispatch(clearError());
    const result = await dispatch(login(data));

    if (login.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: "success",
          title: "Welcome back!",
          message: "You have successfully logged in.",
        })
      );
      navigate("/chat");
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to Baat Cheet">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            error={errors.email}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email",
              },
            })}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="Enter your password"
            icon={Lock}
            error={errors.password}
            {...register("password", {
              required: "Password is required",
            })}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign In
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
