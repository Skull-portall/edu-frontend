import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, metaAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AdminPassTests = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const limit = 20;

  // Fetch metadata for filters
  const { data: campuses } = useQuery({ queryKey: ['campuses'], queryFn: async () => (await metaAPI.getCampuses()).data.data });
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: async () => (await metaAPI.getDepartments()).data.data });
  const { data: semesters } = useQuery({ queryKey: ['semesters'], queryFn: async () => (await metaAPI.getSemesters()).data.data });

  // Fetch Pass Tests
  const { data: passTestsData, isLoading: loading } = useQuery({
    queryKey: ['adminPassTests', page, statusFilter, campusFilter, departmentFilter, semesterFilter],
    queryFn: async () => {
      const params = { page, limit };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (campusFilter) params.campus_id = campusFilter;
      if (departmentFilter) params.department_id = departmentFilter;
      if (semesterFilter) params.semester_id = semesterFilter;
      const response = await adminAPI.getPassTests(params);
      return response.data;
    },
    keepPreviousData: true,
    onError: () => toast.error('Failed to load pass tests')
  });

  const passTests = passTestsData?.data || [];
  const pendingPassTestsCount = passTestsData?.pendingPassTestsCount || 0;
  const pagination = passTestsData?.pagination || { page: 1, total: 0, pages: 0 };

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approvePassTest(id),
    onSuccess: () => {
      toast.success('Test/Assignment approved successfully!');
      queryClient.invalidateQueries(['adminPassTests']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve test')
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => adminAPI.rejectPassTest(id),
    onSuccess: () => {
      toast.success('Test/Assignment rejected and deleted!');
      queryClient.invalidateQueries(['adminPassTests']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject test')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deletePassTest(id),
    onSuccess: () => {
      toast.success('Test/Assignment deleted successfully!');
      queryClient.invalidateQueries(['adminPassTests']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete test')
  });

  const handleApprove = (id) => approveMutation.mutate(id);

  const handleReject = (id) => {
    if (window.confirm('Are you sure you want to reject this test/assignment?')) rejectMutation.mutate(id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this test/assignment? This action cannot be undone.')) deleteMutation.mutate(id);
  };

  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleCampusChange = (e) => { setCampusFilter(e.target.value); setPage(1); };
  const handleDepartmentChange = (e) => { setDepartmentFilter(e.target.value); setPage(1); };
  const handleSemesterChange = (e) => { setSemesterFilter(e.target.value); setPage(1); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Manage Past Papers</h1>
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

      {/* Filter Tabs */}
      <div className="mb-8 animate-fade-in space-y-4">
        <div className="flex gap-2">
          {['all', 'pending', 'approved'].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === status
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Additional Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={campusFilter} onChange={handleCampusChange} className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent">
            <option value="">All Campuses</option>
            {campuses?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>

          <select value={departmentFilter} onChange={handleDepartmentChange} className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent">
            <option value="">All Departments</option>
            {departments?.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>

          <select value={semesterFilter} onChange={handleSemesterChange} className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent">
            <option value="">All Semesters</option>
            {semesters?.map(s => <option key={s._id} value={s._id}>Semester {s.number}</option>)}
          </select>
        </div>
      </div>

      {/* Pass Tests Table */}
      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Title</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">User</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Semester</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Department</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Campus</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Course</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {passTests.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No past papers found</p>
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
                        <Link to={`/profile/${test.user?._id}`} className="block hover:bg-gray-50 transition-colors">
                          <div className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors">{test.user?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{test.user?.email || 'N/A'}</div>
                        </Link>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {test.user?.semester?.number || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {test.user?.department?.code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {test.user?.campus?.code || 'N/A'}
                        </span>
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
                                disabled={approveMutation.isPending}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {approveMutation.isPending ? (
                                  <>
                                    <svg className="animate-spin h-3 w-3 mr-1.5 text-green-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading...
                                  </>
                                ) : (
                                  'Approve'
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(test._id)}
                                disabled={rejectMutation.isPending}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {rejectMutation.isPending ? (
                                  <>
                                    <svg className="animate-spin h-3 w-3 mr-1.5 text-red-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading...
                                  </>
                                ) : (
                                  'Reject'
                                )}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(test._id)}
                            disabled={deleteMutation.isPending}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleteMutation.isPending ? (
                              <>
                                <svg className="animate-spin h-3 w-3 mr-1.5 text-red-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                              </>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div >
        </div >
      )}

      {/* Pagination */}
      {
        pagination.pages > 1 && (
          <div className="mt-6 lg:mt-8 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )
      }
    </div >
  );
};

export default AdminPassTests;

