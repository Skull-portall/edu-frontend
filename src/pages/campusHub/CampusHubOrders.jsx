import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import CampusHubHeader from '../../components/campusHub/CampusHubHeader';
import { getImageUrl } from '../../utils/imageUrl';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const CampusHubOrders = () => {
 const { user } = useAuth();
 const navigate = useNavigate();

 const isProvider = user?.role === 'provider';
 const [activeTab, setActiveTab] = React.useState(isProvider ? 'received' : 'placed');

 const { data: orders = [], isLoading } = useQuery({
 queryKey: ['campusHubOrders'],
 queryFn: async () => {
 const res = await campusHubAPI.getMyOrders();
 return res.data.data || [];
 },
 enabled: !!user,
 });

 if (isLoading) return <Loader />;
 
 const ordersReceived = orders.filter(o => o.provider?._id === user?._id || o.provider?.id === user?.id);
 const ordersPlaced = orders.filter(o => o.student?._id === user?._id || o.student?.id === user?.id);

 const displayOrders = isProvider
 ? (activeTab === 'received' ? ordersReceived : ordersPlaced)
 : ordersPlaced;

 return (
 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
 <CampusHubHeader activePage="orders" />
 
 {isProvider ? (
 <div className="mb-8 bg-gray-100/60 p-1.5 rounded-2xl inline-flex w-full sm:w-auto overflow-x-auto shadow-inner border border-gray-200/50">
 <button
 onClick={() => setActiveTab('received')}
 className={`flex-1 sm:flex-none whitespace-nowrap px-8 py-3.5 text-sm font-black tracking-wide rounded-xl transition-all duration-300 ${activeTab === 'received'
 ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
 }`}
 >
 Orders Received <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${activeTab === 'received' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>{ordersReceived.length}</span>
 </button>
 <button
 onClick={() => setActiveTab('placed')}
 className={`flex-1 sm:flex-none whitespace-nowrap px-8 py-3.5 text-sm font-black tracking-wide rounded-xl transition-all duration-300 ${activeTab === 'placed'
 ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
 }`}
 >
 My Purchases <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${activeTab === 'placed' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>{ordersPlaced.length}</span>
 </button>
 </div>
 ) : (
 <div className="mb-8">
 <span className="inline-block px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-bold tracking-wide">📦 Track your purchases instantly</span>
 </div>
 )}

      <div className="space-y-4">
        {displayOrders.map((order) => {
          const isMyService = order.provider?._id === user?._id || order.provider?.id === user?.id;
          const counterparty = isMyService ? order.student : order.provider;
          const serviceTitle = order.service?.title || 'Service';
          const status = order.status || 'pending';
          return (
            <div
              key={order._id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/campus-hub/orders/${order._id}/chat`)}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    onClick={(e) => { e.stopPropagation(); navigate(`/profile/${counterparty?._id || counterparty?.id}`); }}
                    className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    title={`View ${counterparty?.name}'s profile`}
                  >
                    {counterparty?.profilePicture ? (
                      <img src={getImageUrl(counterparty.profilePicture)} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">{counterparty?.name?.charAt(0) || '?'}</div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{serviceTitle}</h2>
                    <p className="text-sm text-gray-500">
                      {isMyService ? 'Client' : 'Provider'}:{' '}
                      <span
                        onClick={(e) => { e.stopPropagation(); navigate(`/profile/${counterparty?._id || counterparty?.id}`); }}
                        className="font-medium hover:text-red-600 hover:underline cursor-pointer"
                        title={`View ${counterparty?.name}'s profile`}
                      >
                        {counterparty?.name || '—'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    {status === 'in_progress' ? 'ACTIVE' : status.toUpperCase()}
                  </span>
                  {order.unreadCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                      {order.unreadCount > 99 ? '99+' : order.unreadCount} Unread
                    </span>
                  )}
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

 {displayOrders.length === 0 && (
 <div className="text-center py-24 bg-gray-50/50 rounded-3xl border border-dashed border-gray-300 mt-4">
 <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 border border-gray-200">
 <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
 </svg>
 </div>
 <h3 className="text-gray-900 font-extrabold text-2xl mb-3 tracking-tight">No orders found</h3>
 <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto text-lg leading-relaxed">You don't have any {activeTab} orders at the moment. Browse the hub to find what you need.</p>
 <Link to="/campus-hub" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:-translate-y-0.5">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
 </svg>
 Browse Services
 </Link>
 </div>
 )}
 </div>
 );
};

export default CampusHubOrders;
