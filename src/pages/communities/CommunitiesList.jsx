import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { communitiesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';



const ICONS = {
  'Users': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
    </svg>
  ),
  'Book': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  'Code': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  'Chat': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
};

const CommunitiesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || 'All';
  const [search, setSearch] = useState(currentSearch);

  const { data: categories = [] } = useQuery({
    queryKey: ['communityCategories'],
    queryFn: async () => {
      const res = await communitiesAPI.getCategories();
      return [{ name: 'All', icon: '🌍' }, ...(res.data?.data || [])];
    },
    staleTime: 10 * 60 * 1000
  });

  const { data: communities = [], isLoading: loading } = useQuery({
    queryKey: ['communities', { search: currentSearch, category: currentCategory }],
    queryFn: async () => {
      const params = {};
      if (currentSearch) params.search = currentSearch;
      if (currentCategory !== 'All') params.category = currentCategory;
      const response = await communitiesAPI.getAll(params);
      return response.data.data || [];
    },
    keepPreviousData: true,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters(search, currentCategory);
  };

  const handleCategorySelect = (category) => {
    updateFilters(currentSearch, category);
  };

  const updateFilters = (searchTerm, categoryName) => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (categoryName && categoryName !== 'All') params.set('category', categoryName);
    navigate(`/communities?${params.toString()}`);
  };

  if (loading && !communities.length) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 lg:mb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Communities</h1>
          <p className="text-gray-600">Connect, collaborate, and share knowledge with your peers in specialized groups.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleSearch} className="relative group min-w-[300px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities..."
              className="w-full bg-white border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-lg py-2.5 pl-10 pr-4 text-sm transition-all shadow-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
          {user && (
            <Link
              to="/communities/create"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Create Community
            </Link>
          )}
        </div>
      </div>

    <div className="flex flex-wrap items-center gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => handleCategorySelect(cat.name)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
            currentCategory === cat.name
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>{cat.icon}</span>
          {cat.name}
        </button>
      ))}
    </div>

    {/* Communities Grid */}
    {communities.length === 0 ? (
      <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No communities found</h2>
        <p className="text-gray-500 mb-6">Try adjusting your search or filters to find what you're looking for.</p>
        <button 
          onClick={() => navigate('/communities')}
          className="text-red-600 font-semibold hover:underline"
        >
          Reset all filters
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map((community) => (
          <article
            key={community._id}
            onClick={() => navigate(`/communities/${community._id}`)}
            className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                {ICONS[community.displayIcon] || ICONS['Users']}
              </div>
              <div className="text-right">
                <span className="block text-lg font-bold text-gray-900 leading-none">
                  {community.members_count || 0}
                </span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Members
                </span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">
                  {community.category || 'General'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors truncate">
                {community.name}
              </h2>
              <p className="text-sm text-gray-600 line-clamp-2 mb-6">
                {community.description || 'Join this community to connect with peers and share knowledge.'}
              </p>
              
              {community.pinnedResources?.length > 0 && (
                <div className="flex items-center gap-2 text-emerald-600 mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span className="text-xs font-bold">{community.pinnedResources.length} Resources</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100">
                {community.user?.profilePicture ? (
                  <img src={community.user.profilePicture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-red-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {community.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 leading-none">
                  {community.user?.name || 'Anonymous User'}
                </span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
                  Creator
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    )}

    {/* Pagination Placeholder */}
    <div className="mt-8 flex justify-center">
      {/* Pagination component would go here */}
    </div>
  </div>
);
};

export default CommunitiesList;
