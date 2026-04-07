import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

import { getImageUrl } from '../../utils/imageUrl';

const CampusHubServiceDetail = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const { user } = useAuth();
 const queryClient = useQueryClient();
 const [requesting, setRequesting] = useState(false);

 const { data: service, isLoading } = useQuery({
 queryKey: ['campusHubService', id],
 queryFn: async () => {
 const res = await campusHubAPI.getServiceById(id);
 return res.data.data;
 },
 enabled: !!id,
 });

 const createOrderMutation = useMutation({
 mutationFn: () => campusHubAPI.createOrder(id),
 onSuccess: (res) => {
 queryClient.invalidateQueries(['campusHubOrders']);
 if (res.data.reused) {
 toast.success('Found your existing chat. Request sent.');
 } else {
 toast.success('Order created. You can chat with the provider now.');
 }
 navigate(`/campus-hub/orders/${res.data.data._id}/chat`);
 },
 onError: (err) => {
 toast.error(err.response?.data?.message || 'Failed to create order');
 setRequesting(false);
 },
 });

 const handleRequestService = () => {
 if (!user) {
 navigate('/login');
 return;
 }
 if (service.provider._id === user._id || service.provider._id === user.id) {
 toast.error('You cannot request your own service.');
 return;
 }
 setRequesting(true);
 createOrderMutation.mutate();
 };

 if (isLoading || !service) return <Loader />;

 return (
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
 <div className="mb-6">
 <button
 onClick={() => navigate(-1)}
 className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl text-sm font-bold transition-all shadow-sm"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
 </svg>
 Back to Hub
 </button>
 </div>

 <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden relative">
 <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-50 to-rose-50 rounded-bl-full -z-10 mix-blend-multiply pointer-events-none blur-2xl"></div>

 <div className="flex flex-col md:flex-row">
 {(service.images && service.images.length > 0) ? (
 <div className="md:w-5/12 lg:w-1/2 p-6 pb-0 md:pr-0 md:pb-6 relative">
 <div className="flex flex-col gap-3 h-full">
 <div className="relative w-full h-64 md:h-80 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm">
 <img src={getImageUrl(service.images[0])} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
 <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent pointer-events-none"></div>
 </div>
 {service.images.length > 1 && (
 <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
 {service.images.slice(1).map((img, i) => (
 <div key={i} className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 shadow-sm cursor-pointer border border-gray-100 opacity-80 hover:opacity-100 transition-opacity">
 <img src={getImageUrl(img)} alt="" className="absolute inset-0 w-full h-full object-cover" />
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="md:w-5/12 lg:w-1/2 p-6 pb-0 md:pr-0 md:pb-6 relative">
 <div className="w-full h-64 md:h-full min-h-[20rem] rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-gray-50 to-gray-200 border border-gray-100 flex flex-col items-center justify-center text-gray-400">
 <svg className="w-16 h-16 opacity-50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
 <span className="font-bold">No images available</span>
 </div>
 </div>
 )}

 <div className="p-8 md:p-10 md:w-7/12 lg:w-1/2 flex flex-col justify-center relative">
 <div className="flex flex-wrap items-center gap-3 mb-5">
 <span className="px-4 py-1.5 bg-red-100/80 backdrop-blur-sm text-red-600 border border-red-200/50 text-xs font-black uppercase tracking-widest rounded-xl shadow-sm">
 {service.category || 'General'}
 </span>
 <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-black uppercase tracking-widest rounded-xl border border-green-200 flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
 Available
 </span>
 </div>

 <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight tracking-tight">{service.title}</h1>
 
 <div className="mb-8">
 <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-600 to-rose-600">
 ₦{Number(service.price).toLocaleString('en-NG')}
 </span>
 </div>

 <div className="prose prose-sm prose-gray mb-10 max-w-none">
 <h3 className="text-lg font-bold text-gray-900 mb-2">About this service</h3>
 <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{service.description}</p>
 </div>

 <div className="border border-gray-100 bg-gray-50/50 p-5 rounded-2xl mb-8 flex items-center justify-between group/card hover:bg-white hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-red-100 transition-all cursor-pointer"
 onClick={() => navigate(`/profile/${service.provider?._id || service.provider?.id}`)}>
 <div className="flex items-center gap-4">
 <div className="relative">
 {service.provider?.profilePicture ? (
 <img src={getImageUrl(service.provider.profilePicture)} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-transparent group-hover/card:ring-red-100 transition-all" />
 ) : (
 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center text-lg font-black text-red-700 border-2 border-white shadow-sm ring-2 ring-transparent group-hover/card:ring-red-100 transition-all">
 {service.provider?.name?.charAt(0) || 'P'}
 </div>
 )}
 <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white rounded-full"></div>
 </div>
 <div>
 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Service Provider</p>
 <p className="text-lg font-bold text-gray-900 group-hover/card:text-red-600 transition-colors">{service.provider?.name}</p>
 </div>
 </div>
 <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover/card:bg-red-50 group-hover/card:text-red-600 group-hover/card:border-red-100 transition-all shadow-sm">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
 </div>
 </div>

 <div className="mt-auto">
 {user ? (
 (service.provider._id === user._id || service.provider._id === user.id) ? (
 <button
 onClick={() => navigate('/campus-hub/my-services')}
 className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-sm"
 >
 Manage Your Service
 </button>
 ) : (
 <button
 onClick={handleRequestService}
 disabled={requesting || createOrderMutation.isPending}
 className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-red-500/30 transform hover:-translate-y-0.5 transition-all text-lg disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3 relative overflow-hidden group"
 >
 <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
 {(requesting || createOrderMutation.isPending) ? (
 <>
 <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
 Processing Request...
 </>
 ) : (
 <>
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
 Request Service & Chat
 </>
 )}
 </button>
 )
 ) : (
 <button
 onClick={() => navigate('/login')}
 className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg shadow-gray-900/20"
 >
 Log in to Request
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default CampusHubServiceDetail;
