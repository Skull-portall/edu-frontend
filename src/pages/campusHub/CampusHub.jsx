import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import CampusHubHeader from '../../components/campusHub/CampusHubHeader';
import { getImageUrl } from '../../utils/imageUrl';

const CampusHub = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const campusIdValue = user?.campus?._id || user?.campus;

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['campusHubServices', activeSearch, campusIdValue],
    queryFn: async () => {
      const res = await campusHubAPI.getServices({
        search: activeSearch || undefined,
        status: 'active',
        campusId: campusIdValue || undefined
      });
      return res.data.data || [];
    },
  });

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CampusHubHeader />

      {/* Apply as Service Provider CTA - show when user is logged in and NOT already a provider */}
      {user && user.role !== 'provider' && (
        <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-rose-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Offer your skills to fellow students</h2>
            <p className="text-sm text-gray-600">Apply as a service provider, get approved by admin, and start offering any kind of services,sales, notes, or other campus services.</p>
          </div>
          <Link
            to="/campus-hub/apply"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-rose-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
            Apply as Service Provider
          </Link>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Search Services</label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(searchQuery);
          }}
          className="flex max-w-lg gap-3"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword, category, or title..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm flex-shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service._id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            {(service.images && service.images.length > 0) ? (
              <img src={getImageUrl(service.images[0])} alt="" className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  {service.category}
                </span>
                <span className="text-lg font-bold text-red-600">₦{Number(service.price).toLocaleString('en-NG')}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{service.title}</h2>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
              <div className="flex items-center gap-2 mb-4">
                {service.provider?.profilePicture ? (
                  <img src={getImageUrl(service.provider.profilePicture)} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{service.provider?.name?.charAt(0) || 'P'}</div>
                )}
                <span className="text-xs text-gray-500">by {service.provider?.name || 'Provider'}</span>
              </div>
              {user ? (
                <Link
                  to={`/campus-hub/services/${service._id}`}
                  className="block w-full text-center py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                >
                  View & Request
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="block w-full text-center py-2 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm"
                >
                  Login to Request
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <p className="text-gray-500 text-lg">No services found</p>
          <p className="text-gray-400">Try a different search term or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default CampusHub;
