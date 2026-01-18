import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { metaAPI } from '../../services/api';
import { emailService } from '../../services/emailService';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    password_confirmation: '',
    semesterId: '',
    departmentId: '',
    campusId: ''
  });
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch semesters, departments, and campuses from API
    const fetchMetaData = async () => {
      try {
        const [semestersRes, departmentsRes, campusesRes] = await Promise.all([
          metaAPI.getSemesters(),
          metaAPI.getDepartments(),
          metaAPI.getCampuses()
        ]);

        setSemesters(semestersRes.data.data || []);
        setDepartments(departmentsRes.data.data || []);
        setCampuses(campusesRes.data.data || []);
      } catch (error) {
        console.error('Error fetching meta data:', error);
        // Set empty arrays on error
        setSemesters([]);
        setDepartments([]);
        setCampuses([]);
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMetaData();

    // Initialize EmailJS
    emailService.init();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Password validation - must be at least 8 characters
    if (formData.password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    // Password must contain uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.password)) {
      setErrors({ password: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)' });
      setLoading(false);
      return;
    }

    // Passwords must match
    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    const result = await register(formData);

    if (result.success) {
      // Send welcome email
      emailService.sendWelcomeEmail(formData.email, formData.name);

      // Redirect to onboarding feedback after registration
      navigate('/onboardingFeedback');
    } else {
      if (result.errors) {
        const errorObj = {};
        result.errors.forEach(err => {
          errorObj[err.path || err.field] = err.msg || err.message;
        });
        setErrors(errorObj);
      } else {
        setErrors({ general: result.message || 'Registration failed' });
      }
    }

    setLoading(false);
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
              <Link to="/login" className="inline-flex items-center space-x-1.5 text-gray-700 hover:text-red-600 transition-colors font-medium px-2 py-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                <span>Login</span>
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
          <Link to="/login" className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
            </svg>
            <span>Login</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8 bg-white rounded-xl shadow-xl p-8 animate-fade-in">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-4 group">
              <img src="/images/logo.svg" alt="eDu Live Logo" className="w-12 h-12 transform group-hover:scale-110 transition-transform" />
              <span className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                eDu Live
              </span>
            </Link>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-red-600 hover:text-red-500">
                Sign in
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                <p className="font-medium">{errors.general}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${errors.name ? 'border-red-500 ring-red-200' : 'border-gray-300'
                    }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${errors.email ? 'border-red-500 ring-red-200' : 'border-gray-300'
                    }`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${errors.phoneNumber ? 'border-red-500 ring-red-200' : 'border-gray-300'
                    }`}
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester <span className="text-red-600">*</span>
                </label>
                <select
                  name="semesterId"
                  required
                  value={formData.semesterId}
                  onChange={handleChange}
                  disabled={loadingMeta}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${errors.semesterId ? 'border-red-500 ring-red-200' : 'border-gray-300'
                    } ${loadingMeta ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">{loadingMeta ? 'Loading...' : 'Select semester'}</option>
                  {semesters.map(sem => (
                    <option key={sem._id} value={sem._id}>
                      {sem.name || `Semester ${sem.number}`}
                    </option>
                  ))}
                </select>
                {errors.semesterId && <p className="text-red-500 text-sm mt-1">{errors.semesterId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-600">*</span>
                </label>
                <select
                  name="departmentId"
                  required
                  value={formData.departmentId}
                  onChange={handleChange}
                  disabled={loadingMeta}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${errors.departmentId ? 'border-red-500 ring-red-200' : 'border-gray-300'
                    } ${loadingMeta ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">{loadingMeta ? 'Loading...' : 'Select department'}</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-red-500 text-sm mt-1">{errors.departmentId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campus <span className="text-red-600">*</span>
                </label>
                <select
                  name="campusId"
                  required
                  value={formData.campusId}
                  onChange={handleChange}
                  disabled={loadingMeta}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${errors.campusId ? 'border-red-500 ring-red-200' : 'border-gray-300'
                    } ${loadingMeta ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">{loadingMeta ? 'Loading...' : 'Select campus'}</option>
                  {campuses.map(campus => (
                    <option key={campus._id} value={campus._id}>{campus.name}</option>
                  ))}
                </select>
                {errors.campusId && <p className="text-red-500 text-sm mt-1">{errors.campusId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all pr-10 ${errors.password ? 'border-red-500 ring-red-200' : 'border-gray-300'
                      }`}
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
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    name="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all pr-10 ${errors.password_confirmation ? 'border-red-500 ring-red-200' : 'border-gray-300'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? (
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
                {errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                  'Register'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
