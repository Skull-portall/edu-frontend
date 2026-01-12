import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const AdminPassTests = () => {
  const [passTests, setPassTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingPassTestsCount, setPendingPassTestsCount] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    fetchPassTests();
  }, [pagination.page]);

  const fetchPassTests = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPassTests({ page: pagination.page, limit: pagination.limit });
      if (response.data.success) {
        setPassTests(response.data.data || []);
        setPendingPassTestsCount(response.data.pendingPassTestsCount || 0);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching pass tests:', error);
      setMessage({ type: 'error', text: 'Failed to load pass tests' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (testId) => {
    try {
      await adminAPI.approvePassTest(testId);
      setMessage({ type: 'success', text: 'Test/Assignment approved successfully!' });
      fetchPassTests();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to approve test' });
    }
  };

  const handleReject = async (testId) => {
    if (!window.confirm('Are you sure you want to reject this test/assignment?')) return;
    try {
      await adminAPI.rejectPassTest(testId);
      setMessage({ type: 'success', text: 'Test/Assignment rejected and deleted!' });
      fetchPassTests();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reject test' });
    }
  };

  const handleDelete = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test/assignment? This action cannot be undone.')) return;
    try {
      await adminAPI.deletePassTest(testId);
      setMessage({ type: 'success', text: 'Test/Assignment deleted successfully!' });
      fetchPassTests();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete test' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Manage Pass Tests</h1>
              {pendingPassTestsCount > 0 && (
                <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-bold leading-none text-white bg-red-600 rounded-full animate-pulse shadow-lg border-2 border-red-700">
                  {pendingPassTestsCount > 99 ? '99+' : pendingPassTestsCount}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Approve, reject, or delete tests/assignments
              {pendingPassTestsCount > 0 && (
                <span className="text-red-600 font-semibold"> • {pendingPassTestsCount} pending approval</span>
              )}
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base shadow-md whitespace-nowrap"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Success/Error Messages */}
      {message.text && (
        <div className={`mb-6 border-l-4 p-4 rounded-lg shadow-sm ${
          message.type === 'success' 
            ? 'bg-green-100 border-green-500 text-green-700' 
            : 'bg-red-100 border-red-500 text-red-700'
        }`}>
          <div className="flex items-center">
            <svg className={`w-5 h-5 mr-2`} fill="currentColor" viewBox="0 0 20 20">
              {message.type === 'success' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              )}
            </svg>
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Pass Tests Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pass tests...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Title</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">User</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Course</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {passTests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No pass tests found</p>
                        <p className="text-gray-400 text-sm mt-1">Tests/Assignments will appear here once submitted</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  passTests.map((test) => (
                    <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 max-w-xs truncate" title={test.title}>
                          {test.title}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {test.type || 'test'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{test.user?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{test.user?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{test.courseName || 'N/A'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {test.isApproved ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(test.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-2">
                          {!test.isApproved && (
                            <>
                              <button
                                onClick={() => handleApprove(test._id)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(test._id)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(test._id)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 lg:mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPassTests;

