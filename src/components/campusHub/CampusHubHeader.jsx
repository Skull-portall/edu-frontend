import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { campusHubAPI } from "../../services/api";

const CampusHubHeader = ({ activePage }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isProvider = user?.role === "provider" || user?.isProvider;

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["campusHubUnreadCount"],
    queryFn: async () => {
      const res = await campusHubAPI.getUnreadCount();
      return res.data.count || 0;
    },
    enabled: !!user,
  });

  const { data: myApplication } = useQuery({
    queryKey: ["myProviderApplication"],
    queryFn: async () => {
      try {
        const res = await campusHubAPI.getMyApplication();
        return res.data.data || null;
      } catch {
        return null;
      }
    },
    enabled: !!user && !isProvider,
  });

  const hasApplied = !!myApplication;
  const isPending = myApplication?.status === "pending";
  const isRejected = myApplication?.status === "rejected";
  const showBecomeProvider = !isProvider && (!hasApplied || isRejected);
  const isBaseHub = location.pathname === "/campus-hub";

  const linkClass = (page) => {
    const base =
      "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0";
    const isActive = activePage === page;
    if (isActive) {
      return `${base} bg-red-600 text-white shadow-sm`;
    }
    return `${base} bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-red-600`;
  };

  return (
    <div className="mb-4">
      {/* ── Compact Title Row & Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">
            Campus <span className="text-red-600">Hub</span>
          </h1>
          <span className="hidden sm:inline text-xs text-gray-400 font-normal">
            — Student services, freelance tasks & marketplace
          </span>
        </div>

        {/* Quick Nav Badges */}
        {user && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {isBaseHub && showBecomeProvider && (
              <Link
                to="/campus-hub/apply"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full font-bold text-xs bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>{isRejected ? "Re-Apply" : "Become Provider"}</span>
              </Link>
            )}

            {isBaseHub && isPending && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                <span>Pending Review</span>
              </span>
            )}

            <Link to="/campus-hub/orders" className={linkClass("orders")}>
              <span className="relative flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>My Orders</span>
                {unreadCount > 0 && (
                  <span className="min-w-[16px] h-4 bg-red-600 text-white text-[9px] font-black rounded-full px-1 flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
            </Link>

            {isProvider && (
              <>
                <Link to="/campus-hub/my-services" className={linkClass("services")}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>My Services</span>
                </Link>
                <Link to="/campus-hub/provider-dashboard" className={linkClass("dashboard")}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Dashboard</span>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusHubHeader;
