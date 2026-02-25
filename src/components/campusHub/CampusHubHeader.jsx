import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { campusHubAPI } from '../../services/api';

/**
 * Shared Campus Hub header: title, subtitle, and nav (My Orders, Dashboard, My Services).
 * Use on main Campus Hub, My Orders, My Services, and Provider Dashboard pages.
 */
const CampusHubHeader = ({ activePage }) => {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['campusHubUnreadCount'],
    queryFn: async () => {
      const res = await campusHubAPI.getUnreadCount();
      return res.data.count || 0;
    },
    enabled: !!user,
  });

  const linkClass = (page) => {
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all';
    if (activePage === page) {
      if (page === 'orders') return `${base} bg-gray-100 border-2 border-gray-300 text-gray-900`;
      if (page === 'dashboard') return `${base} bg-indigo-600 text-white border-2 border-indigo-600`;
      if (page === 'services') return `${base} bg-red-600 text-white border-2 border-red-600`;
    }
    if (page === 'orders') return `${base} bg-white border border-gray-200 hover:bg-gray-50 text-gray-700`;
    if (page === 'dashboard') return `${base} bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600`;
    if (page === 'services') return `${base} bg-red-600 text-white hover:bg-red-700 border border-red-600`;
    return `${base} bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600`;
  };

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Hub</h1>
      <p className="text-gray-600 mb-6">Browse campus services. Request a service to start chatting with the provider.</p>
      {user && (
        <div className="flex flex-wrap gap-4">
          <Link to="/campus-hub/orders" className={linkClass('orders')}>
            <span className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              My Orders
              {unreadCount > 0 && (
                <span className="absolute -top-3 -right-6 flex items-center justify-center min-w-[20px] h-5 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 shadow-sm transform scale-90 sm:scale-100 animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
          </Link>
          {isProvider && (
            <>
              <Link to="/campus-hub/provider-dashboard" className={linkClass('dashboard')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
                Dashboard
              </Link>
              <Link to="/campus-hub/my-services" className={linkClass('services')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                My Services
              </Link>
            </>
          )}
          {!isProvider && (
            <Link to="/campus-hub/apply" className={linkClass('apply')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
              Apply as Service Provider
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default CampusHubHeader;
