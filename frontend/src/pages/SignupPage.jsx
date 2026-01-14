import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
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
    { label: "One special character", test: (p) => /[!@#$%^&*]/.test(p) },
  ];

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Already have an account?"
      isSignup={true}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Username Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Full Name</label>
          <Input
            type="text"
            placeholder="e.g. John Doe"
            icon={User}
            error={errors.username}
            {...register("username", {
              required: "Name is required",
              minLength: {
                value: 3,
                message: "Name must be at least 3 characters",
              },
              maxLength: {
                value: 30,
                message: "Name must be at most 30 characters",
              },
            })}
          />
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email Address</label>
          <Input
            type="email"
            placeholder="name@work-email.com"
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
                Strength: <span className="font-medium">{passwordStrength.label}</span>
              </p>
            </div>
          )}

          {/* Password Requirements */}
          <div className="grid grid-cols-2 gap-1.5 mt-2">
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

        {/* Terms Checkbox */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 rounded border-border"
            required
          />
          <label htmlFor="terms" className="text-xs text-muted-foreground">
            I agree to the{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create Account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
