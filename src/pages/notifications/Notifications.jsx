import React, { useState } from "react";
import { notificationsAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const typeIconMap = {
  campus_hub_order_new: {
    icon: "🛒",
    color: "bg-blue-100 /50 text-blue-700 ",
    label: "New Order",
  },
  campus_hub_order_status: {
    icon: "🔄",
    color: "bg-amber-100 /50 text-amber-700 ",
    label: "Order Update",
  },
  campus_hub_message: {
    icon: "💬",
    color: "bg-indigo-100 /50 text-indigo-700 ",
    label: "Message",
  },
  campus_hub_application: {
    icon: "📋",
    color: "bg-green-100 /50 text-green-700 ",
    label: "Application",
  },
  campus_hub_dispute: {
    icon: "⚠️",
    color: "bg-red-100 /50 text-red-700 ",
    label: "Dispute",
  },
  note_approved: {
    icon: "✅",
    color: "bg-green-100 /50 text-green-700 ",
    label: "Note",
  },
  note_rejected: {
    icon: "❌",
    color: "bg-red-100 /50 text-red-700 ",
    label: "Note",
  },
  test_approved: {
    icon: "✅",
    color: "bg-green-100 /50 text-green-700 ",
    label: "Test",
  },
  question_accepted: {
    icon: "❓",
    color: "bg-purple-100 /50 text-purple-700 ",
    label: "Question",
  },
  answer_accepted: {
    icon: "💡",
    color: "bg-yellow-100 /50 text-yellow-700 ",
    label: "Answer",
  },
  tagged: {
    icon: "🏷️",
    color: "bg-pink-100 /50 text-pink-700 ",
    label: "Tagged",
  },
  welcome: {
    icon: "🎉",
    color: "bg-green-100 /50 text-green-700 ",
    label: "Welcome",
  },
  account_approved: {
    icon: "✅",
    color: "bg-green-100 /50 text-green-700 ",
    label: "Account",
  },
  account_suspended: {
    icon: "🚫",
    color: "bg-red-100 /50 text-red-700 ",
    label: "Account",
  },
  role_changed: {
    icon: "👤",
    color: "bg-blue-100 /50 text-blue-700 ",
    label: "Role",
  },
};

const getTypeInfo = (type) =>
  typeIconMap[type] || {
    icon: "🔔",
    color: "bg-gray-100 text-gray-700 ",
    label: "Notification",
  };

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

const Notifications = () => {
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await notificationsAPI.getAll();
      return res.data;
    },
    refetchInterval: 30000,
  });

  const notifications = data?.notifications || data?.data || [];
  const unreadCount = notifications.filter(
    (n) => !n.isRead && !n.readAt,
  ).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      toast.success("All notifications marked as read");
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => notificationsAPI.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      toast.success("All notifications cleared");
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.isRead && !notification.readAt) {
      markReadMutation.mutate(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead && !n.readAt;
    if (filter === "campus_hub") return n.type?.startsWith("campus_hub");
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-red-600 text-white text-sm font-bold rounded-full shadow-lg shadow-red-500/30">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "You're all caught up! ✓"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="px-3 py-1.5 text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 :bg-blue-950/40 transition-colors disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Clear all notifications? This cannot be undone.",
                    )
                  ) {
                    clearAllMutation.mutate();
                  }
                }}
                disabled={clearAllMutation.isPending}
                className="px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 :bg-red-950/40 transition-colors disabled:opacity-50"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-5 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { key: "all", label: `All`, count: notifications.length },
            { key: "unread", label: `Unread`, count: unreadCount },
            { key: "campus_hub", label: "Campus Hub", count: null },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                filter === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 :text-gray-200"
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full ${
                    tab.key === "unread"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-600 "
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">🔕</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            No notifications here
          </h3>
          <p className="text-gray-500 text-sm">
            {filter === "unread"
              ? "All caught up! No unread notifications."
              : "Nothing to show in this category."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const isUnread = !notification.isRead && !notification.readAt;
            const typeInfo = getTypeInfo(notification.type);

            return (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  isUnread
                    ? "bg-blue-50 /20 border-blue-100 /50 hover:bg-blue-100/60 :bg-blue-950/30"
                    : "bg-white border-gray-100 hover:bg-gray-50 :bg-gray-800/60"
                }`}
              >
                {/* Unread dot */}
                {isUnread && (
                  <span className="absolute top-4 right-4 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white shadow-sm"></span>
                )}

                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${typeInfo.color}`}
                >
                  {typeInfo.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeInfo.color}`}
                    >
                      {typeInfo.label}
                    </span>
                    <span className="text-xs text-gray-400 ">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">
                    {notification.title}
                  </p>
                  <p className="text-gray-600 text-sm mt-0.5 leading-snug">
                    {notification.message}
                  </p>
                  {notification.link && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold mt-1 group-hover:underline">
                      View details →
                    </span>
                  )}
                </div>

                {/* Mark read */}
                {isUnread && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markReadMutation.mutate(notification._id);
                    }}
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 :text-blue-400 hover:bg-blue-100 :bg-blue-950/50 rounded-lg transition-colors"
                    title="Mark as read"
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
