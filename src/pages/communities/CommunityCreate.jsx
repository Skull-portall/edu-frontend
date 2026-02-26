import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { communitiesAPI } from '../../services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const CommunityCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purpose: '',
    category: 'General',
    displayIcon: 'Users'
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['communityCategories'],
    queryFn: async () => {
      const res = await communitiesAPI.getCategories();
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000
  });

  const icons = [
    { name: 'Users', label: 'Community' },
    { name: 'Book', label: 'Study Group' },
    { name: 'Code', label: 'Tech / Dev' },
    { name: 'Chat', label: 'Social' }
  ];

  const createMutation = useMutation({
    mutationFn: (data) => communitiesAPI.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['communities']);
      toast.success('Your community has been created!', {
        position: 'top-right'
      });
      navigate(`/communities/${res.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create community.');
    }
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Navigation */}
      <div className="mb-8">
        <Link to="/communities" className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Communities
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Community</h1>
        <p className="text-gray-600 mt-1">Start a new space to collaborate and share knowledge.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Community Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Computer Science Study Group"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Display Icon</label>
                  <select
                    name="displayIcon"
                    value={formData.displayIcon}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white cursor-pointer"
                  >
                    {icons.map(icon => (
                      <option key={icon.name} value={icon.name}>{icon.label}</option>
                    ))}
                  </select>
               </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Briefly describe the community's focus..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose & Goals</label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                rows="3"
                placeholder="What are the goals for members?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Community Guidelines</h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm">
                <span className="text-red-600 font-bold">1.</span>
                <span className="text-gray-600">Ensure the community stays respectful and focused.</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="text-red-600 font-bold">2.</span>
                <span className="text-gray-600">Clearly define the goals to attract relevant peers.</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="text-red-600 font-bold">3.</span>
                <span className="text-gray-600">Administrators are responsible for content moderation.</span>
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3.5 rounded-lg font-bold hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? (
              <span className="animate-pulse">Creating...</span>
            ) : (
              <>
                Create Community
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommunityCreate;



