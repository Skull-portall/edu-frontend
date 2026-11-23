import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { campusHubAPI } from "../../services/api";
import CampusHubHeader from "../../components/campusHub/CampusHubHeader";
import { getImageUrl } from "../../utils/imageUrl";
import { useQuery } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";

const statusConfig = {
  pending: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "In Progress",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
};

const CampusHubOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isProvider = user?.role === "provider" || user?.isProvider;
  const [activeTab, setActiveTab] = useState(isProvider ? "received" : "placed");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["campusHubOrders"],
    queryFn: async () => {
      const res = await campusHubAPI.getMyOrders();
      return res.data.data || [];
    },
    enabled: !!user,
  });

  const ordersReceived = useMemo(() => {
    return orders.filter(
      (o) => o.provider?._id === user?._id || o.provider?.id === user?.id,
    );
  }, [orders, user]);

  const ordersPlaced = useMemo(() => {
    return orders.filter(
      (o) => o.student?._id === user?._id || o.student?.id === user?.id,
    );
  }, [orders, user]);

  const displayOrders = useMemo(() => {
    return isProvider
      ? activeTab === "received"
        ? ordersReceived
        : ordersPlaced
      : ordersPlaced;
  }, [isProvider, activeTab, ordersReceived, ordersPlaced]);

  const filteredOrders = useMemo(() => {
    return displayOrders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.service?.title?.toLowerCase().includes(q) ||
        order.student?.name?.toLowerCase().includes(q) ||
        order.provider?.name?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [displayOrders, searchQuery, statusFilter]);

  if (isLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <CampusHubHeader activePage="orders" />

        {/* ── Page Header ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
              My <span className="text-red-600">Orders</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Track requests, communicate with peers, and fulfill service orders
            </p>
          </div>

          {/* Quick Hub Navigation */}
          <Link
            to="/campus-hub"
            className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold text-gray-600 hover:text-red-600 transition"
          >
            <span>Explore Services</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* ── Role Tab Switcher & Search Bar ─────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          {/* Main Role Tabs */}
          <div className="flex items-center gap-2">
            {isProvider ? (
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
                <button
                  onClick={() => setActiveTab("received")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "received"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <span>Orders Received</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === "received"
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {ordersReceived.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("placed")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "placed"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <span>My Purchases</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === "placed"
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {ordersPlaced.length}
                  </span>
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-700">
                <span>🛍️ My Purchases</span>
                <span className="px-1.5 py-0.2 bg-white text-gray-900 rounded-full text-[10px] shadow-xs">
                  {ordersPlaced.length}
                </span>
              </div>
            )}
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search by title or person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-red-500 shadow-xs"
            />
            <svg
              className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Status Filter Chips ─────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-5">
          {[
            { id: "all", label: "All Statuses" },
            { id: "pending", label: "Pending" },
            { id: "in_progress", label: "In Progress" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setStatusFilter(chip.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                statusFilter === chip.id
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── Orders Grid ─────────────────────────────── */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const isMyService =
                order.provider?._id === user?._id ||
                order.provider?.id === user?.id;
              const counterparty = isMyService ? order.student : order.provider;
              const status = order.status || "pending";
              const conf = statusConfig[status] || statusConfig.pending;
              const hasUnread = order.unreadCount > 0;

              return (
                <div
                  key={order._id}
                  onClick={() =>
                    navigate(`/campus-hub/orders/${order._id}/chat`)
                  }
                  className="group bg-white rounded-xl border border-gray-100 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top image & badges row */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-50 border border-gray-100 mb-3">
                      {order.service?.images?.[0] ? (
                        <img
                          src={getImageUrl(order.service.images[0])}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Status badge */}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-xs ${conf.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${conf.dot}`}
                          />
                          {conf.label}
                        </span>
                      </div>

                      {/* Unread Message Pill */}
                      {hasUnread && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-red-600 text-white px-2 py-0.5 rounded-md font-bold text-[10px] shadow-sm animate-pulse">
                            {order.unreadCount} New
                          </span>
                        </div>
                      )}

                      {/* Role Pill */}
                      <div className="absolute bottom-2 left-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider backdrop-blur-xs ${
                            isMyService
                              ? "bg-red-600 text-white"
                              : "bg-gray-900/80 text-white"
                          }`}
                        >
                          {isMyService ? "Sale" : "Purchase"}
                        </span>
                      </div>

                      {/* Price Tag */}
                      <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white font-black text-xs">
                          ₦{Number(order.service?.price || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Order Title */}
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-red-600 transition-colors line-clamp-1 mb-2">
                      {order.service?.title || "Custom Service Request"}
                    </h3>
                  </div>

                  {/* Footer & Counterparty */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      {/* Counterparty avatar and name */}
                      <div className="flex items-center gap-2 min-w-0">
                        {counterparty?.profilePicture ? (
                          <img
                            src={getImageUrl(counterparty.profilePicture)}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center border border-red-100 shrink-0">
                            {counterparty?.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {isMyService ? "Client" : "Provider"}
                          </p>
                          <p className="text-xs font-semibold text-gray-800 truncate max-w-[110px]">
                            {counterparty?.name || "Student"}
                          </p>
                        </div>
                      </div>

                      {/* Order Date */}
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Date
                        </p>
                        <p className="text-xs font-semibold text-gray-700">
                          {new Date(order.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full py-2 bg-gray-900 group-hover:bg-red-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                      <svg
                        className="w-3.5 h-3.5"
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
                      <span>Open Chat & Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {searchQuery || statusFilter !== "all"
                ? "No matching orders found"
                : "No orders yet"}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search terms or status filter."
                : "You have not placed or received any service requests yet."}
            </p>
            {searchQuery || statusFilter !== "all" ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-bold text-gray-700 transition cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                to="/campus-hub"
                className="inline-flex px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition"
              >
                Browse Marketplace
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusHubOrders;
