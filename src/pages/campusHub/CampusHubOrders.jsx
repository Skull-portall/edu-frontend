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

      {/* ── Order Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        {filteredOrders.map((order) => {
          const isMyService = order.provider?._id === user?._id || order.provider?.id === user?.id;
          const counterparty = isMyService ? order.student : order.provider;
          const serviceTitle = order.service?.title || 'Service';
          const status = order.status || 'pending';
          const hasUnread = order.unreadCount > 0;

          const statusConfig = {
            pending:     { label: 'Pending',    dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'text-yellow-600' },
            in_progress: { label: 'Active',     dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600' },
            completed:   { label: 'Completed',  dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200',   text: 'text-blue-600'   },
            cancelled:   { label: 'Cancelled',  dot: 'bg-gray-400',   badge: 'bg-gray-50 text-gray-600 border-gray-200',   text: 'text-gray-500'   },
          };
          const sc = statusConfig[status] || statusConfig.pending;

          return (
            <div
              key={order._id}
              onClick={() => navigate(`/campus-hub/orders/${order._id}/chat`)}
              className="relative group bg-white border border-gray-100/80 rounded-[1.4rem] shadow-sm hover:shadow-[0_8px_32px_-8px_rgba(220,38,38,0.18)] hover:border-red-200 hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
            >
              {/* ── Service image banner ── */}
              <div className="w-full h-32 relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-100 flex-shrink-0">
                {order.service?.images && order.service.images.length > 0 ? (
                  <img
                    src={getImageUrl(order.service.images[0])}
                    alt={serviceTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-black text-red-200 select-none">{serviceTitle.charAt(0)}</span>
                  </div>
                )}

                {/* Status badge overlay */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-sm bg-white/80 ${sc.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                    {sc.label}
                  </span>
                </div>

                {/* Unread badge overlay */}
                {hasUnread && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-600 text-white shadow-lg animate-pulse">
                      {order.unreadCount > 99 ? '99+' : order.unreadCount} new
                    </span>
                  </div>
                )}

                {/* Role tag */}
                <div className="absolute bottom-3 left-3">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${isMyService ? 'bg-rose-600/90 text-white' : 'bg-gray-900/70 text-white'}`}>
                    {isMyService ? 'I\'m Provider' : 'My Purchase'}
                  </span>
                </div>
              </div>

              {/* ── Card Body ── */}
              <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Title */}
                <h2 className="font-black text-gray-900 text-[15px] leading-snug group-hover:text-red-600 transition-colors line-clamp-2">{serviceTitle}</h2>

                {/* Counterparty */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-100">
                    {counterparty?.profilePicture
                      ? <img src={getImageUrl(counterparty.profilePicture)} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-black">{counterparty?.name?.charAt(0) || '?'}</div>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide leading-none mb-0.5">{isMyService ? 'Client' : 'Provider'}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/profile/${counterparty?._id || counterparty?.id}`); }}
                      className="text-[13px] font-bold text-gray-800 hover:text-red-600 transition-colors truncate block max-w-[140px]"
                    >
                      {counterparty?.name || '—'}
                    </button>
                  </div>
                </div>

                {/* Footer: date + CTA */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/campus-hub/orders/${order._id}/chat`); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-extrabold transition-all active:scale-95 shadow-sm ${hasUnread ? 'bg-red-600 text-white shadow-red-600/25 hover:bg-red-700' : 'bg-gray-900 text-white group-hover:bg-red-600 hover:shadow-red-600/30'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    Chat {hasUnread && `(${order.unreadCount})`}
                  </button>
                </div>
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
