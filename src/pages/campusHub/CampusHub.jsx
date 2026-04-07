import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import CampusHubHeader from '../../components/campusHub/CampusHubHeader';
import { getImageUrl } from '../../utils/imageUrl';

const CampusHub = () => {
 const { user } = useAuth();
 const navigate = useNavigate();
 const [searchQuery, setSearchQuery] = useState('');
 const [activeSearch, setActiveSearch] = useState('');

 const campusIdValue = user?.campus?._id || user?.campus;

 const { data: services = [], isLoading } = useQuery({
 queryKey: ['campusHubServices', activeSearch, campusIdValue],
 queryFn: async () => {
 const res = await campusHubAPI.getServices({
 search: activeSearch || undefined,
 status: 'active',
 campusId: campusIdValue || undefined
 });
 return res.data.data || [];
 },
 });

 if (isLoading) return <Loader />;

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6">
 <CampusHubHeader />

 <div className="mb-6 w-full max-w-2xl relative z-10 sm:mt-0">
 <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 uppercase tracking-wider">Find what you need</label>
 <form
 onSubmit={(e) => {
 e.preventDefault();
 setActiveSearch(searchQuery);
 }}
 className="relative flex items-center group"
 >
 <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-500 transition-colors">
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
 </svg>
 </div>
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search for food, clothing, tutors..."
 className="w-full pl-14 pr-32 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400 transition-all shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] text-lg"
 />
 <button
 type="submit"
 className="absolute right-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-[0.85rem] hover:shadow-lg hover:shadow-red-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
 >
 Search
 </button>
 </form>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
 {services.map((service) => (
 <div
 key={service._id}
 onClick={() => navigate(`/campus-hub/services/${service._id}`)}
 className="group bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(220,38,38,0.15)] hover:border-red-100 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full transform hover:-translate-y-1.5"
 >
 <div className="relative h-56 overflow-hidden">
 {(service.images && service.images.length > 0) ? (
 <img src={getImageUrl(service.images[0])} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
 ) : (
 <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
 <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
 </svg>
 </div>
 )}
 {/* Overlays */}
 <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80" />
 
 <div className="absolute top-4 left-4">
 <span className="px-3 py-1.5 bg-white/95 backdrop-blur-md text-red-600 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm border border-white/20">
 {service.category}
 </span>
 </div>
 <div className="absolute bottom-4 left-5 right-4 flex justify-between items-end">
 <span className="text-white text-xl font-black drop-shadow-md">
 ₦{Number(service.price).toLocaleString('en-NG')}
 </span>
 </div>
 </div>
 
 <div className="p-6 flex flex-col flex-1">
 <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors leading-tight">{service.title}</h2>
 <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">{service.description}</p>
 
 <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
 <div
 className="flex items-center gap-3 w-fit"
 onClick={(e) => { e.stopPropagation(); navigate(`/profile/${service.provider?._id || service.provider?.id}`); }}
 >
 <div className="relative">
 {service.provider?.profilePicture ? (
 <img src={getImageUrl(service.provider.profilePicture)} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-red-50 shadow-sm" />
 ) : (
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center text-sm font-bold text-red-700 border-2 border-white shadow-sm">
 {service.provider?.name?.charAt(0) || 'P'}
 </div>
 )}
 <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
 </div>
 <div>
 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">by</p>
 <p className="text-sm font-bold text-gray-900 hover:text-red-600 transition-colors">{service.provider?.name || 'Provider'}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

 {services.length === 0 && (
 <div className="text-center py-24 bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-100 mt-8">
 <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100/50">
 <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
 </svg>
 </div>
 <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">No services found</h3>
 <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">We couldn't find any services matching your current filters. Try searching for something else.</p>
 </div>
 )}
 </div>
 );
};
export default CampusHub;
