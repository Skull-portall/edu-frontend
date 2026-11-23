import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api, {
  notificationsAPI,
  campusHubAPI,
} from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getImageUrl } from "../../utils/imageUrl";
import { timeAgo } from "../../utils/timeAgo";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [courseName, setCourseName] = useState(
    searchParams.get("course_name") || "",
  );
  const [semesterId, setSemesterId] = useState(
    searchParams.get("semester_id") || "",
  );

  // Dashboard Data Query (Questions, Stats, Courses, Semesters)
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: [
      "dashboard",
      {
        search: searchParams.get("search") || "",
        course_name: searchParams.get("course_name") || "",
        semester_id: searchParams.get("semester_id") || "",
      },
    ],
    queryFn: async () => {
      const params = {
        search: searchParams.get("search") || "",
        course_name: searchParams.get("course_name") || "",
        semester_id: searchParams.get("semester_id") || "",
      };
      const response = await api.get("/dashboard", { params });
      return response.data.data;
    },
    keepPreviousData: true,
  });

  // Latest Campus Hub services (top 3)
  const { data: campusHubServices = [] } = useQuery({
    queryKey: ["campusHubServices", "dashboard"],
    queryFn: async () => {
      const res = await campusHubAPI.getServices({ status: "active" });
      return (res.data.data || []).slice(0, 3);
    },
  });

  // Check provider application status (for non-providers)
  const isProvider = user?.role === "provider" || user?.isProvider;
  const { data: myApplication } = useQuery({
    queryKey: ["myProviderApplication"],
    queryFn: async () => {
      try {
        const res = await campusHubAPI.getMyApplication();
        return res.data.data || null;
      } catch {
        return null;
      }
    },
    enabled: !!user && !isProvider,
    staleTime: 60000,
  });

  const hasApplied = !!myApplication;
  const isPending = myApplication?.status === "pending";
  const isRejected = myApplication?.status === "rejected";
  const showProviderBanner = !isProvider && (!hasApplied || isRejected);

  // Notifications Query
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await notificationsAPI.getAll();
      return response.data.notifications || [];
    },
    refetchInterval: 60000,
  });

  // Mutations for Notifications
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (courseName) params.set("course_name", courseName);
    if (semesterId) params.set("semester_id", semesterId);
    navigate(`/dashboard?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    setCourseName("");
    setSemesterId("");
    navigate("/dashboard");
  };

  const hasActiveFilters = Boolean(
    searchParams.get("search") ||
      searchParams.get("course_name") ||
      searchParams.get("semester_id"),
  );

  const markAsRead = (id) => markAsReadMutation.mutate(id);
  const markAllAsRead = () => markAllAsReadMutation.mutate();

  if (dashboardLoading && !dashboardData) {
    return <Loader />;
  }

  const data = dashboardData || {};
  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const questions = data?.recentQuestions || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
      {/* 1. Header Hero Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "S"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Welcome back, {user?.name || "Student"}
              </h1>
              {isProvider && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Provider Active
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                  Application Pending
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Academic feeds, study resources & campus marketplace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/campus-hub"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Campus Hub
          </Link>
          <Link
            to="/questions/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-sm transition-all transform hover:-translate-y-0.5"
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
                strokeWidth="2.5"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Ask Question
          </Link>
        </div>
      </div>

      {/* 2. Compact 4-Metric Command Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-sm flex items-center justify-between hover:border-red-200 transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-500">Questions Asked</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {data?.stats?.myQuestions || 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
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
              />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-sm flex items-center justify-between hover:border-rose-200 transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-500">Answers Given</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {data?.stats?.myAnswers || 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-sm flex items-center justify-between hover:border-amber-200 transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-500">Unread Alerts</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        </div>

        <Link
          to={isProvider ? "/campus-hub/provider-dashboard" : "/campus-hub/orders"}
          className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-sm flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div>
            <p className="text-xs font-medium text-gray-500">
              {isProvider ? "Provider Hub" : "Marketplace Orders"}
            </p>
            <p className="text-sm font-bold text-indigo-600 group-hover:underline mt-1 flex items-center gap-1">
              {isProvider ? "View Analytics" : "View My Orders"} →
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
        </Link>
      </div>

      {/* 3. Quick Launchpad Hub */}
      <div className="mb-7">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <Link
            to="/questions"
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-red-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
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
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 group-hover:text-red-600 transition-colors truncate">
                Questions
              </p>
              <p className="text-[11px] text-gray-500 truncate">Q&A Discussions</p>
            </div>
          </Link>

          <Link
            to="/notes"
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
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
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                Notes
              </p>
              <p className="text-[11px] text-gray-500 truncate">Study Materials</p>
            </div>
          </Link>

          <Link
            to="/pass-tests"
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                Past Papers
              </p>
              <p className="text-[11px] text-gray-500 truncate">Exam Archives</p>
            </div>
          </Link>

          <Link
            to="/communities"
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
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
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                Communities
              </p>
              <p className="text-[11px] text-gray-500 truncate">Student Groups</p>
            </div>
          </Link>

          <Link
            to="/campus-hub"
            className="col-span-2 sm:col-span-1 flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                Campus Hub
              </p>
              <p className="text-[11px] text-gray-500 truncate">Services & Gigs</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Main 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Q&A Community Feed (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Compact Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 sm:p-4">
            <form onSubmit={handleFilterSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions by topic, concept, or keywords..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder:text-gray-400"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3 top-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <select
                  name="course_name"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="flex-1 min-w-[130px] px-3 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Courses</option>
                  {data?.courses?.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  name="semester_id"
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className="flex-1 min-w-[130px] px-3 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Semesters</option>
                  {data?.semesters?.map((s) => (
                    <option key={s._id} value={s._id}>
                      Semester {s.number} - {s.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex-shrink-0"
                >
                  Filter
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Feed Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Recent Questions
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {questions.length}
              </span>
            </div>
            <Link
              to="/questions"
              className="text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              Browse all Q&A →
            </Link>
          </div>

          {/* Question Cards Feed */}
          {questions.length > 0 ? (
            <div className="space-y-3">
              {questions.map((question) => {
                const isAnon = question.isAnonymous || question.is_anonymous;
                const authorName = isAnon
                  ? "Anonymous"
                  : question.user?.name || "Student";
                const createdDate = question.created_at || question.createdAt;

                return (
                  <div
                    key={question._id}
                    onClick={() => navigate(`/questions/${question._id}`)}
                    className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    {/* Header: Author & Time */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                          {!isAnon && question.user?.profilePicture ? (
                            <img
                              src={getImageUrl(question.user.profilePicture)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            authorName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-semibold text-gray-700 truncate max-w-[140px]">
                          {authorName}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>{timeAgo(createdDate)}</span>
                      </div>

                      {question.course_name && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[11px] font-medium truncate max-w-[120px]">
                          {question.course_name}
                        </span>
                      )}
                    </div>

                    {/* Question Title */}
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-1.5">
                      {question.title}
                    </h3>

                    {/* Question Excerpt */}
                    {question.body && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
                        {question.body}
                      </p>
                    )}

                    {/* Attachment chip if exists */}
                    {question.attachment && (
                      <div className="mb-3 inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-600">
                        <svg
                          className="w-3.5 h-3.5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        <span>Attachment included</span>
                      </div>
                    )}

                    {/* Card Footer: Answers & Views */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                          <svg
                            className="w-3.5 h-3.5 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          {question.answersCount || 0}{" "}
                          {question.answersCount === 1 ? "answer" : "answers"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          {question.views || 0} views
                        </span>
                      </div>

                      {question.semester_number && (
                        <span className="text-[11px] font-medium text-gray-400">
                          Sem {question.semester_number}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 sm:p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 mx-auto mb-3 flex items-center justify-center">
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
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                No questions found
              </p>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "Try clearing your filters or search keywords to see more discussions."
                  : "Be the first to start an academic discussion in your campus community!"}
              </p>
              <Link
                to="/questions/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Ask a Question
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Campus Hub Spotlight & Notifications (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Campus Hub Spotlight Widget */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900">
                  Campus Hub Spotlight
                </h3>
              </div>
              <Link
                to="/campus-hub"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View all →
              </Link>
            </div>

            {campusHubServices.length > 0 ? (
              <div className="space-y-2.5 mb-4">
                {campusHubServices.map((service) => (
                  <Link
                    key={service._id}
                    to={`/campus-hub/services/${service._id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                      {service.images && service.images.length > 0 ? (
                        <img
                          src={getImageUrl(service.images[0])}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block">
                        {service.category}
                      </span>
                      <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {service.title}
                      </p>
                      <p className="text-xs font-bold text-red-600 mt-0.5">
                        ₦{Number(service.price).toLocaleString("en-NG")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-3 text-center">
                No active services listed yet.
              </p>
            )}

            {/* Provider or Applicant Actions */}
            <div className="pt-2 border-t border-gray-50 space-y-2">
              {isProvider ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/campus-hub/provider-dashboard"
                    className="text-center px-2.5 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/campus-hub/my-services"
                    className="text-center px-2.5 py-1.5 text-xs font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    My Services
                  </Link>
                </div>
              ) : showProviderBanner ? (
                <Link
                  to="/campus-hub/apply"
                  className="block text-center px-3 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-rose-600 text-white rounded-lg hover:opacity-95 shadow-sm transition-all"
                >
                  Apply as Service Provider ✨
                </Link>
              ) : (
                <Link
                  to="/campus-hub/orders"
                  className="block text-center px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View My Orders
                </Link>
              )}
            </div>
          </div>

          {/* Notifications Widget */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5"
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
                </div>
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-2.5">
                {notifications.slice(0, 5).map((notification) => {
                  const notificationData = notification.data || {};
                  const title = notificationData.title || "Notification";
                  const message = notificationData.message || "";
                  const link = notificationData.link || null;
                  const isRead = !!notification.read_at;

                  return (
                    <div
                      key={notification._id}
                      className={`p-2.5 rounded-lg border text-xs transition-colors ${
                        !isRead
                          ? "bg-red-50/40 border-red-100"
                          : "bg-gray-50/60 border-transparent hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {title}
                          </p>
                          <p className="text-gray-600 line-clamp-2 mt-0.5 text-[11px]">
                            {message}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {timeAgo(notification.created_at)}
                          </span>
                        </div>
                        {!isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-[10px] font-semibold text-red-600 hover:text-red-800 flex-shrink-0"
                          >
                            Read
                          </button>
                        )}
                      </div>
                      {link && (
                        <Link
                          to={link}
                          className="inline-block mt-1 text-[11px] font-semibold text-red-600 hover:underline"
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-400">
                  You're all caught up! No alerts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
