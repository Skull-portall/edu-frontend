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
    { id: "ALL", label: "ALL" },
    ...dbCategories
      .filter((cat) => cat.toUpperCase() !== "ALL")
      .map((cat) => ({ id: cat, label: cat.toUpperCase() })),
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

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6">
      <CampusHubHeader />

      <div className="mt-2 md:mt-4 mb-10">
        <div className="rounded-[2.5rem] bg-white border border-gray-200 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] p-6 sm:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveSearch(searchQuery);
            }}
            className="relative flex flex-col md:flex-row items-stretch md:items-center gap-4"
          >
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-500 transition-colors">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What service are you looking for?"
                className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-3.5 sm:py-4.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-200 transition-all shadow-sm text-base sm:text-lg font-medium"
              />
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${showFilters ? "bg-gray-900 text-white border-gray-900 shadow-xl" : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50 shadow-sm"}`}
              >
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
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  ></path>
                </svg>
                Filters
              </button>

              <button
                type="submit"
                className="flex-[2] sm:flex-none px-6 sm:px-10 py-3.5 sm:py-4.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-2xl shadow-xl shadow-red-500/30 hover:shadow-red-500/50 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Expanded Filters */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${showFilters ? "max-h-[500px] mt-8 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Price Range (₦)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-200 transition-all"
                  />
                  <span className="text-gray-300 font-bold">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-200 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Sort Results By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-200 transition-all appearance-none cursor-pointer"
                >
                  <option value="newest">Latest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    setSortBy("newest");
                    setActiveSearch("");
                    setSearchQuery("");
                  }}
                  className="w-full py-3 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 flex-shrink-0">
              Categories:
            </span>
            <div className="flex items-center gap-3 min-w-max">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                    activeCategory === category.id
                      ? "bg-red-600 text-white shadow-lg shadow-red-500/25 transform -translate-y-0.5"
                      : "bg-gray-50 text-gray-500 border border-transparent hover:border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {services.map((service) => (
          <div
            key={service._id}
            onClick={() => navigate(`/campus-hub/services/${service._id}`)}
            className="group bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_-12px_rgba(220,38,38,0.2)] hover:border-red-100/60 transition-all duration-500 overflow-hidden cursor-pointer flex flex-col h-full transform hover:-translate-y-2"
          >
            <div className="relative aspect-[16/11] overflow-hidden">
              {service.images && service.images.length > 0 ? (
                <img
                  src={getImageUrl(service.images[0])}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-in-out"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
              )}

              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-sm">
                  {service.category || "General"}
                </span>
              </div>

              <div className="absolute bottom-4 right-4">
                <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xl shadow-black/10 border border-white/20">
                  <p className="text-base font-black text-rose-600 leading-none">
                    ₦{Number(service.price).toLocaleString("en-NG")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-extrabold text-gray-900 mb-2.5 group-hover:text-red-600 transition-colors line-clamp-1 leading-tight tracking-tight">
                {service.title}
              </h3>
              <p className="text-gray-500 text-sm font-medium line-clamp-2 leading-relaxed mb-6">
                {service.description}
              </p>

              <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    {service.provider?.profilePicture ? (
                      <img
                        src={getImageUrl(service.provider.profilePicture)}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover shadow-sm border border-red-50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center text-sm font-bold text-red-700 border-2 border-white shadow-sm">
                        {service.provider?.name?.charAt(0) || "P"}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-gray-900 truncate max-w-[120px]">
                      {service.provider?.name}
                    </span>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Provider
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-24 bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-100 mt-8">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100/50">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
            No services found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
            We couldn't find any services matching your current filters. Try
            searching for something else.
          </p>
        </div>
      )}
    </div>
  );
};
export default CampusHub;
