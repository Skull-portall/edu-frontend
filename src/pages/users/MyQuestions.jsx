import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, questionsAPI } from '../../services/api';

const MyQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 });

  useEffect(() => {
    fetchQuestions();
  }, [pagination.page]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getMyQuestions();
      if (response.data.success) {
        setQuestions(response.data.data || []);
        setPagination(response.data.pagination || pagination);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await questionsAPI.delete(questionId);
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">My Questions</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage all your questions in one place</p>
          </div>
          <Link 
            to="/questions/create"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Ask New Question</span>
          </Link>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4 lg:space-y-6 max-w-5xl">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <div 
              key={question._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
                <div className="flex-1 min-w-0 w-full lg:max-w-3xl">
                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    {question.isAnonymous && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Anonymous</span>
                    )}
                    <span className="text-sm text-gray-500">
                      {new Date(question.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {question.courseName && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        {question.courseName}
                      </span>
                    )}
                    {question.semester && (
                      <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">
                        Semester {question.semester.number}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4 hover:text-red-600 transition-colors break-words">
                    <Link to={`/questions/${question._id}`}>
                      {question.title}
                    </Link>
                  </h3>
                  
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 lg:mb-5 line-clamp-2 break-words">
                    {question.body?.substring(0, 250)}{question.body?.length > 250 ? '...' : ''}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      <span className="font-medium">{question.answersCount || 0} {question.answersCount === 1 ? 'answer' : 'answers'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      <span>{question.views || 0} views</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row lg:flex-col gap-2 lg:gap-3 lg:ml-6 w-full lg:w-auto lg:min-w-[140px]">
                  <Link 
                    to={`/questions/${question._id}`}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 lg:px-5 py-2.5 lg:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm lg:text-base font-medium"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(question._id)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 lg:px-5 py-2.5 lg:py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm lg:text-base font-medium"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-gray-500 text-lg mb-4">You haven't asked any questions yet</p>
            <p className="text-gray-400 mb-6">Start by asking your first question!</p>
            <Link 
              to="/questions/create" 
              className="inline-flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <span>Ask Your First Question</span>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page >= pagination.pages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyQuestions;

