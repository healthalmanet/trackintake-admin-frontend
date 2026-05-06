import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, AlertCircle, User, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "../config";

export default function AdminLogin({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetUid, setResetUid] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Handle forgot password
        if (!email) {
          setError("Email is required");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/users/forgot-password/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to send reset link");
          return;
        }

        setSuccess("Reset link sent to your email. Check your email for instructions.");
        setEmail("");
        setTimeout(() => {
          setIsForgotPassword(false);
          setSuccess("");
        }, 3000);
      } else if (isResetPassword) {
        // Handle reset password
        if (!newPassword || !confirmNewPassword) {
          setError("Both password fields are required");
          setLoading(false);
          return;
        }

        if (newPassword !== confirmNewPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        if (newPassword.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/users/reset-password/${resetUid}/${resetToken}/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: newPassword }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to reset password");
          return;
        }

        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          setIsResetPassword(false);
          setNewPassword("");
          setConfirmNewPassword("");
          setResetToken("");
          setResetUid("");
          setSuccess("");
        }, 2000);
      } else {
        // Handle login
        const endpoint = "/api/users/auth/login/";
        const payload = { email, password };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || data.message || "An error occurred");
          return;
        }

        // Check if user is admin
        if (data.user?.role?.toLowerCase() !== "admin") {
          setError("Only admins can access this panel");
          return;
        }

        // Store auth token and user info
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isAdmin", "true");

        // Call success callback
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Track<span className="text-orange-500">Intake</span>
          </h1>
          <p className="text-gray-600 text-sm mt-2 font-medium">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Forgot Password Form */}
          {isForgotPassword && (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError("");
                    setEmail("");
                  }}
                  className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-semibold mb-4 transition"
                >
                  <ArrowLeft size={18} />
                  Back to Login
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your email to receive a password reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="admin@trackintake.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <AlertCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-semibold py-3 rounded-lg transition duration-150 cursor-pointer mt-6"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          )}

          {/* Reset Password Form */}
          {isResetPassword && (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(false);
                    setError("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setResetToken("");
                    setResetUid("");
                  }}
                  className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-semibold mb-4 transition"
                >
                  <ArrowLeft size={18} />
                  Back to Login
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    placeholder="Paste your reset token here"
                    value={resetToken}
                    onChange={(e) => {
                      setResetToken(e.target.value);
                      setError("");
                    }}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reset UID
                  </label>
                  <input
                    type="text"
                    placeholder="Paste your reset UID here"
                    value={resetUid}
                    onChange={(e) => {
                      setResetUid(e.target.value);
                      setError("");
                    }}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showNewPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-11 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmNewPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-11 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {showConfirmNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <AlertCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-semibold py-3 rounded-lg transition duration-150 cursor-pointer mt-6"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {/* Login Form */}
          {!isForgotPassword && !isResetPassword && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                <p className="text-sm text-gray-500 mt-1">Sign in to your admin account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="admin@trackintake.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-11 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-semibold py-3 rounded-lg transition duration-150 cursor-pointer mt-6 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError("");
                    setEmail("");
                  }}
                  className="text-sm text-orange-500 hover:text-orange-600 font-semibold transition"
                >
                  Forgot your password?
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  This is a secure admin panel. Only authorized administrators can access.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
