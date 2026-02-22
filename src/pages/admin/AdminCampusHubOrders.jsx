import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campusHubAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const AdminCampusHubOrders = () => {
  const navigate = useNavigate();
  const [detailOrder, setDetailOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['adminCampusHubOrders'],
    queryFn: async () => {
      const res = await campusHubAPI.adminGetOrders();
      return res.data.data || [];
    },
  });

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link to="/admin" className="text-gray-600 hover:text-gray-900 text-sm font-medium mb-4 inline-block">← Admin</Link>
        <h1 className="text-2xl font-bold text-gray-900">Campus Hub Orders</h1>
        <p className="text-gray-600">View order details and manage chats.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((o) => (
              <tr key={o._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-medium">{o.service?.title}</td>
                <td className="px-4 py-3 text-gray-600">{o.student?.name} ({o.student?.email})</td>
                <td className="px-4 py-3 text-gray-600">{o.provider?.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${statusColors[o.status] || statusColors.open}`}>
                    {o.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(o.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setDetailOrder(o)}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      View details
                    </button>
                    <button
                      onClick={() => navigate(`/campus-hub/orders/${o._id}/chat`)}
                      className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 inline-flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      Chat
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No orders yet.</div>
      )}

      {detailOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <button onClick={() => setDetailOrder(null)} className="text-gray-500 hover:text-gray-700 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Service</h3>
                <p className="font-semibold text-gray-900">{detailOrder.service?.title}</p>
                <p className="text-sm text-gray-600">{detailOrder.service?.description}</p>
                <p className="text-red-600 font-bold mt-1">₦{Number(detailOrder.service?.price || 0).toLocaleString('en-NG')}</p>
              </div>
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[detailOrder.status] || statusColors.open}`}>
                  {detailOrder.status?.replace('_', ' ')}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Provider</h3>
                <p className="font-medium text-gray-900">{detailOrder.provider?.name}</p>
                <p className="text-sm text-gray-500">{detailOrder.provider?.email}</p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Student</h3>
                <p className="font-medium text-gray-900">{detailOrder.student?.name}</p>
                <p className="text-sm text-gray-500">{detailOrder.student?.email}</p>
              </div>
              <p className="text-xs text-gray-400">Created: {new Date(detailOrder.createdAt).toLocaleString()}</p>
              <button
                onClick={() => { setDetailOrder(null); navigate(`/campus-hub/orders/${detailOrder._id}/chat`); }}
                className="w-full mt-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
              >
                Open Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampusHubOrders;
