import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

import { getImageUrl } from '../../utils/imageUrl';

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const CampusHubOrderChat = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const messagesEndRef = useRef(null);

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
    mutationFn: () => campusHubAPI.sendChatMessage(orderId, message),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries(['campusHubChat', orderId]);
      refetchMessages();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send message');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate();
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

  const isProvider = user?.role === 'provider';
  const counterparty = isProvider ? order.student : order.provider;
  const serviceTitle = order.service?.title || 'Service';
  const meUser = isProvider ? order.provider : order.student;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
        <button
          onClick={() => navigate('/campus-hub/orders')}
          className="text-gray-600 hover:text-gray-900 p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div className="flex flex-1 items-center gap-3 min-w-0 cursor-pointer" onClick={() => setShowOrderDetails(true)}>
          <div className="flex -space-x-2">
            {meUser?.profilePicture ? (
              <img src={getImageUrl(meUser.profilePicture)} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold ring-2 ring-white">{meUser?.name?.charAt(0) || '?'}</div>
            )}
            {counterparty?.profilePicture ? (
              <img src={getImageUrl(counterparty.profilePicture)} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold ring-2 ring-white">{counterparty?.name?.charAt(0) || '?'}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate hover:text-red-600">{serviceTitle}</h1>
            <p className="text-sm text-gray-500 truncate">Chat with {counterparty?.name || '—'} · Click to view order details</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 space-y-3 min-h-0">
        {messagesLoading && messages.length === 0 ? (
          <div className="flex justify-center py-8"><Loader /></div>
        ) : (
          messages.map((msg) => {
            const isMe = (msg.sender?._id || msg.sender?.id) === (user?._id || user?.id);
            const avatarUrl = msg.sender?.profilePicture ? getImageUrl(msg.sender.profilePicture) : null;
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isMe && (
                  avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mt-1">{msg.sender?.name?.charAt(0) || '?'}</div>
                  )
                )}
                <div className={`max-w-[75%] rounded-lg px-4 py-2 ${isMe ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                  <p className="text-sm font-medium opacity-90">{!isMe && (msg.sender?.name || 'User')}</p>
                  <p className="break-words">{msg.content}</p>
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
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!message.trim() || sendMutation.isLoading}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
        >
          Send
        </button>
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
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.open}`}>
                  {order.status?.replace('_', ' ')}
                </span>
              </div>
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
    </div>
  );
};

export default CampusHubOrderChat;
