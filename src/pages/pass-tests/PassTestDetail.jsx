import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { passTestsAPI } from '../../services/api';

const PassTestDetail = () => {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      const response = await passTestsAPI.getById(id);
      setTest(response.data.data);
    } catch (error) {
      console.error('Error fetching test:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl font-semibold mb-4">Test not found</div>
        <Link to="/pass-tests" className="text-red-600 hover:text-red-700 underline">
          Back to Tests
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${test.type === 'test' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
            {test.type}
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-gray-900">{test.title}</h1>
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center text-white font-semibold">
              {test.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <Link
              to={`/profile/${test.user?._id || test.user?.id}`}
              className="font-semibold text-gray-700 hover:text-red-600"
            >
              {test.user?.name}
            </Link>
          </div>
          <span>•</span>
          <span>{new Date(test.createdAt).toLocaleDateString()}</span>
          {test.courseName && (
            <>
              <span>•</span>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                {test.courseName}
              </span>
            </>
          )}
        </div>
        <div className="prose max-w-none mb-4">
          <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{test.content}</p>
        </div>
        {test.attachment && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <a
              href={`http://localhost:5000/${test.attachment}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {test.attachmentName || 'Download Attachment'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassTestDetail;
