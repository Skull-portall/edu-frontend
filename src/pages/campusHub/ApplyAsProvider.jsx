import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

import { getImageUrl } from '../../utils/imageUrl';
import { uploadToCloudinary } from '../../utils/cloudinary';

const ApplyAsProvider = () => {
 const navigate = useNavigate();
 const { user } = useAuth();
 const queryClient = useQueryClient();
 const fileInputRef = useRef(null);
 const sampleInputRef = useRef(null);
 const [showCongratsModal, setShowCongratsModal] = useState(false);
 const [showResubmitForm, setShowResubmitForm] = useState(false);
 const [isUploading, setIsUploading] = useState(false);

 const [fullName, setFullName] = useState(user?.name || '');
 const [address, setAddress] = useState('');
 const [serviceName, setServiceName] = useState('');
 const [studentId, setStudentId] = useState('');
 const [providerImage, setProviderImage] = useState(null);
 const [serviceSampleImage, setServiceSampleImage] = useState(null);
 const [skills, setSkills] = useState('');
 const [description, setDescription] = useState('');

 const { data: application, isLoading } = useQuery({
 queryKey: ['campusHubMyApplication'],
 queryFn: async () => {
 const res = await campusHubAPI.getMyApplication();
 return res.data.data;
 },
 });

 const applyMutation = useMutation({
 mutationFn: (formData) => campusHubAPI.applyAsProvider(formData),
 onSuccess: () => {
 setShowResubmitForm(false);
 queryClient.invalidateQueries(['campusHubMyApplication']);
 toast.success('Application submitted successfully! It is under review.');
 },
 onError: (err) => {
 const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to submit application';
 toast.error(msg);
 },
 });

 useEffect(() => {
 if (application?.status === 'approved' && !showCongratsModal) setShowCongratsModal(true);
 }, [application?.status, showCongratsModal]);

 useEffect(() => {
 if (showResubmitForm && application?.status === 'rejected') {
 setFullName(application.fullName || user?.name || '');
 setAddress(application.address || '');
 setServiceName(application.serviceName || '');
 setStudentId(application.studentId || '');
 setProviderImage(null);
 setServiceSampleImage(null);
 setSkills(application.skills || '');
 setDescription(application.description || '');
 }
 }, [showResubmitForm, application]);

 const handleFileChange = (e) => {
 const file = e.target.files?.[0];
 if (file) {
 if (!file.type.startsWith('image/')) {
 toast.error('Please select an image file (JPEG, PNG, or GIF).');
 return;
 }
 if (file.size > 3 * 1024 * 1024) {
 toast.error('Image must be less than 3MB.');
 return;
 }
 setProviderImage(file);
 }
 };

 const handleServiceSampleChange = (e) => {
 const file = e.target.files?.[0];
 if (file) {
 if (!file.type.startsWith('image/')) {
 toast.error('Please select an image file (JPEG, PNG, or GIF).');
 return;
 }
 if (file.size > 3 * 1024 * 1024) {
 toast.error('Image must be less than 3MB.');
 return;
 }
 setServiceSampleImage(file);
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!fullName.trim() || !address.trim() || !serviceName.trim() || !studentId.trim() || !skills.trim() || !description.trim()) {
 toast.error('Please fill in all required fields.');
 return;
 }
 if (!providerImage && !application?.providerImage) {
 toast.error('Please upload your photo or ID image.');
 return;
 }

 try {
 setIsUploading(true);
 let providerImageUrl = application?.providerImage;
 if (providerImage) {
 providerImageUrl = await uploadToCloudinary(providerImage);
 }

 let serviceSampleImageUrl = application?.serviceSampleImage;
 if (serviceSampleImage) {
 serviceSampleImageUrl = await uploadToCloudinary(serviceSampleImage);
 }

 applyMutation.mutate({
 fullName: fullName.trim(),
 address: address.trim(),
 serviceName: serviceName.trim(),
 studentId: studentId.trim(),
 skills: skills.trim(),
 description: description.trim(),
 providerImage: providerImageUrl,
 serviceSampleImage: serviceSampleImageUrl,
 });
 } catch (error) {
 toast.error(error.message || 'Image upload failed. Please try again.');
 } finally {
 setIsUploading(false);
 }
 };

 if (user?.role === 'provider' || user?.isProvider) {
 return (
 <div className="max-w-2xl mx-auto px-4 py-16 text-center">
 <div className="w-24 h-24 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
 <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
 </div>
 <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">You are already a Provider</h2>
 <p className="text-gray-500 font-medium mb-8">Manage your services, track orders, and grow your business from your dashboard.</p>
 <button onClick={() => navigate('/campus-hub/my-services')} className="inline-flex px-8 py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:-translate-y-0.5">
 Go to My Services
 </button>
 </div>
 );
 }

 if (isLoading) return <Loader />;

 if (application && !showResubmitForm) {
 const isPending = application.status === 'pending';
 const isRejected = application.status === 'rejected';
 const isApproved = application.status === 'approved';
 const imageUrl = application.providerImage ? getImageUrl(application.providerImage) : null;

 return (
 <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
 <div className="mb-6">
 <button
 onClick={() => navigate('/campus-hub')}
 className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl text-sm font-bold transition-all shadow-sm"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
 Back to Hub
 </button>
 </div>

 <div className={`rounded-[2rem] overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border bg-white ${isPending ? 'border-amber-100' : isRejected ? 'border-red-100' : 'border-green-100'}`}>
 <div className={`h-32 ${isPending ? 'bg-gradient-to-r from-amber-400 to-amber-500' : isRejected ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`}></div>
 <div className="p-8 sm:p-10 pt-0 relative pb-12">
 
 <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-16 sm:-mt-20 mb-8 sm:mb-10 text-center sm:text-left relative z-10">
 <div className="relative">
 {imageUrl ? (
 <img src={imageUrl} alt="You" className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover border-4 border-white shadow-xl bg-white" />
 ) : (
 <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gray-100 border-4 border-white shadow-xl flex items-center justify-center text-5xl font-black text-gray-400">
 {application.fullName?.charAt(0) || '?'}
 </div>
 )}
 <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-lg ${isPending ? 'bg-amber-500 text-white' : isRejected ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
 {isPending && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
 {isRejected && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>}
 {isApproved && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
 </div>
 </div>
 
 <div className="flex-1 mt-4 sm:mt-0">
 <span className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest mb-3 ${isPending ? 'bg-amber-100 text-amber-800' : isRejected ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
 Status: {application.status}
 </span>
 <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-1">{application.fullName}</h2>
 <p className="font-bold text-gray-500">{application.serviceName}</p>
 </div>
 </div>

 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 max-w-2xl mx-auto">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Student ID</p>
 <p className="font-bold text-gray-900">{application.studentId || '—'}</p>
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Address</p>
 <p className="font-bold text-gray-900">{application.address || '—'}</p>
 </div>
 </div>
 </div>

 <div className="max-w-2xl mx-auto text-center sm:text-left">
 {isPending && (
 <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
 <p className="text-lg font-bold text-amber-900 mb-2">Application Under Review</p>
 <p className="text-amber-700 font-medium mb-6">Our admins are currently reviewing your application. You will be notified once a decision has been made.</p>
 <button onClick={() => navigate('/')} className="px-8 py-3 bg-white border border-amber-300 text-amber-800 rounded-xl font-bold hover:bg-amber-100 transition-colors shadow-sm">
 Back to Feed
 </button>
 </div>
 )}
 {isRejected && (
 <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center">
 <p className="text-lg font-bold text-red-900 mb-2">Application Declined</p>
 <p className="text-red-700 font-medium mb-4">Unfortunately, your application was not approved at this time.</p>
 {application.rejectionReason && (
 <div className="bg-white border border-red-100 p-4 rounded-xl mb-6 text-left inline-block max-w-full w-full">
 <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Reason</p>
 <p className="font-bold text-gray-900">{application.rejectionReason}</p>
 </div>
 )}
 <button onClick={() => setShowResubmitForm(true)} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
 Re-submit Application
 </button>
 </div>
 )}
 {isApproved && (
 <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center">
 <p className="text-lg font-bold text-green-900 mb-2">You're In!</p>
 <p className="text-green-700 font-medium mb-6">Your application is approved. You can now setup your services and start earning.</p>
 <button onClick={() => navigate('/campus-hub/my-services')} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
 Go to Dashboard
 </button>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Congratulations modal */}
 {showCongratsModal && isApproved && (
 <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCongratsModal(false)}>
 <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-10 text-center transform scale-100 animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
 <div className="w-24 h-24 mx-auto mb-6 rounded-[2rem] bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center shadow-inner border border-green-100">
 <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
 </svg>
 </div>
 <h3 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Congratulations!</h3>
 <p className="text-gray-500 font-medium mb-8 text-lg">You are now a verified service provider. Setup your profile and start offering your services to the campus community.</p>
 <div className="space-y-3">
 <button
 onClick={() => { setShowCongratsModal(false); navigate('/campus-hub/my-services'); }}
 className="w-full px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all text-lg"
 >
 Start Earning
 </button>
 <button
 onClick={() => setShowCongratsModal(false)}
 className="w-full px-6 py-3.5 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-colors"
 >
 Dismiss
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
 }

 return (
 <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
 <div className="mb-8">
 <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">Apply to be a <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">Provider</span></h1>
 <p className="text-lg text-gray-600 font-medium max-w-2xl">
 Join the E-DU Hub marketplace. Provide your details so we can verify your identity and keep the community secure.
 </p>
 </div>

 {(applyMutation.isPending || isUploading) && (
 <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
 <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 border border-red-100 shadow-inner">
 <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
 </div>
 <p className="text-xl font-bold text-gray-900 text-center max-w-xs shadow-[0_0_20px_white]">
 {isUploading ? 'Securely uploading your identity documents...' : 'Submitting your application...'}
 </p>
 </div>
 )}

 <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden relative">
 <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-50 to-rose-50 rounded-bl-full -z-10 mix-blend-multiply pointer-events-none blur-3xl"></div>
 <div className="p-8 md:p-10 space-y-8">
 
 {/* Identity Section */}
 <div className="space-y-6">
 <h3 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">1. Personal Identity</h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Legal Full Name <span className="text-red-500">*</span></label>
 <input
 type="text"
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all placeholder-gray-400"
 placeholder="As it appears on your ID"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Student ID Number <span className="text-red-500">*</span></label>
 <input
 type="text"
 value={studentId}
 onChange={(e) => setStudentId(e.target.value)}
 className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all placeholder-gray-400"
 placeholder="e.g. 20/CG/12345"
 required
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Current Address <span className="text-red-500">*</span></label>
 <textarea
 value={address}
 onChange={(e) => setAddress(e.target.value)}
 rows={2}
 className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all placeholder-gray-400 resize-none"
 placeholder="Hostel, off-campus, or contact address"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Photo / Student ID Card <span className="text-red-500">*</span></label>
 <p className="text-sm text-gray-500 mb-3">Upload a clear selfie or your student ID (JPEG/PNG, max 3MB).</p>
 <div 
 onClick={() => fileInputRef.current?.click()}
 className={`w-full relative border-2 border-dashed rounded-2xl px-6 py-6 transition-all group text-center cursor-pointer ${providerImage ? 'border-green-400 bg-green-50/50' : 'border-gray-300 hover:border-red-400 hover:bg-red-50/30'}`}
 >
 <input
 ref={fileInputRef}
 type="file"
 accept="image/jpeg,image/jpg,image/png,image/gif"
 onChange={handleFileChange}
 className="hidden"
 />
 
 {providerImage ? (
 <div className="flex flex-col items-center gap-3">
 <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-green-200">
 <img src={URL.createObjectURL(providerImage)} alt="Preview" className="w-full h-full object-cover" />
 </div>
 <p className="font-bold text-green-700">Image selected</p>
 <p className="text-sm font-medium text-green-600/70 truncate max-w-[200px]">{providerImage.name}</p>
 <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest hover:text-red-600 transition-colors">Click to change</p>
 </div>
 ) : (
 <div className="flex flex-col items-center space-y-3 pointer-events-none">
 <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all">
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"></path></svg>
 </div>
 <div>
 <p className="font-bold text-gray-700">Click to upload your ID</p>
 <p className="text-sm font-medium text-gray-400 mt-1">JPEG, PNG up to 3MB</p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="my-8 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

 {/* Service Section */}
 <div className="space-y-6">
 <h3 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">2. Service Details</h3>
 
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Primary Service Name <span className="text-red-500">*</span></label>
 <input
 type="text"
 value={serviceName}
 onChange={(e) => setServiceName(e.target.value)}
 className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all placeholder-gray-400"
 placeholder="e.g. Professional Note-taking, Math Tutoring"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Skills & Qualifications <span className="text-red-500">*</span></label>
 <textarea
 value={skills}
 onChange={(e) => setSkills(e.target.value)}
 rows={2}
 className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all placeholder-gray-400 resize-none"
 placeholder="List your relevant skills, e.g. Fluent in French, A+ in Advanced Math..."
 required
 />
 </div>

 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Service Portfolio Description <span className="text-red-500">*</span></label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 rows={4}
 className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 font-medium text-gray-900 transition-all placeholder-gray-400 resize-none"
 placeholder="Pitch yourself. Describe the full range of services you offer, your experience, and why students should hire you..."
 required
 />
 </div>

 <div>
 <label className="block text-sm font-bold text-gray-700 mb-2">Portfolio Sample <span className="text-gray-400 font-medium">(Optional)</span></label>
 <p className="text-sm text-gray-500 mb-3">Upload a sample of your work (e.g. design draft, note sample). It helps admin verify your credibility quickly.</p>
 <div 
 onClick={() => sampleInputRef.current?.click()}
 className={`w-full relative border-2 border-dashed rounded-2xl px-6 py-6 transition-all group text-center cursor-pointer ${serviceSampleImage ? 'border-green-400 bg-green-50/50' : 'border-gray-300 hover:border-red-400 hover:bg-red-50/30'}`}
 >
 <input
 ref={sampleInputRef}
 type="file"
 accept="image/jpeg,image/jpg,image/png,image/gif"
 onChange={handleServiceSampleChange}
 className="hidden"
 />
 
 {serviceSampleImage ? (
 <div className="flex flex-col items-center gap-3">
 <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-green-200">
 <img src={URL.createObjectURL(serviceSampleImage)} alt="Preview" className="w-full h-full object-cover" />
 </div>
 <p className="font-bold text-green-700">Sample attached</p>
 <p className="text-sm font-medium text-green-600/70 truncate max-w-[200px]">{serviceSampleImage.name}</p>
 </div>
 ) : (
 <div className="flex flex-col items-center space-y-3 pointer-events-none">
 <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all group-hover:bg-red-50 group-hover:text-red-500">
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
 </div>
 <div>
 <p className="font-bold text-gray-700">Attach a sample image</p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="pt-6 mt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-4">
 <button
 type="submit"
 disabled={applyMutation.isPending || isUploading}
 className="w-full sm:flex-1 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all text-lg disabled:opacity-50 disabled:transform-none"
 >
 Submit Application
 </button>
 <button
 type="button"
 onClick={() => navigate('/campus-hub')}
 className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
 >
 Cancel
 </button>
 </div>
 </div>
 </form>
 </div>
 );
};

export default ApplyAsProvider;
