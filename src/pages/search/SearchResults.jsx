import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI } from '../../services/api';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      setLoading(false);
    }
  }, [query]);

  const performSearch = async () => {
    try {
      const response = await searchAPI.search(query);
      setResults(response.data.data || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'Q': 'bg-blue-100 text-blue-700',
      'A': 'bg-green-100 text-green-700',
      'note': 'bg-yellow-100 text-yellow-700',
      'test': 'bg-purple-100 text-purple-700',
      'assignment': 'bg-orange-100 text-orange-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getRoute = (result) => {
    if (result.type === 'Q') return `/questions/${result.id}`;
    if (result.type === 'A') return `/questions/${result.questionId}`;
    if (result.type === 'note') return `/notes/${result.id}`;
    return `/pass-tests/${result.id}`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
          Search Results
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {query ? `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"` : 'Enter a search query'}
        </p>
      </div>

      {results.length === 0 && query ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No results found for "{query}"</p>
          <p className="text-gray-400 text-sm">Try different keywords or search terms</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              to={getRoute(result)}
              className="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 card-hover"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(result.type)}`}>
                  {result.typeLabel}
                </span>
                <span className="text-sm text-gray-500">
                  {result.author || 'Unknown'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {new Date(result.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">{result.title}</h2>
              <p className="text-gray-600 mb-3 line-clamp-2">{result.content}</p>
              {result.course && (
                <span className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                  {result.course}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
