import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { campusHubAPI } from "../../services/api";
import { useQuery } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";
import CampusHubHeader from "../../components/campusHub/CampusHubHeader";
import { getImageUrl } from "../../utils/imageUrl";

const ProviderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["campusHubOrders"],
    queryFn: async () => {
      const res = await campusHubAPI.getMyOrders();
      return res.data.data || [];
    },
    enabled: !!user && (user.role === "provider" || user.isProvider),
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["campusHubMyServices"],
    queryFn: async () => {
      const res = await campusHubAPI.getMyServices();
      return res.data.data || [];
    },
    enabled: !!user && (user.role === "provider" || user.isProvider),
  });

  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "in_progress",
  );
  const recentOrders = orders.slice(0, 5);
  const totalEarnings = orders
    .filter((o) => o.status === "completed")
    .reduce((acc, o) => acc + (o.service?.price || 0), 0);

  if (user?.role !== "provider" && !user?.isProvider) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center text-gray-900">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-xs border border-red-100">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">
          Provider Access Required
        </h2>
        <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto mb-6">
          You must be an approved campus service provider to access this
          dashboard. Apply today to showcase your skills and start earning!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/campus-hub/apply-provider"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition"
          >
            Apply to Become a Provider
          </Link>
          <Link
            to="/campus-hub"
            className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full font-bold text-xs uppercase tracking-wider transition"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  if (ordersLoading || servicesLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <CampusHubHeader activePage="dashboard" />

        {/* ── Page Header ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded">
                Pro Center
              </span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-600">Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
              Provider <span className="text-red-600">Dashboard</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Welcome back, {user?.name?.split(" ")[0] || "Partner"}! Here is
              your business overview.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => navigate("/campus-hub/my-services")}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              My Listings
            </button>
            <button
              onClick={() => navigate("/campus-hub")}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-xs transition cursor-pointer"
            >
              Marketplace
            </button>
          </div>
        </div>

        {/* ── 4 Compact Stat Cards ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Earnings Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white relative overflow-hidden shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Completed Earnings
              </span>
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-red-400">
                <span className="font-black text-xs">₦</span>
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black tracking-tight leading-none truncate">
                ₦{totalEarnings.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">
                From completed orders
              </p>
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Active Requests
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
                {activeOrders.length}
              </p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">
                Pending & In-progress
              </p>
            </div>
          </div>

          {/* Services Count */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Services Offered
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
                {services.length}
              </p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">
                Published listings
              </p>
            </div>
          </div>

          {/* Trust Score */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Trust Score
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
                  4.9
                </p>
                <span className="text-[11px] text-gray-400 font-bold">/ 5.0</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                Verified Provider
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Dashboard Split ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Recent Orders (2 Columns) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Recent Orders & Inquiries
                </h2>
                <p className="text-[10px] text-gray-400 font-medium">
                  Live order tracking and student communications
                </p>
              </div>
              <button
                onClick={() => navigate("/campus-hub/orders")}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                All Orders
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
              </button>
            </div>

            <div className="divide-y divide-gray-50 flex-1">
              {recentOrders.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-gray-300">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-gray-700">
                    No orders or requests yet
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    When students request your services, they will appear here.
                  </p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order._id}
                    onClick={() =>
                      navigate(`/campus-hub/orders/${order._id}/chat`)
                    }
                    className="p-3.5 hover:bg-gray-50/70 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {order.student?.profilePicture ? (
                          <img
                            src={getImageUrl(order.student.profilePicture)}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            alt=""
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center border border-red-100">
                            {order.student?.name?.charAt(0) || "?"}
                          </div>
                        )}
                        {order.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {order.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 group-hover:text-red-600 transition-colors truncate">
                          {order.service?.title || "Custom Service Order"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-500 font-medium truncate">
                            Student: {order.student?.name}
                          </span>
                          <span className="text-gray-300 text-[10px]">·</span>
                          <span className="text-[10px] font-bold text-red-600">
                            ₦{Number(order.service?.price || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Date */}
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          order.status === "in_progress"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : order.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                      <p className="text-[9px] text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity / Performance Card (1 Column) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Weekly Activity
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Profile impressions & visits
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 font-bold text-[10px] rounded">
                  +24%
                </span>
              </div>

              {/* Bar visualization */}
              <div className="flex items-end justify-between h-28 gap-1.5 pt-4 pb-2">
                {[45, 65, 35, 85, 55, 95, 75].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                  >
                    <div className="relative w-full rounded-md overflow-hidden bg-gray-100 h-full flex items-end">
                      <div
                        className="w-full bg-red-600 group-hover:bg-red-700 rounded-t-md transition-all duration-500"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Tip Box */}
            <div className="mt-4 p-3 bg-red-50/60 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 text-red-600 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <p className="text-xs font-bold text-gray-900">
                  Growth Forecast
                </p>
              </div>
              <p className="text-[11px] text-gray-600 leading-snug">
                Your listings are getting strong engagement. Keeping active and
                responding quickly helps maintain your 4.9 rating!
              </p>
            </div>
          </div>
        </div>

        {/* ── Compact CTA Banner ─────────────────────────────── */}
        <div className="bg-gray-900 rounded-xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Ready to expand your campus business?
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Add more offerings, provide samples, and update pricing anytime.
            </p>
          </div>
          <button
            onClick={() => navigate("/campus-hub/my-services")}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider transition shrink-0 cursor-pointer"
          >
            Manage Services
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
