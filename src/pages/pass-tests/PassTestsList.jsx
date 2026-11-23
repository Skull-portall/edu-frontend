import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { passTestsAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "../../utils/timeAgo";
import toast from "react-hot-toast";

// ─── Suggested Subject Filter Chips ─────────────────────────────────────────
const SUBJECTS = [
  "All",
  "Psychology",
  "Math",
  "Biology",
  "Physics",
  "Chemistry",
  "English",
  "History",
  "Economics",
  "Computer Science",
];

// ─── Single Past Paper Card ─────────────────────────────────────────────────
const PaperCard = ({ test, onClick, user, onAction, actionPending, actionId }) => {
  const authorName = test.user?.name || "Student";
  const course = test.courseName || null;
  const isTest = test.type === "test";
  const contentText =
    test.content?.replace(/<[^>]*>/g, "").substring(0, 140) || "";

  return (
    <article
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-red-100 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                isTest
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}
            >
              {isTest ? "Test / Exam" : "Assignment"}
            </span>
            {course && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-700 group-hover:bg-red-50 group-hover:text-red-700 transition-colors">
                {course}
              </span>
            )}
          </div>

          {/* Admin Moderation Controls if unapproved */}
          {user?.isAdmin && !test.isApproved && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => onAction(e, test._id, "approve")}
                disabled={actionPending && actionId === test._id}
                className="p-1 rounded bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white transition-colors"
                title="Approve"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={(e) => onAction(e, test._id, "reject")}
                disabled={actionPending && actionId === test._id}
                className="p-1 rounded bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition-colors"
                title="Reject"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Paper Title */}
        <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2 mb-1.5 group-hover:text-red-600 transition-colors">
          {test.title}
        </h2>

        {/* Excerpt */}
        {contentText && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3">
            {contentText}...
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {test.user?.profilePicture ? (
            <img
              src={test.user.profilePicture}
              alt=""
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[8px] font-bold">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-gray-600 truncate max-w-[120px] sm:max-w-[150px]">
            {authorName}
          </span>
          <span>•</span>
          <span>{timeAgo(test.createdAt)}</span>
        </div>

        {test.attachment && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
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
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            Paper File
          </span>
        )}
      </div>
    </article>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const PassTestsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentType = searchParams.get("type") || "";
  const currentStatus = searchParams.get("status") || "approved";

  const [search, setSearch] = useState(currentSearch);
  const [activeSubject, setActiveSubject] = useState("All");
  const [actionId, setActionId] = useState(null);

  // Fetch Tests
  const { data: tests = [], isLoading: loading } = useQuery({
    queryKey: [
      "passTests",
      { search: currentSearch, type: currentType, status: currentStatus, subject: activeSubject },
    ],
    queryFn: async () => {
      const params = { status: currentStatus };
      if (currentSearch) params.search = currentSearch;
      if (currentType) params.type = currentType;
      if (activeSubject !== "All") params.courseName = activeSubject;
      const response = await passTestsAPI.getAll(params);
      return response.data.data || [];
    },
    keepPreviousData: true,
  });

  // Action Mutation (Approve / Reject)
  const mutation = useMutation({
    mutationFn: ({ id, action }) =>
      action === "approve" ? passTestsAPI.approve(id) : passTestsAPI.reject(id),
    onSettled: () => setActionId(null),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["passTests"]);
      toast.success(
        `Paper ${variables.action === "approve" ? "approved" : "rejected"} successfully!`,
        { position: "top-center" }
      );
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Operation failed");
    },
  });

  const handleAction = (e, id, action) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to ${action} this paper?`)) {
      setActionId(id);
      mutation.mutate({ id, action });
    }
  };

  const updateFilters = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    updateFilters({ search: search.trim() });
  };

  const handleResetFilters = () => {
    setSearch("");
    setActiveSubject("All");
    setSearchParams({});
  };

  if (loading && !tests.length) {
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
              Past <span className="text-red-600">Papers & Tests</span>
            </h1>
            <span className="hidden sm:inline text-xs text-gray-400 font-normal">
              — Access previous exams, tests & assignments
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
              placeholder="Search by course name, year, or exam title..."
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
        {/* Left Column: Type & Subject Filters */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Paper Type Filter (Test vs Assignment) */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
              Category
            </h3>
            <div className="flex flex-row lg:flex-col gap-1.5 flex-wrap">
              {[
                { id: "", label: "All Papers" },
                { id: "test", label: "Exams & Tests" },
                { id: "assignment", label: "Assignments" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => updateFilters({ type: type.id })}
                  className={`flex-1 lg:w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentType === type.id
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subjects Box */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Subjects
              </h3>
              {activeSubject !== "All" && (
                <button
                  onClick={() => setActiveSubject("All")}
                  className="text-[9px] font-bold text-red-600 hover:underline uppercase"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Mobile Scroll */}
            <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubject(sub)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    activeSubject === sub
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Desktop List */}
            <div className="hidden lg:flex flex-col gap-1 max-h-[380px] overflow-y-auto pr-1">
              {SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubject(sub)}
                  className={`text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                    activeSubject === sub
                      ? "bg-red-50 text-red-600 font-extrabold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{sub}</span>
                  {activeSubject === sub && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Column: Papers Feed */}
        <main className="lg:col-span-3">
          {/* Subheader summary */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{tests.length}</span> paper{tests.length !== 1 ? "s" : ""}
              {activeSubject !== "All" && (
                <span> in <span className="font-bold text-red-600">{activeSubject}</span></span>
              )}
              {currentSearch && (
                <span> matching "<span className="font-bold text-gray-900">{currentSearch}</span>"</span>
              )}
            </div>

            {(activeSubject !== "All" || currentSearch || currentType) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Papers Grid */}
          {tests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {tests.map((test) => (
                <PaperCard
                  key={test._id}
                  test={test}
                  user={user}
                  onAction={handleAction}
                  actionPending={mutation.isPending}
                  actionId={actionId}
                  onClick={() => navigate(`/pass-tests/${test._id}`)}
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight mb-1">
                No Papers Found
              </h3>
              <p className="text-gray-500 font-medium mb-6 max-w-sm mx-auto text-xs">
                {currentSearch || activeSubject !== "All" || currentType
                  ? "No papers match your search criteria. Try clearing some filters."
                  : "No past papers have been submitted for this category yet."}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {(currentSearch || activeSubject !== "All" || currentType) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all"
                  >
                    Clear Filters
                  </button>
                )}
                {user ? (
                  <Link
                    to="/pass-tests/create"
                    className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md shadow-gray-900/10"
                  >
                    Upload Paper
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-600/20"
                  >
                    Login to Upload
                  </Link>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Floating "Upload Paper" Button ── */}
      {user && (
        <Link
          to="/pass-tests/create"
          className="fixed bottom-24 sm:bottom-8 right-5 sm:right-8 bg-gray-900 hover:bg-red-600 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 z-40 group border border-white/20"
          aria-label="Upload Paper"
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
            Upload Paper
          </span>
        </Link>
      )}
    </div>
  );
};

export default PassTestsList;
