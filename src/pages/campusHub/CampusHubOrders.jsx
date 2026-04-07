import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import CampusHubHeader from '../../components/campusHub/CampusHubHeader';
import { getImageUrl } from '../../utils/imageUrl';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';

const statusConfig = {
 pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'PENDING' },
 in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'ACTIVE' },
 completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'COMPLETED' },
 cancelled: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400', label: 'CANCELLED' },
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

 <div className="space-y-5">
 {displayOrders.map((order) => {
 const isMyService = order.provider?._id === user?._id || order.provider?.id === user?.id;
 const counterparty = isMyService ? order.student : order.provider;
 const serviceTitle = order.service?.title || 'Service Unavailable';
 const status = order.status || 'pending';
 const conf = statusConfig[status] || statusConfig.pending;

 return (
 <div
 key={order._id}
 onClick={() => navigate(`/campus-hub/orders/${order._id}/chat`)}
 className="group bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 hover:shadow-[0_8px_30px_-4px_rgba(220,38,38,0.12)] hover:border-red-100 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden"
 >
 {/* Highlight bar for active unread */}
 {order.unreadCount > 0 && (
 <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-red-500 to-rose-600 shadow-lg shadow-red-500/50"></div>
 )}

 <div className="flex items-start sm:items-center gap-5 flex-1 min-w-0">
 <div
 onClick={(e) => { e.stopPropagation(); navigate(`/profile/${counterparty?._id || counterparty?.id}`); }}
 className="relative cursor-pointer flex-shrink-0 group/avatar"
 >
 {counterparty?.profilePicture ? (
 <img src={getImageUrl(counterparty.profilePicture)} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-sm border-2 border-transparent group-hover/avatar:border-red-100 transition-all" />
 ) : (
 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center text-xl font-black text-gray-400 group-hover/avatar:border-red-100 border-2 border-transparent transition-all shadow-inner">{counterparty?.name?.charAt(0) || '?'}</div>
 )}
 {order.unreadCount > 0 && (
 <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 border-[3px] border-white rounded-full animate-bounce shadow-sm"></div>
 )}
 </div>
 
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-3 mb-1.5">
 <h2 className="text-xl font-extrabold text-gray-900 truncate group-hover:text-red-600 transition-colors">{serviceTitle}</h2>
 </div>
 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm">
 <p className="flex items-center gap-2 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
 <span className="font-bold text-gray-400 text-xs uppercase tracking-wider">{isMyService ? 'Client' : 'Provider'}</span>
 <span className="font-bold text-gray-700">{counterparty?.name || 'Unknown User'}</span>
 </p>
 <p className="text-gray-400 font-medium flex items-center gap-1.5 px-2.5 py-1">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
 {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
 </p>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between sm:justify-end gap-5 sm:flex-col sm:items-end flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
 <div className={`px-4 py-2 rounded-xl text-[11px] font-black tracking-widest border flex items-center gap-2 ${conf.bg} ${conf.text} ${conf.border}`}>
 <span className={`w-2 h-2 rounded-full ${conf.dot} animate-pulse`}></span>
 {conf.label}
 </div>
 <div className="flex items-center gap-4">
 {order.unreadCount > 0 && (
 <span className="text-xs font-black text-red-600 bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg shadow-sm">
 {order.unreadCount} New
 </span>
 )}
 <div className="hidden sm:flex w-11 h-11 rounded-2xl bg-gray-50 items-center justify-center text-gray-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors shadow-sm">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
 </svg>
 </div>
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
