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
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "Active",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
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
    month: "short",
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
  }, [socket, orderId, user?._id, queryClient]);

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
    mutationFn: (statusText) =>
      campusHubAPI.updateOrderStatus(orderId, statusText),
    onSuccess: (_, statusText) => {
      queryClient.invalidateQueries({ queryKey: ["campusHubOrder", orderId] });
      toast.success(
        statusText === "cancelled"
          ? "Order cancelled."
          : statusText === "completed"
            ? "Order marked as completed! 🎉"
            : "Order accepted! 🚀",
      );
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update status"),
  });

  const handleSend = useCallback(
    (e) => {
      if (e) e.preventDefault();
      const trimmed = message.trim();
      if (!trimmed && !file) return;

      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        _id: tempId,
        _tempId: tempId,
        content: trimmed,
        attachment: file ? URL.createObjectURL(file) : null,
        attachmentType: file
          ? file.type.startsWith("image/")
            ? "image"
            : "raw"
          : null,
        attachmentName: file?.name,
        sender: {
          _id: user?._id || user?.id,
          name: user?.name,
          profilePicture: user?.profilePicture,
        },
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

      sendMutation.mutate(
        { textToSend, fileToSend },
        {
          onSuccess: (res) => {
            const real = res.data.data;
            setLocalMessages((prev) => {
              if (prev.some((m) => m._id === real._id))
                return prev.filter((m) => m._id !== tempId);
              return prev.map((m) => (m._id === tempId ? real : m));
            });
          },
          onError: () => {
            setLocalMessages((prev) => prev.filter((m) => m._id !== tempId));
            setMessage(textToSend);
          },
        },
      );
    },
    [message, file, user, sendMutation, orderId],
  );

  const handleTypingEvent = useCallback(() => {
    if (!socket || !orderId) return;
    socket.emit("typing", { orderId, userId: user?._id || user?.id });
  }, [socket, orderId, user?._id, user?.id]);

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
  if (!order) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-xs text-gray-500 mb-4">
          This order conversation does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/campus-hub/orders")}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const isProvider =
    (order.provider?._id || order.provider?.id) === (user?._id || user?.id);
  const counterparty = isProvider ? order.student : order.provider;
  const serviceTitle = order.service?.title || "Service Request";
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isClosed = order.status === "cancelled" || order.status === "completed";
  const grouped = groupMessagesByDate(localMessages);

  return (
    <div className="fixed inset-0 z-50 flex bg-[#fafafa] overflow-hidden w-full h-[100dvh]">
      {/* ── Desktop Conversations Sidebar ─────────────────────────────── */}
      <div className="hidden md:flex flex-col w-72 lg:w-80 bg-white border-r border-gray-100 shrink-0">
        {/* Sidebar Header */}
        <div className="h-14 px-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-gray-900">
              Campus Messages
            </span>
            <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">
              {myOrders.length}
            </span>
          </div>
          <button
            onClick={() => navigate("/campus-hub/orders")}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
            title="Back to Orders"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-3 space-y-2 border-b border-gray-50 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:bg-white"
            />
            <svg
              className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex gap-1 p-0.5 bg-gray-100 rounded-full">
            {["all", "purchasing", "providing"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                  filterType === type
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {type === "all" ? "All" : type === "purchasing" ? "Buying" : "Selling"}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {myOrders.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-xs font-bold text-gray-400">No active chats</p>
            </div>
          ) : (
            (() => {
              const lowQ = searchQuery.toLowerCase().trim();
              const filtered = myOrders.filter((o) => {
                const oIsProvider =
                  (o.provider?._id || o.provider?.id) ===
                  (user?._id || user?.id);
                if (filterType === "purchasing" && oIsProvider) return false;
                if (filterType === "providing" && !oIsProvider) return false;
                if (!lowQ) return true;
                return [o.provider?.name, o.student?.name, o.service?.title].some(
                  (n) => String(n || "").toLowerCase().includes(lowQ),
                );
              });

              if (filtered.length === 0) {
                return (
                  <p className="text-center py-8 text-xs text-gray-400 font-medium">
                    No results found
                  </p>
                );
              }

              return filtered.map((o) => {
                const oIsProvider =
                  (o.provider?._id || o.provider?.id) ===
                  (user?._id || user?.id);
                const oCounterparty = oIsProvider ? o.student : o.provider;
                const isSelected = String(o._id) === String(orderId);
                const statusStyle =
                  STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;

                return (
                  <div
                    key={o._id}
                    onClick={() => navigate(`/campus-hub/orders/${o._id}/chat`)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? "bg-red-50 text-gray-900 border border-red-100"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        {o.service?.images?.length > 0 ? (
                          <img
                            src={getImageUrl(o.service.images[0])}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                            {o.service?.title?.charAt(0) || "S"}
                          </div>
                        )}
                      </div>
                      {o.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {o.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {o.service?.title || "Service"}
                        </h4>
                        <span className="text-[9px] text-gray-400 shrink-0">
                          {new Date(o.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-gray-500 font-medium truncate">
                          {oCounterparty?.name}
                        </span>
                        <span className="text-gray-300 text-[10px]">·</span>
                        <span
                          className={`text-[10px] font-bold ${statusStyle.text}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>

      {/* ── Main Chat Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#fafafa] relative min-w-0">
        {/* Top Chat Header */}
        <header className="h-14 px-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile back to orders */}
            <button
              onClick={() => navigate("/campus-hub/orders")}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:text-gray-800 transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Thumbnail */}
            <div
              className="relative cursor-pointer shrink-0"
              onClick={() => setShowOrderDetails(true)}
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                {order.service?.images?.length > 0 ? (
                  <img
                    src={getImageUrl(order.service.images[0])}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-red-600 bg-red-50">
                    {order.service?.title?.charAt(0) || "S"}
                  </div>
                )}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${
                  connected ? "bg-emerald-500" : "bg-gray-300"
                }`}
              />
            </div>

            {/* Title & Counterparty */}
            <div
              className="min-w-0 cursor-pointer"
              onClick={() => setShowOrderDetails(true)}
            >
              <h2 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                {serviceTitle}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                <span className="truncate">{counterparty?.name}</span>
                <span className="text-gray-300">·</span>
                <span
                  className={`inline-flex items-center gap-1 font-bold ${statusCfg.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
                <span className="text-gray-300">·</span>
                <span className="font-bold text-red-600">
                  ₦{Number(order.service?.price || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isProvider && order.status === "pending" && (
              <button
                onClick={() => updateStatusMutation.mutate("in_progress")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              >
                Accept Order
              </button>
            )}
            {isProvider && order.status === "in_progress" && (
              <button
                onClick={() => updateStatusMutation.mutate("completed")}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              >
                Mark Complete
              </button>
            )}
            <button
              onClick={() => setShowOrderDetails(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition cursor-pointer"
              title="Order Details"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        >
          <div className="max-w-3xl mx-auto space-y-3">
            {localMessages.length === 0 && !messagesLoading && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Start the Conversation
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Discuss project specifics, deadlines, and delivery expectations.
                </p>
              </div>
            )}

            {grouped.map((item) => {
              if (item.type === "divider") {
                return (
                  <div key={item.key} className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {formatDateDivider(item.date)}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                );
              }

              const { msg } = item;
              const isMe =
                (msg.sender?._id || msg.sender?.id) === (user?._id || user?.id);
              const isOptimistic = msg._isOptimistic;

              return (
                <div
                  key={item.key}
                  className={`flex items-end gap-2 ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Sender avatar */}
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0">
                    {msg.sender?.profilePicture ? (
                      <img
                        src={getImageUrl(msg.sender.profilePicture)}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {msg.sender?.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    {msg.content && (
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                          isMe
                            ? "bg-red-600 text-white rounded-br-xs"
                            : "bg-white border border-gray-100 text-gray-900 rounded-bl-xs"
                        } ${isOptimistic ? "opacity-70" : "opacity-100"}`}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* Attachment rendering */}
                    {msg.attachment && (
                      <div
                        className={`mt-1.5 p-1 rounded-xl bg-white border border-gray-100 shadow-xs overflow-hidden ${
                          isMe ? "rounded-br-xs" : "rounded-bl-xs"
                        }`}
                      >
                        {msg.attachmentType === "image" ? (
                          <div
                            className="relative max-w-xs rounded-lg overflow-hidden cursor-pointer"
                            onClick={() => setPreviewImage(msg.attachment)}
                          >
                            <img
                              src={getImageUrl(msg.attachment)}
                              className="w-full max-h-56 object-cover hover:scale-105 transition-transform"
                              alt="Attachment"
                            />
                          </div>
                        ) : (
                          <a
                            href={getImageUrl(msg.attachment)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                          >
                            <svg
                              className="w-5 h-5 text-red-500 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate max-w-[180px]">
                                {msg.attachmentName || "Download Attachment"}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                Click to open
                              </span>
                            </div>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-[9px] text-gray-400 mt-1 px-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" />
                </div>
                <p className="text-[10px] font-medium text-gray-400">
                  {counterparty?.name?.split(" ")[0]} is typing...
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-gray-100 shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* File staging banner */}
            {file && (
              <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    className="w-4 h-4 text-red-600 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  <span className="font-semibold text-gray-800 truncate">
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={removeFile}
                  className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5 text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-center gap-2">
              {/* Attachment file trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isClosed}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center shrink-0 transition disabled:opacity-50 cursor-pointer"
                title="Attach photo or document"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Text Input */}
              <input
                ref={textareaRef}
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTypingEvent();
                }}
                placeholder={
                  isClosed
                    ? "This order is closed"
                    : "Type a message... (Press Enter to send)"
                }
                disabled={isClosed}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-red-500"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={
                  (!message.trim() && !file) ||
                  sendMutation.isPending ||
                  isClosed
                }
                className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0 transition disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {sendMutation.isPending || uploading ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 rotate-90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Order Details Modal ─────────────────────────────── */}
        {showOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-36 bg-gray-100">
                {order.service?.images?.length > 0 ? (
                  <img
                    src={getImageUrl(order.service.images[0])}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-red-600 to-rose-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-xs hover:bg-black/60 transition"
                >
                  ✕
                </button>
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-bold uppercase rounded mb-1 inline-block">
                    {order.service?.category || "General"}
                  </span>
                  <h3 className="text-sm font-bold text-white truncate">
                    {serviceTitle}
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Status
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${statusCfg.text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                      />
                      {statusCfg.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Price
                    </span>
                    <span className="font-black text-red-600">
                      ₦{Number(order.service?.price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Participants
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">
                        {order.student?.name}
                      </p>
                      <span className="text-[10px] text-gray-400">Student</span>
                    </div>
                    <span className="text-gray-300">↔</span>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {order.provider?.name}
                      </p>
                      <span className="text-[10px] text-gray-400">Provider</span>
                    </div>
                  </div>
                </div>

                {!isClosed && isProvider && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to cancel this order?",
                        )
                      ) {
                        updateStatusMutation.mutate("cancelled");
                      }
                    }}
                    className="w-full py-2 bg-gray-100 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel This Order
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Photo Zoom Preview Modal ─────────────────────────────── */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={getImageUrl(previewImage)}
              alt="Zoom Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 text-white text-lg font-bold bg-white/20 hover:bg-white/40 w-8 h-8 rounded-full flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusHubOrderChat;
