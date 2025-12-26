import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Mail, Lock, User, AlertCircle, Check } from "lucide-react";
import AuthLayout from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { register as registerUser, clearError, setRegistrationEmail } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import { getPasswordStrength } from "@/lib/utils";
import { useState, useEffect } from "react";

const SignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const password = watch("password");

  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, label: "", color: "" });
    }
  }, [password]);

  const onSubmit = async (data) => {
    dispatch(clearError());
    const result = await dispatch(registerUser(data));

    if (registerUser.fulfilled.match(result)) {
      dispatch(setRegistrationEmail(data.email));
      dispatch(
        addToast({
          type: "success",
          title: "Registration successful!",
          message: "Please check your email for the OTP.",
        })
      );
      navigate("/verify-otp");
    }
  };

  // Password requirements
  const requirements = [
    { label: "At least 6 characters", test: (p) => p?.length >= 6 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One number", test: (p) => /[0-9]/.test(p) },
    { label: "One special character (!@#$%^&*)", test: (p) => /[!@#$%^&*]/.test(p) },
  ];

  return (
    <AuthLayout title="Create an account" subtitle="Start your journey with Baat Cheet">
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

        {/* Username Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Username</label>
          <Input
            type="text"
            placeholder="johndoe"
            icon={User}
            error={errors.username}
            {...register("username", {
              required: "Username is required",
              minLength: {
                value: 3,
                message: "Username must be at least 3 characters",
              },
              maxLength: {
                value: 30,
                message: "Username must be at most 30 characters",
              },
            })}
          />
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>

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
          <label className="text-sm font-medium text-foreground">Password</label>
          <Input
            type="password"
            placeholder="Create a strong password"
            icon={Lock}
            error={errors.password}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
              validate: {
                hasUpperCase: (value) =>
                  /[A-Z]/.test(value) || "Password must contain an uppercase letter",
                hasNumber: (value) =>
                  /[0-9]/.test(value) || "Password must contain a number",
                hasSpecial: (value) =>
                  /[!@#$%^&*]/.test(value) || "Password must contain a special character",
              },
            })}
          />

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      level <= passwordStrength.score
                        ? passwordStrength.color
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength:{" "}
                <span className="font-medium">{passwordStrength.label}</span>
              </p>
            </div>
          )}

          {/* Password Requirements */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {requirements.map((req, index) => (
              <div
                key={index}
                className={`flex items-center gap-1.5 text-xs ${
                  req.test(password) ? "text-green-500" : "text-muted-foreground"
                }`}
              >
                <Check className="h-3 w-3" />
                <span>{req.label}</span>
              </div>
            ))}
          </div>

          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create Account
        </Button>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our{" "}
          <a href="#" className="underline hover:text-foreground">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-foreground">
            Privacy Policy
          </a>
        </p>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
