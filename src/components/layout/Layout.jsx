import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCampusHubNotifications } from "../../hooks/useCampusHubNotifications";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils/imageUrl";
import { useQuery } from "@tanstack/react-query";
import { campusHubAPI, notificationsAPI } from "../../services/api";

const Layout = () => {
  const { user, logout, checkAuth } = useAuth();
  useCampusHubNotifications(user);
  usePushNotifications(user);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Fetch Unread Messages Count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["campusHubUnreadCount"],
    queryFn: async () => {
      const res = await campusHubAPI.getUnreadCount();
      return res.data.count || 0;
    },
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15s to keep it updated
  });

  // Fetch Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await notificationsAPI.getAll();
      return response.data?.notifications || [];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const prevNotificationsRef = useRef([]);

  useEffect(() => {
    if (!user || !notifications.length) return;
    const prevItems = prevNotificationsRef.current;

    if (prevItems.length > 0) {
      const prevIds = new Set(prevItems.map((n) => n._id));
      const newItems = notifications.filter(
        (n) => !prevIds.has(n._id) && !n.read_at && !n.isRead,
      );

      newItems.forEach((n) => {
        const title = n.data?.title || "New Notification";
        toast.success(title, { icon: "🔔", duration: 5000 });
      });
    }

    prevNotificationsRef.current = notifications;
  }, [notifications, user]);

  const unreadNotifications = notifications.filter(
    (n) => !n.isRead && !n.readAt,
  ).length;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  const prevRoleRef = useRef(null);

  // Auto-refresh auth so when admin approves, user sees provider role quickly (Dashboard, My Services, etc.)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !checkAuth) return;
    const interval = setInterval(checkAuth, 20000); // every 20s
    const onVisible = () => {
      if (document.visibilityState === "visible") checkAuth();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [checkAuth]);

  // Toast when user becomes provider (approved by admin) without visiting apply page
  useEffect(() => {
    if (!user) return;
    const prevRole = prevRoleRef.current;
    if (
      prevRole !== null &&
      prevRole !== "provider" &&
      user.role === "provider"
    ) {
      toast.success(
        "You're now a service provider! Start offering your services from Campus Hub.",
        { duration: 6000 },
      );
    }
    prevRoleRef.current = user.role;
  }, [user?.role]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const profileButton = document.getElementById("profile-menu-button");
      const profileMenu = document.getElementById("profile-menu");
      if (
        profileButton &&
        profileMenu &&
        !profileButton.contains(event.target) &&
        !profileMenu.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Helper to check if route is active
  const isRouteActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-gray-50 antialiased min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 group"
                >
                  <img
                    src="/images/logo.svg"
                    alt="eDu Live Logo"
                    className="w-10 h-10 transform group-hover:scale-110 transition-transform"
                  />
                  <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                    eDu Live
                  </span>
                </Link>
              </div>
              <div className="hidden md:ml-8 md:flex md:space-x-6">
                <Link
                  to="/dashboard"
                  className={`${isRouteActive("/dashboard") ? "text-red-600 border-red-600" : "text-gray-700 hover:text-red-600 :text-red-400 border-transparent hover:border-red-600"} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    ></path>
                  </svg>
                  <span>Home</span>
                </Link>
                <Link
                  to="/questions"
                  className={`${isRouteActive("/questions") ? "text-red-600 border-red-600" : "text-gray-700 hover:text-red-600 :text-red-400 border-transparent hover:border-red-600"} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors relative`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>Questions</span>
                </Link>
                <Link
                  to="/notes"
                  className={`${isRouteActive("/notes") ? "text-red-600 border-red-600" : "text-gray-700 hover:text-red-600 :text-red-400 border-transparent hover:border-red-600"} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  <span>Notes</span>
                </Link>
                <Link
                  to="/pass-tests"
                  className={`${isRouteActive("/pass-tests") ? "text-red-600 border-red-600" : "text-gray-700 hover:text-red-600 border-transparent hover:border-red-600"} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    ></path>
                  </svg>
                  <span>Past Papers</span>
                </Link>
                <Link
                  to="/communities"
                  className={`${isRouteActive("/communities") ? "text-red-600 border-red-600" : "text-gray-700 hover:text-red-600 border-transparent hover:border-red-600"} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors relative`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                  <span>Communities</span>
                </Link>
                <Link
                  to="/campus-hub"
                  className={`${isRouteActive("/campus-hub") ? "text-red-600 border-red-600" : "text-gray-700 hover:text-red-600 border-transparent hover:border-red-600"} inline-flex items-center space-x-1.5 px-1 pt-1 border-b-2 text-sm font-semibold transition-colors`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    ></path>
                  </svg>
                  <div className="relative flex items-center">
                    <span>Campus Hub</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-3 min-w-[16px] h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="hidden lg:flex items-center flex-1 max-w-md px-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = e.target.search.value;
                  if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
                }}
                className="w-full relative group"
              >
                {/* <input
 type="text"
 name="search"
 placeholder="Search anything..."
 className="w-full bg-gray-50 border-none rounded-2xl py-2 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-400 group-hover:bg-gray-100"
 /> */}
                {/* <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
 </svg> */}
              </form>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              {user ? (
                <>
                  {/* Dark mode toggle is in Profile/Settings */}
                  {/* Notification Bell */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => navigate("/notifications")}
                      className="p-2 text-gray-500 hover:text-red-600 focus:outline-none transition-colors relative"
                    >
                      <span className="sr-only">View notifications</span>
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-600 border-2 border-white text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {unreadNotifications > 99
                            ? "99+"
                            : unreadNotifications}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      id="profile-menu-button"
                      type="button"
                      className="flex items-center space-x-2 focus:outline-none"
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
                        {user.profilePicture ? (
                          <img
                            src={getImageUrl(user.profilePicture)}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {user.name?.charAt(0).toUpperCase() || "U"}
                            </span>
                          </div>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </button>

                    <div
                      id="profile-menu"
                      className={`${profileMenuOpen ? "" : "hidden"} absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}
                    >
                      <div className="py-1">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          to={`/profile/${user._id || user.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              ></path>
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
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                            <span>My Questions</span>
                          </div>
                        </Link>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
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
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              ></path>
                            </svg>
                            <span>Dashboard</span>
                          </div>
                        </Link>
                        {(user.isClassRep || user.role === "class_rep") && (
                          <Link
                            to="/class-rep/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <div className="flex items-center space-x-2">
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
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                              </svg>
                              <span>Class Rep Dashboard</span>
                            </div>
                          </Link>
                        )}
                        {(user.role === "provider" || user.isProvider) && (
                          <Link
                            to="/campus-hub/provider-dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <div className="flex items-center space-x-2">
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
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                ></path>
                              </svg>
                              <span>Provider Dashboard</span>
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
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                ></path>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                ></path>
                              </svg>
                              <span>Admin Panel</span>
                            </div>
                          </Link>
                        )}
                        <div className="border-t border-gray-200"></div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-red-600 px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-lg px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:-translate-y-0.5"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: Notification Bell & Profile Avatar */}
            <div className="md:hidden flex items-center space-x-3 pr-2">
              {user ? (
                <>
                  <Link
                    to="/notifications"
                    className="relative p-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-600 border-2 border-white text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <Link
                    to={`/profile/${user._id || user.id}`}
                    className="flex items-center focus:outline-none"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-red-200 shadow-sm">
                      {user.profilePicture ? (
                        <img
                          src={getImageUrl(user.profilePicture)}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-semibold text-red-600 px-3 py-1.5 border border-red-200 rounded-lg"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ───── Mobile "More" Menu Overlay and Bubble ───── */}
      {/* Background Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Floating Popover Bubble */}
      <div
        className={`md:hidden fixed bottom-24 pb-4 left-6 right-6 z-40 bg-white/95 [#111418]/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] [0_8px_40px_rgba(0,0,0,0.5)] border border-gray-200 /60 transition-all duration-300 origin-bottom transform ${mobileMenuOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-8 opacity-0 pointer-events-none"}`}
      >
        {/* Little triangle pointing to the button */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white [#111418] border-b border-r border-gray-200 /60 rotate-45 transform"></div>

        <div className="p-5 relative z-10 grid grid-cols-4 gap-y-6 gap-x-2 justify-items-center">
          <Link
            to="/notes"
            onClick={() => setMobileMenuOpen(false)}
            className="flex flex-col items-center gap-2 group w-full"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 /80 flex items-center justify-center text-red-500 shadow-inner group-hover:bg-red-50 :bg-red-500/10 transition-colors">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <span className="text-[9px] font-bold tracking-wider uppercase text-gray-600 group-hover:text-red-500 transition-colors text-center">
              Notes
            </span>
          </Link>

          <Link
            to="/communities"
            onClick={() => setMobileMenuOpen(false)}
            className="flex flex-col items-center gap-2 group w-full"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 /80 flex items-center justify-center text-red-500 shadow-inner group-hover:bg-red-50 :bg-red-500/10 transition-colors">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
            </div>
            <span className="text-[9px] font-bold tracking-wider uppercase text-gray-600 group-hover:text-red-500 transition-colors text-center">
              Comms
            </span>
          </Link>

          {(user?.isClassRep || user?.role === "class_rep") && (
            <Link
              to="/class-rep/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex flex-col items-center gap-2 group w-full"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 /80 flex items-center justify-center text-red-500 shadow-inner group-hover:bg-red-50 :bg-red-500/10 transition-colors">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase text-gray-600 group-hover:text-red-500 transition-colors text-center">
                Rep Dash
              </span>
            </Link>
          )}

          {(user?.role === "provider" || user?.isProvider) && (
            <Link
              to="/campus-hub/provider-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex flex-col items-center gap-2 group w-full"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 /80 flex items-center justify-center text-red-500 shadow-inner group-hover:bg-red-50 :bg-red-500/10 transition-colors">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  ></path>
                </svg>
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase text-gray-600 group-hover:text-red-500 transition-colors text-center">
                Pro Dash
              </span>
            </Link>
          )}

          {user?.isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex flex-col items-center gap-2 group w-full"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 /80 flex items-center justify-center text-red-500 shadow-inner group-hover:bg-red-50 :bg-red-500/10 transition-colors">
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37..."
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase text-gray-600 group-hover:text-red-500 transition-colors text-center">
                Admin
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ───── Mobile Bottom Navigation Bar Base (Floating Pill) ───── */}
      <nav
        className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex justify-center pb-safe"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="w-full bg-white/95 [#111418]/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-200 /80 px-2 py-2 relative z-50">
          <div className="grid grid-cols-5 items-center justify-items-center w-full relative">
            {/* 1. Dashboard */}
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-200 w-full ${isRouteActive("/dashboard") ? "text-red-600 " : "text-gray-500 hover:text-gray-900 :text-white"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={isRouteActive("/dashboard") ? "2.5" : "2"}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span className="text-[10px] font-bold tracking-tight uppercase">
                Dash
              </span>
            </Link>

            {/* 2. Questions */}
            <Link
              to="/questions"
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-200 w-full ${isRouteActive("/questions") ? "text-red-600 " : "text-gray-500 hover:text-gray-900 :text-white"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={isRouteActive("/questions") ? "2.5" : "2"}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-[10px] font-bold tracking-tight uppercase">
                Q&A
              </span>
            </Link>

            {/* 3. Center Menu Toggle (Red Pill Container) */}
            <div className="relative w-full h-full flex justify-center items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`absolute -top-6 flex items-center justify-center h-[52px] w-[52px] rounded-full shadow-xl transition-all duration-300 ${mobileMenuOpen ? "bg-gray-900 text-white shadow-gray-900/30 rotate-180 scale-105" : "bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-500/30"}`}
                aria-label="More Menu"
              >
                <svg
                  className={`w-7 h-7 transform transition-transform duration-300`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* 4. Pass Papers */}
            <Link
              to="/pass-tests"
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-200 w-full ${isRouteActive("/pass-tests") ? "text-red-600 " : "text-gray-500 hover:text-gray-900 :text-white"}`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={isRouteActive("/pass-tests") ? "2.5" : "2"}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <span className="text-[10px] font-bold tracking-tight uppercase">
                Papers
              </span>
            </Link>

            {/* 5. Campus Hub */}
            <Link
              to="/campus-hub"
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-200 w-full ${isRouteActive("/campus-hub") ? "text-red-600 " : "text-gray-500 hover:text-gray-900 :text-white"}`}
            >
              <div className="relative flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isRouteActive("/campus-hub") ? "2.5" : "2"}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] bg-red-600 border-[1.5px] border-white [#111418] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight uppercase">
                Hub
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Animated Toast Notifications */}
      <div
        id="toast-container"
        className="fixed top-20 right-4 z-50 space-y-3 max-w-md"
      ></div>

      <main className="pt-2 min-h-screen pb-32 md:pb-12 bg-gray-50 ">
        <Outlet />
      </main>

      {!user && (
        <footer className="bg-gray-900 text-gray-300 py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <img
                    src="/images/logo.svg"
                    alt="eDu Live Logo"
                    className="w-10 h-10"
                  />
                  <span className="text-xl font-bold text-white">eDu Live</span>
                </div>
                <p className="text-gray-400">
                  Empowering students through peer-to-peer learning.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Platform</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/#features"
                      className="hover:text-white transition-colors"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/#how-it-works"
                      className="hover:text-white transition-colors"
                    >
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/campus-hub"
                      className="hover:text-white transition-colors"
                    >
                      Campus Hub
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/questions"
                      className="hover:text-white transition-colors"
                    >
                      Questions
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Account</h4>
                <ul className="space-y-2">
                  {user ? (
                    <li>
                      <Link
                        to="/dashboard"
                        className="hover:text-white transition-colors"
                      >
                        Dashboard
                      </Link>
                    </li>
                  ) : (
                    <>
                      <li>
                        <Link
                          to="/login"
                          className="hover:text-white transition-colors"
                        >
                          Login
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/register"
                          className="hover:text-white transition-colors"
                        >
                          Register
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Contact</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/#contact"
                      className="hover:text-white transition-colors"
                    >
                      Developer
                    </Link>
                  </li>
                  <li>
                    <a
                      href="mailto:modibboakheem@gmail.com"
                      className="hover:text-white transition-colors"
                    >
                      Support
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
              <p>
                &copy; {new Date().getFullYear()} eDu Live. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
