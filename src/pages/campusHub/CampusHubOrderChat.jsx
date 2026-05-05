import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { campusHubAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils/imageUrl";
import { uploadToCloudinary } from "../../utils/cloudinary";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  in_progress: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
  },
  completed: {
    label: "Completed",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-400",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
};

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateDivider(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function groupMessagesByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const msg of messages) {
    const dateStr = new Date(msg.createdAt).toDateString();
    if (dateStr !== lastDate) {
      groups.push({
        type: "divider",
        date: msg.createdAt,
        key: `divider-${msg.createdAt}`,
      });
      lastDate = dateStr;
    }
    groups.push({ type: "message", msg, key: msg._id || msg._tempId });
  }
  return groups;
}

const CampusHubOrderChat = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'purchasing', 'providing'

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["campusHubOrder", orderId],
    queryFn: async () => {
      const res = await campusHubAPI.getOrderById(orderId);
      return res.data.data;
    },
    enabled: !!orderId,
  });

  const { data: remoteMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["campusHubChat", orderId],
    queryFn: async () => {
      const res = await campusHubAPI.getChatMessages(orderId);
      return res.data.data || [];
    },
    enabled: !!orderId,
    staleTime: 30000,
  });

  const { data: myOrdersData } = useQuery({
    queryKey: ["campusHubOrders"],
    queryFn: async () => {
      const res = await campusHubAPI.getMyOrders();
      return res.data.data?.orders || res.data.data || [];
    },
  });
  const myOrders = myOrdersData || [];

  useEffect(() => {
    if (remoteMessages) {
      setLocalMessages(remoteMessages);
    }
  }, [remoteMessages]);

  useEffect(() => {
    setLocalMessages([]);
  }, [orderId]);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !orderId) return;
    socket.emit("join_order_chat", orderId);
    setConnected(true);

    const handleNewMessage = (msg) => {
      if (msg.order?.toString() !== orderId && msg.order !== orderId) return;
      setLocalMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      queryClient.invalidateQueries({ queryKey: ["campusHubUnreadCount"] });
    };

    const handleTyping = (data) => {
      if (data.orderId === orderId && data.userId !== (user?._id || user?.id)) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on("new_chat_message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.emit("leave_order_chat", orderId);
      socket.off("new_chat_message", handleNewMessage);
      socket.off("typing", handleTyping);
      setConnected(false);
    };
  }, [socket, orderId, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isTyping]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async ({ textToSend, fileToSend }) => {
      let attachmentUrl = null;
      let attachmentType = null;
      if (fileToSend) {
        setUploading(true);
        attachmentUrl = await uploadToCloudinary(fileToSend);
        if (fileToSend.type.startsWith("image/")) attachmentType = "image";
        else if (fileToSend.type.startsWith("video/")) attachmentType = "video";
        else attachmentType = "raw";
        setUploading(false);
      }
      return campusHubAPI.sendChatMessage(orderId, {
        content: textToSend,
        attachment: attachmentUrl,
        attachmentType,
        attachmentName: fileToSend ? fileToSend.name : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campusHubChat", orderId] });
    },
    onError: (err) => {
      setUploading(false);
      toast.error(err.response?.data?.message || "Failed to send message");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (statusText) => campusHubAPI.updateOrderStatus(orderId, statusText),
    onSuccess: (_, statusText) => {
      queryClient.invalidateQueries({ queryKey: ["campusHubOrder", orderId] });
      toast.success(statusText === "cancelled" ? "Order cancelled." : statusText === "completed" ? "Order marked as completed! 🎉" : "Order accepted! 🚀");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update status"),
  });

  const handleSend = useCallback((e) => {
    if (e) e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed && !file) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      _tempId: tempId,
      content: trimmed,
      attachment: file ? URL.createObjectURL(file) : null,
      attachmentType: file ? (file.type.startsWith("image/") ? "image" : "raw") : null,
      attachmentName: file?.name,
      sender: { _id: user?._id, name: user?.name, profilePicture: user?.profilePicture },
      createdAt: new Date().toISOString(),
      _isOptimistic: true,
    };
    setLocalMessages((prev) => [...prev, optimistic]);

    const textToSend = trimmed;
    const fileToSend = file;
    setMessage("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    sendMutation.mutate({ textToSend, fileToSend }, {
      onSuccess: (res) => {
        const real = res.data.data;
        setLocalMessages((prev) => {
          if (prev.some((m) => m._id === real._id)) return prev.filter((m) => m._id !== tempId);
          return prev.map((m) => (m._id === tempId ? real : m));
        });
      },
      onError: () => {
        setLocalMessages((prev) => prev.filter((m) => m._id !== tempId));
        setMessage(textToSend);
      },
    });
  }, [message, file, user, sendMutation, orderId]);

  const handleTypingEvent = useCallback(() => {
    if (!socket || !orderId) return;
    socket.emit("typing", { orderId, userId: user?._id });
  }, [socket, orderId, user?._id]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selected);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (orderLoading && !order) return <Loader />;
  if (!order) return <div className="p-10 text-center">Order not found.</div>;

  const isProvider = (order.provider?._id || order.provider?.id) === (user?._id || user?.id);
  const counterparty = isProvider ? order.student : order.provider;
  const serviceTitle = order.service?.title || "Service";
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isClosed = order.status === "cancelled" || order.status === "completed";
  const grouped = groupMessagesByDate(localMessages);

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#f8fafc] overflow-hidden w-full h-[100dvh] h-[100svh]">
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <div className="hidden md:flex flex-col w-72 lg:w-80 xl:w-96 bg-white border-r border-gray-100/80 shadow-[10px_0_40px_-15px_rgba(0,0,0,0.03)] flex-shrink-0 z-30 pt-safe">
        <div className="h-16 md:h-20 px-6 bg-white border-b border-gray-50 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </div>
            <h2 className="font-black text-gray-900 text-xl tracking-tight">Messages</h2>
          </div>
          <button
            onClick={() => navigate("/campus-hub/orders")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-5 space-y-5 bg-white flex-shrink-0">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-200 transition-all shadow-inner"
            />
          </div>
          
          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
            {['all', 'purchasing', 'providing'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                {type === 'all' ? 'All' : type === 'purchasing' ? 'Buying' : 'Selling'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-2 bg-white scrollbar-hide">
          {myOrders.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
              <p className="text-gray-400 font-black text-xs uppercase tracking-widest">No active chats</p>
            </div>
          ) : (
            (() => {
              const lowQ = searchQuery.toLowerCase();
              const filteredOrders = myOrders.filter((o) => {
                const oIsProvider = (o.provider?._id || o.provider?.id) === (user?._id || user?.id);
                if (filterType === "purchasing" && oIsProvider) return false;
                if (filterType === "providing" && !oIsProvider) return false;
                if (!searchQuery.trim()) return true;
                return [o.provider?.name, o.student?.name, o.service?.title].some(n => String(n || "").toLowerCase().includes(lowQ));
              });

              if (filteredOrders.length === 0) return <p className="text-center py-10 text-xs font-black text-gray-400 uppercase tracking-widest">No results found</p>;

              return filteredOrders.map((o) => {
                const oIsProvider = (o.provider?._id || o.provider?.id) === (user?._id || user?.id);
                const oCounterparty = oIsProvider ? o.student : o.provider;
                const isSelected = String(o._id) === String(orderId);
                const statusStyle = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;

                return (
                  <div
                    key={o._id}
                    onClick={() => navigate(`/campus-hub/orders/${o._id}/chat`)}
                    className={`group relative flex items-center gap-4 p-4 rounded-[2rem] cursor-pointer transition-all duration-300 ${isSelected ? "bg-red-50/50 border border-red-100 shadow-[0_10px_30px_-15px_rgba(239,68,68,0.15)]" : "hover:bg-gray-50 border border-transparent"}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-14 h-14 rounded-2xl overflow-hidden shadow-lg transition-transform duration-500 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}>
                        {o.service?.images?.length > 0 ? (
                          <img src={getImageUrl(o.service.images[0])} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 font-black">{o.service?.title?.charAt(0)}</div>
                        )}
                      </div>
                      {o.unreadCount > 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                          {o.unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`font-black truncate text-sm tracking-tight ${isSelected ? "text-red-600" : "text-gray-900"}`}>{o.service?.title || "Service"}</h3>
                        <span className="text-[9px] font-black text-gray-400 uppercase ml-2">{new Date(o.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-500 truncate">{oCounterparty?.name}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${statusStyle.text}`}>{statusStyle.label}</span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>

      {/* ── Chat Main Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#fdfdfd] relative min-w-0">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

        {/* Header */}
        <header className="relative z-20 bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 pt-safe px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button onClick={() => navigate("/campus-hub/orders")} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-red-600 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <div className="relative cursor-pointer" onClick={() => setShowOrderDetails(true)}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                {order.service?.images?.length > 0 ? (
                  <img src={getImageUrl(order.service.images[0])} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-red-50 flex items-center justify-center text-red-600 font-black">{order.service?.title?.charAt(0)}</div>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            </div>
            <div className="min-w-0 cursor-pointer" onClick={() => setShowOrderDetails(true)}>
              <h1 className="text-sm sm:text-base font-black text-gray-900 truncate tracking-tight">{serviceTitle}</h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 flex items-center gap-2">
                <span className="truncate">{counterparty?.name}</span>
                <span className="hidden xs:inline w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className={`${statusCfg.text} truncate`}>{statusCfg.label}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isProvider && order.status === "pending" && (
              <button onClick={() => updateStatusMutation.mutate("in_progress")} className="px-3 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">Accept</button>
            )}
            {isProvider && order.status === "in_progress" && (
              <button onClick={() => updateStatusMutation.mutate("completed")} className="px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">Complete</button>
            )}
            <button onClick={() => setShowOrderDetails(true)} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollContainerRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-8 space-y-6 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-2">
            {localMessages.length === 0 && !messagesLoading && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Say Hello!</h3>
                <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto">Discuss details and set expectations to ensure a smooth service delivery.</p>
              </div>
            )}

            {grouped.map((item, idx) => {
              if (item.type === "divider") {
                return (
                  <div key={item.key} className="flex items-center gap-4 py-8">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{formatDateDivider(item.date)}</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
                  </div>
                );
              }

              const { msg } = item;
              const isMe = (msg.sender?._id || msg.sender?.id) === (user?._id || user?.id);
              const isOptimistic = msg._isOptimistic;

              return (
                <div key={item.key} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} mb-4 group`}>
                  <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md flex-shrink-0 mb-1">
                    {msg.sender?.profilePicture ? (
                      <img src={getImageUrl(msg.sender.profilePicture)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">{msg.sender?.name?.charAt(0)}</div>
                    )}
                  </div>
                  
                  <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {msg.content && (
                      <div className={`px-5 py-3 rounded-[1.75rem] text-sm font-medium shadow-sm transition-all duration-300 ${isMe ? 'bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'} ${isOptimistic ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}>
                        {msg.content}
                      </div>
                    )}
                    
                    {msg.attachment && (
                      <div className={`mt-2 p-2 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden group/file transition-all ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                        {msg.attachmentType === 'image' ? (
                          <div className="relative aspect-video rounded-xl overflow-hidden cursor-zoom-in" onClick={() => setPreviewImage(msg.attachment)}>
                            <img src={getImageUrl(msg.attachment)} className="w-full h-full object-cover group-hover/file:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/0 group-hover/file:bg-black/10 transition-colors" />
                          </div>
                        ) : (
                          <a href={getImageUrl(msg.attachment)} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-gray-900 truncate max-w-[200px]">{msg.attachmentName || 'Download File'}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">View Attachment</p>
                            </div>
                          </a>
                        )}
                      </div>
                    )}
                    
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1.5 px-2">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1.5">{counterparty?.name?.split(' ')[0]} is typing...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="relative z-20 px-4 sm:px-6 pb-6 pt-2 bg-white/80 backdrop-blur-2xl">
          <div className="max-w-4xl mx-auto">
            {file && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] font-bold text-red-400 uppercase">Ready to send</p>
                  </div>
                </div>
                <button onClick={removeFile} className="p-2 text-red-300 hover:text-red-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="relative flex items-end gap-2 sm:gap-3">
              <div className="relative flex-1 bg-gray-50 border border-gray-100 rounded-[2rem] shadow-inner focus-within:ring-4 focus-within:ring-red-500/5 focus-within:border-red-200 transition-all flex items-end p-1.5 sm:p-2 pr-3 sm:pr-4">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 sm:p-3 text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                </button>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); handleTypingEvent(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message..."
                  className="flex-1 max-h-32 min-h-[44px] sm:min-h-[48px] py-2.5 sm:py-3.5 bg-transparent border-none outline-none text-sm font-medium text-gray-900 placeholder-gray-400 resize-none scrollbar-hide"
                  disabled={isClosed}
                />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              </div>
              
              <button
                type="submit"
                disabled={(!message.trim() && !file) || sendMutation.isPending || isClosed}
                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${(!message.trim() && !file) || isClosed ? 'bg-gray-100 text-gray-300' : 'bg-red-600 text-white shadow-red-500/30 hover:scale-105 active:scale-95'}`}
              >
                {sendMutation.isPending || uploading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Modals */}
        {showOrderDetails && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowOrderDetails(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="relative h-48 sm:h-56">
                {order.service?.images?.length > 0 ? (
                  <img src={getImageUrl(order.service.images[0])} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-50 to-rose-100" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <button onClick={() => setShowOrderDetails(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div className="absolute bottom-6 left-8 right-8">
                  <span className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg mb-2 inline-block">{order.service?.category || 'General'}</span>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{serviceTitle}</h3>
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                      <p className={`text-sm font-black uppercase tracking-widest ${statusCfg.text}`}>{statusCfg.label}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</p>
                    <p className="text-xl font-black text-gray-900">₦{Number(order.service?.price || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Participants</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-red-600 shadow-sm overflow-hidden">
                        {order.student?.profilePicture ? <img src={getImageUrl(order.student.profilePicture)} className="w-full h-full object-cover" /> : 'S'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900">{order.student?.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Student</p>
                      </div>
                    </div>
                    <div className="w-4 h-px bg-gray-200" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-red-600 shadow-sm overflow-hidden">
                        {order.provider?.profilePicture ? <img src={getImageUrl(order.provider.profilePicture)} className="w-full h-full object-cover" /> : 'P'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900">{order.provider?.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Provider</p>
                      </div>
                    </div>
                  </div>
                </div>

                {!isClosed && isProvider && (
                  <button onClick={() => { if(window.confirm('Cancel this order?')) updateStatusMutation.mutate('cancelled'); }} className="w-full py-4 bg-gray-50 text-red-600 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-red-50 transition-all">Cancel This Order</button>
                )}
              </div>
            </div>
          </div>
        )}

        {previewImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-4" onClick={() => setPreviewImage(null)}>
            <img src={getImageUrl(previewImage)} alt="Preview" className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-90 duration-300" />
            <button className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusHubOrderChat;
