import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { passTestsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const PassTestsList = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('approved'); // 'approved' or 'pending'

  const canApprove = user && (user.isAdmin || user.role === 'class_rep' || user.isClassRep);

  useEffect(() => {
    fetchTests();
  }, [search, type, status]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (type) params.type = type;
      params.status = status;

      const response = await passTestsAPI.getAll(params);
      setTests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHandleAction = async (e, id, action) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to ${action} this item?`)) return;

    try {
      if (action === 'approve') {
        await passTestsAPI.approve(id);
      } else {
        await passTestsAPI.reject(id);
      }
      fetchTests(); // Refresh list
    } catch (error) {
      console.error(`Error ${action}ing test:`, error);
      alert(`Failed to ${action} item`);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTests();
  };

  if (loading && !tests.length) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
              Past Tests & Assignments
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Browse past exams and assignments shared by students
            </p>
          </div>
        </div>

        {/* Dashboard Link for Class Reps */}
        {canApprove && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-blue-900">Class Representative Access</h3>
              <p className="text-sm text-blue-700">Manage pending approvals for your semester in the dashboard.</p>
            </div>
            <Link
              to="/class-rep/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tests and assignments..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-base"
              />
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            >
              <option value="">All Types</option>
              <option value="test">Tests</option>
              <option value="assignment">Assignments</option>
            </select>
            <button
              type="submit"
              className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
            >
              Search
            </button>
          </form>
        </div>

        {user && (
          <Link
            to="/pass-tests/create"
            className="btn-create btn-create-animate inline-flex items-center gap-2"
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="btn-text">Share Test/Assignment</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-lg">
              No tests or assignments found
            </p>
          </div>
        ) : (
          tests.map((test) => (
            <div
              key={test._id}
              className="relative group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 card-hover flex flex-col h-full"
            >
              <Link to={`/pass-tests/${test._id}`} className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${test.type === 'test' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                    {test.type}
                  </span>
                  {!test.isApproved && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      Pending
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900 line-clamp-2">{test.title}</h2>
                <p className="text-gray-600 mb-4 text-sm line-clamp-3">{test.content?.substring(0, 150)}...</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center text-white text-xs font-semibold">
                      {test.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span>{test.user?.name}</span>
                  </div>
                  {test.courseName && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                      {test.courseName}
                    </span>
                  )}
                </div>
              </Link>

              {/* No Approval Buttons Here */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PassTestsList;
