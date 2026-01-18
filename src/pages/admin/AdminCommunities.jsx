import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AdminCommunities = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch Communities
  const { data: communitiesData, isLoading: loading } = useQuery({
    queryKey: ['adminCommunities', page],
    queryFn: async () => {
      const response = await adminAPI.getCommunities({ page, limit });
      return response.data;
    },
    keepPreviousData: true,
    onError: () => toast.error('Failed to load communities')
  });

  const communities = communitiesData?.data || [];
  const inactiveCommunitiesCount = communitiesData?.inactiveCommunitiesCount || 0;
  const pagination = communitiesData?.pagination || { page: 1, total: 0, pages: 0 };

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: (id) => adminAPI.toggleCommunity(id),
    onSuccess: () => {
      toast.success('Community status updated successfully!');
      queryClient.invalidateQueries(['adminCommunities']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update community')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteCommunity(id),
    onSuccess: () => {
      toast.success('Community deleted successfully!');
      queryClient.invalidateQueries(['adminCommunities']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete community')
  });

  const handleToggle = (communityId) => {
    toggleMutation.mutate(communityId);
  };

  const handleDelete = (communityId) => {
    if (window.confirm('Are you sure you want to delete this community? This action cannot be undone!')) {
      deleteMutation.mutate(communityId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Manage Communities</h1>
              {inactiveCommunitiesCount > 0 && (
                <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-bold leading-none text-white bg-red-600 rounded-full animate-pulse shadow-lg border-2 border-red-700">
                  {inactiveCommunitiesCount > 99 ? '99+' : inactiveCommunitiesCount}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Activate, deactivate, or delete communities
              {inactiveCommunitiesCount > 0 && (
                <span className="text-red-600 font-semibold"> • {inactiveCommunitiesCount} inactive</span>
              )}
            </p>
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

      {/* Communities Table */}
      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Community</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Owner</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Posts</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {communities.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No communities found</p>
                        <p className="text-gray-400 text-sm mt-1">Communities will appear here once created</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  communities.map((community) => (
                    <tr key={community._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{community.name}</div>
                        {community.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{community.description}</div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{community.user?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{community.user?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {community.posts?.length || 0}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {community.isActive ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(community.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleToggle(community._id)}
                            disabled={toggleMutation.isLoading}
                            className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${community.isActive
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {toggleMutation.isLoading ? 'Loading...' : (community.isActive ? 'Deactivate' : 'Activate')}
                          </button>
                          <button
                            onClick={() => handleDelete(community._id)}
                            disabled={deleteMutation.isLoading}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleteMutation.isLoading ? 'Loading...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 lg:mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
            disabled={page === pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminCommunities;

