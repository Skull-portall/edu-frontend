import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const AdminCampusHubServices = () => {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['adminCampusHubServices'],
    queryFn: async () => {
      const res = await campusHubAPI.adminGetServices();
      return res.data.data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => campusHubAPI.adminUpdateService(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCampusHubServices']);
      toast.success('Service status updated.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => campusHubAPI.adminDeleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCampusHubServices']);
      toast.success('Service deleted.');
      setDeletingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete');
      setDeletingId(null);
    },
  });

  const handleDelete = (id, title) => {
    if (!window.confirm(`Delete service "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link to="/admin" className="text-gray-600 hover:text-gray-900 text-sm font-medium mb-4 inline-block">← Admin</Link>
        <h1 className="text-2xl font-bold text-gray-900">Campus Hub Services</h1>
        <p className="text-gray-600">Manage, suspend, or delete services posted by providers.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {services.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-medium">{s.title}</td>
                <td className="px-4 py-3 text-gray-600">{s.category}</td>
                <td className="px-4 py-3 text-gray-600">₦{Number(s.price).toLocaleString('en-NG')}</td>
                <td className="px-4 py-3 text-gray-600">{s.provider?.name} ({s.provider?.email})</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${s.status === 'active' ? 'bg-green-100 text-green-800' : s.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {s.status === 'active' ? (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: s._id, status: 'suspended' })}
                        disabled={updateStatusMutation.isPending}
                        className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded hover:bg-amber-200 disabled:opacity-70"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: s._id, status: 'active' })}
                        disabled={updateStatusMutation.isPending}
                        className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-70"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(s._id, s.title)}
                      disabled={deletingId === s._id}
                      className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-70"
                    >
                      {deletingId === s._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {services.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No services yet.</div>
      )}
    </div>
  );
};

export default AdminCampusHubServices;
