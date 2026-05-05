import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { campusHubAPI } from "../../services/api";
import CampusHubHeader from "../../components/campusHub/CampusHubHeader";
import { getImageUrl } from "../../utils/imageUrl";
import { useQuery } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const CampusHubOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isProvider = user?.role === "provider" || user?.isProvider;
  const [activeTab, setActiveTab] = React.useState(
    isProvider ? "received" : "placed",
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["campusHubOrders"],
    queryFn: async () => {
      const res = await campusHubAPI.getMyOrders();
      return res.data.data || [];
    },
    enabled: !!user,
  });

  if (isLoading) return <Loader />;

  const ordersReceived = orders.filter(
    (o) => o.provider?._id === user?._id || o.provider?.id === user?.id,
  );
  const ordersPlaced = orders.filter(
    (o) => o.student?._id === user?._id || o.student?.id === user?.id,
  );

  const displayOrders = isProvider
    ? activeTab === "received"
      ? ordersReceived
      : ordersPlaced
    : ordersPlaced;

  const filteredOrders = displayOrders.filter((order) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const title = order.service?.title?.toLowerCase() || "";
    const studentName = order.student?.name?.toLowerCase() || "";
    const providerName = order.provider?.name?.toLowerCase() || "";
    return (
      title.includes(q) || studentName.includes(q) || providerName.includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <CampusHubHeader activePage="orders" />

      {/* Header & Search Section */}
      <div className="mb-8 md:mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
        <div className="space-y-4 sm:space-y-6 flex-1">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
              My <span className="text-red-600">Orders</span>
            </h1>
            <p className="text-gray-500 font-bold">
              Track and manage your marketplace activities
            </p>
          </div>

          {isProvider ? (
            <div className="inline-flex p-1 sm:p-1.5 bg-gray-100/50 backdrop-blur-md rounded-2xl sm:rounded-[1.5rem] border border-gray-200/50 shadow-inner max-w-full overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("received")}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-[1.1rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                  activeTab === "received"
                    ? "bg-white text-gray-900 shadow-xl shadow-black/5 transform -translate-y-0.5"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Orders Received
                <span
                  className={`ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] ${activeTab === "received" ? "bg-red-50 text-red-600" : "bg-gray-200 text-gray-500"}`}
                >
                  {ordersReceived.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("placed")}
                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-[1.1rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                  activeTab === "placed"
                    ? "bg-white text-gray-900 shadow-xl shadow-black/5 transform -translate-y-0.5"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                My Purchases
                <span
                  className={`ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] ${activeTab === "placed" ? "bg-red-50 text-red-600" : "bg-gray-200 text-gray-500"}`}
                >
                  {ordersPlaced.length}
                </span>
              </button>
            </div>
          ) : (
            <div className="inline-flex px-5 py-2.5 bg-blue-50/50 rounded-2xl border border-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest">
              🛍️ Shopping History
            </div>
          )}
        </div>

        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-3xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-200 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredOrders.map((order) => {
          const isMyService =
            order.provider?._id === user?._id ||
            order.provider?.id === user?.id;
          const counterparty = isMyService ? order.student : order.provider;
          const status = order.status || "pending";
          const hasUnread = order.unreadCount > 0;

          const statusTheme = {
            pending:
              "from-amber-400 to-orange-400 shadow-amber-500/20 text-amber-700 bg-amber-50 border-amber-100",
            in_progress:
              "from-emerald-400 to-teal-400 shadow-emerald-500/20 text-emerald-700 bg-emerald-50 border-emerald-100",
            completed:
              "from-blue-400 to-indigo-400 shadow-blue-500/20 text-blue-700 bg-blue-50 border-blue-100",
            cancelled:
              "from-gray-400 to-gray-500 shadow-gray-500/20 text-gray-700 bg-gray-50 border-gray-100",
          };

          return (
            <div
              key={order._id}
              onClick={() => navigate(`/campus-hub/orders/${order._id}/chat`)}
              className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-12px_rgba(220,38,38,0.15)] hover:border-red-100/60 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col h-full transform hover:-translate-y-2"
            >
              {/* Card Header/Banner */}
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-50">
                {order.service?.images?.[0] ? (
                  <img
                    src={getImageUrl(order.service.images[0])}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <svg
                      className="w-16 h-16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      ></path>
                    </svg>
                  </div>
                )}

                {/* Status Overlay */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`px-4 py-1.5 rounded-full backdrop-blur-md bg-white/90 border shadow-lg flex items-center gap-2 ${statusTheme[status].split(" ")[3]} ${statusTheme[status].split(" ")[4]}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${statusTheme[status].split(" ")[0]}`}
                    ></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Unread Alert */}
                {hasUnread && (
                  <div className="absolute top-4 left-4">
                    <div className="bg-red-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl animate-bounce">
                      {order.unreadCount} New
                    </div>
                  </div>
                )}

                {/* Role Tag */}
                <div className="absolute bottom-4 left-4">
                  <span
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20 shadow-sm ${isMyService ? "bg-red-600/80 text-white" : "bg-gray-900/80 text-white"}`}
                  >
                    {isMyService ? "Sale" : "Purchase"}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-7 flex-1 flex flex-col">
                <h3 className="text-xl font-extrabold text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                  {order.service?.title || "Untitled Service"}
                </h3>

                <div className="flex items-center justify-between items-end mt-auto pt-6 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {counterparty?.profilePicture ? (
                        <img
                          src={getImageUrl(counterparty.profilePicture)}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover shadow-sm border border-red-50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center text-sm font-black text-red-600 border border-white shadow-sm">
                          {counterparty?.name?.charAt(0) || "P"}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                        {isMyService ? "Client" : "Provider"}
                      </p>
                      <p className="text-sm font-black text-gray-900 truncate max-w-[120px]">
                        {counterparty?.name || "User"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                      Ordered
                    </p>
                    <p className="text-sm font-black text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all group-hover:bg-red-600 group-hover:shadow-lg group-hover:shadow-red-500/30 flex items-center justify-center gap-2">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      ></path>
                    </svg>
                    Open Chat
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-24 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 mt-8">
          <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 border border-gray-100">
            <svg
              className="w-12 h-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
            No orders found
          </h3>
          <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">
            Try adjusting your search or filters to find what you're looking
            for.
          </p>
          <Link
            to="/campus-hub"
            className="inline-flex px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 hover:-translate-y-1 transition-all"
          >
            Browse Services
          </Link>
        </div>
      )}
    </div>
  );
};

export default CampusHubOrders;
