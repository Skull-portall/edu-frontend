import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AdminOnboardingFeedback = () => {
 const [page, setPage] = useState(1);
 const limit = 20;

 const feedbackOptions = {
 classmate: 'Classmate',
 school: 'School',
 department: 'Department',
 teacher: 'Teacher',
 friend: 'Friend',
 social_media: 'Social Media',
 other: 'Other'
 };

 // Fetch Feedback
 const { data: feedbackData, isLoading: loading } = useQuery({
 queryKey: ['onboardingFeedback', page],
 queryFn: async () => {
 const response = await adminAPI.getOnboardingFeedback({ page, limit });
 return response.data;
 },
 keepPreviousData: true,
 onError: () => toast.error('Failed to load feedback')
 });

 const feedback = feedbackData?.data || [];
 const feedbackCounts = feedbackData?.feedbackCounts || {};
 const pagination = feedbackData?.pagination || { page: 1, total: 0, pages: 0 };

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
 {/* Header Section */}
 <div className="mb-6 lg:mb-8">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
 <div className="flex-1">
 <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Onboarding Feedback</h1>
 <p className="text-sm sm:text-base text-gray-600">View how users discovered eDu Live</p>
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

 {/* Feedback Statistics */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
 <h2 className="text-xl font-bold text-gray-900 mb-4">Feedback Summary</h2>
 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
 {Object.entries(feedbackOptions).map(([key, label]) => (
 <div key={key} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
 <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">
 {feedbackCounts[key] || 0}
 </div>
 <div className="text-xs sm:text-sm text-gray-600 font-medium">{label}</div>
 </div>
 ))}
 </div>
 </div>

 {/* Feedback List */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
 <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50">
 <h2 className="text-xl font-bold text-gray-900">All Feedback ({pagination.total})</h2>
 </div>
 {loading ? (
 <div className="py-12">
 <Loader />
 </div>
 ) : feedback.length === 0 ? (
 <div className="p-12 text-center">
 <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
 </svg>
 <p className="text-gray-500 text-lg font-medium">No feedback available</p>
 <p className="text-gray-400 text-sm mt-1">User feedback will appear here</p>
 </div>
 ) : (
 <div className="divide-y divide-gray-200">
 {feedback.map((user) => (
 <div key={user._id} className="p-6 hover:bg-gray-50 transition-colors">
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100">
 {user.profilePicture ? (
 <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center">
 <span className="text-white text-sm font-semibold">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
 </div>
 )}
 </div>
 <div>
 <Link to={`/admin/users/${user._id}`} className="text-lg font-semibold text-gray-900 hover:text-red-600 transition-colors">
 {user.name}
 </Link>
 <div className="text-sm text-gray-600">{user.email}</div>
 </div>
 </div>
 <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
 {user.campus && (
 <span className="flex items-center gap-1">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
 </svg>
 {user.campus.name}
 </span>
 )}
 {user.department && (
 <span className="flex items-center gap-1">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
 </svg>
 {user.department.name}
 </span>
 )}
 {user.semester && (
 <span className="flex items-center gap-1">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
 </svg>
 Semester {user.semester.number}
 </span>
 )}
 </div>
 <div className="mt-2">
 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
 </svg>
 {feedbackOptions[user.onboardingFeedback] || user.onboardingFeedback}
 </span>
 </div>
 </div>
 <div className="text-sm text-gray-500">
 <div className="flex items-center gap-1">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
 </svg>
 {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
 </div>
 <div className="text-xs text-gray-400 mt-1">
 {new Date(user.createdAt).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Pagination */}
 {pagination.pages > 1 && (
 <div className="px-6 py-4 border-t border-gray-200 flex justify-center gap-2">
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
 </div>
 );
};

export default AdminOnboardingFeedback;

