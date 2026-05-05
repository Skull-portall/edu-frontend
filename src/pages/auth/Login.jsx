import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        try {
          const { onboardingAPI } = require("../../services/api");
          const statusRes = await onboardingAPI.getStatus();
          navigate(
            statusRes.data.needsOnboarding
              ? "/onboarding-feedback"
              : "/dashboard",
          );
        } catch {
          navigate("/dashboard");
        }
        return;
      } else {
        setError(result.message || "Login failed");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Always light/white — dark mode only available after login in Settings */
    <div className="min-h-screen bg-white flex font-sans">
      {/* ───── LEFT: Form Panel ───── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/images/logo.svg"
                alt="eDu Live Logo"
                className="w-10 h-10"
              />
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                eDu Live
              </span>
            </Link>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-2">
            Welcome Back.
          </h1>
          <p className="text-gray-500 font-medium mb-10">
            Log in to securely access your student workspace and communities.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-gray-700 mb-1.5"
              >
                Email address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-red-600 focus:text-red-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium"
                  placeholder="University Email Address"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-red-600 focus:text-red-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium"
                  placeholder="Account Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
              >
                Recover Password
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl text-white font-bold text-sm tracking-widest bg-red-600 hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  LOGIN...
                </>
              ) : (
                "SIGN IN"
              )}
            </button>

            <p className="text-center text-sm font-medium text-gray-500 pt-2">
              New to eDu Live?{" "}
              <Link
                to="/register"
                className="text-red-600 font-bold hover:text-red-500 transition-colors"
              >
                Apply for Account
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* ───── RIGHT: Info Panel ───── */}
      <div className="hidden lg:flex lg:w-1/2 sticky top-0 h-screen bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 items-center justify-center p-10 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-red-600/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-rose-600/15 blur-[60px] rounded-full pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
          {/* Logo — centered */}
          <Link to="/" className="mb-6 block group cursor-pointer">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center border border-white/10 mx-auto group-hover:bg-white/20 group-hover:scale-105 transition-all duration-300">
              <img
                src="/images/logo.svg"
                alt="eDu Live Logo"
                className="w-11 h-11 object-contain"
              />
            </div>
            <p className="text-white/60 text-xs font-semibold mt-2 tracking-widest uppercase group-hover:text-white transition-colors">
              eDu Live
            </p>
          </Link>

          {/* Headline — centered */}
          <h2 className="text-3xl lg:text-4xl font-black text-white leading-[1.15] tracking-tight mb-8 px-2">
            Empowering{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">
              Students
            </span>{" "}
            everywhere.
          </h2>

          {/* 3-column grid cards */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              {
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                title: "Secure Access",
                desc: "Enterprise-grade security.",
              },
              {
                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                title: "Campus Hub",
                desc: "Connect with peers.",
              },
              {
                icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                title: "Knowledge",
                desc: "Notes & past papers.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={item.icon}
                    />
                  </svg>
                </div>
                <h3 className="text-white font-black text-xs tracking-tight mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-400 font-medium text-[10px] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
