import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const profileButton = document.getElementById('profile-menu-button');
      const profileMenu = document.getElementById('profile-menu');
      if (profileButton && profileMenu && !profileButton.contains(event.target) && !profileMenu.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Helper to check if route is active
  const isRouteActive = (path) => {
    if (path === '/' || path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-gray-50 antialiased min-h-screen">
      {/* Navbar - Matching Laravel exactly */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="flex items-center space-x-2 group">
                  <img src="/images/logo.svg" alt="eDu Live Logo" className="w-10 h-10 transform group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">eDu Live</span>
                </Link>
              </div>
              <div className="hidden md:ml-8 md:flex md:space-x-6">
                <Link 
                  to="/dashboard" 
                  className={`${isRouteActive('/dashboard') ? 'text-red-600 border-red-600' : 'text-gray-700 hover:text-red-600 border-transparent hover:border-red-600'} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  <span>Home</span>
                </Link>
                <Link 
                  to="/questions" 
                  className={`${isRouteActive('/questions') ? 'text-red-600 border-red-600' : 'text-gray-700 hover:text-red-600 border-transparent hover:border-red-600'} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors relative`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Questions</span>
                </Link>
                <Link 
                  to="/notes" 
                  className={`${isRouteActive('/notes') ? 'text-red-600 border-red-600' : 'text-gray-700 hover:text-red-600 border-transparent hover:border-red-600'} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span>Notes</span>
                </Link>
                <Link 
                  to="/pass-tests" 
                  className={`${isRouteActive('/pass-tests') ? 'text-red-600 border-red-600' : 'text-gray-700 hover:text-red-600 border-transparent hover:border-red-600'} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                  <span>Pass Tests</span>
                </Link>
                <Link 
                  to="/communities" 
                  className={`${isRouteActive('/communities') ? 'text-red-600 border-red-600' : 'text-gray-700 hover:text-red-600 border-transparent hover:border-red-600'} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors relative`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <span>Forums</span>
                </Link>
                {user && (
                  <Link 
                    to="/my-questions" 
                    className={`${isRouteActive('/my-questions') ? 'text-red-600 border-red-600' : 'text-gray-700 hover:text-red-600 border-transparent hover:border-red-600'} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>My Qs</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              {user ? (
                <div className="relative">
                  <button 
                    id="profile-menu-button" 
                    type="button" 
                    className="flex items-center space-x-2 focus:outline-none"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
                      {user.profile_picture ? (
                        <img 
                          src={user.profile_picture} 
                          alt={user.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                        </div>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  <div 
                    id="profile-menu" 
                    className={`${profileMenuOpen ? '' : 'hidden'} absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}
                  >
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link 
                        to={`/profile/${user._id || user.id}`} 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                          <span>My Profile</span>
                        </div>
                      </Link>
                      <Link 
                        to="/my-questions" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span>My Qs</span>
                        </div>
                      </Link>
                      <Link 
                        to="/dashboard" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                          </svg>
                          <span>Dashboard</span>
                        </div>
                      </Link>
                      {(user.isClassRep || user.role === 'class_rep') && (
                        <Link 
                          to="/class-rep/dashboard" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Class Rep Dashboard</span>
                          </div>
                        </Link>
                      )}
                      {user.isAdmin && (
                        <Link 
                          to="/admin" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <span>Admin Panel</span>
                          </div>
                        </Link>
                      )}
                      <div className="border-t border-gray-200"></div>
                      <button 
                        onClick={() => {
                          handleLogout();
                          setProfileMenuOpen(false);
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                          </svg>
                          <span>Logout</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-red-600 px-4 py-2 text-sm font-medium transition-colors">Login</Link>
                  <Link to="/register" className="bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-lg px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:-translate-y-0.5">Register</Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                id="mobile-menu-button" 
                type="button" 
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 focus:outline-none transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg id="menu-icon" className={`h-6 w-6 transition-transform ${mobileMenuOpen ? 'hidden' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
                <svg id="close-icon" className={`h-6 w-6 transition-transform ${mobileMenuOpen ? '' : 'hidden'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile menu with animations - Matching Laravel */}
        <div 
          id="mobile-menu" 
          className={`${mobileMenuOpen ? '' : 'hidden'} md:hidden bg-white border-t border-gray-200 shadow-lg`}
        >
          {user && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 px-4 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Link to={`/profile/${user._id || user.id}`} className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white shadow-md">
                    {user.profile_picture ? (
                      <img 
                        src={user.profile_picture} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${user._id || user.id}`} className="block">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          <div className="px-3 py-3 space-y-1">
            <Link 
              to="/dashboard" 
              className={`menu-item flex items-center space-x-3 px-3 py-3 text-base font-medium ${isRouteActive('/dashboard') ? 'text-red-600 bg-red-50' : 'text-gray-700 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              <span>Home</span>
            </Link>
            <Link 
              to="/questions" 
              className={`menu-item flex items-center justify-between px-3 py-3 text-base font-medium ${isRouteActive('/questions') ? 'text-red-600 bg-red-50' : 'text-gray-700 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Questions</span>
              </div>
            </Link>
            
            <Link 
              to="/notes" 
              className={`menu-item flex items-center space-x-3 px-3 py-3 text-base font-medium ${isRouteActive('/notes') ? 'text-red-600 bg-red-50' : 'text-gray-700 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Notes</span>
            </Link>
            
            <Link 
              to="/pass-tests" 
              className={`menu-item flex items-center space-x-3 px-3 py-3 text-base font-medium ${isRouteActive('/pass-tests') ? 'text-red-600 bg-red-50' : 'text-gray-700 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <span>Pass Tests</span>
            </Link>
            
            <Link 
              to="/communities" 
              className={`menu-item flex items-center justify-between px-3 py-3 text-base font-medium ${isRouteActive('/communities') ? 'text-red-600 bg-red-50' : 'text-gray-700 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span>Forums</span>
              </div>
            </Link>
            
            {user && (
              <Link 
                to="/my-questions" 
                className={`menu-item flex items-center space-x-3 px-3 py-3 text-base font-medium ${isRouteActive('/my-questions') ? 'text-red-600 bg-red-50' : 'text-gray-700 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>My Qs</span>
              </Link>
            )}
            
            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`menu-item flex items-center space-x-3 px-3 py-3 text-base font-medium ${isRouteActive('/dashboard') ? 'text-red-600 bg-red-50' : 'text-gray-700 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  <span>Dashboard</span>
                </Link>
                
                {(user.isClassRep || user.role === 'class_rep') && (
                  <Link 
                    to="/class-rep/dashboard" 
                    className="menu-item flex items-center justify-between px-3 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Class Rep Dashboard</span>
                    </div>
                  </Link>
                )}
                
                {user.isAdmin && (
                  <Link 
                    to="/admin" 
                    className="menu-item relative flex items-center justify-between px-3 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span>Admin Panel</span>
                    </div>
                  </Link>
                )}
                
                <div className="border-t border-gray-200 my-2"></div>
                
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="menu-item w-full flex items-center space-x-3 px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  <span>Logout</span>
                </button>
              </>
            )}
            
            {!user && (
              <>
                <Link 
                  to="/login" 
                  className="menu-item flex items-center space-x-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                  </svg>
                  <span>Login</span>
                </Link>
                <Link 
                  to="/register" 
                  className="menu-item flex items-center justify-center space-x-2 px-3 py-3 text-base font-medium bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all shadow-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                  </svg>
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Animated Toast Notifications */}
      <div id="toast-container" className="fixed top-20 right-4 z-50 space-y-3 max-w-md"></div>

      <main className="py-8">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-300 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/images/logo.svg" alt="eDu Live Logo" className="w-10 h-10" />
                <span className="text-xl font-bold text-white">eDu Live</span>
              </div>
              <p className="text-gray-400">Empowering students through peer-to-peer learning.</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/questions" className="hover:text-white transition-colors">Questions</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-2">
                {user ? (
                  <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                ) : (
                  <>
                    <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                    <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                  </>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li><Link to="/#contact" className="hover:text-white transition-colors">Developer</Link></li>
                <li><a href="mailto:modibboakheem@gmail.com" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} eDu Live. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
