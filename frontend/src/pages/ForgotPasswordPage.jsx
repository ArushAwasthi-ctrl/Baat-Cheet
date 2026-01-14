import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Mail, Lock, AlertCircle, ArrowLeft, Check } from "lucide-react";
import AuthLayout from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { forgotPassword, resetPassword, clearError, setResetEmail } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import { getPasswordStrength } from "@/lib/utils";
import { useRef, useEffect } from "react";

const OTP_LENGTH = 6;

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(""));
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });
  const inputRefs = useRef([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();

  const password = watch("password");

  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, label: "", color: "" });
    }
  }, [password]);

  // Handle email submission (Step 1)
  const handleEmailSubmit = async (data) => {
    dispatch(clearError());
    const result = await dispatch(forgotPassword({ email: data.email }));

    if (forgotPassword.fulfilled.match(result)) {
      setEmail(data.email);
      dispatch(setResetEmail(data.email));
      dispatch(
        addToast({
          type: "success",
          title: "OTP Sent!",
          message: "Check your email for the verification code.",
        })
      );
      setStep(2);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, OTP_LENGTH);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < OTP_LENGTH) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);

    const lastFilledIndex = Math.min(pastedData.length - 1, OTP_LENGTH - 1);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  // Handle password reset (Step 2)
  const handleResetSubmit = async (data) => {
    dispatch(clearError());

    const otpValue = otp.join("");
    if (otpValue.length !== OTP_LENGTH) {
      dispatch(addToast({ type: "error", title: "Error", message: "Please enter the complete OTP" }));
      return;
    }

    const result = await dispatch(
      resetPassword({
        email,
        otp: otpValue,
        password: data.password,
      })
    );

    if (resetPassword.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: "success",
          title: "Password Reset!",
          message: "You can now login with your new password.",
        })
      );
      navigate("/login");
    } else {
      setOtp(new Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const goBack = () => {
    setStep(1);
    setOtp(new Array(OTP_LENGTH).fill(""));
    reset();
    dispatch(clearError());
  };

  // Password requirements
  const requirements = [
    { label: "At least 6 characters", test: (p) => p?.length >= 6 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One number", test: (p) => /[0-9]/.test(p) },
    { label: "One special character", test: (p) => /[!@#$%^&*]/.test(p) },
  ];

  const stepTitles = {
    1: { title: "Forgot password?", subtitle: "Enter your email to receive a reset code" },
    2: { title: "Reset your password", subtitle: `Enter the code sent to ${email}` },
  };

  return (
    <AuthLayout title={stepTitles[step].title} subtitle={stepTitles[step].subtitle}>
      {/* Progress Indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-2 w-12 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Email */}
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSubmit(handleEmailSubmit)}
            className="space-y-5"
          >
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

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

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send Reset Code
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </motion.form>
        )}

        {/* Step 2: OTP + New Password */}
        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit(handleResetSubmit)}
            className="space-y-5"
          >
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* OTP Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Verification Code</label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 text-center text-xl font-bold rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-ring outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <Input
                type="password"
                placeholder="Create a strong password"
                icon={Lock}
                error={errors.password}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" },
                  validate: {
                    hasUpperCase: (v) => /[A-Z]/.test(v) || "Need uppercase letter",
                    hasNumber: (v) => /[0-9]/.test(v) || "Need a number",
                    hasSpecial: (v) => /[!@#$%^&*]/.test(v) || "Need special character",
                  },
                })}
              />

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
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {requirements.map((req, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1 text-xs ${
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

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isLoading}
                disabled={otp.some((d) => !d)}
              >
                Reset Password
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
