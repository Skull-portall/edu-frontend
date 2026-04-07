import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI, metaAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AdminUsers = () => {
 const { user: currentUser } = useAuth();
 const navigate = useNavigate();
 const queryClient = useQueryClient();

 // Filter states
 const [filters, setFilters] = useState({
 search: '',
 campus_id: '',
 department_id: '',
 semester_id: '',
 status: ''
 });

 const [page, setPage] = useState(1);
 const limit = 20;

 // Metadata Query
 const { data: metaData } = useQuery({
 queryKey: ['adminMeta'],
 queryFn: async () => {
 const [deptRes, semRes, campusRes] = await Promise.all([
 metaAPI.getDepartments(),
 metaAPI.getSemesters(),
 metaAPI.getCampuses()
 ]);
 return {
 departments: deptRes.data.data || [],
 semesters: semRes.data.data || [],
 campuses: campusRes.data.data || []
 };
 },
 staleTime: 1000 * 60 * 60, // 1 hour
 });

 // Users Query
 const { data: usersData, isLoading: loading } = useQuery({
 queryKey: ['adminUsers', { ...filters, page, limit }],
 queryFn: async () => {
 const params = { page, limit, ...filters };
 const response = await adminAPI.getUsers(params);
 return response.data;
 },
 keepPreviousData: true,
 onError: () => toast.error('Failed to load users'),
 });

 const users = usersData?.data || [];
 const pagination = usersData?.pagination || { page: 1, total: 0, pages: 0 };
 const newUsersCount = usersData?.newUsersCount || 0;
 const { departments = [], semesters = [], campuses = [] } = metaData || {};

 const handleFilterChange = (e) => {
 const { name, value } = e.target;
 setFilters(prev => ({ ...prev, [name]: value }));
 setPage(1);
 };

 const handleClearFilters = () => {
 setFilters({
 search: '',
 campus_id: '',
 department_id: '',
 semester_id: '',
 status: ''
 });
 setPage(1);
 };

 // Mutations
 const promoteMutation = useMutation({
 mutationFn: () => adminAPI.promoteSemester(),
 onSuccess: (res) => {
 toast.success(res.data.message || 'Users promoted successfully!');
 queryClient.invalidateQueries(['adminUsers']);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to promote users')
 });

 const suspendMutation = useMutation({
 mutationFn: (id) => adminAPI.suspendUser(id),
 onSuccess: () => {
 toast.success('User suspended successfully!');
 queryClient.invalidateQueries(['adminUsers']);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to suspend user')
 });

 const reactivateMutation = useMutation({
 mutationFn: (id) => adminAPI.reactivateUser(id),
 onSuccess: () => {
 toast.success('User restored successfully!');
 queryClient.invalidateQueries(['adminUsers']);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to reactivate user')
 });

 const deleteMutation = useMutation({
 mutationFn: (id) => adminAPI.deleteUser(id),
 onSuccess: () => {
 toast.success('User deleted successfully!');
 queryClient.invalidateQueries(['adminUsers']);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete user')
 });

 const handlePromoteSemester = () => {
 if (window.confirm('Are you sure you want to promote eligible users?')) {
 promoteMutation.mutate();
 }
 };

 const handleSuspend = (id) => {
 if (window.confirm('Suspend user?')) suspendMutation.mutate(id);
 };

 const handleReactivate = (id) => reactivateMutation.mutate(id);

 const handleDelete = (id) => {
 if (window.confirm('Delete user? This cannot be undone.')) deleteMutation.mutate(id);
 };

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
 {/* Header Section */}
 <div className="mb-6 lg:mb-8">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Manage Users</h1>
 {newUsersCount > 0 && (
 <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-bold leading-none text-white bg-red-600 rounded-full animate-pulse shadow-lg border-2 border-red-700">
 {newUsersCount > 99 ? '99+' : newUsersCount}
 </span>
 )}
 </div>
 <p className="text-sm sm:text-base text-gray-600">
 View, suspend, or delete users
 {newUsersCount > 0 && (
 <span className="text-red-600 font-semibold"> • {newUsersCount} new registration{newUsersCount > 1 ? 's' : ''} this week</span>
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

 {/* Bulk Semester Promotion Section */}
 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <div>
 <h2 className="text-xl font-bold text-gray-900 mb-2">Bulk Semester Promotion</h2>
 <p className="text-sm text-gray-600">Promote all users to the next semester who have been registered for 3+ months</p>
 </div>
 <button
 onClick={handlePromoteSemester}
 disabled={promoteMutation.isPending}
 className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-200 font-semibold inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {promoteMutation.isPending ? 'Loading...' : (
 <>
 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
 </svg>
 Promote Eligible Users
 </>
 )}
 </button>
 </div>
 </div>

 {/* Search and Filter Form */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
 <form onSubmit={(e) => { e.preventDefault(); }} className="grid grid-cols-1 md:grid-cols-5 gap-4">
 <div>
 <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">Search</label>
 <input
 type="text"
 id="search"
 name="search"
 value={filters.search}
 onChange={handleFilterChange}
 placeholder="Name or Email"
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
 />
 </div>
 <div>
 <label htmlFor="campus_id" className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
 <select
 id="campus_id"
 name="campus_id"
 value={filters.campus_id}
 onChange={handleFilterChange}
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
 >
 <option value="">All Campuses</option>
 {campuses.map(campus => (
 <option key={campus._id} value={campus._id}>{campus.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-2">Department</label>
 <select
 id="department_id"
 name="department_id"
 value={filters.department_id}
 onChange={handleFilterChange}
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
 >
 <option value="">All Departments</option>
 {departments.map(dept => (
 <option key={dept._id} value={dept._id}>{dept.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label htmlFor="semester_id" className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
 <select
 id="semester_id"
 name="semester_id"
 value={filters.semester_id}
 onChange={handleFilterChange}
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
 >
 <option value="">All Semesters</option>
 {semesters.map(sem => (
 <option key={sem._id} value={sem._id}>Semester {sem.number}</option>
 ))}
 </select>
 </div>
 <div>
 <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
 <select
 id="status"
 name="status"
 value={filters.status}
 onChange={handleFilterChange}
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
 >
 <option value="">All Status</option>
 <option value="active">Active</option>
 <option value="suspended">Suspended</option>
 </select>
 </div>
 <div className="md:col-span-5 flex justify-end space-x-2">
 <button type="button" onClick={handleClearFilters} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300">
 Clear Filters
 </button>
 </div>
 </form>
 </div>

 {/* Users Table */}
 {loading ? (
 <Loader />
 ) : (
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200">
 <thead className="bg-gray-50">
 <tr>
 <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">User</th>
 <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Phone/WhatsApp</th>
 <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Campus</th>
 <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Department</th>
 <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Semester</th>
 <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Stats</th>
 <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
 <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {users.length === 0 ? (
 <tr>
 <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No users found.</td>
 </tr>
 ) : (
 users.map((user) => (
 <tr key={user._id} className="hover:bg-gray-50 transition-colors">
 <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
 <div className="flex items-center">
 <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
 {user.profilePicture ? (
 <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
 ) : (
 <div className="h-full w-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
 <span className="text-white text-sm font-semibold">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
 </div>
 )}
 </div>
 <div className="ml-4">
 <div className="text-sm font-medium text-gray-900">{user.name}</div>
 <div className="text-sm text-gray-500">{user.email}</div>
 {user.isAdmin && (
 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">Admin</span>
 )}
 </div>
 </div>
 </td>
 <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
 {user.phoneNumber ? (
 <div className="flex items-center gap-2">
 <a
 href={`https://wa.me/${user.phoneNumber.replace(/[^0-9]/g, '')}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 text-sm"
 >
 {user.phoneNumber}
 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
 </svg>
 </a>
 </div>
 ) : (
 <span className="text-sm text-gray-400">N/A</span>
 )}
 </td>
 <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
 <div className="text-sm font-medium text-gray-900">{user.campus?.code || 'N/A'}</div>
 <div className="text-xs text-gray-500 truncate max-w-[150px]">{user.campus?.name || 'N/A'}</div>
 </td>
 <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
 <div className="text-sm font-medium text-gray-900">{user.department?.code || 'N/A'}</div>
 <div className="text-xs text-gray-500 truncate max-w-[150px]">{user.department?.name || 'N/A'}</div>
 </td>
 <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
 <div className="text-sm text-gray-900">
 {user.semester ? `Semester ${user.semester.number}` : 'N/A'}
 </div>
 </td>
 <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
 <div className="flex items-center gap-3">
 <span>Q: <span className="font-semibold text-gray-900">{user.questionsCount || 0}</span></span>
 <span>A: <span className="font-semibold text-gray-900">{user.answersCount || 0}</span></span>
 </div>
 </td>
 <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
 {user.suspendedAt ? (
 <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Suspended</span>
 ) : (
 <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
 )}
 </td>
 <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => navigate(`/admin/users/${user._id}`)}
 className="btn-view inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 hover:text-red-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-red-200"
 >
 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
 </svg>
 View
 </button>
 {user.suspendedAt ? (
 <button
 onClick={() => handleReactivate(user._id)}
 disabled={reactivateMutation.isPending}
 className="btn-activate inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 hover:text-green-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-green-200"
 >
 {reactivateMutation.isPending ? (
 <>
 <svg className="animate-spin h-3 w-3 text-green-700 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 Loading...
 </>
 ) : (
 <>
 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
 </svg>
 Activate
 </>
 )}
 </button>
 ) : (
 <button
 onClick={() => handleSuspend(user._id)}
 disabled={suspendMutation.isPending}
 className="btn-suspend inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 hover:text-yellow-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-yellow-200"
 >
 {suspendMutation.isPending ? (
 <>
 <svg className="animate-spin h-3 w-3 text-yellow-700 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 Loading...
 </>
 ) : (
 <>
 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
 </svg>
 Suspend
 </>
 )}
 </button>
 )}
 {user._id !== currentUser?._id && (
 <button
 onClick={() => handleDelete(user._id)}
 disabled={deleteMutation.isPending}
 className="btn-delete inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 hover:text-red-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-red-200"
 >
 {deleteMutation.isPending ? (
 <>
 <svg className="animate-spin h-3 w-3 text-red-700 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 Loading...
 </>
 ) : (
 <>
 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
 </svg>
 Delete
 </>
 )}
 </button>
 )}
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
 <div className="mt-6 flex justify-center gap-2">
 <button
 onClick={() => setPage(page - 1)}
 disabled={page === 1}
 className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
 >
 Previous
 </button>
 <span className="px-4 py-2 text-gray-700">
 Page {page} of {pagination.pages}
 </span>
 <button
 onClick={() => setPage(page + 1)}
 disabled={page === pagination.pages}
 className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
 >
 Next
 </button>
 </div>
 )}
 </div>
 );
};

export default AdminUsers;

