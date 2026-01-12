import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { metaAPI } from '../../services/api';

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

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    const result = await register(formData);

    if (result.success) {
      // Redirect to onboarding feedback after registration
      navigate('/onboarding-feedback');
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                  errors.name ? 'border-red-500 ring-red-200' : 'border-gray-300'
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                  errors.email ? 'border-red-500 ring-red-200' : 'border-gray-300'
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                  errors.phoneNumber ? 'border-red-500 ring-red-200' : 'border-gray-300'
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                  errors.semesterId ? 'border-red-500 ring-red-200' : 'border-gray-300'
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                  errors.departmentId ? 'border-red-500 ring-red-200' : 'border-gray-300'
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                  errors.campusId ? 'border-red-500 ring-red-200' : 'border-gray-300'
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
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                  errors.password ? 'border-red-500 ring-red-200' : 'border-gray-300'
                }`}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-600">*</span>
              </label>
              <input
                name="password_confirmation"
                type="password"
                required
                value={formData.password_confirmation}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                  errors.password_confirmation ? 'border-red-500 ring-red-200' : 'border-gray-300'
                }`}
              />
              {errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default Register;
