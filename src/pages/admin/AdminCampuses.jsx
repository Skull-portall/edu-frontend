import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AdminCampuses = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', code: '', description: '' });

  // Fetch Campuses
  const { data: campusesData, isLoading: loading } = useQuery({
    queryKey: ['adminCampuses'],
    queryFn: async () => {
      const response = await adminAPI.getCampuses();
      return response.data;
    },
    onError: () => toast.error('Failed to load campuses')
  });

  const campuses = campusesData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newCampus) => adminAPI.createCampus(newCampus),
    onSuccess: () => {
      toast.success('Campus created successfully!');
      setFormData({ name: '', code: '', description: '' });
      queryClient.invalidateQueries(['adminCampuses']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create campus')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateCampus(id, data),
    onSuccess: () => {
      toast.success('Campus updated successfully!');
      setEditingId(null);
      setEditFormData({ name: '', code: '', description: '' });
      queryClient.invalidateQueries(['adminCampuses']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update campus')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteCampus(id),
    onSuccess: () => {
      toast.success('Campus deleted successfully!');
      queryClient.invalidateQueries(['adminCampuses']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete campus')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (campus) => {
    setEditingId(campus._id);
    setEditFormData({
      name: campus.name || '',
      code: campus.code || '',
      description: campus.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: '', code: '', description: '' });
  };

  const handleUpdate = (campusId) => {
    updateMutation.mutate({ id: campusId, data: editFormData });
  };

  const handleDelete = (campusId) => {
    if (window.confirm('Are you sure you want to delete this campus? This action cannot be undone!')) {
      deleteMutation.mutate(campusId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Manage Campuses</h1>
            <p className="text-sm sm:text-base text-gray-600">Add, edit, or remove campuses</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Campus Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Campus</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">Campus Code</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., MAIN, NORTH, SOUTH"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Campus Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Main Campus"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isLoading ? 'Adding...' : 'Add Campus'}
            </button>
          </form>
        </div>

        {/* Campuses List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Campuses</h2>
          {loading ? (
            <Loader />
          ) : campuses.length === 0 ? (
            <p className="text-gray-500">No campuses yet. Add one to get started!</p>
          ) : (
            <div className="space-y-3">
              {campuses.map((campus) => (
                <div key={campus._id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md">
                  {editingId === campus._id ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdate(campus._id); }}>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                          <input
                            type="text"
                            value={editFormData.code}
                            onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={updateMutation.isLoading}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                          >
                            {updateMutation.isLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{campus.code}</h3>
                          <p className="text-sm text-gray-600">{campus.name}</p>
                          {campus.description && (
                            <p className="text-xs text-gray-500 mt-1">{campus.description.substring(0, 100)}{campus.description.length > 100 ? '...' : ''}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">{campus.usersCount || 0} students</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(campus)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-blue-200"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(campus._id)}
                            disabled={deleteMutation.isLoading}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 hover:text-red-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCampuses;

