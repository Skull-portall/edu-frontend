import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { campusHubAPI } from '../../services/api';

const CampusHubHeader = ({ activePage }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isProvider = user?.role === 'provider' || user?.isProvider;

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['campusHubUnreadCount'],
    queryFn: async () => {
      const res = await campusHubAPI.getUnreadCount();
      return res.data.count || 0;
    },
    enabled: !!user,
  });

  // Check if user has already submitted a provider application
  const { data: myApplication } = useQuery({
    queryKey: ['myProviderApplication'],
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
  const isPending = myApplication?.status === 'pending';
  const isRejected = myApplication?.status === 'rejected';

  // Show button only if user is NOT a provider AND hasn't applied yet (or was rejected)
  const showBecomeProvider = !isProvider && (!hasApplied || isRejected);

  const isBaseHub = location.pathname === '/campus-hub';

  const linkClass = (page) => {
    const base = 'inline-flex flex-shrink-0 items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-sm whitespace-nowrap';
    const isActive = activePage === page;
    if (isActive) {
      return `${base} bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20 transform -translate-y-0.5 border-none`;
    }
    return `${base} bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-200 hover:border-red-200`;
  };

  return (
    <div className="mb-6 relative">
      {isBaseHub && (
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-red-50/80 to-rose-100/40 border border-red-100/50 mb-8 pb-32 shadow-sm">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-200/40 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>
          <div className="absolute top-12 -left-24 w-72 h-72 bg-rose-200/40 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>
        </div>
      )}

      <div className={`relative z-10 ${isBaseHub ? 'px-2 pt-4 pb-4 md:px-6 md:pt-6 md:pb-6' : ''}`}>
        <div className="mb-8">
          <span className="inline-block px-4 py-1.5 rounded-full bg-red-100/80 backdrop-blur-sm text-red-700 text-xs font-black tracking-widest uppercase mb-4 shadow-sm border border-red-200/50">🎓 eDu Live Marketplace</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 mb-4 tracking-tight">
            Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">Hub</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl leading-relaxed font-medium">
            Discover, request, and offer services within your campus community. Connect with trusted student providers instantly.
          </p>
        </div>

        {user && (
          <div className="flex flex-wrap gap-3 overflow-x-auto pb-4 scrollbar-hide">

            {/* Become a Provider — hidden if already provider or has pending/approved application */}
            {isBaseHub && showBecomeProvider && (
              <Link to="/campus-hub/apply" className="inline-flex flex-shrink-0 items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-md bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-0.5 whitespace-nowrap">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                </svg>
                {isRejected ? 'Re-Apply as Provider' : 'Become a Provider'}
              </Link>
            )}

            {/* Pending badge */}
            {isBaseHub && isPending && (
              <span className="inline-flex flex-shrink-0 items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm whitespace-nowrap cursor-default">
                <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Application Pending Review
              </span>
            )}

            <Link to="/campus-hub/orders" className={linkClass('orders')}>
              <span className="relative flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
                My Orders
                {unreadCount > 0 && (
                  <span className="absolute -top-3 -right-6 flex items-center justify-center min-w-[20px] h-5 bg-red-600 text-white text-xs font-black rounded-full px-1.5 shadow-md transform animate-bounce">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
            </Link>

            {isProvider && (
              <>
                <Link to="/campus-hub/my-services" className={linkClass('services')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  My Services
                </Link>
                <Link to="/campus-hub/provider-dashboard" className={linkClass('dashboard')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  Dashboard
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
