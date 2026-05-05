import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { campusHubAPI } from "../../services/api";
import { useQuery } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";
import CampusHubHeader from "../../components/campusHub/CampusHubHeader";
import { getImageUrl } from "../../utils/imageUrl";

const ProviderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["campusHubOrders"],
    queryFn: async () => {
      const res = await campusHubAPI.getMyOrders();
      return res.data.data || [];
    },
    enabled: !!user && (user.role === "provider" || user.isProvider),
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["campusHubMyServices"],
    queryFn: async () => {
      const res = await campusHubAPI.getMyServices();
      return res.data.data || [];
    },
    enabled: !!user && (user.role === "provider" || user.isProvider),
  });

  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "in_progress",
  );
  const recentOrders = orders.slice(0, 5);
  const totalEarnings = orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + (o.service?.price || 0), 0);

  if (user?.role !== "provider" && !user?.isProvider) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl border border-red-100 flex items-center justify-center mb-10 group hover:rotate-6 transition-transform">
          <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Access Restricted</h2>
        <p className="text-gray-500 font-bold max-w-md mx-auto mb-10 text-lg">You must be an approved provider to access this dashboard.</p>
        <Link to="/campus-hub" className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-900/20 hover:bg-black transition-all">Back to Marketplace</Link>
      </div>
    );
  }

  if (ordersLoading || servicesLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        <CampusHubHeader activePage="dashboard" />

        {/* ── Dashboard Header ─────────────────────────────── */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-500/20">Pro Center</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">Provider <span className="text-red-600">Dashboard</span></h1>
            <p className="text-gray-500 font-bold mt-2">Welcome back, {user?.name?.split(' ')[0] || "Partner"}!</p>
          </div>
          <div className="flex gap-4">
             <button onClick={() => navigate("/campus-hub/my-services")} className="px-8 py-4 bg-white border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-gray-700 hover:bg-gray-50 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">My Listings</button>
             <button onClick={() => navigate("/campus-hub")} className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-gray-900/20 hover:bg-black hover:-translate-y-1 transition-all duration-300">Public View</button>
          </div>
        </div>

        {/* ── Stats Grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Earnings Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-8 shadow-2xl shadow-gray-900/40 text-white relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 h-64 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl group-hover:bg-red-600/40 transition-all duration-700"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"></path></svg>
              </div>
              <div className="h-10 w-24">
                <svg viewBox="0 0 100 40" className="w-full h-full text-red-500 stroke-current fill-none">
                   <path d="M0 35 Q 20 10, 40 25 T 80 5 T 100 30" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Estimated Earnings</p>
              <h3 className="text-4xl font-black tracking-tighter leading-none">₦{totalEarnings.toLocaleString()}</h3>
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 h-64 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl group-hover:bg-amber-100 transition-all duration-700"></div>
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-inner group-hover:scale-110 transition-transform relative z-10">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Requests</p>
              <h3 className="text-6xl font-black tracking-tighter text-gray-900">{activeOrders.length}</h3>
            </div>
          </div>

          {/* Services Count */}
          <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 h-64 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-all duration-700"></div>
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner group-hover:scale-110 transition-transform relative z-10">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Published Listings</p>
              <h3 className="text-6xl font-black tracking-tighter text-gray-900">{services.length}</h3>
            </div>
          </div>

          {/* Business Score */}
          <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 h-64 flex flex-col justify-between">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-all duration-700"></div>
             <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner relative z-10">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Trust Score</p>
              <h3 className="text-6xl font-black tracking-tighter text-gray-900">4.9</h3>
            </div>
          </div>
        </div>

        {/* ── Performance Charts Section ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Recent Orders List */}
          <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden flex flex-col">
            <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Activity</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Live order tracking</p>
              </div>
              <button onClick={() => navigate("/campus-hub/orders")} className="px-5 py-2.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">View Full List</button>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[500px] scrollbar-hide">
              {recentOrders.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-100">
                    <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                  </div>
                  <p className="text-gray-400 font-black text-xs uppercase tracking-widest">No recent transactions</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <div key={order._id} onClick={() => navigate(`/campus-hub/orders/${order._id}/chat`)} className="group flex items-center justify-between p-8 hover:bg-red-50/20 transition-all cursor-pointer">
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          {order.student?.profilePicture ? (
                            <img src={getImageUrl(order.student.profilePicture)} className="w-16 h-16 rounded-[1.25rem] object-cover border-2 border-white shadow-lg group-hover:scale-105 transition-transform" alt="" />
                          ) : (
                            <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center text-red-600 font-black text-xl border-2 border-white shadow-lg group-hover:scale-105 transition-transform">
                              {order.student?.name?.charAt(0) || "?"}
                            </div>
                          )}
                          {order.unreadCount > 0 && <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xl animate-bounce">{order.unreadCount}</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xl font-black text-gray-900 group-hover:text-red-600 transition-colors truncate leading-tight mb-1">{order.service?.title}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.student?.name}</span>
                            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">₦{Number(order.service?.price || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${order.status === 'in_progress' ? 'bg-amber-50 text-amber-600 border-amber-100' : order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400'}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Performance Chart / Analytics Card */}
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden flex flex-col p-10">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Performance</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10">Business growth index</p>
            
            <div className="flex-1 flex flex-col justify-end gap-4">
              <div className="flex items-end justify-between h-48 gap-3">
                {[45, 65, 35, 85, 55, 95, 75].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                    <div className="relative w-full rounded-2xl overflow-hidden shadow-inner bg-gray-50 h-full">
                      <div 
                        className={`absolute bottom-0 left-0 w-full rounded-t-2xl bg-gradient-to-t from-red-600 to-rose-400 transition-all duration-1000 delay-${i * 100} group-hover/bar:brightness-110 shadow-lg`}
                        style={{ height: `${h}%` }}
                      >
                         <div className="absolute top-2 left-0 w-full flex justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity">
                            <span className="text-[8px] font-black text-white">{h}%</span>
                         </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-gray-300 uppercase">{['M','T','W','T','F','S','S'][i]}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-red-50/50 rounded-3xl border border-red-100/50">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                   </div>
                   <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Growth Forecast</p>
                </div>
                <p className="text-[11px] font-bold text-red-600/70 leading-relaxed italic">"Your marketplace visibility is up 24% this week. Keep active to maintain the momentum!"</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Management Section ─────────────────────────────── */}
        <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-red-500/40">
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 leading-tight">Ready to expand your campus business?</h2>
                <p className="text-white/80 font-bold text-lg leading-relaxed">Boost your listings with professional photos and detailed descriptions to attract more customers.</p>
              </div>
              <button 
                onClick={() => navigate("/campus-hub/my-services")}
                className="px-10 py-5 bg-white text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 whitespace-nowrap"
              >
                Create New Service
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
