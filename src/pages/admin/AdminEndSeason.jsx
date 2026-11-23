import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { adminAPI, metaAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const AdminEndSeason = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    campus_id: "",
    department_id: "",
  });
  const [showPreview, setShowPreview] = useState(false);

  // Fetch Metadata
  const { data: metaData, isLoading: metaLoading } = useQuery({
    queryKey: ["adminEndSeasonMeta"],
    queryFn: async () => {
      const [campusesRes, departmentsRes, semestersRes] = await Promise.all([
        metaAPI.getCampuses(),
        metaAPI.getDepartments(),
        metaAPI.getSemesters(),
      ]);
      return {
        campuses: campusesRes.data.data || [],
        departments: departmentsRes.data.data || [],
        semesters: semestersRes.data.data || [],
      };
    },
    onError: () => toast.error("Failed to load metadata"),
  });

  const campuses = metaData?.campuses || [];
  const departments = metaData?.departments || [];
  const semesters = metaData?.semesters || [];

  // Fetch Student Counts
  const { data: studentCountsData, isLoading: countsLoading } = useQuery({
    queryKey: [
      "adminStudentCounts",
      formData.campus_id,
      formData.department_id,
    ],
    queryFn: async () => {
      const response = await adminAPI.getStudentCounts(
        formData.campus_id,
        formData.department_id,
      );
      return response.data.data || {};
    },
    enabled: !!(formData.campus_id && formData.department_id),
    onSuccess: () => setShowPreview(true),
  });

  const studentCounts = studentCountsData || {};

  // Mutation
  const promoteMutation = useMutation({
    mutationFn: () =>
      adminAPI.promoteUsersByCampusDepartment(
        formData.campus_id,
        formData.department_id,
      ),
    onSuccess: (response) => {
      toast.success(response.data.message || "Students promoted successfully!");
      setFormData({ campus_id: "", department_id: "" });
      setShowPreview(false);
      queryClient.invalidateQueries(["adminStudentCounts"]);
      queryClient.invalidateQueries(["adminUsers"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to promote students"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !window.confirm(
        "Are you sure you want to promote all students from the selected campus and department to the next semester? This action cannot be undone.",
      )
    ) {
      return;
    }
    promoteMutation.mutate();
  };

  const selectedCampus = campuses.find((c) => c._id === formData.campus_id);
  const selectedDepartment = departments.find(
    (d) => d._id === formData.department_id,
  );
  const uniqueSemesters = Array.from(
    new Map(semesters.map((s) => [s.number, s])).values(),
  ).sort((a, b) => a.number - b.number);
  const maxSemester =
    uniqueSemesters.length > 0
      ? Math.max(...uniqueSemesters.map((s) => s.number))
      : 0;

  if (metaLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
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
              <span className="text-xs font-bold text-red-600">
                Semester Rollover
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
                Academic <span className="text-red-600">Rollover</span>
              </h1>
              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black uppercase tracking-wider">
                End Season
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Promote enrolled students to their next semester level
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

        {/* ── Notice Callout ─────────────────────────────── */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 sm:p-4 mb-6 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-900 mb-0.5">
              Irreversible Batch Operation
            </h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              This action increments the semester level of all active students in the selected department by one.
              Students currently in the highest final semester will be retained.
            </p>
          </div>
        </div>

        {/* ── Promotion Form ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6 mb-8">
          <h2 className="text-sm font-bold text-gray-900 mb-1">
            Select Academic Scope
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Filter by campus and department to preview the enrolled student counts before triggering promotion.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Campus <span className="text-red-500">*</span>
                </label>
                <select
                  id="campus_id"
                  name="campus_id"
                  value={formData.campus_id}
                  onChange={(e) =>
                    setFormData({ ...formData, campus_id: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-red-500"
                >
                  <option value="">-- Choose Campus --</option>
                  {campuses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({ ...formData, department_id: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-red-500"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ready Confirmation Banner */}
            {showPreview && selectedCampus && selectedDepartment && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">
                    Ready for Semester Progression
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Target:{" "}
                    <span className="font-bold">{selectedCampus.name}</span> ·{" "}
                    <span className="font-bold">{selectedDepartment.name}</span>
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                  Scope Verified
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
              <Link
                to="/admin"
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={
                  promoteMutation.isPending ||
                  !formData.campus_id ||
                  !formData.department_id
                }
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {promoteMutation.isPending ? "Promoting..." : "Promote Eligible Students"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Current Semester Structure & Student Breakdown ─────────────────────────────── */}
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900">
              Semester Levels & Enrollments
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Active student counts across registered semester tiers
            </p>
          </div>

          {countsLoading ? (
            <div className="py-12 flex justify-center">
              <Loader />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {uniqueSemesters.map((semester) => (
                <div
                  key={semester._id}
                  className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs relative flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                      Semester {semester.number}
                    </span>
                    {semester.number < maxSemester ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                        →
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[9px] font-black uppercase">
                        Final
                      </span>
                    )}
                  </div>

                  {semester.name &&
                    semester.name !== `Semester ${semester.number}` && (
                      <p className="text-[11px] text-gray-400 font-medium truncate mb-2">
                        {semester.name}
                      </p>
                    )}

                  <div className="pt-2 border-t border-gray-50">
                    <span className="text-xs font-bold text-gray-900">
                      {studentCounts[semester._id] !== undefined
                        ? `${studentCounts[semester._id]} enrolled`
                        : "—"}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      {studentCounts[semester._id] !== undefined
                        ? "Active in scope"
                        : "Select scope to count"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEndSeason;
