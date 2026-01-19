import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, preventing default');
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', formData.email);
      const result = await login(formData.email, formData.password);
      console.log('Login result:', result);

      if (result.success) {
        console.log('Login successful, checking onboarding status');
        // Check if user needs onboarding feedback
        try {
          const { onboardingAPI } = require('../../services/api');
          const statusRes = await onboardingAPI.getStatus();
          if (statusRes.data.needsOnboarding) {
            navigate('/onboarding-feedback');
          } else {
            navigate('/dashboard');
          }
        } catch (error) {
          navigate('/dashboard');
        }
        // Don't set loading to false when navigating away
        return;
      } else {
        console.log('Login failed with message:', result.message);
        setError(result.message === 'getaddrinfo ENOTFOUND ac-oun3l5e-shard-00-00.o3ycw9b.mongodb.net' ? 'Login failed' : result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 animate-fade-in">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-[60] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <img src="/images/logo.svg" alt="eDu Live Logo" className="w-10 h-10 transform group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">eDu Live</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 focus:outline-none transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className={`h-6 w-6 transition-transform ${mobileMenuOpen ? 'hidden' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
                <svg className={`h-6 w-6 transition-transform ${mobileMenuOpen ? '' : 'hidden'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8">
              <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="inline-flex items-center space-x-1.5 text-gray-700 hover:text-red-600 transition-colors font-medium whitespace-nowrap px-2 py-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                <span>Features</span>
              </a>
              <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="inline-flex items-center space-x-1.5 text-gray-700 hover:text-red-600 transition-colors font-medium whitespace-nowrap px-2 py-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <span>How It Works</span>
              </a>
              <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="inline-flex items-center space-x-1.5 text-gray-700 hover:text-red-600 transition-colors font-medium whitespace-nowrap px-2 py-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>About</span>
              </a>
              <Link to="/register" className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium ml-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <span>Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`${mobileMenuOpen ? '' : 'hidden'} md:hidden fixed inset-x-0 top-[64px] bg-white border-t border-gray-200 shadow-lg z-[100] max-h-[calc(100vh-4rem)] overflow-y-auto`}>
        <div className="px-4 py-4 space-y-1">
          <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">Features</a>
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">How It Works</a>
          <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">About</a>
          <Link to="/register" className="flex items-center space-x-3 px-4 py-3 text-base font-medium bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:shadow-lg transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <span>Get Started</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-xl p-8 animate-fade-in">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-4 group">
              <img src="/images/logo.svg" alt="eDu Live Logo" className="w-12 h-12 transform group-hover:scale-110 transition-transform" />
              <span className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                eDu Live
              </span>
            </Link>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <Link to="/register" className="font-medium text-red-600 hover:text-red-500">
                create a new account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg animate-fade-in">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm transition-all pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-red-600 hover:text-red-500">
                Forgot your password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link to="/register" className="text-sm text-red-600 hover:text-red-500 font-medium">
                Don't have an account? Register here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
