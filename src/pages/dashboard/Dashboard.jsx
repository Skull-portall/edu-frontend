import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { notificationsAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [courseName, setCourseName] = useState(searchParams.get('course_name') || '');
  const [semesterId, setSemesterId] = useState(searchParams.get('semester_id') || '');

  // Dashboard Data Query
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', {
      search: searchParams.get('search') || '',
      course_name: searchParams.get('course_name') || '',
      semester_id: searchParams.get('semester_id') || ''
    }],
    queryFn: async () => {
      const params = {
        search: searchParams.get('search') || '',
        course_name: searchParams.get('course_name') || '',
        semester_id: searchParams.get('semester_id') || ''
      };
      const response = await api.get('/dashboard', { params });
      return response.data.data;
    },
    keepPreviousData: true,
  });

  // Notifications Query
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsAPI.getAll();
      return response.data.notifications || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Mark as Read Mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  // Mark All as Read Mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (courseName) params.set('course_name', courseName);
    if (semesterId) params.set('semester_id', semesterId);
    navigate(`/dashboard?${params.toString()}`);
  };

  const markAsRead = (id) => markAsReadMutation.mutate(id);
  const markAllAsRead = () => markAllAsReadMutation.mutate();

  if (dashboardLoading && !dashboardData) {
    return <Loader />;
  }

  const data = dashboardData || {};

  const unreadCount = notifications.filter(n => !n.read_at).length;
  const questions = data?.recentQuestions || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="welcome-header-container">
            <h1 className="welcome-heading text-xl sm:text-2xl md:text-2xl font-semibold mb-2">
              <span className="welcome-text">Welcome back,</span>
              <span className="username-text">{user?.name || 'User'}</span>
              <span className="welcome-emoji">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 welcome-subtitle">Explore questions, share knowledge, and help others learn</p>
          </div>
          <Link
            to="/questions/create"
            className="btn-create btn-create-animate"
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
            </svg>
            <span className="btn-text">Ask Question</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 lg:mb-8 max-w-4xl">
        <div className="bg-white rounded-xl p-5 sm:p-6 lg:p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 card-hover animate-scale-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm lg:text-base font-medium">Your Questions</span>
            <svg className="w-6 h-6 lg:w-7 lg:h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">{data?.stats?.myQuestions || 0}</div>
          <div className="text-sm lg:text-base text-gray-500 mt-2">Questions asked</div>
        </div>

        <div className="bg-white rounded-xl p-5 sm:p-6 lg:p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 card-hover animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm lg:text-base font-medium">Your Answers</span>
            <svg className="w-6 h-6 lg:w-7 lg:h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">{data?.stats?.myAnswers || 0}</div>
          <div className="text-sm lg:text-base text-gray-500 mt-2">Answers provided</div>
        </div>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse shadow-lg border-2 border-red-700">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </h2>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-red-600 hover:text-red-800 font-semibold transition-colors">
                Mark all as read
              </button>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => {
                const notificationData = notification.data || {};
                const title = notificationData.title || 'Notification';
                const message = notificationData.message || '';
                const link = notificationData.link || null;
                const color = notificationData.color || 'blue';
                const isRead = !!notification.read_at;

                return (
                  <div
                    key={notification._id}
                    className={`notification-item p-4 sm:p-5 hover:bg-gray-50 transition-colors ${!isRead ? 'bg-red-50 border-l-4 border-red-600' : ''}`}
                    data-notification-id={notification._id}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {color === 'green' ? (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </div>
                        ) : color === 'red' ? (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{message}</p>
                            <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleDateString()}</p>
                          </div>
                          {!isRead && (
                            <button onClick={() => markAsRead(notification._id)} className="flex-shrink-0 text-xs text-red-600 hover:text-red-800 font-medium transition-colors">
                              Mark as read
                            </button>
                          )}
                        </div>
                        {link && (
                          <Link to={link} className="inline-block mt-2 text-sm text-red-600 hover:text-red-800 font-medium transition-colors">
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Service Cards Section */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Questions Card */}
          <Link to="/questions" className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-300 card-hover transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">Questions</h3>
            <p className="text-sm text-gray-600 mb-3">Browse and answer questions from the community</p>
            <div className="text-xs text-gray-500 font-medium">View All →</div>
          </Link>

          {/* Notes Card */}
          <Link to="/notes" className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 card-hover transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Notes</h3>
            <p className="text-sm text-gray-600 mb-3">Access and share study notes</p>
            <div className="text-xs text-gray-500 font-medium">View All →</div>
          </Link>

          {/* Pass Tests Card */}
          <Link to="/pass-tests" className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-300 card-hover transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Pass Tests</h3>
            <p className="text-sm text-gray-600 mb-3">Access past tests and assignments</p>
            <div className="text-xs text-gray-500 font-medium">View All →</div>
          </Link>

          {/* Communities Card */}
          <Link to="/communities" className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-300 card-hover transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Communities</h3>
            <p className="text-sm text-gray-600 mb-3">Join discussions and connect with peers</p>
            <div className="text-xs text-gray-500 font-medium">View All →</div>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 transform transition-all duration-300 hover:shadow-md">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Questions</label>
              <div>
                <input
                  type="text"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or content..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 transform focus:scale-[1.01] text-base"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <div className="relative">
                <select
                  name="course_name"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 appearance-none bg-white cursor-pointer hover:border-red-300 transform focus:scale-[1.02]"
                >
                  <option value="">All Courses</option>
                  {data?.courses?.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <div className="relative">
                <select
                  name="semester_id"
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 appearance-none bg-white cursor-pointer hover:border-red-300 transform focus:scale-[1.02]"
                >
                  <option value="">All Semesters</option>
                  {data?.semesters?.map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      Semester {semester.number} - {semester.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-200 font-semibold relative overflow-hidden">
              <span className="relative z-10 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
                <span>Apply Filters</span>
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Questions List */}
      <div className="space-y-4 lg:space-y-6 max-w-5xl">
        {questions.length > 0 ? (
          questions.map((question) => (
            <div
              key={question._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 hover:shadow-md transition-all duration-200 cursor-pointer card-hover question-item"
              onClick={() => navigate(`/questions/${question._id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-3">
                    {question.is_anonymous && !user?.isAdmin ? (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Anonymous</span>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          {question.user?.profile_picture ? (
                            <img
                              src={question.user.profile_picture}
                              alt={question.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center">
                              <span className="text-white text-xs font-semibold">{question.user?.name?.charAt(0) || 'U'}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/profile/${question.user?._id || question.user?.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-gray-600 font-medium hover:text-red-600 hover:underline transition-colors"
                          >
                            {question.user?.name || 'Unknown'}
                          </Link>
                          {question.is_anonymous && user?.isAdmin && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">(Anonymous)</span>
                          )}
                        </div>
                      </div>
                    )}
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{new Date(question.created_at || question.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4 hover:text-red-600 transition-colors">
                    <Link to={`/questions/${question._id}`} onClick={(e) => e.stopPropagation()}>
                      {question.title}
                    </Link>
                  </h3>

                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 lg:mb-5 line-clamp-2">{question.body?.substring(0, 250)}</p>

                  {question.attachment && (
                    <div className="mb-4">
                      {question.attachment_type === 'image' ? (
                        <div
                          className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/questions/${question._id}`);
                          }}
                        >
                          <img
                            src={question.attachment}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-300">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-sm text-gray-700 font-medium">{question.attachment_name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 lg:gap-5 text-sm lg:text-base">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      <span className="font-medium">{question.answersCount || 0} {question.answersCount === 1 ? 'answer' : 'answers'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      <span>{question.views || 0} views</span>
                    </div>
                    {question.course_name && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        {question.course_name}
                      </span>
                    )}
                    {question.semester_number && (
                      <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">
                        Semester {question.semester_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-gray-500 text-lg mb-4">No questions found</p>
            <p className="text-gray-400 mb-6">Be the first to ask a question!</p>
            <Link to="/questions/create" className="btn-create btn-create-animate">
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
              </svg>
              <span className="btn-text">Ask Your First Question</span>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.total > data.pagination.per_page && (
        <div className="mt-8">
          {/* Pagination component would go here */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;