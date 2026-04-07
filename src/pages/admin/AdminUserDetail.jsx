import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { adminAPI, metaAPI, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AdminUserDetail = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const { user: currentUser } = useAuth();
 const queryClient = useQueryClient();
 const [showSemesterForm, setShowSemesterForm] = useState(false);
 const [semesterFormData, setSemesterFormData] = useState({ semester_id: '' });
 const [showRoleForm, setShowRoleForm] = useState(false);
 const [roleFormData, setRoleFormData] = useState({ role: '' });
 const [imageError, setImageError] = useState(false);

 const getProfilePictureUrl = (picturePath) => {
 if (!picturePath) return null;
 if (picturePath.startsWith('http')) return picturePath;
 if (picturePath.startsWith('/uploads')) return picturePath;
 const apiUrl = API_BASE_URL;
 const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
 if (picturePath.startsWith('uploads/')) {
 return `${baseUrl}/${picturePath}`;
 }
 return `${baseUrl}/uploads/${picturePath}`;
 };

 // Fetch User
 const { data: userData, isLoading: userLoading } = useQuery({
 queryKey: ['adminUser', id],
 queryFn: async () => {
 const response = await adminAPI.getUserById(id);
 return response.data;
 },
 onSuccess: (data) => {
 if (data.data) {
 setRoleFormData({ role: data.data.role || 'student' });
 }
 },
 onError: (error) => {
 toast.error(error.response?.data?.message || 'Failed to load user details');
 }
 });

 // Fetch Semesters
 const { data: semestersData } = useQuery({
 queryKey: ['metaSemesters'],
 queryFn: async () => {
 const response = await metaAPI.getSemesters();
 return response.data;
 },
 });

 const user = userData?.data;
 const semesters = semestersData?.data || [];

 // Mutations
 const suspendMutation = useMutation({
 mutationFn: () => adminAPI.suspendUser(id),
 onSuccess: () => {
 toast.success('User suspended successfully!');
 queryClient.invalidateQueries(['adminUser', id]);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to suspend user')
 });

 const reactivateMutation = useMutation({
 mutationFn: () => adminAPI.reactivateUser(id),
 onSuccess: () => {
 toast.success('User reactivated successfully!');
 queryClient.invalidateQueries(['adminUser', id]);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to reactivate user')
 });

 const deleteMutation = useMutation({
 mutationFn: () => adminAPI.deleteUser(id),
 onSuccess: () => {
 toast.success('User deleted successfully!');
 setTimeout(() => navigate('/admin/users'), 2000);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete user')
 });

 const updateSemesterMutation = useMutation({
 mutationFn: (semesterId) => adminAPI.updateUserSemester(id, semesterId),
 onSuccess: () => {
 toast.success('User semester updated successfully!');
 setShowSemesterForm(false);
 queryClient.invalidateQueries(['adminUser', id]);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to update semester')
 });

 const updateRoleMutation = useMutation({
 mutationFn: (role) => adminAPI.updateUserRole(id, role),
 onSuccess: () => {
 toast.success('User role updated successfully!');
 setShowRoleForm(false);
 queryClient.invalidateQueries(['adminUser', id]);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role')
 });

 const handleSuspend = () => {
 if (window.confirm('Are you sure you want to suspend this user?')) {
 suspendMutation.mutate();
 }
 };

 const handleReactivate = () => reactivateMutation.mutate();

 const handleDelete = () => {
 if (window.confirm('Are you sure you want to delete this user? This action cannot be undone!')) {
 deleteMutation.mutate();
 }
 };

 const handleUpdateSemester = (e) => {
 e.preventDefault();
 updateSemesterMutation.mutate(semesterFormData.semester_id);
 };

 const handleUpdateRole = (e) => {
 e.preventDefault();
 updateRoleMutation.mutate(roleFormData.role);
 };

 if (userLoading) {
 return (
 <div className="flex items-center justify-center min-h-screen bg-gray-50">
 <Loader />
 </div>
 );
 }

 if (!user) {
 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
 <div className="text-center py-12">
 <p className="text-gray-500 text-lg">User not found</p>
 <Link to="/admin/users" className="text-red-600 hover:text-red-700 mt-4 inline-block font-medium">
 Back to Users
 </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
 {/* Header Section */}
 <div className="mb-6 lg:mb-8">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">User Details</h1>
 <p className="text-sm sm:text-base text-gray-600">View and manage user information</p>
 </div>
 <Link
 to="/admin/users"
 className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base shadow-md whitespace-nowrap"
 >
 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
 </svg>
 <span>Back to Users</span>
 </Link>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* User Info Card */}
 <div className="lg:col-span-1">
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
 <div className="text-center mb-6">
 <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-gray-100 relative">
 {user.profilePicture && !imageError ? (
 <img
 src={getProfilePictureUrl(user.profilePicture)}
 alt={user.name}
 className="w-full h-full object-cover"
 onError={() => setImageError(true)}
 />
 ) : (
 <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
 <span className="text-white text-3xl font-semibold">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
 </div>
 )}
 </div>
 <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
 <p className="text-gray-600 mt-1">{user.email}</p>
 {user.isAdmin && (
 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mt-2">
 Admin
 </span>
 )}
 {user.suspendedAt ? (
 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 mt-2">
 Suspended
 </span>
 ) : (
 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 mt-2">
 Active
 </span>
 )}
 </div>

 <div className="space-y-4 border-t border-gray-200 pt-6">
 <div>
 <label className="text-sm font-medium text-gray-500">Role</label>
 <div className="mt-1 flex items-center justify-between">
 <span className="text-base font-semibold text-gray-900 capitalize">{user.role || 'student'}</span>
 <button
 onClick={() => setShowRoleForm(!showRoleForm)}
 className="text-red-600 hover:text-red-700 text-sm font-medium"
 >
 Edit
 </button>
 </div>
 {showRoleForm && (
 <form onSubmit={handleUpdateRole} className="mt-3 space-y-2">
 <select
 value={roleFormData.role}
 onChange={(e) => setRoleFormData({ role: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500"
 >
 <option value="student">Student</option>
 <option value="class_rep">Class Rep</option>
 <option value="teacher">Teacher</option>
 <option value="administrative_staff">Admin Staff</option>
 </select>
 <div className="flex gap-2">
 <button
 type="submit"
 disabled={updateRoleMutation.isPending}
 className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm disabled:opacity-50"
 >
 {updateRoleMutation.isPending ? 'Saving...' : 'Save'}
 </button>
 <button type="button" onClick={() => setShowRoleForm(false)} className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 text-sm">
 Cancel
 </button>
 </div>
 </form>
 )}
 </div>

 <div>
 <label className="text-sm font-medium text-gray-500">Semester</label>
 <div className="mt-1 flex items-center justify-between">
 <span className="text-base font-semibold text-gray-900">
 {user.semester ? `Semester ${user.semester.number}` : 'N/A'}
 </span>
 <button
 onClick={() => setShowSemesterForm(!showSemesterForm)}
 className="text-red-600 hover:text-red-700 text-sm font-medium"
 >
 Edit
 </button>
 </div>
 {showSemesterForm && (
 <form onSubmit={handleUpdateSemester} className="mt-3 space-y-2">
 <select
 value={semesterFormData.semester_id}
 onChange={(e) => setSemesterFormData({ semester_id: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500"
 >
 <option value="">Select Semester</option>
 {semesters.map(sem => (
 <option key={sem._id} value={sem._id}>Semester {sem.number}</option>
 ))}
 </select>
 <div className="flex gap-2">
 <button
 type="submit"
 disabled={updateSemesterMutation.isPending}
 className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm disabled:opacity-50"
 >
 {updateSemesterMutation.isPending ? 'Saving...' : 'Save'}
 </button>
 <button type="button" onClick={() => setShowSemesterForm(false)} className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 text-sm">
 Cancel
 </button>
 </div>
 </form>
 )}
 </div>

 <div>
 <label className="text-sm font-medium text-gray-500">Campus</label>
 <p className="mt-1 text-base font-semibold text-gray-900">{user.campus?.name || 'N/A'}</p>
 {user.campus?.code && <p className="text-sm text-gray-500">{user.campus.code}</p>}
 </div>

 <div>
 <label className="text-sm font-medium text-gray-500">Department</label>
 <p className="mt-1 text-base font-semibold text-gray-900">{user.department?.name || 'N/A'}</p>
 {user.department?.code && <p className="text-sm text-gray-500">{user.department.code}</p>}
 </div>

 {user.phoneNumber && (
 <div>
 <label className="text-sm font-medium text-gray-500">Phone</label>
 <div className="mt-1">
 <a
 href={`https://wa.me/${user.phoneNumber.replace(/[^0-9]/g, '')}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
 >
 {user.phoneNumber}
 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
 </svg>
 </a>
 </div>
 </div>
 )}

 <div>
 <label className="text-sm font-medium text-gray-500">Reputation</label>
 <p className="mt-1 text-base font-semibold text-gray-900">{user.reputation || 0} points</p>
 </div>

 <div>
 <label className="text-sm font-medium text-gray-500">Joined</label>
 <p className="mt-1 text-base font-semibold text-gray-900">
 {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
 </p>
 </div>
 </div>

 {/* Actions */}
 <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
 {user.suspendedAt ? (
 <button
 onClick={handleReactivate}
 disabled={reactivateMutation.isPending}
 className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
 >
 {reactivateMutation.isPending ? 'Activating...' : 'Activate User'}
 </button>
 ) : (
 <button
 onClick={handleSuspend}
 disabled={suspendMutation.isPending}
 className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-semibold disabled:opacity-50"
 >
 {suspendMutation.isPending ? 'Suspending...' : 'Suspend User'}
 </button>
 )}
 {user._id !== currentUser?._id && (
 <button
 onClick={handleDelete}
 disabled={deleteMutation.isPending}
 className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
 >
 {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Content Section */}
 <div className="lg:col-span-2 space-y-6">
 {/* Statistics */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
 <h3 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h3>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="text-center p-4 bg-gray-50 rounded-lg">
 <div className="text-2xl font-bold text-red-600">{user.questionsCount || 0}</div>
 <div className="text-sm text-gray-600 mt-1">Questions</div>
 </div>
 <div className="text-center p-4 bg-gray-50 rounded-lg">
 <div className="text-2xl font-bold text-blue-600">{user.answersCount || 0}</div>
 <div className="text-sm text-gray-600 mt-1">Answers</div>
 </div>
 <div className="text-center p-4 bg-gray-50 rounded-lg">
 <div className="text-2xl font-bold text-green-600">{user.notesCount || 0}</div>
 <div className="text-sm text-gray-600 mt-1">Notes</div>
 </div>
 <div className="text-center p-4 bg-gray-50 rounded-lg">
 <div className="text-2xl font-bold text-purple-600">{user.reputation || 0}</div>
 <div className="text-sm text-gray-600 mt-1">Reputation</div>
 </div>
 </div>
 </div>

 {/* Recent Questions */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
 <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Questions</h3>
 {user.questions && user.questions.length > 0 ? (
 <div className="space-y-3">
 {user.questions.slice(0, 5).map((question) => (
 <div key={question._id} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
 <Link to={`/questions/${question._id}`} className="text-base font-medium text-gray-900 hover:text-red-600">
 {question.title}
 </Link>
 <p className="text-sm text-gray-500 mt-1">
 {new Date(question.createdAt).toLocaleDateString()}
 </p>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-gray-500">No questions yet</p>
 )}
 </div>

 {/* Recent Answers */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
 <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Answers</h3>
 {user.answers && user.answers.length > 0 ? (
 <div className="space-y-3">
 {user.answers.slice(0, 5).map((answer) => (
 <div key={answer._id} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
 <Link to={`/questions/${answer.question?._id}`} className="text-base font-medium text-gray-900 hover:text-red-600">
 {answer.question?.title || 'Question'}
 </Link>
 <p className="text-sm text-gray-600 mt-1 line-clamp-2">{answer.body}</p>
 <p className="text-sm text-gray-500 mt-1">
 {new Date(answer.createdAt).toLocaleDateString()}
 </p>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-gray-500">No answers yet</p>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};

export default AdminUserDetail;

