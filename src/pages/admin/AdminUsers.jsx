import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminAPI, metaAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    campus_id: "",
    department_id: "",
    semester_id: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const limit = 20;

  // Metadata Query
  const { data: metaData } = useQuery({
    queryKey: ["adminMeta"],
    queryFn: async () => {
      const [deptRes, semRes, campusRes] = await Promise.all([
        metaAPI.getDepartments(),
        metaAPI.getSemesters(),
        metaAPI.getCampuses(),
      ]);
      return {
        departments: deptRes.data.data || [],
        semesters: semRes.data.data || [],
        campuses: campusRes.data.data || [],
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Users Query
  const { data: usersData, isLoading: loading } = useQuery({
    queryKey: ["adminUsers", { ...filters, page, limit }],
    queryFn: async () => {
      const params = { page, limit, ...filters };
      const response = await adminAPI.getUsers(params);
      return response.data;
    },
    keepPreviousData: true,
    onError: () => toast.error("Failed to load users"),
  });

  const users = usersData?.data || [];
  const pagination = usersData?.pagination || { page: 1, total: 0, pages: 0 };
  const newUsersCount = usersData?.newUsersCount || 0;
  const { departments = [], semesters = [], campuses = [] } = metaData || {};

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      campus_id: "",
      department_id: "",
      semester_id: "",
      status: "",
    });
    setPage(1);
  };

  // Mutations
  const promoteMutation = useMutation({
    mutationFn: () => adminAPI.promoteSemester(),
    onSuccess: (res) => {
      toast.success(res.data.message || "Users promoted successfully!");
      queryClient.invalidateQueries(["adminUsers"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to promote users"),
  });

  const suspendMutation = useMutation({
    mutationFn: (id) => adminAPI.suspendUser(id),
    onSuccess: () => {
      toast.success("User suspended successfully!");
      queryClient.invalidateQueries(["adminUsers"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to suspend user"),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id) => adminAPI.reactivateUser(id),
    onSuccess: () => {
      toast.success("User restored successfully!");
      queryClient.invalidateQueries(["adminUsers"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to reactivate user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted successfully!");
      queryClient.invalidateQueries(["adminUsers"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete user"),
  });

  const handlePromoteSemester = () => {
    if (window.confirm("Are you sure you want to promote eligible users?")) {
      promoteMutation.mutate();
    }
  };

  const handleSuspend = (id) => {
    if (window.confirm("Suspend user?")) suspendMutation.mutate(id);
  };

  const handleReactivate = (id) => reactivateMutation.mutate(id);

  const handleDelete = (id) => {
    if (window.confirm("Delete user? This cannot be undone."))
      deleteMutation.mutate(id);
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
              <span className="text-xs font-bold text-red-600">Users</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
                User <span className="text-red-600">Directory</span>
              </h1>
              {newUsersCount > 0 && (
                <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-bold">
                  +{newUsersCount} New
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Manage accounts, verify profiles, and control platform access
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

        {/* ── Bulk Promotion Banner ─────────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3.5 sm:p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-blue-900">
                Bulk Semester Progression
              </span>
              <span className="px-2 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-bold uppercase">
                Academic Rollover
              </span>
            </div>
            <p className="text-[11px] text-blue-700 mt-0.5">
              Promote all registered users enrolled 3+ months to their next academic level.
            </p>
          </div>

          <button
            onClick={handlePromoteSemester}
            disabled={promoteMutation.isPending}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {promoteMutation.isPending ? "Promoting..." : "Promote Eligible"}
          </button>
        </div>

        {/* ── Filter Bar ─────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-xs mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            <div>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search name or email..."
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <select
                name="campus_id"
                value={filters.campus_id}
                onChange={handleFilterChange}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-red-500"
              >
                <option value="">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                name="department_id"
                value={filters.department_id}
                onChange={handleFilterChange}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-red-500"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                name="semester_id"
                value={filters.semester_id}
                onChange={handleFilterChange}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-red-500"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s._id} value={s._id}>
                    Semester {s.number}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-red-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              {(filters.search ||
                filters.campus_id ||
                filters.department_id ||
                filters.semester_id ||
                filters.status) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="Clear filters"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Users Table ─────────────────────────────── */}
        {loading ? (
          <Loader />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Campus / Dept
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-12 text-center text-gray-400 font-medium"
                      >
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u._id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        {/* User Profile */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                              {u.profilePicture ? (
                                <img
                                  src={u.profilePicture}
                                  alt={u.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                                  {u.name?.charAt(0) || "U"}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-900 truncate max-w-[140px]">
                                  {u.name}
                                </span>
                                {u.isAdmin && (
                                  <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[9px] font-bold">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-400 truncate block">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.phoneNumber ? (
                            <a
                              href={`https://wa.me/${u.phoneNumber.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 text-[11px]"
                            >
                              <span>{u.phoneNumber}</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[11px]">N/A</span>
                          )}
                        </td>

                        {/* Campus / Dept */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-gray-900 font-semibold truncate max-w-[150px]">
                            {u.department?.name || u.department?.code || "N/A"}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                            {u.campus?.name || u.campus?.code || "Campus N/A"}
                          </div>
                        </td>

                        {/* Semester */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-gray-700 font-medium">
                            {u.semester ? `Sem ${u.semester.number}` : "N/A"}
                          </span>
                        </td>

                        {/* Stats */}
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          <span className="font-bold text-gray-900">
                            {u.questionsCount || 0}
                          </span>{" "}
                          Q ·{" "}
                          <span className="font-bold text-gray-900">
                            {u.answersCount || 0}
                          </span>{" "}
                          A
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.suspendedAt ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/admin/users/${u._id}`)}
                              className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              View
                            </button>

                            {u.suspendedAt ? (
                              <button
                                onClick={() => handleReactivate(u._id)}
                                disabled={reactivateMutation.isPending}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(u._id)}
                                disabled={suspendMutation.isPending}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Suspend
                              </button>
                            )}

                            {u._id !== currentUser?._id && (
                              <button
                                onClick={() => handleDelete(u._id)}
                                disabled={deleteMutation.isPending}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Delete user"
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
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
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
                  Showing page {page} of {pagination.pages} ({pagination.total}{" "}
                  total users)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
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

export default AdminUsers;
