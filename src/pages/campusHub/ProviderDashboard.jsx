import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import CampusHubHeader from '../../components/campusHub/CampusHubHeader';
import { getImageUrl } from '../../utils/imageUrl';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  quoted: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

const ProviderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['campusHubOrders'],
    queryFn: async () => {
      const res = await campusHubAPI.getMyOrders();
      return res.data.data || [];
    },
    enabled: !!user && user.role === 'provider',
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['campusHubMyServices'],
    queryFn: async () => {
      const res = await campusHubAPI.getMyServices();
      return res.data.data || [];
    },
    enabled: !!user && user.role === 'provider',
  });

  const activeStatuses = ['pending', 'quoted', 'accepted', 'in_progress'];
  const openOrders = orders.filter(o => activeStatuses.includes(o.status));
  const recentOrders = orders.slice(0, 5);

  if (user?.role !== 'provider') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Access restricted to service providers.</p>
        <Link to="/campus-hub" className="text-red-600 font-medium mt-4 inline-block">Back to Campus Hub</Link>
      </div>
    );
  }

  if (ordersLoading && servicesLoading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CampusHubHeader activePage="dashboard" />
      <div className="mb-6">
        <button
          onClick={() => navigate('/campus-hub')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back
        </button>
      </div>
      <p className="text-gray-600 mb-8">Manage your orders, services, and chats</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to="/campus-hub/my-services"
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-red-200 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              <p className="text-sm text-gray-500">My Services</p>
            </div>
          </div>
        </Link>
        <Link
          to="/campus-hub/orders"
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-red-200 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>
          </div>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{openOrders.length}</p>
              <p className="text-sm text-gray-500">Active Orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Order Requests</h2>
            <Link to="/campus-hub/orders" className="text-sm text-red-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No orders yet</p>
            ) : (
              recentOrders.map((order) => {
                const student = order.student;
                return (
                  <Link
                    key={order._id}
                    to={`/campus-hub/orders/${order._id}/chat`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    {student?.profilePicture ? (
                      <img src={getImageUrl(student.profilePicture)} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">{student?.name?.charAt(0) || '?'}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{order.service?.title}</p>
                      <p className="text-sm text-gray-500 truncate">{student?.name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusColors[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">My Services</h2>
            <Link to="/campus-hub/my-services" className="text-sm text-red-600 font-medium hover:underline">Manage</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {services.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No services yet. Create your first service!</p>
            ) : (
              services.slice(0, 4).map((svc) => (
                <div key={svc._id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{svc.title}</p>
                    <p className="text-sm text-gray-500">₦{Number(svc.price).toLocaleString('en-NG')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${svc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {svc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
