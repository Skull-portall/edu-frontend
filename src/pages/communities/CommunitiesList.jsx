import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { communitiesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CommunitiesList = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await communitiesAPI.getAll();
      setCommunities(response.data.data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
              Communities
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Join study groups and communities
            </p>
          </div>
        </div>

        {user && (
          <Link
            to="/communities/create"
            className="btn-create btn-create-animate inline-flex items-center gap-2"
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="btn-text">Create Community</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-lg">No communities found</p>
          </div>
        ) : (
          communities.map((community) => (
            <Link
              key={community._id}
              to={`/communities/${community._id}`}
              className="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 card-hover"
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-900">{community.name}</h2>
              <p className="text-gray-600 mb-4 line-clamp-3">{community.description || 'No description'}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center text-white text-xs font-semibold">
                  {community.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span>Created by {community.user?.name}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunitiesList;
