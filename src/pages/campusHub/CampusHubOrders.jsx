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

 const isProvider = user?.role === 'provider' || user?.isProvider;
 const [activeTab, setActiveTab] = React.useState(isProvider ? 'received' : 'placed');
 const [searchQuery, setSearchQuery] = React.useState('');

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

 const filteredOrders = displayOrders.filter(order => {
   const q = searchQuery.toLowerCase();
   if (!q) return true;
   const title = order.service?.title?.toLowerCase() || '';
   const studentName = order.student?.name?.toLowerCase() || '';
   const providerName = order.provider?.name?.toLowerCase() || '';
   return title.includes(q) || studentName.includes(q) || providerName.includes(q);
 });

 return (
 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
 <CampusHubHeader activePage="orders" />
 
 <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
   {isProvider ? (
   <div className="bg-gray-100/80 p-1.5 rounded-[1.25rem] inline-flex w-full sm:w-auto overflow-x-auto shadow-inner border border-gray-200/60 relative z-10">
   <button
   onClick={() => setActiveTab('received')}
   className={`flex-1 sm:flex-none whitespace-nowrap px-8 py-3 text-sm font-extrabold tracking-wide rounded-xl transition-all duration-300 ${activeTab === 'received'
   ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
   : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
   }`}
   >
   Orders Received <span className={`ml-2 px-2.5 py-0.5 rounded-md text-xs font-black shadow-sm ${activeTab === 'received' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{ordersReceived.length}</span>
   </button>
   <button
   onClick={() => setActiveTab('placed')}
   className={`flex-1 sm:flex-none whitespace-nowrap px-8 py-3 text-sm font-extrabold tracking-wide rounded-xl transition-all duration-300 ${activeTab === 'placed'
   ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
   : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
   }`}
   >
   My Purchases <span className={`ml-2 px-2.5 py-0.5 rounded-md text-xs font-black shadow-sm ${activeTab === 'placed' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{ordersPlaced.length}</span>
   </button>
   </div>
   ) : (
   <div>
   <span className="inline-block px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-extrabold tracking-wide shadow-sm">📦 Track your purchases instantly</span>
   </div>
   )}

   {/* Search Box */}
   <div className="relative w-full lg:w-96 relative z-10">
     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
     </div>
     <input
       type="text"
       placeholder="Search by keyword, client, or provider..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-[1.25rem] text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100/50 transition-all shadow-sm"
     />
   </div>
 </div>

      <div className="space-y-5 relative z-10">
        {filteredOrders.map((order) => {
          const isMyService = order.provider?._id === user?._id || order.provider?.id === user?.id;
          const counterparty = isMyService ? order.student : order.provider;
          const serviceTitle = order.service?.title || 'Service';
          const status = order.status || 'pending';
          return (
            <div
              key={order._id}
              className="group bg-white rounded-[1.5rem] p-5 sm:p-6 border-2 border-transparent hover:border-red-50 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_-12px_rgba(220,38,38,0.2)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden"
              onClick={() => navigate(`/campus-hub/orders/${order._id}/chat`)}
            >
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-red-500 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-red-50 to-rose-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:from-red-100 transition-colors opacity-70"></div>

              <div className="flex items-center justify-start gap-4 sm:gap-5 relative z-10 w-full sm:w-auto pl-2">
                <div
                  onClick={(e) => { e.stopPropagation(); navigate(`/profile/${counterparty?._id || counterparty?.id}`); }}
                  className="cursor-pointer relative flex-shrink-0"
                  title={`View ${counterparty?.name}'s profile`}
                >
                  <div className="absolute inset-0 bg-red-100 rounded-full blur group-hover:blur-md transition-all opacity-0 group-hover:opacity-60 scale-110"></div>
                  {counterparty?.profilePicture ? (
                    <img src={getImageUrl(counterparty.profilePicture)} alt="" className="w-[3.25rem] h-[3.25rem] rounded-full object-cover relative z-10 border-[3px] border-white shadow-sm transition-colors" />
                  ) : (
                    <div className="w-[3.25rem] h-[3.25rem] rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-black text-xl relative z-10 border-[3px] border-white shadow-sm transition-colors">{counterparty?.name?.charAt(0) || '?'}</div>
                  )}
                  {order.unreadCount > 0 && (
                     <div className="absolute -top-1 -right-1 z-20 w-[18px] h-[18px] bg-red-600 border-[3px] border-white rounded-full animate-pulse shadow-sm"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-[1.1rem] font-black text-gray-900 mb-0.5 leading-tight group-hover:text-red-600 transition-colors truncate pr-4">{serviceTitle}</h2>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500 font-bold mb-1.5">
                    <span className="text-gray-400 font-semibold">{isMyService ? 'Client' : 'Provider'}:</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); navigate(`/profile/${counterparty?._id || counterparty?.id}`); }}
                      className="text-gray-800 hover:text-red-600 transition-colors cursor-pointer decoration-gray-300 hover:decoration-red-300 underline underline-offset-4"
                    >
                      {counterparty?.name || '—'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto mt-3 sm:mt-0 pt-4 sm:pt-0 border-t border-gray-50 sm:border-none relative z-10 pr-2">
                <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                   <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border ${statusColors[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                     {status === 'in_progress' ? 'ACTIVE' : status.replace('_', ' ')}
                   </span>
                   {order.unreadCount > 0 && (
                     <span className="text-red-600 text-[11px] font-bold animate-pulse tracking-wide">
                       {order.unreadCount > 99 ? '99+' : order.unreadCount} Unread
                     </span>
                   )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/campus-hub/orders/${order._id}/chat`); }}
                  className="shrink-0 flex items-center gap-2 px-6 py-3 bg-gray-900 group-hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-md group-hover:shadow-red-600/30 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>

 {filteredOrders.length === 0 && (
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
