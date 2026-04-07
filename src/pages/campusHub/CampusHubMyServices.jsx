import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import CampusHubHeader from '../../components/campusHub/CampusHubHeader';
import { getImageUrl } from '../../utils/imageUrl';
import { uploadToCloudinary } from '../../utils/cloudinary';

const CampusHubMyServices = () => {
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const [editing, setEditing] = useState(null);
 const [form, setForm] = useState({ title: '', description: '', category: '', price: '', status: 'active' });
 const [createImages, setCreateImages] = useState([]);
 const [showCreate, setShowCreate] = useState(false);
 const [isUploading, setIsUploading] = useState(false);

 const { data: services = [], isLoading } = useQuery({
 queryKey: ['campusHubMyServices'],
 queryFn: async () => {
 const res = await campusHubAPI.getMyServices();
 return res.data.data || [];
 },
 });

 const createMutation = useMutation({
 mutationFn: (formData) => campusHubAPI.createService(formData),
 onSuccess: () => {
 queryClient.invalidateQueries(['campusHubMyServices']);
 setShowCreate(false);
 setForm({ title: '', description: '', category: '', price: '', status: 'active' });
 setCreateImages([]);
 toast.success('Service created.');
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to create service'),
 });

 const updateMutation = useMutation({
 mutationFn: ({ id, data }) => campusHubAPI.updateService(id, data),
 onSuccess: () => {
 queryClient.invalidateQueries(['campusHubMyServices']);
 setEditing(null);
 toast.success('Service updated.');
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
 });

 const deleteMutation = useMutation({
 mutationFn: (id) => campusHubAPI.deleteService(id),
 onSuccess: () => {
 queryClient.invalidateQueries(['campusHubMyServices']);
 toast.success('Service deleted.');
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
 });

 const handleCreate = async (e) => {
 e.preventDefault();
 if (!form.title.trim() || !form.description.trim()) {
 toast.error('Title and description required.');
 return;
 }
 if (createImages.length < 1 || createImages.length > 5) {
 toast.error('Please add between 1 and 5 images for the service.');
 return;
 }
 try {
 setIsUploading(true);
 const imageUrls = await Promise.all(
 Array.from(createImages).map((file) => uploadToCloudinary(file))
 );

 createMutation.mutate({
 title: form.title.trim(),
 description: form.description.trim(),
 category: (form.category || 'General').trim(),
 price: form.price || '0',
 images: imageUrls,
 });
 } catch (error) {
 toast.error(error.message || 'Image upload failed. Please try again.');
 } finally {
 setIsUploading(false);
 }
 };

 const handleUpdate = (e) => {
 e.preventDefault();
 if (!editing || !form.title.trim()) return;
 updateMutation.mutate({ id: editing._id, data: form });
 };

 const startEdit = (svc) => {
 setEditing(svc);
 setForm({
 title: svc.title,
 description: svc.description,
 category: svc.category || '',
 price: String(svc.price ?? ''),
 status: svc.status || 'active',
 });
 };

 if (isLoading) return <Loader />;

 return (
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
 <CampusHubHeader activePage="services" />
 
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-white border border-gray-100 p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
 <div>
 <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Your Services Portfolio</h2>
 <p className="text-gray-500 font-medium mt-1">Manage, update, and add new services to the marketplace.</p>
 </div>
 <button
 onClick={() => { setShowCreate(true); setEditing(null); setCreateImages([]); setForm({ title: '', description: '', category: '', price: '', status: 'active' }); }}
 className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
 Add New Service
 </button>
 </div>

 {(showCreate || editing) && (
 <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] p-8 mb-10 overflow-hidden relative">
 <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-600 to-rose-600"></div>
 <div className="flex justify-between items-center mb-6 pl-4">
 <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{editing ? 'Edit Service' : 'Create New Service'}</h2>
 <button onClick={() => { setShowCreate(false); setEditing(null); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
 </button>
 </div>
 
 <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-6 pl-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="md:col-span-2">
 <label className="block text-sm font-bold text-gray-700 mb-2">Service Title *</label>
 <input
 value={form.title}
 onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
 placeholder="e.g. Professional UI/UX Design"
 className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all placeholder-gray-400"
 required
 />
 </div>

 <div className="md:col-span-2">
 <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Description *</label>
 <textarea
 value={form.description}
 onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
 rows={4}
 placeholder="Describe your service, what's included, and your expertise..."
 className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all placeholder-gray-400 resize-none"
 required
 />
 </div>

 {!editing && (
 <div className="md:col-span-2">
 <label className="block text-sm font-bold text-gray-700 mb-2">Service Images * <span className="text-gray-400 font-normal">(1 to 5 images)</span></label>
 <div className="relative border-2 border-dashed border-gray-300 rounded-2xl px-6 py-8 hover:border-red-400 hover:bg-red-50/30 transition-colors group text-center cursor-pointer">
 <input
 type="file"
 accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
 multiple
 onChange={(e) => {
 const files = Array.from(e.target.files || []);
 if (files.length > 5) {
 toast.error('Maximum 5 images.');
 setCreateImages(files.slice(0, 5));
 } else {
 setCreateImages(files);
 }
 }}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 />
 <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
 </div>
 <p className="font-bold text-gray-700">Click to upload or drag and drop</p>
 <p className="text-sm font-medium text-gray-400">JPG, PNG, WEBP (max. 5 files)</p>
 </div>
 </div>
 {createImages.length > 0 && (
 <div className="mt-4 flex gap-3 overflow-x-auto p-2">
 {Array.from(createImages).map((file, idx) => (
 <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 shadow-sm">
 <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
 <input
 value={form.category}
 onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
 placeholder="e.g. Graphic Design"
 className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all placeholder-gray-400"
 />
 </div>

 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Price (₦) *</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
 <span className="text-gray-500 font-bold">₦</span>
 </div>
 <input
 type="number"
 min="0"
 step="0.01"
 value={form.price}
 onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
 className="w-full pl-10 pr-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all placeholder-gray-400"
 required
 />
 </div>
 </div>

 {editing && (
 <div className="md:col-span-2">
 <label className="block text-sm font-bold text-gray-700 mb-2">Visibility Status</label>
 <select
 value={form.status}
 onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
 className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all appearance-none"
 >
 <option value="active">Active (Visible)</option>
 <option value="inactive">Inactive (Hidden)</option>
 <option value="suspended">Suspended</option>
 </select>
 </div>
 )}
 </div>

 <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
 <button
 type="submit"
 disabled={editing ? updateMutation.isPending : (createMutation.isPending || isUploading || createImages.length < 1)}
 className="px-8 py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center min-w-[140px]"
 >
 {isUploading ? (
 <span className="flex items-center gap-2">
 <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
 Uploading...
 </span>
 ) : (createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Service'}
 </button>
 <button type="button" onClick={() => { setShowCreate(false); setEditing(null); }} className="px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
 Cancel
 </button>
 </div>
 </form>
 </div>
 )}

 <div className="space-y-6">
 {services.map((svc) => (
 <div key={svc._id} className="group bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(220,38,38,0.1)] hover:border-red-100 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row">
 
 {(svc.images && svc.images.length > 0) ? (
 <div className="w-full sm:w-64 h-56 sm:h-auto relative overflow-hidden flex-shrink-0">
 <img src={getImageUrl(svc.images[0])} alt={svc.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
 {svc.images.length > 1 && (
 <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-white text-xs font-bold shadow-sm">
 +{svc.images.length - 1} images
 </div>
 )}
 </div>
 ) : (
 <div className="w-full sm:w-64 h-56 sm:h-auto bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center flex-shrink-0 border-r border-gray-100">
 <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
 </div>
 )}

 <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
 <div>
 <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
 <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-lg">{svc.category || 'General'}</span>
 <span className="text-2xl font-black text-rose-600">₦{Number(svc.price).toLocaleString('en-NG')}</span>
 </div>
 <h2 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-red-600 transition-colors leading-tight">{svc.title}</h2>
 <p className="text-gray-500 font-medium mb-4 line-clamp-2 leading-relaxed">{svc.description}</p>
 </div>

 <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-gray-100">
 <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${svc.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
 <span className={`w-1.5 h-1.5 rounded-full ${svc.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
 {svc.status}
 </span>

 <div className="flex gap-3">
 <button 
 onClick={() => { setShowCreate(false); startEdit(svc); }} 
 className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
 >
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
 Edit
 </button>
 <button
 onClick={() => {
 if (window.confirm('Are you absolutely sure you want to delete this service?')) {
 deleteMutation.mutate(svc._id);
 }
 }}
 className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors shadow-sm"
 >
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
 Delete
 </button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

 {services.length === 0 && !showCreate && !editing && (
 <div className="text-center py-24 bg-gray-50/50 rounded-3xl border border-dashed border-gray-300 mt-8">
 <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 border border-gray-200">
 <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
 </div>
 <h3 className="text-2xl font-extrabold text-gray-900 mb-2">No Portfolio Yet</h3>
 <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">Create your first service to start offering your skills and products to the campus community.</p>
 <button
 onClick={() => { setShowCreate(true); setForm({ title: '', description: '', category: '', price: '', status: 'active' }); }}
 className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
 >
 Create First Service
 </button>
 </div>
 )}
 </div>
 );
};
export default CampusHubMyServices;
