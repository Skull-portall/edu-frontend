import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import CampusHubHeader from '../../components/campusHub/CampusHubHeader';
import { getImageUrl } from '../../utils/imageUrl';

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
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

  const openOrders = orders.filter(o => o.status === 'open' || o.status === 'in_progress');
  const recentOrders = orders.slice(0, 5);

 if (user?.role !== 'provider') {
 return (
 <div className="max-w-4xl mx-auto px-4 py-20 text-center">
 <div className="w-28 h-28 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100">
 <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
 </div>
 <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Access Restricted</h2>
 <p className="text-gray-600 font-medium max-w-md mx-auto mb-10 text-lg">You must be an approved service provider to view and manage your services dashboard.</p>
 <Link to="/campus-hub" className="inline-flex px-8 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5">Return to Marketplace</Link>
 </div>
 );
 }

 if (ordersLoading && servicesLoading) return <Loader />;

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
 <CampusHubHeader activePage="dashboard" />
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
 <div onClick={() => navigate('/campus-hub/my-services')} className="group bg-gradient-to-br from-red-600 to-rose-600 rounded-[2rem] p-8 shadow-xl shadow-red-600/20 text-white cursor-pointer transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
 <div className="absolute -right-6 -top-6 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all delay-75 pointer-events-none"></div>
 <div className="flex justify-between items-start mb-8 relative z-10">
 <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10">
 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
 </div>
 <span className="p-3 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg></span>
 </div>
 <h3 className="text-5xl font-black mb-2 relative z-10 tracking-tight">{services.length}</h3>
 <p className="text-red-50 text-lg font-bold relative z-10 flex items-center gap-2">My Services listed <span className="w-2 h-2 rounded-full bg-red-100 animate-pulse"></span></p>
 </div>

 <div onClick={() => navigate('/campus-hub/orders')} className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-8 shadow-xl shadow-gray-900/20 text-white cursor-pointer transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
 <div className="absolute -right-6 -top-6 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all delay-75 pointer-events-none"></div>
 <div className="flex justify-between items-start mb-8 relative z-10">
 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/5">
 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
 </div>
 <span className="p-3 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg></span>
 </div>
 <h3 className="text-5xl font-black mb-2 relative z-10 tracking-tight">{orders.length}</h3>
 <p className="text-gray-300 text-lg font-bold relative z-10">Total Orders Processed</p>
 </div>

 <div className="group bg-white border border-rose-100 rounded-[2rem] p-8 shadow-xl shadow-rose-100/50 transform transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
 <div className="flex justify-between items-start mb-8 relative z-10">
 <div className="w-16 h-16 bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl flex items-center justify-center border border-rose-100 shadow-inner">
 <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
 </div>
 </div>
 <div>
 <h3 className="text-5xl font-black text-gray-900 mb-2 relative z-10 tracking-tight">{openOrders.length}</h3>
 <p className="text-gray-500 text-lg font-bold relative z-10">Active Orders in Progress</p>
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
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status] || statusColors.open}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

 <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full">
 <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
 <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Portfolio</h2>
 <Link to="/campus-hub/my-services" className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 rounded-lg text-sm text-red-600 font-bold hover:bg-red-100 transition-colors">Manage</Link>
 </div>
 <div className="divide-y divide-gray-50 flex-1 flex flex-col">
 {services.length === 0 ? (
 <div className="p-16 text-center flex-1 flex flex-col items-center justify-center">
 <p className="text-gray-400 font-medium text-lg mb-6">No services listed yet.</p>
 <Link to="/campus-hub/my-services" className="inline-flex px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg">Create Service</Link>
 </div>
 ) : (
 services.slice(0, 5).map((svc) => (
 <div key={svc._id} className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors">
 <div className="min-w-0 flex-1 pr-6">
 <p className="font-extrabold text-gray-900 text-lg truncate mb-1">{svc.title}</p>
 <p className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-lg w-fit">₦{Number(svc.price).toLocaleString('en-NG')}</p>
 </div>
 <span className={`px-4 py-2 rounded-xl font-black text-[10px] tracking-widest uppercase ${svc.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
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
