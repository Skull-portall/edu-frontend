import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { communitiesAPI } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const CommunityCreate = () => {
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const [formData, setFormData] = useState({
 name: '',
 description: '',
 purpose: ''
 });

 const createMutation = useMutation({
 mutationFn: (data) => communitiesAPI.create(data),
 onSuccess: (res) => {
 queryClient.invalidateQueries(['communities']);
 toast.success('Your community has been created!', {
 position: 'top-center'
 });
 navigate(`/communities/${res.data.data._id}`);
 },
 onError: (error) => {
 toast.error(error.response?.data?.message || 'Failed to create community.');
 }
 });

 const handleChange = (e) => {
 setFormData({
 ...formData,
 [e.target.name]: e.target.value
 });
 };

 const handleSubmit = (e) => {
 e.preventDefault();
 createMutation.mutate(formData);
 };

 return (
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
 {/* Navigation */}
 <div className="mb-12 animate-fade-in text-center lg:text-left">
 <Link to="/communities" className="inline-flex items-center gap-2 text-gray-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] mb-6 transition-colors">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
 </svg>
 Back to Communities
 </Link>
 <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight uppercase tracking-tight">
 Create <span className="text-red-600">Community</span>
 </h1>
 <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-4 italic">"CREATE A SPACE FOR SHARED LEARNING."</p>
 </div>

 <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-slide-up">
 {/* Main Form Content */}
 <div className="lg:col-span-2 space-y-8">
 <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-8">
 <div className="space-y-4">
 <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Community Name</label>
 <input
 type="text"
 name="name"
 value={formData.name}
 onChange={handleChange}
 required
 placeholder="e.g. Quantum Physics 101"
 className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300"
 />
 </div>

 <div className="space-y-4">
 <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Description</label>
 <textarea
 name="description"
 value={formData.description}
 onChange={handleChange}
 rows="4"
 placeholder="What is this community about? Define the scope..."
 className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-gray-700 font-medium focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300 italic"
 />
 </div>

 <div className="space-y-4">
 <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Mission / Purpose</label>
 <textarea
 name="purpose"
 value={formData.purpose}
 onChange={handleChange}
 rows="4"
 placeholder="What should members expect to achieve here?"
 className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-gray-700 font-medium focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300 italic"
 />
 </div>
 </div>
 </div>

 {/* Sidebar Guidance */}
 <div className="lg:col-span-1 space-y-8">
 <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
 <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6">Community Guidelines</h3>
 <ul className="space-y-4">
 <li className="flex gap-3 text-xs font-medium text-gray-300 leading-relaxed">
 <span className="text-red-500 font-black">01</span> Keep names clear and academic.
 </li>
 <li className="flex gap-3 text-xs font-medium text-gray-300 leading-relaxed">
 <span className="text-red-500 font-black">02</span> Define a clear mission to attract the right contributors.
 </li>
 <li className="flex gap-3 text-xs font-medium text-gray-300 leading-relaxed">
 <span className="text-red-500 font-black">03</span> Active participation keeps the community alive.
 </li>
 </ul>
 </div>

 <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
 <button
 type="submit"
 disabled={createMutation.isPending}
 className="w-full bg-red-600 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 shadow-xl shadow-red-600/20 mb-4 text-sm cursor-pointer flex items-center justify-center gap-2"
 >
 {createMutation.isPending ? (
 <>
 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 Loading...
 </>
 ) : (
 'Create Community'
 )}
 </button>
 <Link to="/communities" className="block w-full text-center py-4 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-gray-900 transition-colors">
 Cancel
 </Link>
 </div>
 </div>
 </form>
 </div>
 );
};

export default CommunityCreate;

