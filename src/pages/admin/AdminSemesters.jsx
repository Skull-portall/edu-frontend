import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AdminSemesters = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: '', number: '' });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', number: '' });

  // Fetch Semesters
  const { data: semestersData, isLoading: loading } = useQuery({
    queryKey: ['adminSemesters'],
    queryFn: async () => {
      const response = await adminAPI.getSemesters();
      return response.data;
    },
    onError: () => toast.error('Failed to load semesters')
  });

  const semesters = semestersData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newSemester) => adminAPI.createSemester(newSemester),
    onSuccess: () => {
      toast.success('Semester created successfully!');
      setFormData({ name: '', number: '' });
      queryClient.invalidateQueries(['adminSemesters']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create semester')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateSemester(id, data),
    onSuccess: () => {
      toast.success('Semester updated successfully!');
      setEditingId(null);
      setEditFormData({ name: '', number: '' });
      queryClient.invalidateQueries(['adminSemesters']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update semester')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteSemester(id),
    onSuccess: () => {
      toast.success('Semester deleted successfully!');
      queryClient.invalidateQueries(['adminSemesters']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete semester')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (semester) => {
    setEditingId(semester._id);
    setEditFormData({
      name: semester.name || '',
      number: semester.number || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: '', number: '' });
  };

  const handleUpdate = (semesterId) => {
    updateMutation.mutate({ id: semesterId, data: editFormData });
  };

  const handleDelete = (semesterId) => {
    if (window.confirm('Are you sure you want to delete this semester? This action cannot be undone!')) {
      deleteMutation.mutate(semesterId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Manage Semesters</h1>
            <p className="text-sm sm:text-base text-gray-600">Add, edit, or remove semesters</p>
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
        {/* Add Semester Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Semester</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Semester Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., First Semester"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">Semester Number (1-12)</label>
              <input
                type="number"
                id="number"
                name="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                required
                min="1"
                max="12"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 1, 2, 3... 12"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createMutation.isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                'Add Semester'
              )}
            </button>
          </form>
        </div>

        {/* Semesters List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Semesters</h2>
          {loading ? (
            <Loader />
          ) : semesters.length === 0 ? (
            <p className="text-gray-500">No semesters yet. Add one to get started!</p>
          ) : (
            <div className="space-y-3">
              {semesters.map((semester) => (
                <div key={semester._id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md">
                  {editingId === semester._id ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdate(semester._id); }}>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Number (1-12)</label>
                          <input
                            type="number"
                            value={editFormData.number}
                            onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                            required
                            min="1"
                            max="12"
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
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={updateMutation.isLoading}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                          >
                            {updateMutation.isLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                              </span>
                            ) : (
                              'Save'
                            )}
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
                        <div>
                          <h3 className="font-semibold text-gray-900">Semester {semester.number}</h3>
                          <p className="text-sm text-gray-600">{semester.name}</p>
                          <p className="text-xs text-gray-400 mt-2">{semester.usersCount || 0} students</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(semester)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-blue-200"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(semester._id)}
                            disabled={deleteMutation.isLoading}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 hover:text-red-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleteMutation.isLoading ? (
                              <>
                                <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Delete
                              </>
                            )}
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

export default AdminSemesters;

