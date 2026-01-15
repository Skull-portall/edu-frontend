import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { questionsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const QuestionsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchQuestions();
  }, [searchParams]);

  const fetchQuestions = async () => {
    try {
      const params = {
        search: searchParams.get('search') || ''
      };
      const response = await questionsAPI.getAll(params);
      setQuestions(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    navigate(`/questions?${params.toString()}`);
    fetchQuestions();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
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
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">All Questions</h1>
            <p className="text-sm sm:text-base text-gray-600">Browse and explore questions from the community</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions by title, content, or course..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-base"
              />
            </div>
            <button type="submit" className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold whitespace-nowrap">
              Search
            </button>
            {searchParams.get('search') && (
              <Link to="/questions" className="bg-gray-100 text-gray-700 px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold whitespace-nowrap text-center">
                Clear
              </Link>
            )}
          </form>
        </div>
      </div>

      {/* Ask Question Button */}
      <div className="mb-6">
        {user ? (
          <Link
            to="/questions/create"
            className="btn-create btn-create-animate"
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
            </svg>
            <span className="btn-text">Ask Question</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="btn-create btn-create-animate"
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
            </svg>
            <span className="btn-text">Login to Ask</span>
          </Link>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4 lg:space-y-6 min-h-[400px] max-w-5xl mx-auto">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <article
              key={question._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 p-5 sm:p-6 lg:p-8 card-hover cursor-pointer animate-fade-in"
              onClick={() => navigate(`/questions/${question._id}`)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                <div className="flex-1 min-w-0">
                  {/* Question Meta */}
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                    {question.is_anonymous && !user?.isAdmin ? (
                      <span className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        <span>Anonymous</span>
                      </span>
                    ) : (
                      <div className="flex items-center space-x-2 sm:space-x-2.5">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-100">
                          {question.user?.profile_picture ? (
                            <img
                              src={question.user.profile_picture}
                              alt={question.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center">
                              <span className="text-white text-sm sm:text-base font-semibold">{question.user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/profile/${question.user?._id || question.user?.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm sm:text-base text-gray-600 font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-none hover:text-red-600 hover:underline transition-colors"
                          >
                            {question.user?.name || 'Unknown'}
                          </Link>
                          {question.is_anonymous && user?.isAdmin && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">(Anonymous)</span>
                          )}
                        </div>
                      </div>
                    )}
                    <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">•</span>
                    <span className="text-xs sm:text-sm text-gray-500">{new Date(question.created_at || question.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Question Title */}
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 hover:text-red-600 transition-colors break-words line-clamp-2 leading-tight">
                    {question.title}
                  </h2>

                  {/* Question Body Preview */}
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 mb-3 sm:mb-4 lg:mb-5 line-clamp-2 break-words leading-relaxed">
                    {question.body?.substring(0, 200)}
                    {question.body?.length > 200 && '...'}
                  </p>

                  {/* Attachment Preview */}
                  {question.attachment && (
                    <div className="mb-3" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/questions/${question._id}`);
                    }}>
                      {question.attachment_type === 'image' ? (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity">
                          <img
                            src={question.attachment}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors max-w-full">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-xs sm:text-sm text-gray-700 font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">{question.attachment_name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question Footer */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-5 text-xs sm:text-sm">
                    <span className="flex items-center space-x-1.5 sm:space-x-2 text-gray-600">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      <span className="font-medium whitespace-nowrap">{question.answers_count || 0} answers</span>
                    </span>
                    <span className="flex items-center space-x-1.5 sm:space-x-2 text-gray-600">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      <span className="whitespace-nowrap">{question.views || 0} views</span>
                    </span>
                    {question.course_name && (
                      <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold truncate max-w-[150px] sm:max-w-none">
                        {question.course_name}
                      </span>
                    )}
                    {question.semester_number && (
                      <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-semibold">
                        Semester {question.semester_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 lg:p-16 text-center animate-fade-in">
            <div className="max-w-md mx-auto">
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No questions found</h3>
              <p className="text-gray-500 text-base mb-6">
                {user ? (
                  'There are no questions available yet. Be the first to ask a question!'
                ) : (
                  <>There are no questions available yet. <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold underline">Login</Link> to ask the first question!</>
                )}
              </p>
              {user && (
                <Link
                  to="/questions/create"
                  className="btn-create btn-create-animate"
                >
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                  </svg>
                  <span className="btn-text">Ask the First Question</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.per_page && (
        <div className="mt-8 lg:mt-12">
          {/* Pagination component would go here */}
        </div>
      )}
    </div>
  );
};

export default QuestionsList;
