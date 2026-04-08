import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';
import { uploadToCloudinary } from '../../utils/cloudinary';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400' },
  in_progress: { label: 'Active',      bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  completed:   { label: 'Completed',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400' },
  cancelled:   { label: 'Cancelled',   bg: 'bg-gray-100',  text: 'text-gray-600',   border: 'border-gray-200',   dot: 'bg-gray-400' },
};

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function groupMessagesByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const msg of messages) {
    const dateStr = new Date(msg.createdAt).toDateString();
    if (dateStr !== lastDate) {
      groups.push({ type: 'divider', date: msg.createdAt, key: `divider-${msg.createdAt}` });
      lastDate = dateStr;
    }
    groups.push({ type: 'message', msg, key: msg._id || msg._tempId });
  }
  return groups;
}

const CampusHubOrderChat = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['campusHubOrder', orderId],
    queryFn: async () => {
      const res = await campusHubAPI.getOrderById(orderId);
      return res.data.data;
    },
    enabled: !!orderId,
  });

  const { data: fetchedMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['campusHubChat', orderId],
    queryFn: async () => {
      const res = await campusHubAPI.getChatMessages(orderId);
      return res.data.data || [];
    },
    enabled: !!orderId,
    // No refetchInterval — WebSocket handles real-time
    staleTime: 30000,
  });

  // Sync fetched messages into local state (without duplicates)
  useEffect(() => {
    setLocalMessages(fetchedMessages);
  }, [fetchedMessages]);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !orderId) return;

    // Join the specific order chat room
    socket.emit('join_order_chat', orderId);
    setConnected(true);

    const handleNewMessage = (msg) => {
      if (msg.order?.toString() !== orderId && msg.order !== orderId) return;
      setLocalMessages(prev => {
        // Avoid duplicates by _id
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Mark as read via re-fetching (slight delay to debounce)
      queryClient.invalidateQueries({ queryKey: ['campusHubUnreadCount'] });
    };

    const handleTyping = (data) => {
      if (data.orderId === orderId && data.userId !== (user?._id || user?.id)) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on('new_chat_message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.emit('leave_order_chat', orderId);
      socket.off('new_chat_message', handleNewMessage);
      socket.off('typing', handleTyping);
      setConnected(false);
    };
  }, [socket, orderId, user?._id]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isTyping]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async ({ textToSend, fileToSend }) => {
      let attachmentUrl = null;
      let attachmentType = null;

      if (fileToSend) {
        setUploading(true);
        attachmentUrl = await uploadToCloudinary(fileToSend);
        if (fileToSend.type.startsWith('image/')) attachmentType = 'image';
        else if (fileToSend.type.startsWith('video/')) attachmentType = 'video';
        else attachmentType = 'raw';
        setUploading(false);
      }

      return campusHubAPI.sendChatMessage(orderId, {
        content: textToSend,
        attachment: attachmentUrl,
        attachmentType,
      });
    },
    onSuccess: (res) => {
      // The backend broadcasts via socket; just invalidate to keep in sync
      queryClient.invalidateQueries({ queryKey: ['campusHubChat', orderId] });
    },
    onError: (err) => {
      setUploading(false);
      toast.error(err.response?.data?.message || 'Failed to send message');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (statusText) => campusHubAPI.updateOrderStatus(orderId, statusText),
    onSuccess: (_, statusText) => {
      queryClient.invalidateQueries({ queryKey: ['campusHubOrder', orderId] });
      toast.success(
        statusText === 'cancelled' ? 'Order cancelled.' :
        statusText === 'completed' ? 'Order marked as completed! 🎉' :
        'Order accepted! 🚀'
      );
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const handleSend = useCallback((e) => {
    if (e) e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed && !file) return;

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      _tempId: tempId,
      content: trimmed,
      attachment: file ? URL.createObjectURL(file) : null,
      attachmentType: file ? (file.type.startsWith('image/') ? 'image' : 'raw') : null,
      attachmentName: file?.name,
      sender: { _id: user?._id, name: user?.name, profilePicture: user?.profilePicture },
      createdAt: new Date().toISOString(),
      _isOptimistic: true,
    };
    setLocalMessages(prev => [...prev, optimistic]);

    const textToSend = trimmed;
    const fileToSend = file;
    setMessage('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    sendMutation.mutate({ textToSend, fileToSend }, {
      onSuccess: (res) => {
        const real = res.data.data;
        setLocalMessages(prev => prev.map(m => m._id === tempId ? real : m));
      },
      onError: () => {
        setLocalMessages(prev => prev.filter(m => m._id !== tempId));
        setMessage(textToSend);
      }
    });
  }, [message, file, user, sendMutation]);

  const handleTypingEvent = useCallback(() => {
    if (!socket || !orderId) return;
    socket.emit('typing', { orderId, userId: user?._id });
  }, [socket, orderId, user?._id]);

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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (orderLoading && !order) return <Loader />;
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="w-20 h-20 bg-white rounded-3xl shadow flex items-center justify-center border border-gray-100">
          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <p className="text-gray-500 font-semibold text-lg">Order not found or you don't have access.</p>
        <button onClick={() => navigate('/campus-hub/orders')} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">Back to Orders</button>
      </div>
    );
  }

  const isProvider = (order.provider?._id || order.provider?.id) === (user?._id || user?.id);
  const counterparty = isProvider ? order.student : order.provider;
  const meUser = isProvider ? order.provider : order.student;
  const serviceTitle = order.service?.title || 'Service';
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isClosed = order.status === 'cancelled' || order.status === 'completed';

  const grouped = groupMessagesByDate(localMessages);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() => navigate('/campus-hub/orders')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </button>

          {/* Avatars */}
          <div className="flex -space-x-3 flex-shrink-0">
            <div className="relative z-10 cursor-pointer" onClick={() => navigate(`/profile/${meUser?._id || meUser?.id}`)}>
              {meUser?.profilePicture
                ? <img src={getImageUrl(meUser.profilePicture)} alt="" className="w-11 h-11 rounded-full object-cover ring-[3px] ring-white shadow-sm" />
                : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-black text-base ring-[3px] ring-white shadow-sm">{meUser?.name?.charAt(0) || '?'}</div>
              }
            </div>
            <div className="relative z-20 cursor-pointer" onClick={() => navigate(`/profile/${counterparty?._id || counterparty?.id}`)}>
              {counterparty?.profilePicture
                ? <img src={getImageUrl(counterparty.profilePicture)} alt="" className="w-11 h-11 rounded-full object-cover ring-[3px] ring-white shadow-sm" />
                : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-700 font-black text-base ring-[3px] ring-white shadow-sm">{counterparty?.name?.charAt(0) || '?'}</div>
              }
            </div>
          </div>

          {/* Title & subtitle */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowOrderDetails(true)}>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-gray-900 truncate hover:text-red-600 transition-colors">{serviceTitle}</h1>
              {connected && <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 animate-pulse" title="Live"></span>}
            </div>
            <p className="text-xs text-gray-400 font-medium truncate">
              {counterparty?.name || '—'} · <span className="hover:text-gray-600">Tap for order details</span>
            </p>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Action buttons */}
            {order.status === 'pending' && isProvider && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateStatusMutation.mutate('in_progress')}
                  disabled={updateStatusMutation.isPending}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-black rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                >ACCEPT</button>
                <button
                  onClick={() => { if (window.confirm('Decline this request?')) updateStatusMutation.mutate('cancelled'); }}
                  disabled={updateStatusMutation.isPending}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-black rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >DECLINE</button>
              </div>
            )}
            {order.status === 'in_progress' && isProvider && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => { if (window.confirm('Mark as completed?')) updateStatusMutation.mutate('completed'); }}
                  disabled={updateStatusMutation.isPending}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >COMPLETE</button>
                <button
                  onClick={() => { if (window.confirm('Cancel this order?')) updateStatusMutation.mutate('cancelled'); }}
                  disabled={updateStatusMutation.isPending}
                  className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 text-xs font-black rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >CANCEL</button>
              </div>
            )}

            <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Info banner */}
        {order.status === 'pending' && !isProvider && (
          <div className="bg-amber-50 border-t border-amber-100 px-4 py-2.5">
            <p className="text-xs text-amber-700 font-semibold text-center max-w-4xl mx-auto">⏳ Awaiting provider approval — feel free to message to discuss details.</p>
          </div>
        )}
        {order.status === 'pending' && isProvider && (
          <div className="bg-blue-50 border-t border-blue-100 px-4 py-2.5">
            <p className="text-xs text-blue-700 font-semibold text-center max-w-4xl mx-auto">🔔 New request! Discuss details, then Accept or Decline above.</p>
          </div>
        )}
        {order.status === 'completed' && (
          <div className="bg-emerald-50 border-t border-emerald-100 px-4 py-2.5">
            <p className="text-xs text-emerald-700 font-semibold text-center max-w-4xl mx-auto">✅ Order completed. This chat is now read-only.</p>
          </div>
        )}
        {order.status === 'cancelled' && (
          <div className="bg-gray-100 border-t border-gray-200 px-4 py-2.5">
            <p className="text-xs text-gray-600 font-semibold text-center max-w-4xl mx-auto">🚫 Order cancelled. This chat is now read-only.</p>
          </div>
        )}
      </div>

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto space-y-1">
        {messagesLoading && localMessages.length === 0 ? (
          <div className="flex justify-center items-center h-full"><Loader /></div>
        ) : localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-xl mb-1">Start the conversation</h3>
              <p className="text-gray-400 font-medium text-sm max-w-xs">Introduce yourself and discuss the service requirements with {counterparty?.name?.split(' ')[0] || 'the other party'}.</p>
            </div>
          </div>
        ) : (
          <>
            {grouped.map((item) => {
              if (item.type === 'divider') {
                return (
                  <div key={item.key} className="flex items-center gap-3 py-4">
                    <div className="flex-1 h-px bg-gray-100"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{formatDateDivider(item.date)}</span>
                    <div className="flex-1 h-px bg-gray-100"></div>
                  </div>
                );
              }

              const { msg } = item;
              const isMe = (msg.sender?._id || msg.sender?.id) === (user?._id || user?.id);
              const avatarUrl = msg.sender?.profilePicture ? getImageUrl(msg.sender.profilePicture) : null;

              return (
                <div key={item.key} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} mb-1`}>
                  {/* Avatar */}
                  {!isMe && (
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 mb-1 cursor-pointer"
                      onClick={() => navigate(`/profile/${msg.sender?._id || msg.sender?.id}`)}
                    >
                      {avatarUrl
                        ? <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-black text-gray-600">{msg.sender?.name?.charAt(0) || '?'}</div>
                      }
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`max-w-[72%] sm:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}>
                    <div className={`relative rounded-[1.5rem] px-4 py-3 shadow-sm
                      ${isMe
                        ? 'bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]'
                      }
                      ${msg._isOptimistic ? 'opacity-70' : ''}
                    `}>
                      {/* Attachment */}
                      {msg.attachment && (
                        <div className={`${msg.content ? 'mb-2' : ''}`}>
                          {msg.attachmentType === 'image' ? (
                            <div
                              onClick={() => !msg._isOptimistic && setPreviewImage(msg.attachment)}
                              className="relative overflow-hidden rounded-xl cursor-pointer group/img max-w-xs"
                            >
                              <img src={msg.attachment} alt="" className="max-h-56 w-full object-cover transform group-hover/img:scale-105 transition-transform duration-500 rounded-xl" />
                              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors rounded-xl flex items-center justify-center">
                                <div className="opacity-0 group-hover/img:opacity-100 bg-white/90 rounded-full p-2 backdrop-blur-sm scale-90 group-hover/img:scale-100 transition-all">
                                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={msg.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'border-white/20 bg-black/10 text-white hover:bg-black/20' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'} transition-all`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-white shadow-sm border border-gray-200'}`}>
                                <svg className={`w-5 h-5 ${isMe ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                              </div>
                              <span className="text-sm font-bold truncate">{msg.attachmentName || 'Download File'}</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Text */}
                      {msg.content && <p className="break-words whitespace-pre-wrap leading-relaxed text-[14.5px]">{msg.content}</p>}

                      {/* Uploading indicator */}
                      {msg._isOptimistic && (
                        <div className="absolute bottom-2 right-3">
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-1 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-black text-gray-500 flex-shrink-0">
                  {counterparty?.name?.charAt(0) || '?'}
                </div>
                <div className="bg-white border border-gray-100 rounded-[1.5rem] rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </>
        )}
      </div>

      {/* ── Input area ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.04)] z-20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* File preview */}
          {file && (
            <div className="mb-3 flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-2xl relative max-w-xs">
              <button
                type="button"
                onClick={removeFile}
                className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1.5 shadow hover:bg-black z-10 transition-transform hover:scale-110"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              {file.type.startsWith('image/') ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-gray-200 bg-white">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate max-w-[140px]">{file.name}</p>
                <p className="text-xs font-medium text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2.5">
            {/* Attach button */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf,.doc,.docx,.zip,.txt" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isClosed || uploading}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all flex-shrink-0 disabled:opacity-40 border border-transparent hover:border-red-100"
              title="Attach file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            </button>

            {/* Text input */}
            <div className="flex-1 bg-gray-50 border-2 border-gray-100 focus-within:border-red-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-100/50 rounded-[1.25rem] transition-all">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTypingEvent();
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                placeholder={isClosed ? 'This chat is closed.' : 'Type a message...'}
                className="w-full px-4 py-3 bg-transparent outline-none resize-none min-h-[48px] max-h-[120px] text-gray-900 placeholder-gray-400 font-medium text-[14.5px] leading-relaxed"
                maxLength={2000}
                rows={1}
                disabled={isClosed}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if ((message.trim() || file) && !uploading && !sendMutation.isPending && !isClosed) handleSend();
                  }
                }}
              />
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={(!message.trim() && !file) || sendMutation.isPending || uploading || isClosed}
              className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-2xl shadow-md hover:shadow-red-500/30 hover:shadow-lg active:scale-95 transform transition-all flex-shrink-0 disabled:opacity-40 disabled:hover:shadow-none disabled:active:scale-100"
            >
              {uploading || sendMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Order Details Modal ─────────────────────────────────────────────── */}
      {showOrderDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setShowOrderDetails(false)}>
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 sm:p-8">
              {/* Handle */}
              <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">Order Details</h2>
                <button onClick={() => setShowOrderDetails(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              {/* Service info */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Service</p>
                <p className="font-extrabold text-gray-900 text-lg mb-1">{order.service?.title}</p>
                {order.service?.description && <p className="text-sm text-gray-500 leading-relaxed mb-3">{order.service?.description}</p>}
                <p className="text-red-600 font-black text-xl">₦{Number(order.service?.price || 0).toLocaleString('en-NG')}</p>
              </div>

              {/* Status */}
              <div className="mb-5">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                  <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`}></span>
                  {statusCfg.label}
                </span>
              </div>

              {/* People */}
              <div className="space-y-4">
                {[
                  { label: 'Service Provider', person: order.provider },
                  { label: 'Customer', person: order.student }
                ].map(({ label, person }) => (
                  <div key={label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      {person?.profilePicture
                        ? <img src={getImageUrl(person.profilePicture)} alt="" className="w-12 h-12 rounded-full object-cover" />
                        : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-black text-base">{person?.name?.charAt(0) || '?'}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
                      <p className="font-extrabold text-gray-900 truncate">{person?.name}</p>
                      {person?.email && <p className="text-sm text-gray-400 truncate">{person.email}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 font-semibold mt-5">Ordered {new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen image preview ────────────────────────────────────────── */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur flex items-center justify-center z-[60] p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button className="absolute top-5 right-5 text-white/80 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all z-70">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default CampusHubOrderChat;
