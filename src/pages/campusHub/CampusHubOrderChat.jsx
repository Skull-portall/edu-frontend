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
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  quoted: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
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
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
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

        // Simple type detection
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
      // Restore inputs if failed
      setMessage(variables.textToSend || '');
      setFile(variables.fileToSend || null);
      toast.error(err.message || err.response?.data?.message || 'Failed to send message');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ statusText, quotedPrice }) => campusHubAPI.updateOrderStatus(orderId, { status: statusText, quotedPrice }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['campusHubOrder', orderId]);
      if (variables.statusText === 'cancelled') toast.success('Order has been cancelled.');
      else if (variables.statusText === 'completed') toast.success('Order marked as completed.');
      else if (variables.statusText === 'quoted') {
        toast.success('Quotation submitted successfully!');
        setShowQuoteModal(false);
      }
      else toast.success('Order updated successfully!');
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

    // Set Optimistic UI instantly
    setOptimisticMessage({
      content: trimmed,
      attachmentType: file ? (file.type.startsWith('image/') ? 'image' : 'raw') : null,
      attachmentPreview: file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      attachmentName: file ? file.name : null,
      createdAt: new Date()
    });

    const textToSend = trimmed;
    const fileToSend = file;

    // Clear physical inputs instantly for snappy experience
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
      if (selected.size > 10 * 1024 * 1024) { // 10MB limit
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
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Order not found.</p>
        <button onClick={() => navigate('/campus-hub/orders')} className="mt-4 text-red-600 font-medium">Back to Orders</button>
      </div>
    );
  }

  const isProvider = (order.provider?._id || order.provider?.id) === (user?._id || user?.id);
  const counterparty = isProvider ? order.student : order.provider;
  const serviceTitle = order.service?.title || 'Service';
  const meUser = isProvider ? order.provider : order.student;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100vh-8rem)] w-full sm:px-6 lg:px-8 py-0 md:py-6 bg-white md:bg-transparent relative">
      <div className="flex items-center gap-2 md:gap-4 p-3 md:p-0 md:mb-4 md:pb-4 border-b border-gray-200 sticky top-0 bg-white z-10 shadow-sm md:shadow-none">
        <button
          onClick={() => navigate('/campus-hub/orders')}
          className="text-gray-600 hover:text-gray-900 p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex -space-x-2">
            {/* My Avatar */}
            <div
              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${meUser?._id || meUser?.id}`); }}
              className="cursor-pointer hover:opacity-80 transition-opacity z-10"
              title="View my profile"
            >
              {meUser?.profilePicture ? (
                <img src={getImageUrl(meUser.profilePicture)} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold ring-2 ring-white">{meUser?.name?.charAt(0) || '?'}</div>
              )}
            </div>
            {/* Counterparty Avatar */}
            <div
              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${counterparty?._id || counterparty?.id}`); }}
              className="cursor-pointer hover:opacity-80 transition-opacity z-20"
              title={`View ${counterparty?.name}'s profile`}
            >
              {counterparty?.profilePicture ? (
                <img src={getImageUrl(counterparty.profilePicture)} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold ring-2 ring-white">{counterparty?.name?.charAt(0) || '?'}</div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowOrderDetails(true)}>
            <h1 className="text-lg font-bold text-gray-900 truncate hover:text-red-600">{serviceTitle}</h1>
            <p className="text-sm text-gray-500 truncate">Chat with {counterparty?.name || '—'} · Click to view order details</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {((order.status === 'pending' || order.status === 'quoted') && isProvider) && (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mr-1 sm:mr-2 sm:border-r border-gray-200 sm:pr-3">
              <button
                onClick={() => {
                  setQuotePrice(order.quotedPrice || order.service?.price || '');
                  setShowQuoteModal(true);
                }}
                disabled={updateStatusMutation.isPending}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-[10px] sm:text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {order.status === 'quoted' ? 'UPDATE QUOTE' : 'SUBMIT QUOTE'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to decline this request?')) {
                    updateStatusMutation.mutate({ statusText: 'cancelled' });
                  }
                }}
                disabled={updateStatusMutation.isPending}
                className="px-2 sm:px-3 py-1 bg-gray-500 text-white text-[10px] sm:text-xs font-bold rounded hover:bg-gray-600 disabled:opacity-50"
              >
                DECLINE
              </button>
            </div>
          )}

          {order.status === 'quoted' && !isProvider && (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mr-1 sm:mr-2 sm:border-r border-gray-200 sm:pr-3">
              <button
                onClick={() => updateStatusMutation.mutate({ statusText: 'accepted' })}
                disabled={updateStatusMutation.isPending}
                className="px-2 sm:px-3 py-1 bg-green-600 text-white text-[10px] sm:text-xs font-bold rounded hover:bg-green-700 disabled:opacity-50"
              >
                ACCEPT QUOTE (₦{Number(order.quotedPrice).toLocaleString()})
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Decline this quotation?')) {
                    updateStatusMutation.mutate({ statusText: 'cancelled' });
                  }
                }}
                disabled={updateStatusMutation.isPending}
                className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 text-[10px] sm:text-xs font-bold rounded disabled:opacity-50 border border-red-200"
              >
                REJECT
              </button>
            </div>
          )}

          {(order.status === 'accepted' || order.status === 'in_progress') && isProvider && (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mr-1 sm:mr-2 sm:border-r border-gray-200 sm:pr-3">
              {order.status === 'accepted' && (
                <button
                  onClick={() => updateStatusMutation.mutate({ statusText: 'in_progress' })}
                  disabled={updateStatusMutation.isPending}
                  className="px-2 sm:px-3 py-1 bg-amber-600 text-white text-[10px] sm:text-xs font-bold rounded hover:bg-amber-700 disabled:opacity-50"
                >
                  START SERVICE
                </button>
              )}
              <button
                onClick={() => {
                  if (window.confirm('Mark this service as completed?')) {
                    updateStatusMutation.mutate({ statusText: 'completed' });
                  }
                }}
                disabled={updateStatusMutation.isPending}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-[10px] sm:text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50 shadow-sm"
              >
                COMPLETE
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this order?')) {
                    updateStatusMutation.mutate({ statusText: 'cancelled' });
                  }
                }}
                disabled={updateStatusMutation.isPending}
                className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 text-[10px] sm:text-xs font-bold rounded disabled:opacity-50 border border-red-200"
              >
                CANCEL
              </button>
            </div>
          )}
          <span className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full border shadow-sm flex-shrink-0 ${statusColors[order.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
             {order.status?.toUpperCase().replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 md:rounded-xl p-3 sm:p-4 space-y-3 min-h-0 bg-[url('/images/chat-bg.png')] bg-opacity-50 bg-repeat">
        {messagesLoading && messages.length === 0 ? (
          <div className="flex justify-center py-8"><Loader /></div>
        ) : (
          messages.map((msg) => {
            const isMe = (msg.sender?._id || msg.sender?.id) === (user?._id || user?.id);
            const avatarUrl = msg.sender?.profilePicture ? getImageUrl(msg.sender.profilePicture) : null;
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isMe && (
                  <div
                    onClick={() => navigate(`/profile/${msg.sender?._id || msg.sender?.id}`)}
                    className="cursor-pointer hover:opacity-80 transition-opacity shrink-0 mt-1"
                    title={`View ${msg.sender?.name}'s profile`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover block" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{msg.sender?.name?.charAt(0) || '?'}</div>
                    )}
                  </div>
                )}
                <div className={`max-w-[75%] rounded-lg px-4 py-2 ${isMe ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                  <p
                    className="text-sm font-medium opacity-90 cursor-pointer hover:underline mb-1"
                    onClick={() => !isMe && navigate(`/profile/${msg.sender?._id || msg.sender?.id}`)}
                  >
                    {!isMe && (msg.sender?.name || 'User')}
                  </p>

                  {msg.attachment && (
                    <div className="mt-1 mb-2">
                      {msg.attachmentType === 'image' ? (
                        <div onClick={() => setPreviewImage(msg.attachment)}>
                          <img src={msg.attachment} alt="attachment" className="max-w-full rounded-lg max-h-60 object-contain cursor-pointer hover:opacity-90 transition-opacity bg-black/5" />
                        </div>
                      ) : (
                        <a
                          href={msg.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-3 rounded-lg border ${isMe ? 'border-red-400 bg-red-700/30 text-white hover:bg-red-700/50' : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'} transition-colors inline-flex max-w-full`}
                        >
                          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          <span className="text-sm font-medium underline break-all line-clamp-1">View Attached File</span>
                        </a>
                      )}
                    </div>
                  )}

                  {msg.content && <p className="break-words whitespace-pre-wrap">{msg.content}</p>}
                  <p className={`text-xs mt-1 ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                {isMe && (
                  user?.profilePicture ? (
                    <img src={getImageUrl(user.profilePicture)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-xs font-bold text-red-700 flex-shrink-0 mt-1">{user?.name?.charAt(0) || '?'}</div>
                  )
                )}
              </div>
            );
          })
        )}

        {optimisticMessage && (
          <div className="flex justify-end gap-2 opacity-60 animate-pulse">
            <div className="max-w-[75%] rounded-lg px-4 py-2 bg-red-600 text-white shadow-sm border border-red-500">
              <p className="text-sm font-medium opacity-90 mb-1">Sending...</p>

              {(optimisticMessage.attachmentPreview || optimisticMessage.attachmentName) && (
                <div className="mt-1 mb-2">
                  {optimisticMessage.attachmentType === 'image' && optimisticMessage.attachmentPreview ? (
                    <img src={optimisticMessage.attachmentPreview} alt="uploading preview" className="max-w-full rounded-lg max-h-60 object-contain bg-black/5" />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-red-400 bg-red-700/30 text-white inline-flex max-w-full">
                      <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      <span className="text-sm font-medium underline break-all line-clamp-1">{optimisticMessage.attachmentName || 'Uploading File...'}</span>
                    </div>
                  )}
                </div>
              )}

              {optimisticMessage.content && <p className="break-words whitespace-pre-wrap">{optimisticMessage.content}</p>}
              <p className="text-xs mt-1 text-red-100">
                {new Date(optimisticMessage.createdAt).toLocaleTimeString()}
              </p>
            </div>
            {user?.profilePicture ? (
              <img src={getImageUrl(user.profilePicture)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-xs font-bold text-red-700 flex-shrink-0 mt-1">{user?.name?.charAt(0) || '?'}</div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Warning Banners */}
      <div className="shrink-0 px-3 md:px-0 bg-white md:bg-transparent">
        {order.status === 'pending' && !isProvider && (
          <div className="mt-2 flex items-center gap-2 text-xs md:text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-100">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p>Order is waiting for provider's approval, but you can still chat to discuss details.</p>
          </div>
        )}
        {order.status === 'pending' && isProvider && (
          <div className="mt-2 flex items-center gap-2 text-xs md:text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-100">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p>Review chat or Accept the request at the top right to start the service.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="shrink-0 flex flex-col gap-2 w-full p-3 md:p-0 md:mt-4 bg-white md:bg-transparent border-t border-gray-200 md:border-none relative">
        {file && (
          <div className="relative inline-block border border-gray-200 rounded-xl p-2 bg-gray-50 max-w-[200px] sm:max-w-xs shadow-sm self-start">
            <button
              type="button"
              onClick={removeFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            {file.type.startsWith('image/') ? (
              <img src={URL.createObjectURL(file)} alt="preview" className="max-h-24 w-full rounded object-contain" />
            ) : (
              <div className="flex items-center gap-2 p-2 px-3 overflow-hidden">
                <svg className="w-8 h-8 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-row gap-2 relative items-end w-full">
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
            className="p-2.5 md:p-3 text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-full transition-colors shrink-0 mb-[2px]"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
          </button>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 md:py-3.5 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none shadow-sm resize-none min-h-[48px] max-h-32"
            maxLength={2000}
            rows={1}
            disabled={order.status === 'cancelled'}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
            }}
          />
          <button
            type="submit"
            disabled={(!message.trim() && !file) || sendMutation.isPending || uploading || order.status === 'cancelled'}
            className="px-5 py-3 md:py-3.5 bg-red-600 text-white rounded-full hover:bg-red-700 font-medium disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center shrink-0 mb-[2px] min-h-[48px] w-[50px] md:w-auto"
          >
            {uploading || sendMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                <span className="hidden md:inline">Send</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Order details modal */}
      {showOrderDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowOrderDetails(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button onClick={() => setShowOrderDetails(false)} className="text-gray-500 hover:text-gray-700 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Service</h3>
                <p className="font-semibold text-gray-900">{order.service?.title}</p>
                <p className="text-sm text-gray-600 mt-1">{order.service?.description}</p>
                <p className="text-red-600 font-bold mt-2">₦{Number(order.service?.price || 0).toLocaleString('en-NG')}</p>
              </div>
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {order.status?.toUpperCase().replace('_', ' ')}
                </span>
              </div>
              {order.notes && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1 italic">Student Requirements</h3>
                  <p className="text-sm font-bold text-gray-900 leading-relaxed italic">"{order.notes}"</p>
                </div>
              )}
              {order.deadline && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Desired Deadline</h3>
                  <p className="text-sm font-black text-gray-900 uppercase italic">{new Date(order.deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              )}
               {order.status === 'quoted' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">Current Quotation</h3>
                  <p className="text-xl font-black text-blue-600 italic">₦{Number(order.quotedPrice).toLocaleString()}</p>
                </div>
              )}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Service Provider</h3>
                <div className="flex items-center gap-3">
                  {order.provider?.profilePicture ? (
                    <img src={getImageUrl(order.provider.profilePicture)} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">{order.provider?.name?.charAt(0) || 'P'}</div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{order.provider?.name}</p>
                    <p className="text-sm text-gray-500">{order.provider?.email}</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Student (Customer)</h3>
                <div className="flex items-center gap-3">
                  {order.student?.profilePicture ? (
                    <img src={getImageUrl(order.student.profilePicture)} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">{order.student?.name?.charAt(0) || 'S'}</div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{order.student?.name}</p>
                    <p className="text-sm text-gray-500">{order.student?.email}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">Order created: {new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Provider Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up border border-gray-100">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Set <span className="text-red-600">Quote</span></h2>
                  <p className="text-sm text-gray-500 font-medium">Final price for this request</p>
                </div>
                <button onClick={() => setShowQuoteModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 italic">Quoted Price (₦)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-5 text-gray-400 font-black italic">₦</span>
                    <input
                      type="number"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-5 py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-red-500 focus:bg-white transition-all text-xl font-black placeholder-gray-200"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={() => setShowQuoteModal(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ statusText: 'quoted', quotedPrice: quotePrice })}
                    disabled={updateStatusMutation.isPending || !quotePrice}
                    className="flex-2 w-2/3 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                  >
                    {updateStatusMutation.isPending ? 'Sending...' : 'Send Quote'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4" onClick={() => setPreviewImage(null)}>
          <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full transition-colors z-[70]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img src={previewImage} alt="Fullscreen Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl relative z-[65]" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default CampusHubOrderChat;
