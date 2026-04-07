import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

import { getImageUrl } from '../../utils/imageUrl';
import { uploadToCloudinary } from '../../utils/cloudinary';

const statusColors = {
 pending: 'bg-amber-100/50 text-amber-700 border-amber-200',
 in_progress: 'bg-blue-100/50 text-blue-700 border-blue-200',
 completed: 'bg-emerald-100/50 text-emerald-700 border-emerald-200',
 cancelled: 'bg-gray-100/50 text-gray-700 border-gray-200',
};

const CampusHubOrderChat = () => {
 const { orderId } = useParams();
 const navigate = useNavigate();
 const { user } = useAuth();
 const queryClient = useQueryClient();
 const [message, setMessage] = useState('');
 const [file, setFile] = useState(null);
 const [uploading, setUploading] = useState(false);
 const [showOrderDetails, setShowOrderDetails] = useState(false);
 const [previewImage, setPreviewImage] = useState(null);
 const [optimisticMessage, setOptimisticMessage] = useState(null);
 const messagesEndRef = useRef(null);
 const fileInputRef = useRef(null);

 const { data: order, isLoading: orderLoading } = useQuery({
 queryKey: ['campusHubOrder', orderId],
 queryFn: async () => {
 const res = await campusHubAPI.getOrderById(orderId);
 return res.data.data;
 },
 enabled: !!orderId,
 });

 const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
 queryKey: ['campusHubChat', orderId],
 queryFn: async () => {
 const res = await campusHubAPI.getChatMessages(orderId);
 return res.data.data || [];
 },
 enabled: !!orderId,
 refetchInterval: 5000,
 });

 const sendMutation = useMutation({
 mutationFn: async ({ textToSend, fileToSend }) => {
 let attachmentUrl = null;
 let attachmentType = null;

 if (fileToSend) {
 setUploading(true);
 attachmentUrl = await uploadToCloudinary(fileToSend);

 if (fileToSend.type.startsWith('image/')) {
 attachmentType = 'image';
 } else if (fileToSend.type.startsWith('video/')) {
 attachmentType = 'video';
 } else {
 attachmentType = 'raw';
 }
 setUploading(false);
 }

 return campusHubAPI.sendChatMessage(orderId, {
 content: textToSend,
 attachment: attachmentUrl,
 attachmentType
 });
 },
 onSuccess: () => {
 setOptimisticMessage(null);
 queryClient.invalidateQueries(['campusHubChat', orderId]);
 refetchMessages();
 },
 onError: (err, variables) => {
 setUploading(false);
 setOptimisticMessage(null);
 setMessage(variables.textToSend || '');
 setFile(variables.fileToSend || null);
 toast.error(err.message || err.response?.data?.message || 'Failed to send message');
 },
 });

 const updateStatusMutation = useMutation({
 mutationFn: (statusText) => campusHubAPI.updateOrderStatus(orderId, statusText),
 onSuccess: (data, statusText) => {
 queryClient.invalidateQueries(['campusHubOrder', orderId]);
 if (statusText === 'cancelled') toast.success('Order has been cancelled.');
 else if (statusText === 'completed') toast.success('Order marked as completed.');
 else toast.success('Order accepted successfully!');
 },
 onError: (err) => {
 toast.error(err.response?.data?.message || 'Failed to update order status');
 },
 });

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages]);

 const handleSend = (e) => {
 if (e) e.preventDefault();
 const trimmed = message.trim();
 if (!trimmed && !file) return;

 setOptimisticMessage({
 content: trimmed,
 attachmentType: file ? (file.type.startsWith('image/') ? 'image' : 'raw') : null,
 attachmentPreview: file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
 attachmentName: file ? file.name : null,
 createdAt: new Date()
 });

 const textToSend = trimmed;
 const fileToSend = file;

 setMessage('');
 setFile(null);
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }

 sendMutation.mutate({ textToSend, fileToSend });
 };

 const handleFileChange = (e) => {
 const selected = e.target.files[0];
 if (selected) {
 if (selected.size > 10 * 1024 * 1024) { 
 toast.error('File size must be less than 10MB');
 return;
 }
 setFile(selected);
 }
 };

 const removeFile = () => {
 setFile(null);
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }
 };

 if (orderLoading && !order) return <Loader />;
 if (!order) {
 return (
 <div className="max-w-2xl mx-auto px-4 py-16 text-center">
 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
 </div>
 <p className="text-gray-500 font-medium text-lg">Order not found or you don't have access.</p>
 <button onClick={() => navigate('/campus-hub/orders')} className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">Back to Orders</button>
 </div>
 );
 }

 const isProvider = (order.provider?._id || order.provider?.id) === (user?._id || user?.id);
 const counterparty = isProvider ? order.student : order.provider;
 const serviceTitle = order.service?.title || 'Service';
 const meUser = isProvider ? order.provider : order.student;

 return (
 <div className="max-w-4xl mx-auto flex flex-col h-[calc(100dvh-4.5rem)] md:h-[calc(100vh-6rem)] w-full sm:px-6 lg:px-8 py-0 md:py-8 bg-gray-50/30 md:bg-transparent relative">
 
 {/* Header */}
 <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 md:p-6 bg-white border-b md:border md:rounded-t-[2rem] border-gray-100 sticky top-0 z-20 shadow-sm md:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
 <div className="flex items-center gap-4 min-w-0">
 <button
 onClick={() => navigate('/campus-hub/orders')}
 className="text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-2.5 rounded-xl transition-all shrink-0 border border-transparent hover:border-red-100"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
 </svg>
 </button>
 
 <div className="flex items-center gap-4 min-w-0 flex-1">
 <div className="flex -space-x-3 shrink-0">
 <div
 onClick={(e) => { e.stopPropagation(); navigate(`/profile/${meUser?._id || meUser?.id}`); }}
 className="cursor-pointer hover:scale-105 transition-transform z-10 relative"
 title="View my profile"
 >
 {meUser?.profilePicture ? (
 <img src={getImageUrl(meUser.profilePicture)} alt="" className="w-12 h-12 rounded-full object-cover ring-4 ring-white shadow-sm" />
 ) : (
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center text-red-700 font-bold ring-4 ring-white shadow-sm">{meUser?.name?.charAt(0) || 'U'}</div>
 )}
 <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
 </div>
 <div
 onClick={(e) => { e.stopPropagation(); navigate(`/profile/${counterparty?._id || counterparty?.id}`); }}
 className="cursor-pointer hover:scale-105 transition-transform z-20 relative"
 title={`View ${counterparty?.name}'s profile`}
 >
 {counterparty?.profilePicture ? (
 <img src={getImageUrl(counterparty.profilePicture)} alt="" className="w-12 h-12 rounded-full object-cover ring-4 ring-white shadow-sm" />
 ) : (
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold ring-4 ring-white shadow-sm">{counterparty?.name?.charAt(0) || 'C'}</div>
 )}
 </div>
 </div>
 
 <div className="min-w-0 flex-1 cursor-pointer group" onClick={() => setShowOrderDetails(true)}>
 <div className="flex items-center gap-2">
 <h1 className="text-lg md:text-xl font-extrabold text-gray-900 truncate group-hover:text-red-600 transition-colors leading-tight">{serviceTitle}</h1>
 <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
 </div>
 <p className="text-sm font-medium text-gray-500 truncate">
 <span className="text-gray-400">Order with</span> <span className="text-gray-700 font-bold">{counterparty?.name || '—'}</span>
 </p>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-none border-gray-100">
 <span className={`px-4 py-1.5 text-[11px] font-black tracking-widest uppercase border rounded-xl flex items-center gap-2 shadow-sm ${statusColors[order.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
 <span className={`w-2 h-2 rounded-full ${order.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : order.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
 {order.status === 'in_progress' ? 'Active' : order.status}
 </span>

 {isProvider && (
 <div className="flex items-center gap-2">
 {order.status === 'pending' && (
 <>
 <button
 onClick={() => updateStatusMutation.mutate('in_progress')}
 disabled={updateStatusMutation.isPending}
 className="px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 disabled:opacity-50 shadow-sm transition-colors"
 >
 {updateStatusMutation.isPending ? 'Processing...' : 'Accept'}
 </button>
 <button
 onClick={() => {
 if (window.confirm('Are you sure you want to decline this request?')) {
 updateStatusMutation.mutate('cancelled');
 }
 }}
 disabled={updateStatusMutation.isPending}
 className="px-4 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 transition-colors"
 >
 Decline
 </button>
 </>
 )}
 {order.status === 'in_progress' && (
 <>
 <button
 onClick={() => {
 if (window.confirm('Mark this service as completed?')) {
 updateStatusMutation.mutate('completed');
 }
 }}
 disabled={updateStatusMutation.isPending}
 className="px-4 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 disabled:opacity-50 shadow-sm transition-colors"
 >
 Complete Check
 </button>
 <button
 onClick={() => {
 if (window.confirm('Are you sure you want to cancel this active order?')) {
 updateStatusMutation.mutate('cancelled');
 }
 }}
 disabled={updateStatusMutation.isPending}
 className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
 >
 Cancel
 </button>
 </>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Warning Banners */}
 <div className="shrink-0 bg-white md:bg-transparent">
 {order.status === 'pending' && !isProvider && (
 <div className="md:px-2 md:pt-2">
 <div className="flex items-center gap-3 text-sm text-yellow-700 bg-yellow-50/80 backdrop-blur-md px-5 py-3 md:rounded-xl border-y md:border border-yellow-200/50 shadow-sm">
 <svg className="w-5 h-5 shrink-0 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
 <p className="font-medium">Waiting for provider's approval. You can message them below to discuss details.</p>
 </div>
 </div>
 )}
 {order.status === 'pending' && isProvider && (
 <div className="md:px-2 md:pt-2">
 <div className="flex items-center gap-3 text-sm text-blue-700 bg-blue-50/80 backdrop-blur-md px-5 py-3 md:rounded-xl border-y md:border border-blue-200/50 shadow-sm">
 <svg className="w-5 h-5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
 <p className="font-medium">New request! Chat to clarify details, then Accept or Decline using the buttons above.</p>
 </div>
 </div>
 )}
 </div>

 {/* Chat Area */}
 <div className="flex-1 overflow-y-auto bg-[#F9FAFB] md:bg-white md:border-x border-gray-100 p-4 sm:p-6 space-y-6 min-h-0 relative">
 {/* Subtle patterned background */}
 <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

 {messagesLoading && messages.length === 0 ? (
 <div className="flex justify-center items-center h-full"><Loader /></div>
 ) : messages.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full text-center px-4 relative z-10">
 <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-red-100">
 <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
 </div>
 <h3 className="text-xl font-extrabold text-gray-900 mb-2">No messages yet</h3>
 <p className="text-gray-500 max-w-sm">Start the conversation by saying hi and discussing the service requirements.</p>
 </div>
 ) : (
 <div className="relative z-10 space-y-6">
 {messages.map((msg, idx) => {
 const isMe = (msg.sender?._id || msg.sender?.id) === (user?._id || user?.id);
 const avatarUrl = msg.sender?.profilePicture ? getImageUrl(msg.sender.profilePicture) : null;
 const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id);

 return (
 <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-3 items-end`}>
 {!isMe && (
 <div className="w-10 shrink-0">
 {showAvatar && (
 <div
 onClick={() => navigate(`/profile/${msg.sender?._id || msg.sender?.id}`)}
 className="cursor-pointer hover:opacity-80 transition-opacity"
 title={msg.sender?.name}
 >
 {avatarUrl ? (
 <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100" />
 ) : (
 <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 shadow-sm border border-gray-100">{msg.sender?.name?.charAt(0) || '?'}</div>
 )}
 </div>
 )}
 </div>
 )}
 
 <div className={`max-w-[75%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
 <div className={`rounded-[1.5rem] px-5 py-3.5 shadow-sm relative group
 ${isMe 
 ? 'bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-br-md' 
 : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]'}`}
 >
 {msg.attachment && (
 <div className={`mt-1 ${msg.content ? 'mb-3' : 'mb-1'}`}>
 {msg.attachmentType === 'image' ? (
 <div onClick={() => setPreviewImage(msg.attachment)} className="relative overflow-hidden rounded-xl cursor-pointer group/img">
 <img src={msg.attachment} alt="attachment" className="max-w-full max-h-64 object-cover transform group-hover/img:scale-105 transition-transform duration-500" />
 <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
 <div className="opacity-0 group-hover/img:opacity-100 bg-white/90 text-gray-900 rounded-full p-2 backdrop-blur-sm transform scale-90 group-hover/img:scale-100 transition-all">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
 </div>
 </div>
 </div>
 ) : (
 <a
 href={msg.attachment}
 target="_blank"
 rel="noopener noreferrer"
 className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'border-red-400 bg-red-700/50 text-white hover:bg-red-800/50' : 'border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100'} transition-all`}
 >
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-white shadow-sm border border-gray-200'}`}>
 <svg className={`w-5 h-5 ${isMe ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
 </div>
 <span className="text-sm font-bold truncate">Download Attachment</span>
 </a>
 )}
 </div>
 )}

 {msg.content && <p className="break-words whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>}
 </div>

 <p className={`text-[11px] font-bold tracking-widest uppercase mt-2 px-1 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
 {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>
 );
 })}

 {optimisticMessage && (
 <div className="flex justify-end gap-3 items-end opacity-60">
 <div className="max-w-[75%] md:max-w-[65%] flex flex-col items-end">
 <div className="rounded-[1.5rem] px-5 py-3.5 shadow-sm bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-br-md relative overflow-hidden">
 <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
 
 {(optimisticMessage.attachmentPreview || optimisticMessage.attachmentName) && (
 <div className={`mt-1 relative z-10 ${optimisticMessage.content ? 'mb-3' : 'mb-1'}`}>
 {optimisticMessage.attachmentType === 'image' && optimisticMessage.attachmentPreview ? (
 <div className="relative overflow-hidden rounded-xl">
 <img src={optimisticMessage.attachmentPreview} alt="" className="max-w-full max-h-64 object-cover" />
 </div>
 ) : (
 <div className="flex items-center gap-3 p-3 rounded-xl border border-red-400 bg-red-700/50 text-white">
 <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
 </div>
 <span className="text-sm font-bold truncate w-24">Uploading...</span>
 </div>
 )}
 </div>
 )}
 {optimisticMessage.content && <p className="break-words whitespace-pre-wrap leading-relaxed text-[15px] relative z-10">{optimisticMessage.content}</p>}
 </div>
 <p className="text-[11px] font-bold tracking-widest uppercase mt-2 px-1 text-gray-400">Sending...</p>
 </div>
 </div>
 )}
 
 <div ref={messagesEndRef} className="h-2" />
 </div>
 )}
 </div>

 {/* Input Area */}
 <div className="shrink-0 bg-white md:border md:rounded-b-[2rem] border-gray-200 border-t shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.02)] relative z-20">
 
 {/* Selected file preview */}
 {file && (
 <div className="px-5 pt-4 pb-2">
 <div className="relative inline-flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-xl max-w-full">
 <button
 type="button"
 onClick={removeFile}
 className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1.5 shadow-md hover:bg-black z-10 transition-transform hover:scale-110"
 >
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
 </button>
 
 {file.type.startsWith('image/') ? (
 <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-white">
 <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
 </div>
 ) : (
 <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
 <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
 </div>
 )}
 <div className="pr-3 overflow-hidden">
 <p className="text-sm font-bold text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">{file.name}</p>
 <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
 </div>
 </div>
 </div>
 )}

 <form onSubmit={handleSend} className="p-3 sm:p-4">
 <div className="flex flex-row items-end gap-3 w-full bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:ring-4 focus-within:ring-red-500/10 focus-within:border-red-400 focus-within:bg-white transition-all shadow-sm">
 <input
 type="file"
 ref={fileInputRef}
 onChange={handleFileChange}
 className="hidden"
 accept="image/*,application/pdf,.doc,.docx,.zip,.txt"
 />
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 disabled={order.status === 'cancelled' || uploading}
 className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all shrink-0 mb-[2px] shadow-sm disabled:opacity-50"
 title="Attach file"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
 </svg>
 </button>

 <textarea
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 placeholder="Type your message here..."
 className="flex-1 py-3 px-2 bg-transparent outline-none resize-none min-h-[52px] max-h-32 text-gray-900 placeholder-gray-400 font-medium"
 maxLength={2000}
 rows={1}
 disabled={order.status === 'cancelled'}
 onInput={(e) => {
 e.target.style.height = 'auto';
 e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
 }}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 if ((message.trim() || file) && !uploading && !sendMutation.isPending && order.status !== 'cancelled') {
 handleSend();
 }
 }
 }}
 />

 <button
 type="submit"
 disabled={(!message.trim() && !file) || sendMutation.isPending || uploading || order.status === 'cancelled'}
 className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full hover:shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all shrink-0 mb-[2px] disabled:opacity-50 disabled:hover:transform-none disabled:shadow-none"
 >
 {uploading || sendMutation.isPending ? (
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
 ) : (
 <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
 )}
 </button>
 </div>
 </form>
 </div>

 {/* Order details modal */}
 {showOrderDetails && (
 <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowOrderDetails(false)}>
 <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col transform scale-100 animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
 <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
 <h2 className="text-xl font-extrabold text-gray-900">Order Information</h2>
 <button onClick={() => setShowOrderDetails(false)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
 </button>
 </div>
 
 <div className="p-6 overflow-y-auto w-full">
 <div className="mb-8">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-yellow-200 mb-3">
 {order.service?.category || 'Service'}
 </div>
 <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2">{order.service?.title}</h3>
 <p className="text-sm text-gray-500 font-medium leading-relaxed mb-4">{order.service?.description}</p>
 <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex justify-between items-center">
 <span className="text-sm font-bold text-red-800">Agreed Price</span>
 <span className="text-2xl font-black text-red-600">₦{Number(order.service?.price || 0).toLocaleString('en-NG')}</span>
 </div>
 </div>
 
 <div className="space-y-4">
 <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
 <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Service Provider</h3>
 <div className="flex items-center gap-4">
 {order.provider?.profilePicture ? (
 <img src={getImageUrl(order.provider.profilePicture)} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-100" />
 ) : (
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center text-red-700 font-bold shadow-inner">{order.provider?.name?.charAt(0) || 'P'}</div>
 )}
 <div>
 <p className="font-extrabold text-gray-900 truncate">{order.provider?.name}</p>
 <p className="text-xs font-medium text-gray-500 truncate">{order.provider?.email}</p>
 </div>
 </div>
 </div>

 <div className="flex justify-center -my-2 relative z-10">
 <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
 </div>
 </div>
 
 <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
 <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Client (Student)</h3>
 <div className="flex items-center gap-4">
 {order.student?.profilePicture ? (
 <img src={getImageUrl(order.student.profilePicture)} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-100" />
 ) : (
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold shadow-inner">{order.student?.name?.charAt(0) || 'S'}</div>
 )}
 <div>
 <p className="font-extrabold text-gray-900 truncate">{order.student?.name}</p>
 <p className="text-xs font-medium text-gray-500 truncate">{order.student?.email}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center">
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
 <span className={`px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg border ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
 {order.status === 'in_progress' ? 'ACTIVE' : order.status}
 </span>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Fullscreen Image Preview modal */}
 {previewImage && (
 <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-md flex items-center justify-center z-[60] p-4 md:p-10" onClick={() => setPreviewImage(null)}>
 <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all z-[70] backdrop-blur-sm">
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
 </button>
 <img src={previewImage} alt="Fullscreen Preview" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl relative z-[65] border border-white/10" onClick={(e) => e.stopPropagation()} />
 </div>
 )}
 </div>
 );
};

export default CampusHubOrderChat;
