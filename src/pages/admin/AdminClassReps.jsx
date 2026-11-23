import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import Loader from "../../components/common/Loader";
import { getImageUrl } from "../../utils/imageUrl";

const AdminClassReps = () => {
  const queryClient = useQueryClient();
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [emailToSearch, setEmailToSearch] = useState("");

  // Fetch reference data
  const { data: campuses = [] } = useQuery({
    queryKey: ["adminCampuses"],
    queryFn: async () => {
      const res = await adminAPI.getCampuses();
      return res.data.data;
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["adminDepartments"],
    queryFn: async () => {
      const res = await adminAPI.getDepartments();
      return res.data.data;
    },
  });

  const { data: semesters = [] } = useQuery({
    queryKey: ["adminSemesters"],
    queryFn: async () => {
      const res = await adminAPI.getSemesters();
      return res.data.data;
    },
  });

  // Fetch Current Class Reps for selected section
  const { data: currentReps = [], isLoading: loadingReps } = useQuery({
    queryKey: [
      "adminUsers",
      "class_rep",
      selectedCampus,
      selectedDepartment,
      selectedSemester,
    ],
    queryFn: async () => {
      const params = { role: "class_rep" };
      if (selectedCampus) params.campus_id = selectedCampus;
      if (selectedDepartment) params.department_id = selectedDepartment;
      if (selectedSemester) params.semester_id = selectedSemester;
      const res = await adminAPI.getUsers(params);
      return res.data.data;
    },
    enabled: !!(selectedCampus && selectedDepartment && selectedSemester),
  });

  // Search User by Email
  const {
    data: previewUser,
    isLoading: searchingEmail,
    isError: previewIsError,
    error: previewError,
  } = useQuery({
    queryKey: ["adminUserPreview", emailToSearch],
    queryFn: async () => {
      const res = await adminAPI.previewUserByEmail(emailToSearch);
      return res.data.data;
    },
    enabled: !!emailToSearch,
    retry: false,
  });

  // Assign Class Rep Mutation
  const assignMutation = useMutation({
    mutationFn: (data) => adminAPI.assignClassRep(data),
    onSuccess: (res) => {
      toast.success(res.data.message || "Successfully assigned as Class Rep!");
      queryClient.invalidateQueries(["adminUsers", "class_rep"]);
      setSearchEmail("");
      setEmailToSearch("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to assign class rep");
    },
  });

  // Revoke Class Rep (Downgrade to Student)
  const revokeMutation = useMutation({
    mutationFn: (userId) => adminAPI.updateUserRole(userId, "student"),
    onSuccess: () => {
      toast.success("Successfully removed class rep privileges.");
      queryClient.invalidateQueries(["adminUsers", "class_rep"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to remove class rep");
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) {
      toast.error("Please enter an email address to search.");
      return;
    }
    setEmailToSearch(searchEmail.trim());
  };

  const handleAssign = () => {
    if (!selectedCampus || !selectedDepartment || !selectedSemester) {
      toast.error("Please select Campus, Department, and Semester first.");
      return;
    }
    if (!previewUser) {
      toast.error("No user found to assign.");
      return;
    }

    assignMutation.mutate({
      email: previewUser.email,
      campus: selectedCampus,
      department: selectedDepartment,
      semester: selectedSemester,
    });
  };

  const isScopeSelected = selectedCampus && selectedDepartment && selectedSemester;

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
              <span className="text-xs font-bold text-red-600">Class Reps</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
                Class <span className="text-red-600">Representatives</span>
              </h1>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Assign and manage designated class reps by campus, department, and semester
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

        {/* ── Main Two-Column Layout ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Scope & Assignment Form (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* 1. Target Scope Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-1">
                1. Select Academic Scope
              </h2>
              <p className="text-[11px] text-gray-400 mb-3">
                Choose the campus section where you want to assign or inspect representatives
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Campus
                  </label>
                  <select
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Choose Campus</option>
                    {campuses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Choose Dept</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Choose Semester</option>
                    {semesters.map((s) => (
                      <option key={s._id} value={s._id}>
                        Semester {s.number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Search & Assign Student */}
            <div
              className={`bg-white rounded-xl border border-gray-100 p-4 shadow-xs transition-opacity ${
                !isScopeSelected ? "opacity-60" : "opacity-100"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  2. Search & Designate Representative
                </h2>
                {!isScopeSelected && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase">
                    Select Scope First
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mb-3">
                Look up the student by their registered email address to grant rep privileges
              </p>

              <form onSubmit={handleSearch} className="flex gap-2 mb-3">
                <input
                  type="email"
                  placeholder="student@example.com..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  disabled={!isScopeSelected}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-red-500 disabled:opacity-50"
                  required
                />
                <button
                  type="submit"
                  disabled={!isScopeSelected || searchingEmail}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {searchingEmail ? "Searching..." : "Lookup Student"}
                </button>
              </form>

              {/* Error State */}
              {previewIsError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                  {previewError?.response?.data?.message || "No user found with this email."}
                </div>
              )}

              {/* Preview User & Assign Action */}
              {previewUser && !searchingEmail && !previewIsError && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-emerald-300 shrink-0">
                      {previewUser.profilePicture ? (
                        <img
                          src={getImageUrl(previewUser.profilePicture)}
                          alt={previewUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-emerald-700 bg-emerald-100">
                          {previewUser.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-gray-900 truncate">
                          {previewUser.name}
                        </h4>
                        <span className="px-1.5 py-0.2 bg-white text-gray-600 rounded text-[9px] font-bold uppercase">
                          {previewUser.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium truncate">
                        {previewUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAssign}
                    disabled={assignMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {assignMutation.isPending ? "Assigning..." : "Assign as Rep"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Currently Assigned Reps */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex flex-col h-fit">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-1">
              Assigned Reps
            </h2>
            <p className="text-[11px] text-gray-400 mb-3">
              Representatives currently active in this scope
            </p>

            {!isScopeSelected ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400">
                  Select campus, department, and semester to view assigned reps.
                </p>
              </div>
            ) : loadingReps ? (
              <div className="py-8 flex justify-center">
                <Loader />
              </div>
            ) : currentReps.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-700 mb-0.5">
                  No Rep Assigned
                </p>
                <p className="text-[11px] text-gray-400">
                  This section does not have an active class representative yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentReps.map((rep) => (
                  <div
                    key={rep._id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-gray-200 shrink-0">
                        {rep.profilePicture ? (
                          <img
                            src={getImageUrl(rep.profilePicture)}
                            alt={rep.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-red-600 bg-red-50">
                            {rep.name?.charAt(0) || "R"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-gray-900 truncate">
                          {rep.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-mono truncate">
                          {rep.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Revoke class rep privileges from ${rep.name}?`,
                          )
                        ) {
                          revokeMutation.mutate(rep._id);
                        }
                      }}
                      disabled={revokeMutation.isPending}
                      className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-200 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminClassReps;
