import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { questionsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const QuestionsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(currentSearch);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['questions', { search: currentSearch }],
    queryFn: async () => {
      const params = {
        search: currentSearch
      };
      const response = await questionsAPI.getAll(params);
      return response.data;
    },
    keepPreviousData: true,
  });

  const questions = data?.data || [];
  const pagination = data?.pagination || {};

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    navigate(`/questions?${params.toString()}`);
  };

  if (loading && !questions.length) {
    return <Loader />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header Section */}
      <div className="mb-12 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight uppercase">
              Knowledge <span className="text-red-600">Base</span>
            </h1>
            <p className="text-gray-500 font-medium max-w-xl">
              Explore and contribute to our growing library of academic inquiries. Every question is a step towards mastery.
            </p>
          </div>

          <div className="shrink-0">
            {user ? (
              <Link
                to="/questions/create"
                className="inline-flex items-center gap-3 bg-gray-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:shadow-gray-900/30 transform hover:-translate-y-1 active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                </svg>
                Ask Question
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-3 bg-red-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/10 hover:shadow-red-600/30 transform hover:-translate-y-1 active:scale-95 transition-all"
              >
                Login to Ask
              </Link>
            )}
          </div>
        </div>

        {/* Global Search Interface */}
        <div className="bg-white p-2 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col sm:flex-row gap-2 max-w-3xl">
          <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
            <svg className="absolute left-6 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions, topics or courses..."
              className="w-full bg-transparent border-none py-6 pl-16 pr-8 text-lg font-bold text-gray-900 placeholder-gray-400 focus:ring-0"
            />
          </form>
          <button
            onClick={handleSearch}
            className="px-10 py-6 bg-red-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95"
          >
            Search Questions
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6 min-h-[500px] animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <article
              key={question._id}
              onClick={() => navigate(`/questions/${question._id}`)}
              className="group bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 lg:p-10 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500 transform hover:-translate-y-1 cursor-pointer overflow-hidden relative"
            >
              {/* Status Indicator */}
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl ${question.answersCount > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                  {question.answersCount > 0 ? 'Answered' : 'Unsolved'}
                </span>
              </div>

              <div className="flex flex-col gap-6 sm:gap-8 pr-20 sm:pr-24">
                <div className="flex-1">
                  {/* Meta */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg ring-4 ring-gray-50 flex-shrink-0">
                      {question.user?.profile_picture || question.user?.profilePicture ? (
                        <img src={question.user.profile_picture || question.user.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white text-sm sm:text-lg font-black uppercase">
                          {question.user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profile/${question.user?._id || question.user?.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block text-sm font-black text-gray-900 hover:text-red-600 transition-colors uppercase tracking-tight truncate"
                      >
                        {question.isAnonymous && !user?.isAdmin ? 'ANONYMOUS' : (question.user?.name || 'STUDENT')}
                      </Link>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(question.created_at || question.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-4 group-hover:text-red-600 transition-colors uppercase tracking-tight leading-tight line-clamp-2">
                    {question.title}
                  </h2>
                  <p className="text-gray-500 font-medium line-clamp-2 leading-relaxed mb-6 sm:mb-8 italic text-sm sm:text-base">
                    "{question.body}"
                  </p>

                  {/* Footer Stats */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{question.answersCount || 0} Answers</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{question.views || 0} Views</span>
                    </div>

                    {(question.course_name || question.courseName) && (
                      <span className="ml-auto bg-red-50 text-red-600 px-3 sm:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic border border-red-100">
                        {question.course_name || question.courseName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">Silence is not always golden</h3>
            <p className="text-gray-500 font-medium mb-10 max-w-sm mx-auto text-sm sm:text-base">No questions match your criteria. Why not start a new discussion?</p>
            {user && (
              <Link to="/questions/create" className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:shadow-gray-900/30 transition-all text-sm sm:text-base">
                Ask Something
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionsList;
