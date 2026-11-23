import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { adminAPI, metaAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const AdminNotes = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'approved'
  const [campusFilter, setCampusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const limit = 20;

  // Fetch metadata for filters
  const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: async () => (await metaAPI.getCampuses()).data.data,
  });
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await metaAPI.getDepartments()).data.data,
  });
  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => (await metaAPI.getSemesters()).data.data,
  });

  // Fetch Notes
  const { data: notesData, isLoading: loading } = useQuery({
    queryKey: [
      "adminNotes",
      page,
      statusFilter,
      campusFilter,
      departmentFilter,
      semesterFilter,
    ],
    queryFn: async () => {
      const params = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (campusFilter) params.campus_id = campusFilter;
      if (departmentFilter) params.department_id = departmentFilter;
      if (semesterFilter) params.semester_id = semesterFilter;
      const response = await adminAPI.getNotes(params);
      return response.data;
    },
    onError: () => toast.error("Failed to load notes"),
  });

  const notes = notesData?.data || [];
  const pendingNotesCount = notesData?.pendingNotesCount || 0;
  const pagination = notesData?.pagination || { page: 1, total: 0, pages: 0 };

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approveNote(id),
    onSuccess: () => {
      toast.success("Note approved and published!");
      queryClient.invalidateQueries(["adminNotes"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Approval failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => adminAPI.rejectNote(id),
    onSuccess: () => {
      toast.success("Note rejected.");
      queryClient.invalidateQueries(["adminNotes"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Operation failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteNote(id),
    onSuccess: () => {
      toast.success("Note deleted permanently.");
      queryClient.invalidateQueries(["adminNotes"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Delete failed"),
  });

  const handleApprove = (id) => approveMutation.mutate(id);

  const handleReject = (id) => {
    if (window.confirm("Are you sure you want to reject this note?")) {
      rejectMutation.mutate(id);
    }
  };

  const handleDelete = (id) => {
    if (
      window.confirm("Are you sure you want to delete this note permanently?")
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleCampusChange = (e) => {
    setCampusFilter(e.target.value);
    setPage(1);
  };
  const handleDepartmentChange = (e) => {
    setDepartmentFilter(e.target.value);
    setPage(1);
  };
  const handleSemesterChange = (e) => {
    setSemesterFilter(e.target.value);
    setPage(1);
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
              <span className="text-xs font-bold text-red-600">Notes</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
                Study Notes <span className="text-red-600">Moderation</span>
              </h1>
              {pendingNotesCount > 0 && (
                <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-bold">
                  {pendingNotesCount} Pending Review
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Review, approve, and manage peer-shared study materials
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

        {/* ── Filters Bar ─────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-xs mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full self-start">
            {["all", "pending", "approved"].map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  statusFilter === status
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Metadata Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={campusFilter}
              onChange={handleCampusChange}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-red-500"
            >
              <option value="">All Campuses</option>
              {campuses?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={handleDepartmentChange}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-red-500"
            >
              <option value="">All Departments</option>
              {departments?.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={semesterFilter}
              onChange={handleSemesterChange}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-red-500"
            >
              <option value="">All Semesters</option>
              {semesters?.map((s) => (
                <option key={s._id} value={s._id}>
                  Semester {s.number}
                </option>
              ))}
            </select>

            {(campusFilter || departmentFilter || semesterFilter) && (
              <button
                onClick={() => {
                  setCampusFilter("");
                  setDepartmentFilter("");
                  setSemesterFilter("");
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition cursor-pointer"
                title="Reset filters"
              >
                ✕ Reset
              </button>
            )}
          </div>
        </div>

        {/* ── Notes Table ─────────────────────────────── */}
        {loading ? (
          <Loader />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Course & Dept
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {notes.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-12 text-center text-gray-400 font-medium"
                      >
                        No notes found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    notes.map((note) => (
                      <tr
                        key={note._id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        {/* Title & Link */}
                        <td className="px-4 py-3">
                          <Link
                            to={`/notes/${note._id}`}
                            className="font-bold text-gray-900 hover:text-red-600 transition-colors line-clamp-1 max-w-xs block"
                            title={note.title}
                          >
                            {note.title}
                          </Link>
                        </td>

                        {/* Author */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                              {note.user?.profilePicture ? (
                                <img
                                  src={note.user.profilePicture}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-gray-500">
                                  {note.user?.name?.charAt(0) || "?"}
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-gray-800 truncate max-w-[120px]">
                              {note.user?.name || "Anonymous"}
                            </span>
                          </div>
                        </td>

                        {/* Course & Department */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[10px] uppercase">
                            {note.courseName || "General"}
                          </span>
                          <span className="text-[11px] text-gray-400 ml-1.5">
                            {note.user?.department?.code || ""}
                          </span>
                        </td>

                        {/* Semester */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-gray-700 font-medium">
                            {note.user?.semester?.number
                              ? `Sem ${note.user.semester.number}`
                              : "N/A"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {note.isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-[11px]">
                          {new Date(note.createdAt).toLocaleDateString(
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
                              to={`/notes/${note._id}`}
                              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition"
                            >
                              Inspect
                            </Link>

                            {!note.isApproved && (
                              <button
                                onClick={() => handleApprove(note._id)}
                                disabled={approveMutation.isPending}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                              >
                                Approve
                              </button>
                            )}

                            <button
                              onClick={() =>
                                note.isApproved
                                  ? handleDelete(note._id)
                                  : handleReject(note._id)
                              }
                              disabled={
                                rejectMutation.isPending ||
                                deleteMutation.isPending
                              }
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            >
                              {note.isApproved ? "Delete" : "Reject"}
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
                  Page {page} of {pagination.pages} ({pagination.total} total notes)
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

export default AdminNotes;
