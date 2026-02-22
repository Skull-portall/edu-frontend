import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import CampusHubHeader from '../../components/campusHub/CampusHubHeader';
import { getImageUrl } from '../../utils/imageUrl';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const CampusHubOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['campusHubOrders'],
    queryFn: async () => {
      const res = await campusHubAPI.getMyOrders();
      return res.data.data || [];
    },
    enabled: !!user,
  });

  if (isLoading) return <Loader />;

  const isProvider = user?.role === 'provider';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CampusHubHeader activePage="orders" />
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
      <p className="text-gray-600 mb-6">
        {isProvider ? 'Orders from students requesting your services.' : 'Your requested services. Click to open chat.'}
      </p>

      <div className="space-y-4">
        {orders.map((order) => {
          const counterparty = isProvider ? order.student : order.provider;
          const serviceTitle = order.service?.title || 'Service';
          const status = order.status || 'open';
          return (
            <div
              key={order._id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/campus-hub/orders/${order._id}/chat`)}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {counterparty?.profilePicture ? (
                    <img src={getImageUrl(counterparty.profilePicture)} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">{counterparty?.name?.charAt(0) || '?'}</div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{serviceTitle}</h2>
                    <p className="text-sm text-gray-500">
                      {isProvider ? 'Student' : 'Provider'}: {counterparty?.name || '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors.open}`}>
                    {status.replace('_', ' ')}
                  </span>
                  <Link
                    to={`/campus-hub/orders/${order._id}/chat`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    Open Chat
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
          <p className="text-gray-500 text-lg">No orders yet</p>
          <Link to="/campus-hub" className="inline-block mt-4 text-red-600 font-medium hover:underline">
            Browse services →
          </Link>
        </div>
      )}
    </div>
  );
};

export default CampusHubOrders;
