import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import CampusHubHeader from '../../components/campusHub/CampusHubHeader';
import { getImageUrl } from '../../utils/imageUrl';
import { uploadToCloudinary } from '../../utils/cloudinary';

const CampusHubMyServices = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', price: '', status: 'active' });
  const [createImages, setCreateImages] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['campusHubMyServices'],
    queryFn: async () => {
      const res = await campusHubAPI.getMyServices();
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (formData) => campusHubAPI.createService(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['campusHubMyServices']);
      setShowCreate(false);
      setForm({ title: '', description: '', category: '', price: '', status: 'active' });
      setCreateImages([]);
      toast.success('Service created.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create service'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => campusHubAPI.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campusHubMyServices']);
      setEditing(null);
      toast.success('Service updated.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => campusHubAPI.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['campusHubMyServices']);
      toast.success('Service deleted.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description required.');
      return;
    }
    if (createImages.length < 1 || createImages.length > 5) {
      toast.error('Please add between 1 and 5 images for the service.');
      return;
    }
    try {
      setIsUploading(true);
      const imageUrls = await Promise.all(
        Array.from(createImages).map((file) => uploadToCloudinary(file))
      );

      createMutation.mutate({
        title: form.title.trim(),
        description: form.description.trim(),
        category: (form.category || 'General').trim(),
        price: form.price || '0',
        images: imageUrls,
      });
    } catch (error) {
      toast.error(error.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editing || !form.title.trim()) return;
    updateMutation.mutate({ id: editing._id, data: form });
  };

  const startEdit = (svc) => {
    setEditing(svc);
    setForm({
      title: svc.title,
      description: svc.description,
      category: svc.category || '',
      price: String(svc.price ?? ''),
      status: svc.status || 'active',
    });
  };

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CampusHubHeader activePage="services" />
      <div className="flex flex-wrap items-center justify-end gap-2 mb-6">
        <button
          onClick={() => { setShowCreate(true); setEditing(null); setCreateImages([]); setForm({ title: '', description: '', category: '', price: '', status: 'active' }); }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
        >
          Add Service
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">New Service</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service images * (min 1, max 5)</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 5) {
                    toast.error('Maximum 5 images.');
                    setCreateImages(files.slice(0, 5));
                  } else {
                    setCreateImages(files);
                  }
                }}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              {createImages.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">{createImages.length} image(s) selected</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Tutoring"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isLoading || isUploading || createImages.length < 1}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading Images...' : createMutation.isLoading ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Service</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={updateMutation.isLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {services.map((svc) => (
          <div key={svc._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
              {(svc.images && svc.images.length > 0) ? (
                <div className="flex gap-2 overflow-x-auto sm:w-48 flex-shrink-0">
                  {svc.images.slice(0, 3).map((img, i) => (
                    <img key={i} src={getImageUrl(img)} alt="" className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                  ))}
                </div>
              ) : (
                <div className="w-full sm:w-48 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm flex-shrink-0">No image</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{svc.category || 'General'}</span>
                    <span className="ml-2 text-lg font-bold text-red-600">₦{Number(svc.price).toLocaleString('en-NG')}</span>
                    <h2 className="text-xl font-bold text-gray-900 mt-2">{svc.title}</h2>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{svc.description}</p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${svc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {svc.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(svc)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Edit
                    </button>
                    <button
                      onClick={() => window.confirm('Delete this service?') && deleteMutation.mutate(svc._id)}
                      className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && !showCreate && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No services yet. Add your first service above.</p>
        </div>
      )}
    </div>
  );
};

export default CampusHubMyServices;
