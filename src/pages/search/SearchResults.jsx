import Loader from '../../components/common/Loader';
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';

const SearchResults = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: results = [], isLoading: loading } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query) return [];
      const response = await searchAPI.search(query);
      return response.data.data || [];
    },
    enabled: !!query,
  });

  const getTypeColor = (type) => {
    const colors = {
      'Q': 'bg-blue-50 text-blue-700 border-blue-100',
      'A': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'note': 'bg-amber-50 text-amber-700 border-amber-100',
      'test': 'bg-red-50 text-red-700 border-red-100',
      'assignment': 'bg-rose-50 text-rose-700 border-rose-100'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-100';
  };

  const getRoute = (result) => {
    if (result.type === 'Q') return `/questions/${result.id}`;
    if (result.type === 'A') return `/questions/${result.questionId || result.id}`;
    if (result.type === 'note') return `/notes/${result.id}`;
    return `/pass-tests/${result.id}`;
  };

  if (loading && query) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      {/* Search Context Header */}
      <div className="mb-16 animate-fade-in">
        <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight uppercase">
          Search <span className="text-red-600">Results</span>
        </h1>

        {query ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-gray-900 text-white px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">
              {results.length} Results
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">
              "{query}"
            </p>
          </div>
        ) : (
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs italic">Enter search keywords...</p>
        )}
      </div>

      {!query ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 animate-slide-up">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">Start Searching</h2>
          <p className="text-gray-500 font-medium max-w-sm mx-auto">Search for questions, notes, and community posts across the platform.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 animate-slide-up">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 text-red-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">No Results Found</h2>
          <p className="text-gray-500 font-medium max-w-sm mx-auto">We couldn't find anything matching your search. Try different keywords.</p>
        </div>
      ) : (
        <div className="space-y-8 animate-slide-up">
          {results.map((result, index) => (
            <article
              key={`${result.type}-${result.id}`}
              onClick={() => (window.location.href = getRoute(result))}
              className="group bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getTypeColor(result.type)} italic`}>
                  {result.typeLabel || result.type}
                </span>
                <span className="text-gray-300 font-mono">•</span>
                <div className="flex items-center gap-2">
                  {!(result.isAnonymous || result.is_anonymous) ? (
                    <>
                      <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-black border border-gray-100 uppercase">
                        {result.author?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{result.author || 'STUDENT'}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ANONYMOUS</span>
                    </>
                  )}
                </div>
                <span className="text-gray-300 font-mono">•</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest font-mono">
                  {new Date(result.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase tracking-tight leading-tight mb-4 line-clamp-2">
                {result.title}
              </h2>

              <p className="text-gray-500 font-medium line-clamp-3 leading-relaxed mb-8 italic">
                "{result.content?.replace(/<[^>]*>/g, '').substring(0, 300)}..."
              </p>

              {result.course && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <span className="bg-gray-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic group-hover:bg-red-600 transition-colors">
                    {result.course}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
