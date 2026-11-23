import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { campusHubAPI } from "../../services/api";
import { useQuery } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";
import CampusHubHeader from "../../components/campusHub/CampusHubHeader";
import { getImageUrl } from "../../utils/imageUrl";

const CampusHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["campusHubCategories"],
    queryFn: async () => {
      const res = await campusHubAPI.getCategories();
      return res.data.data || [];
    },
  });

  const categories = [
    { id: "ALL", label: "All" },
    ...dbCategories
      .filter((cat) => cat.toUpperCase() !== "ALL")
      .map((cat) => ({ id: cat, label: cat })),
  ];

  const campusIdValue = user?.campus?._id || user?.campus;

  const { data: services = [], isLoading } = useQuery({
    queryKey: [
      "campusHubServices",
      activeSearch,
      activeCategory,
      campusIdValue,
      minPrice,
      maxPrice,
      sortBy,
    ],
    queryFn: async () => {
      const res = await campusHubAPI.getServices({
        search: activeSearch || undefined,
        category: activeCategory !== "ALL" ? activeCategory : undefined,
        status: "active",
        campusId: campusIdValue || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sort: sortBy,
      });
      return res.data.data || [];
    },
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  const handleResetFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setActiveSearch("");
    setSearchQuery("");
    setActiveCategory("ALL");
  };

  if (isLoading && !services.length) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
      <CampusHubHeader activePage="hub" />

      {/* ── Compact Search & Filter Row ── */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-3xl">
          {/* Pill Search Input */}
          <div className="flex-1 bg-white p-1 rounded-full shadow-sm border border-gray-200 flex items-center">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campus services, design, tutoring, delivery, laundry..."
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

          {/* Toggle Filter Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 sm:py-2.5 rounded-full font-bold text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              showFilters
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-sm"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Filters</span>
          </button>
        </div>

        {/* ── Expandable Filter Box ── */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mt-3 max-w-3xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Price Range (₦)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <span className="text-gray-300 text-xs">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                >
                  <option value="newest">Latest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-1.5 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 rounded-lg transition-all"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Category Filter Pills ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-2 mt-2 -mx-2 px-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeCategory === cat.id
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Subheader summary ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{services.length}</span> service{services.length !== 1 ? "s" : ""}
          {activeCategory !== "ALL" && (
            <span> in <span className="font-bold text-red-600">{activeCategory}</span></span>
          )}
          {activeSearch && (
            <span> matching "<span className="font-bold text-gray-900">{activeSearch}</span>"</span>
          )}
        </div>

        {(activeCategory !== "ALL" || activeSearch || minPrice || maxPrice) && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-red-600 hover:text-red-700 underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* ── Services Grid ── */}
      {services.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map((service) => (
            <div
              key={service._id}
              onClick={() => navigate(`/campus-hub/services/${service._id}`)}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Image Banner */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={getImageUrl(service.images[0])}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Category Pill Tag */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider rounded-md">
                      {service.category || "Service"}
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-2.5 right-2.5">
                    <div className="bg-white/95 px-2.5 py-1 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs font-black text-red-600 leading-none font-mono">
                        ₦{Number(service.price).toLocaleString("en-NG")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3.5">
                  <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors line-clamp-1 leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Provider Info Footer */}
              <div className="px-3.5 pb-3 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  {service.provider?.profilePicture ? (
                    <img
                      src={getImageUrl(service.provider.profilePicture)}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[8px]">
                      {service.provider?.name?.charAt(0) || "P"}
                    </div>
                  )}
                  <span className="font-semibold text-gray-700 truncate max-w-[120px]">
                    {service.provider?.name || "Provider"}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-red-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mt-4">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base font-black text-gray-900 mb-1">
            No services found
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            No services matched your current filters. Try searching for something else or resetting your filters.
          </p>
          {(activeCategory !== "ALL" || activeSearch || minPrice || maxPrice) && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CampusHub;
