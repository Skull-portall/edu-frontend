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
  const [search, setSearch] = useState(currentSearch);

  const { data: communities = [], isLoading: loading } = useQuery({
    queryKey: ['communities', { search: currentSearch }],
    queryFn: async () => {
      const params = {};
      if (currentSearch) params.search = currentSearch;
      const response = await communitiesAPI.getAll(params);
      return response.data.data || [];
    },
    keepPreviousData: true,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      {/* Header Section */}
      <div className="mb-16 animate-fade-in text-center lg:text-left flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight uppercase">
            Communities
          </h1>
          <p className="text-gray-500 font-medium max-w-xl">
            Join groups with fellow students. Collaborative learning makes studying easier and more fun.
          </p>
        </div>

        {/* Global Action */}
        <div className="shrink-0">
          {user && (
            <Link
              to="/communities/create"
              className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:shadow-gray-900/30 transform hover:-translate-y-1 active:scale-95 transition-all text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
              </svg>
              Create Community
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-8 animate-slide-up">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Discovery</h3>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a community..."
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-400"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg shadow-gray-900/20"
              >
                Search
              </button>
              {currentSearch && (
                <Link
                  to="/communities"
                  onClick={() => setSearch('')}
                  className="block w-full text-center py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                >
                  Clear Results
                </Link>
              )}
            </form>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-3xl p-8 text-white shadow-2xl shadow-red-600/20 text-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">Communities</h3>
            <div className="text-4xl font-black mb-1">{communities.length}</div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-6">Total Communities</p>
            <p className="text-xs font-medium opacity-80 leading-relaxed italic border-t border-white/10 pt-6">
              "Communities help us learn better together."
            </p>
          </div>
        </div>

        {/* Community Grid */}
        <div className="lg:col-span-3">
          {communities.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 animate-fade-in">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">No Communities Found</h3>
              <p className="text-gray-500 font-medium mb-10 max-w-sm mx-auto">Try searching for something else or create the first community.</p>
              {user && (
                <Link to="/communities/create" className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:shadow-gray-900/30 transition-all text-sm">
                  Create First Community
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {communities.map((community, index) => (
                <article
                  key={community._id}
                  onClick={() => navigate(`/communities/${community._id}`)}
                  className="group bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer flex flex-col items-start"
                >
                  <div className="flex items-center justify-between w-full mb-8">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-black text-gray-900 font-mono tracking-tighter">{community.members_count || community.members?.length || 0}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Members</span>
                    </div>
                  </div>

                  <h2 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-red-600 transition-colors uppercase tracking-tight line-clamp-1">
                    {community.name}
                  </h2>
                  <p className="text-gray-500 font-medium line-clamp-2 leading-relaxed mb-10 italic flex-1">
                    "{community.description || 'Focus, collaboration, and academic growth through shared efforts.'}"
                  </p>

                  <div className="flex items-center gap-4 pt-6 border-t border-gray-50 w-full mt-auto">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg ring-2 ring-gray-100">
                      {community.user?.profilePicture ? (
                        <img src={community.user.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white text-[10px] font-black">
                          {community.user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Moderator</span>
                      <span className="block text-xs font-black text-gray-900 uppercase truncate max-w-[120px]">{community.user?.name || 'STUDENT'}</span>
                    </div>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunitiesList;
