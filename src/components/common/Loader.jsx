import React from "react";

/**
 * Universal Skeleton Loader
 * Renders modern, responsive placeholder skeleton cards and layout
 * whenever lazy routes or page content are being loaded.
 */
const Loader = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-pulse">
      {/* Top Banner / Header Skeleton */}
      <div className="mb-6 sm:mb-8 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 sm:h-9 bg-gray-200 rounded-xl w-48 sm:w-72"></div>
            <div className="h-3.5 sm:h-4 bg-gray-100 rounded-lg w-64 sm:w-96"></div>
          </div>
          <div className="hidden sm:block h-10 bg-gray-200 rounded-xl w-32"></div>
        </div>

        {/* Search bar skeleton */}
        <div className="h-11 sm:h-12 bg-white border border-gray-100 rounded-full w-full max-w-3xl shadow-sm mt-4"></div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column / Sidebar Skeleton */}
        <div className="hidden lg:block lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-8 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-8 bg-gray-100 rounded-xl w-full"></div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2.5">
            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-7 bg-gray-50 rounded-lg w-full"></div>
            ))}
          </div>
        </div>

        {/* Right / Main Content Cards Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Subheader info bar skeleton */}
          <div className="flex items-center justify-between pb-1">
            <div className="h-4 bg-gray-100 rounded w-36"></div>
            <div className="h-4 bg-gray-100 rounded w-20"></div>
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3"
              >
                {/* Badge tags */}
                <div className="flex gap-2">
                  <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
                  <div className="h-4 w-14 bg-gray-100 rounded-full"></div>
                </div>

                {/* Title lines */}
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                </div>

                {/* Body excerpt lines */}
                <div className="space-y-1 pt-1">
                  <div className="h-3 bg-gray-50 rounded w-full"></div>
                  <div className="h-3 bg-gray-50 rounded w-4/5"></div>
                </div>

                {/* Footer metadata */}
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                    <div className="h-3 bg-gray-100 rounded w-20"></div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
