import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const AdminCommunities = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch Communities
  const { data: communitiesData, isLoading: loading } = useQuery({
    queryKey: ["adminCommunities", page],
    queryFn: async () => {
      const response = await adminAPI.getCommunities({ page, limit });
      return response.data;
    },
    keepPreviousData: true,
    onError: () => toast.error("Failed to load communities"),
  });

  const communities = communitiesData?.data || [];
  const inactiveCommunitiesCount =
    communitiesData?.inactiveCommunitiesCount || 0;
  const pagination = communitiesData?.pagination || {
    page: 1,
    total: 0,
    pages: 0,
  };

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: (id) => adminAPI.toggleCommunity(id),
    onSuccess: () => {
      toast.success("Community status updated successfully!");
      queryClient.invalidateQueries(["adminCommunities"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update community"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteCommunity(id),
    onSuccess: () => {
      toast.success("Community deleted successfully!");
      queryClient.invalidateQueries(["adminCommunities"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete community"),
  });

  const handleToggle = (communityId) => {
    toggleMutation.mutate(communityId);
  };

  const handleDelete = (communityId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this community? This action cannot be undone!",
      )
    ) {
      deleteMutation.mutate(communityId);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* ── Breadcrumb & Top Bar ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/admin"
                className="text-xs font-bold text-gray-500 hover:text-red-600 transition"
              >
                Admin
              </Link>
              <span className="text-gray-300 text-xs">/</span>
              <span className="text-xs font-bold text-red-600">Communities</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
                Community <span className="text-red-600">Moderation</span>
              </h1>
              {inactiveCommunitiesCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                  {inactiveCommunitiesCount} Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Review discussion circles, posts activity, and community statuses
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Admin Dashboard
            </Link>
          </div>
        </div>

        {/* ── Table ─────────────────────────────── */}
        {loading ? (
          <Loader />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Community
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Creator
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Posts
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {communities.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-12 text-center text-gray-400 font-medium"
                      >
                        No communities found.
                      </td>
                    </tr>
                  ) : (
                    communities.map((community) => (
                      <tr
                        key={community._id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        {/* Title & Desc */}
                        <td className="px-4 py-3">
                          <Link
                            to={`/communities/${community._id}`}
                            className="font-bold text-gray-900 hover:text-red-600 transition-colors line-clamp-1 max-w-xs block"
                          >
                            {community.name}
                          </Link>
                          {community.description && (
                            <span className="text-[11px] text-gray-400 line-clamp-1 max-w-xs block">
                              {community.description}
                            </span>
                          )}
                        </td>

                        {/* Owner */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-gray-800 truncate max-w-[120px] block">
                            {community.user?.name || "N/A"}
                          </span>
                        </td>

                        {/* Posts */}
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-700">
                          {community.posts?.length || 0}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {community.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-[11px]">
                          {new Date(community.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/communities/${community._id}`}
                              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition"
                            >
                              View
                            </Link>

                            <button
                              onClick={() => handleToggle(community._id)}
                              disabled={toggleMutation.isPending}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                                community.isActive
                                  ? "bg-amber-50 hover:bg-amber-100 text-amber-700"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {community.isActive ? "Deactivate" : "Activate"}
                            </button>

                            <button
                              onClick={() => handleDelete(community._id)}
                              disabled={deleteMutation.isPending}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">
                  Page {page} of {pagination.pages} ({pagination.total} total communities)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCommunities;
