import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingCounts, setPendingCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
        setPendingCounts(response.data.data.pendingCounts || {});
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage and monitor your platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 hover:shadow-md transition-all duration-300">
          <div className="text-sm text-gray-500 mb-1">Total Users</div>
          <div className="text-3xl sm:text-4xl font-bold text-red-600">{stats?.users || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 hover:shadow-md transition-all duration-300">
          <div className="text-sm text-gray-500 mb-1">Total Questions</div>
          <div className="text-3xl sm:text-4xl font-bold text-red-600">{stats?.questions || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 hover:shadow-md transition-all duration-300">
          <div className="text-sm text-gray-500 mb-1">Total Courses</div>
          <div className="text-3xl sm:text-4xl font-bold text-red-600">{stats?.courses || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 hover:shadow-md transition-all duration-300">
          <div className="text-sm text-gray-500 mb-1">Total Semesters</div>
          <div className="text-3xl sm:text-4xl font-bold text-red-600">{stats?.semesters || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 hover:shadow-md transition-all duration-300">
          <div className="text-sm text-gray-500 mb-1">Total Departments</div>
          <div className="text-3xl sm:text-4xl font-bold text-red-600">{stats?.departments || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 hover:shadow-md transition-all duration-300">
          <div className="text-sm text-gray-500 mb-1">Total Campuses</div>
          <div className="text-3xl sm:text-4xl font-bold text-red-600">{stats?.campuses || 0}</div>
        </div>
      </div>

      {/* End Season Section */}
      <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl shadow-sm border-2 border-red-200 p-6 mb-6 lg:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              End Season - Semester Promotion
            </h2>
            <p className="text-sm text-gray-600">Promote all students from a specific campus and department to the next semester after exams</p>
          </div>
          <Link
            to="/admin/end-season"
            className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-200 font-semibold inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
            End Season & Promote
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link
          to="/admin/users"
          className="group relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Manage Users</h3>
            {pendingCounts?.newUsers > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                {pendingCounts.newUsers > 99 ? '99+' : pendingCounts.newUsers}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm">View, suspend, or delete users</p>
          {pendingCounts?.newUsers > 0 && (
            <p className="text-xs text-red-600 font-medium mt-2">New registrations this week</p>
          )}
        </Link>

        <Link
          to="/admin/departments"
          className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">Manage Departments</h3>
          <p className="text-gray-600 text-sm">Add, edit, or remove departments</p>
        </Link>

        <Link
          to="/admin/campuses"
          className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">Manage Campuses</h3>
          <p className="text-gray-600 text-sm">Add, edit, or remove campuses</p>
        </Link>

        <Link
          to="/admin/courses"
          className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">Manage Courses</h3>
          <p className="text-gray-600 text-sm">Add, edit, or remove courses</p>
        </Link>

        <Link
          to="/admin/semesters"
          className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">Manage Semesters</h3>
          <p className="text-gray-600 text-sm">Add, edit, or remove semesters</p>
        </Link>

        <Link
          to="/admin/onboarding-feedback"
          className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">Onboarding Feedback</h3>
          <p className="text-gray-600 text-sm">View user registration feedback</p>
        </Link>

        <Link
          to="/admin/topics"
          className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">Manage Topics</h3>
          <p className="text-gray-600 text-sm">Add, edit, or remove topics</p>
        </Link>

        <Link
          to="/admin/notes"
          className="group relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Manage Notes</h3>
            {pendingCounts?.pendingNotes > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                {pendingCounts.pendingNotes > 99 ? '99+' : pendingCounts.pendingNotes}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm">Approve, reject, or delete course notes</p>
          {pendingCounts?.pendingNotes > 0 && (
            <p className="text-xs text-red-600 font-medium mt-2">{pendingCounts.pendingNotes} pending approval</p>
          )}
        </Link>

        <Link
          to="/admin/pass-tests"
          className="group relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Manage Pass Tests</h3>
            {pendingCounts?.pendingPassTests > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                {pendingCounts.pendingPassTests > 99 ? '99+' : pendingCounts.pendingPassTests}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm">Approve, reject, or delete tests/assignments</p>
          {pendingCounts?.pendingPassTests > 0 && (
            <p className="text-xs text-red-600 font-medium mt-2">{pendingCounts.pendingPassTests} pending approval</p>
          )}
        </Link>

        <Link
          to="/admin/communities"
          className="group relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Manage Communities</h3>
            {pendingCounts?.inactiveCommunities > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                {pendingCounts.inactiveCommunities > 99 ? '99+' : pendingCounts.inactiveCommunities}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm">Activate, deactivate, or delete communities</p>
          {pendingCounts?.inactiveCommunities > 0 && (
            <p className="text-xs text-red-600 font-medium mt-2">{pendingCounts.inactiveCommunities} inactive</p>
          )}
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
