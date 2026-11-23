import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { communitiesAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { timeAgo } from "../../utils/timeAgo";

// ─── Single Community Card ──────────────────────────────────────────────────
const CommunityCard = ({ community, onClick }) => {
  const memberCount =
    community.members_count || community.members?.length || 0;
  const creatorName = community.user?.name || "Student Leader";

  return (
    <article
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-red-100 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Badges & Member Count */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
            Study Group
          </span>

          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            <svg
              className="w-3 h-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Community Name */}
        <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-1 mb-1.5 group-hover:text-red-600 transition-colors">
          {community.name}
        </h2>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {community.description ||
            "Join this student community to discuss coursework, study sessions, and campus events."}
        </p>
      </div>

      {/* Footer Info */}
      <div className="pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {community.user?.profilePicture ? (
            <img
              src={community.user.profilePicture}
              alt=""
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[8px] font-bold">
              {creatorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-gray-600 truncate max-w-[120px] sm:max-w-[150px]">
            {creatorName}
          </span>
          {community.createdAt && (
            <>
              <span>•</span>
              <span>{timeAgo(community.createdAt)}</span>
            </>
          )}
        </div>

        <span className="text-[10px] font-bold text-red-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
          View &rarr;
        </span>
      </div>
    </article>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const CommunitiesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(currentSearch);

  const { data: communities = [], isLoading: loading } = useQuery({
    queryKey: ["communities", { search: currentSearch }],
    queryFn: async () => {
      const params = {};
      if (currentSearch) params.search = currentSearch;
      const response = await communitiesAPI.getAll(params);
      return response.data.data || [];
    },
    keepPreviousData: true,
  });

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSearchParams({});
  };

  if (loading && !communities.length) {
    return <Loader />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
      {/* ── Compact Header & Search Bar ── */}
      <div className="mb-4">
        {/* Compact Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">
              Student <span className="text-red-600">Communities</span>
            </h1>
            <span className="hidden sm:inline text-xs text-gray-400 font-normal">
              — Connect, study, and collaborate in peer groups
            </span>
          </div>
        </div>

        {/* Compact Pill Search Bar */}
        <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 flex items-center max-w-3xl">
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 relative flex items-center"
          >
            <svg
              className="absolute left-4 w-4 h-4 text-gray-400"
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
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities, departments, clubs, or study circles..."
              className="w-full bg-transparent border-none py-2 sm:py-2.5 pl-11 pr-3 text-xs sm:text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none"
            />
          </form>
          <button
            onClick={handleSearchSubmit}
            className="px-5 py-1.5 sm:py-2 bg-red-600 text-white rounded-full font-bold uppercase tracking-wider hover:bg-red-700 transition-all text-[11px] shrink-0 active:scale-95 shadow-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* ── Main Layout: Sidebar & Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Column: Quick Info Widget */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
              Community Stats
            </h3>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600">Total Circles</span>
              <span className="font-mono text-sm font-black text-gray-900">
                {communities.length}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
              Study groups and departmental communities help you find course mates, share updates, and revise together.
            </p>
          </div>
        </aside>

        {/* Right Column: Community Cards Grid */}
        <main className="lg:col-span-3">
          {/* Subheader summary */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{communities.length}</span> communit{communities.length !== 1 ? "ies" : "y"}
              {currentSearch && (
                <span> matching "<span className="font-bold text-gray-900">{currentSearch}</span>"</span>
              )}
            </div>

            {currentSearch && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline"
              >
                Clear search
              </button>
            )}
          </div>

          {/* Grid */}
          {communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {communities.map((community) => (
                <CommunityCard
                  key={community._id}
                  community={community}
                  onClick={() => navigate(`/communities/${community._id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center shadow-sm my-4">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
                  />
                </svg>
              </div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight mb-1">
                No Communities Found
              </h3>
              <p className="text-gray-500 font-medium mb-6 max-w-sm mx-auto text-xs">
                {currentSearch
                  ? "No communities matched your search query. Try different keywords."
                  : "No communities have been created yet. Be the first to start a study circle!"}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {currentSearch && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all"
                  >
                    Clear Search
                  </button>
                )}
                {user ? (
                  <Link
                    to="/communities/create"
                    className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md shadow-gray-900/10"
                  >
                    Create Community
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-600/20"
                  >
                    Login to Join
                  </Link>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Floating "Create Community" Button ── */}
      {user && (
        <Link
          to="/communities/create"
          className="fixed bottom-24 sm:bottom-8 right-5 sm:right-8 bg-gray-900 hover:bg-red-600 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 z-40 group border border-white/20"
          aria-label="Create Community"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">
            Create Community
          </span>
        </Link>
      )}
    </div>
  );
};

export default CommunitiesList;
