import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import AuthLayout from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/Button";
import { verifyOtp, resendOtp, clearError } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const VerifyOtpPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, registrationEmail } = useSelector((state) => state.auth);

  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(""));
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!registrationEmail) {
      navigate("/signup");
    }
  }, [registrationEmail, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle input change
  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === OTP_LENGTH) {
      handleSubmit(newOtp.join(""));
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
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

    // Focus last filled input or last input
    const lastFilledIndex = Math.min(pastedData.length - 1, OTP_LENGTH - 1);
    inputRefs.current[lastFilledIndex]?.focus();

    // Auto-submit if complete
    if (pastedData.length === OTP_LENGTH) {
      handleSubmit(pastedData);
    }
  };

  // Submit OTP
  const handleSubmit = async (otpValue) => {
    dispatch(clearError());
    const result = await dispatch(
      verifyOtp({
        email: registrationEmail,
        otp: otpValue || otp.join(""),
      })
    );

    if (verifyOtp.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: "success",
          title: "Account verified!",
          message: "Welcome to Baat Cheet!",
        })
      );
      navigate("/chat");
    } else {
      // Shake animation on error - clear inputs
      setOtp(new Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;

    setIsResending(true);
    dispatch(clearError());

    const result = await dispatch(resendOtp({ email: registrationEmail }));

    if (resendOtp.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: "success",
          title: "OTP Sent!",
          message: "A new OTP has been sent to your email.",
        })
      );
      setResendTimer(RESEND_COOLDOWN);
      setOtp(new Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }

    setIsResending(false);
  };

  // Mask email
  const maskEmail = (email) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    const maskedUsername =
      username.slice(0, 2) + "*".repeat(Math.max(username.length - 4, 2)) + username.slice(-2);
    return `${maskedUsername}@${domain}`;
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We've sent a 6-digit code to ${maskEmail(registrationEmail)}`}
    >
      <div className="space-y-6">
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

        {/* OTP Input Grid */}
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background outline-none transition-all"
            />
          ))}
        </div>

        {/* Timer and Resend */}
        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in{" "}
              <span className="font-medium text-foreground">{resendTimer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`} />
              Resend code
            </button>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="button"
          onClick={() => handleSubmit()}
          className="w-full"
          isLoading={isLoading}
          disabled={otp.some((digit) => !digit)}
        >
          Verify Email
        </Button>

        {/* Back to Signup */}
        <p className="text-center text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtpPage;
