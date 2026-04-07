import Loader from '../../components/common/Loader';
import React from 'react';
import { Link } from 'react-router-dom';
import { classRepAPI, API_BASE_URL } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const ClassRepDashboard = () => {
 const queryClient = useQueryClient();

 // Dashboard Data Query
 const { data, isLoading: loading } = useQuery({
 queryKey: ['classRepDashboard'],
 queryFn: async () => {
 const response = await classRepAPI.getDashboard();
 return response.data.data;
 },
 onError: () => toast.error('Failed to load dashboard data')
 });

 const pendingNotes = data?.pendingNotes || [];
 const pendingPassTests = data?.pendingPassTests || [];
 const pendingCount = data?.pendingCount || 0;

 // Generic mutation handler for approvals/rejections
 const handleMutation = useMutation({
 mutationFn: ({ type, id, action }) => {
 if (type === 'note') {
 return action === 'approve' ? classRepAPI.approveNote(id) : classRepAPI.rejectNote(id);
 } else {
 return action === 'approve' ? classRepAPI.approvePassTest(id) : classRepAPI.rejectPassTest(id);
 }
 },
 onSuccess: (_, variables) => {
 queryClient.invalidateQueries(['classRepDashboard']);
 const itemType = variables.type === 'note' ? 'Note' : 'Item';
 const actionText = variables.action === 'approve' ? 'approved successfully!' : 'rejected and deleted!';
 toast.success(`${itemType} ${actionText}`);
 },
 onError: (error) => {
 toast.error(error.response?.data?.message || 'Action failed');
 }
 });

 const handleApproveNote = (noteId) => handleMutation.mutate({ type: 'note', id: noteId, action: 'approve' });
 const handleRejectNote = (noteId) => {
 if (window.confirm('Are you sure you want to reject this note?')) {
 handleMutation.mutate({ type: 'note', id: noteId, action: 'reject' });
 }
 };
 const handleApprovePassTest = (id) => handleMutation.mutate({ type: 'test', id, action: 'approve' });
 const handleRejectPassTest = (id, type) => {
 if (window.confirm(`Are you sure you want to reject this ${type}?`)) {
 handleMutation.mutate({ type: 'test', id, action: 'reject' });
 }
 };

 const getAttachmentUrl = (attachmentPath) => {
 if (!attachmentPath) return null;
 if (attachmentPath.startsWith('http')) return attachmentPath;

 // Normalize backslashes to forward slashes for URL compatibility
 const normalizedPath = attachmentPath.replace(/\\/g, '/');

 const apiUrl = API_BASE_URL;
 // Get base URL by removing /api/v1 suffix if present
 const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');

 // Remove leading slash from path to prevent double slash
 const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;

 // If path doesn't start with uploads/ and isn't just a filename (contains /), 
 // we might need to be careful, but usually it's in uploads directory.
 // The previous logic checked for 'uploads/'. Let's keep that safely.

 if (cleanPath.startsWith('uploads/')) {
 return `${baseUrl}/${cleanPath}`;
 }
 return `${baseUrl}/uploads/${cleanPath}`;
 };

 if (loading && !data) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-50">
 <Loader />
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
 {/* Header Section */}
 <header className="mb-8 sm:mb-10 animate-fade-in">
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
 <div className="flex-1">
 <div className="flex items-center gap-4 mb-3">
 <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl shadow-lg flex items-center justify-center">
 <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
 </svg>
 </div>
 <div>
 <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight flex items-center gap-3">
 CR Dashboard
 {pendingCount > 0 && (
 <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold bg-red-600 text-white rounded-full animate-pulse shadow-md">
 {pendingCount}
 </span>
 )}
 </h1>
 <p className="text-sm sm:text-base text-gray-600 mt-1.5 max-w-2xl">
 Review and curate notes, tests, and assignments for your department.
 </p>
 </div>
 </div>
 </div>
 </div>
 </header>

 {/* Status Alert */}
 {pendingCount > 0 && (
 <div className="bg-red-50 border-l-4 border-red-500 rounded-xl shadow-sm p-4 mb-8 animate-slide-in">
 <div className="flex items-center gap-3">
 <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
 <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6zm-1 8a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
 </svg>
 </div>
 <p className="text-sm font-semibold text-red-800">
 You have <span className="underline font-bold">{pendingCount}</span> items awaiting your review.
 </p>
 </div>
 </div>
 )}

 {/* Pending Notes Section */}
 <section className="mb-12 animate-slide-up">
 <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
 <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700">
 <h2 className="text-xl font-bold text-white flex items-center gap-3">
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
 </svg>
 Pending Notes ({pendingNotes.length})
 </h2>
 </div>
 <div className="divide-y divide-gray-100">
 {pendingNotes.length > 0 ? (
 pendingNotes.map((note) => (
 <div key={note._id} className="p-6 sm:p-8 hover:bg-gray-50/50 transition-all group">
 <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
 <div className="flex-1 min-w-0">
 <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{note.title}</h3>
 <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-gray-600 mb-4">
 {note.user && (
 <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
 <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
 {note.user.name.charAt(0)}
 </div>
 <Link to={`/profile/${note.user._id}`} className="text-gray-900 hover:text-red-600 font-bold">
 {note.user.name}
 </Link>
 </div>
 )}
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-blue-400"></div>
 <span className="font-semibold text-gray-800">{note.courseName}</span>
 </div>
 {note.semester && (
 <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
 Semester {note.semester.number}
 </span>
 )}
 <div className="flex items-center gap-1.5 text-gray-500">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
 </svg>
 <span>{new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
 </div>
 </div>
 <p className="text-gray-700 leading-relaxed line-clamp-2 italic mb-4">
 "{note.content?.replace(/<[^>]*>/g, '').substring(0, 200)}..."
 </p>

 {/* Attachment Preview */}
 {note.attachment && (
 <div className="inline-flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
 <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
 <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
 </svg>
 </div>
 <div className="min-w-0 pr-2">
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Attachment Found</p>
 <a
 href={getAttachmentUrl(note.attachment)}
 target="_blank"
 rel="noopener noreferrer"
 className="text-sm text-gray-900 hover:text-red-600 font-bold truncate max-w-[200px] block"
 >
 {note.attachmentName || 'View Document'} ↗
 </a>
 </div>
 </div>
 )}
 </div>
 <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-40">
 <button
 onClick={() => handleApproveNote(note._id)}
 disabled={handleMutation.isPending}
 className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
 </svg>
 Approve
 </button>
 <button
 onClick={() => handleRejectNote(note._id)}
 disabled={handleMutation.isPending}
 className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-red-600 border-2 border-red-50 text-red-700 rounded-xl hover:bg-red-50 font-bold transition-all disabled:opacity-50"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
 </svg>
 Reject
 </button>
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="p-16 text-center">
 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
 </svg>
 </div>
 <h3 className="text-xl font-bold text-gray-900 mb-2">No pending notes</h3>
 <p className="text-gray-500 max-w-sm mx-auto">Everything is up to date! New notes from your department will appear here.</p>
 </div>
 )}
 </div>
 </div>
 </section>

 {/* Pending Pass Tests Section */}
 <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
 <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
 <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-rose-600">
 <h2 className="text-xl font-bold text-white flex items-center gap-3">
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
 </svg>
 Pending Tests & Assignments ({pendingPassTests.length})
 </h2>
 </div>
 <div className="divide-y divide-gray-100">
 {pendingPassTests.length > 0 ? (
 pendingPassTests.map((passTest) => (
 <div key={passTest._id} className="p-6 sm:p-8 hover:bg-gray-50/50 transition-all group">
 <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-3">
 <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors uppercase tracking-tight">{passTest.title}</h3>
 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${passTest.type === 'test'
 ? 'bg-green-50 text-green-700 border-green-100'
 : passTest.type === 'assignment'
 ? 'bg-blue-50 text-blue-700 border-blue-100'
 : 'bg-purple-50 text-purple-700 border-purple-100'
 }`}>
 {passTest.type}
 </span>
 </div>
 <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-gray-600 mb-4">
 {passTest.user && (
 <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
 <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
 {passTest.user.name.charAt(0)}
 </div>
 <Link to={`/profile/${passTest.user._id}`} className="text-gray-900 hover:text-red-600 font-bold">
 {passTest.user.name}
 </Link>
 </div>
 )}
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-purple-400"></div>
 <span className="font-semibold text-gray-800">{passTest.courseName}</span>
 </div>
 {passTest.semester && (
 <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-100">
 Semester {passTest.semester.number}
 </span>
 )}
 <div className="flex items-center gap-1.5 text-gray-500">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
 </svg>
 <span>{new Date(passTest.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
 </div>
 </div>
 <p className="text-gray-700 leading-relaxed line-clamp-2 italic mb-4">
 "{passTest.content?.replace(/<[^>]*>/g, '').substring(0, 200)}..."
 </p>

 {/* Attachment Preview */}
 {passTest.attachment && (
 <div className="inline-flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
 <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
 <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
 </svg>
 </div>
 <div className="min-w-0 pr-2">
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Test Document</p>
 <a
 href={getAttachmentUrl(passTest.attachment)}
 target="_blank"
 rel="noopener noreferrer"
 className="text-sm text-gray-900 hover:text-purple-600 font-bold truncate max-w-[200px] block"
 >
 {passTest.attachmentName || 'View/Download'} ↗
 </a>
 </div>
 </div>
 )}
 </div>
 <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-40">
 <button
 onClick={() => handleApprovePassTest(passTest._id)}
 disabled={handleMutation.isPending}
 className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
 </svg>
 Approve
 </button>
 <button
 onClick={() => handleRejectPassTest(passTest._id, passTest.type)}
 disabled={handleMutation.isPending}
 className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-red-50 text-red-700 rounded-xl hover:bg-red-50 font-bold transition-all disabled:opacity-50"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
 </svg>
 Reject
 </button>
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="p-16 text-center">
 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
 </svg>
 </div>
 <h3 className="text-xl font-bold text-gray-900 mb-2">No pending tests</h3>
 <p className="text-gray-500 max-w-sm mx-auto">All tests and assignments have been reviewed. Good job!</p>
 </div>
 )}
 </div>
 </div>
 </section>
 </div>
 </div>
 );
};

export default ClassRepDashboard;

