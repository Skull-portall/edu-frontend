import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { questionsAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { timeAgo } from "../../utils/timeAgo";
import Loader from "../../components/common/Loader";

// ─── Subject Categories ─────────────────────────────────────────────────────
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

// ─── Status Badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ answered }) =>
  answered ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
      Answered
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-gray-300 text-gray-500 bg-white">
      Unanswered
    </span>
  );

// ─── Single Question Card ───────────────────────────────────────────────────
const QuestionCard = ({ question, onClick }) => {
  const isAnon = question.isAnonymous || question.is_anonymous;
  const authorName = isAnon ? "Anonymous" : question.user?.name || "Student";
  const course = question.courseName || question.course_name || null;
  const answersCount = question.answersCount ?? 0;
  const upvotes = question.votesCount ?? question.upvotesCount ?? 0;
  const bodyText = question.body?.replace(/<[^>]*>/g, "") || "";

  return (
    <article
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-red-100 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top meta tags */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StatusBadge answered={answersCount > 0} />
          {course && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-700 group-hover:bg-red-50 group-hover:text-red-700 transition-colors">
              {course}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2 mb-1.5 group-hover:text-red-600 transition-colors">
          {question.title}
        </h2>

        {/* Body preview */}
        {bodyText && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {bodyText}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {!isAnon && question.user?.profilePicture ? (
            <img
              src={question.user.profilePicture}
              alt=""
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-gray-600 truncate max-w-[110px] sm:max-w-[140px]">
            {authorName}
          </span>
          <span>•</span>
          <span>{timeAgo(question.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2.5 font-semibold text-gray-500 text-[10px]">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
            {upvotes}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {answersCount}
          </span>
        </div>
      </div>
    </article>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ user, hasFilters, onReset }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center shadow-sm my-4">
    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg
        className="w-7 h-7 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 className="text-base font-black text-gray-900 uppercase tracking-tight mb-1">
      {hasFilters ? "No matching questions" : "No questions yet"}
    </h3>
    <p className="text-gray-500 font-medium mb-6 max-w-sm mx-auto text-xs">
      {hasFilters
        ? "Try adjusting your search query or subject filters to find what you need."
        : "Be the first to ignite a discussion in this subject!"}
    </p>
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {hasFilters && (
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all"
        >
          Clear Filters
        </button>
      )}
      {user ? (
        <Link
          to="/questions/create"
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md shadow-gray-900/10"
        >
          Ask a Question
        </Link>
      ) : (
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-600/20"
        >
          Login to Ask
        </Link>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const QuestionsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(currentSearch);
  const [activeSubject, setActiveSubject] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'answered', 'unanswered'

  // Build query params
  const queryParams = { search: currentSearch };
  if (activeSubject !== "All") queryParams.courseName = activeSubject;

  const { data, isLoading } = useQuery({
    queryKey: ["questions", { search: currentSearch, subject: activeSubject }],
    queryFn: async () => {
      const response = await questionsAPI.getAll(queryParams);
      return response.data;
    },
    keepPreviousData: true,
  });

  const rawQuestions = data?.data || [];

  // Filter by status on client side if requested
  const questions = rawQuestions.filter((q) => {
    if (statusFilter === "answered") return (q.answersCount ?? 0) > 0;
    if (statusFilter === "unanswered") return (q.answersCount ?? 0) === 0;
    return true;
  });

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearch("");
    setActiveSubject("All");
    setStatusFilter("all");
    setSearchParams({});
  };

  if (isLoading && !rawQuestions.length) {
    return <Loader />;
  }

  const answeredCount = rawQuestions.filter((q) => (q.answersCount ?? 0) > 0).length;
  const unansweredCount = rawQuestions.length - answeredCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
      {/* ── Compact Header & Search Bar Row ── */}
      <div className="mb-4">
        {/* Compact Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">
              Questions & <span className="text-red-600">Answers</span>
            </h1>
            <span className="hidden sm:inline text-xs text-gray-400 font-normal">
              — Explore and ask doubts across campus
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
              placeholder="Search questions, topics, or subjects (e.g. 'Cognitive dissonance', 'Math')..."
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
        {/* Left Column: Compact Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Status Filters */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
              Status
            </h3>
            <div className="flex flex-row lg:flex-col gap-1.5 flex-wrap">
              <button
                onClick={() => setStatusFilter("all")}
                className={`flex-1 lg:w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "all"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>All</span>
                <span className="text-[10px] opacity-75 font-mono">{rawQuestions.length}</span>
              </button>
              <button
                onClick={() => setStatusFilter("answered")}
                className={`flex-1 lg:w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "answered"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                <span>Answered</span>
                <span className="text-[10px] opacity-75 font-mono">{answeredCount}</span>
              </button>
              <button
                onClick={() => setStatusFilter("unanswered")}
                className={`flex-1 lg:w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "unanswered"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                }`}
              >
                <span>Unanswered</span>
                <span className="text-[10px] opacity-75 font-mono">{unansweredCount}</span>
              </button>
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
            <div className="hidden lg:flex flex-col gap-1 max-h-[340px] overflow-y-auto pr-1">
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

        {/* Right Column: Questions Feed */}
        <main className="lg:col-span-3">
          {/* Subheader summary */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{questions.length}</span> question{questions.length !== 1 ? "s" : ""}
              {activeSubject !== "All" && (
                <span> in <span className="font-bold text-red-600">{activeSubject}</span></span>
              )}
              {currentSearch && (
                <span> matching "<span className="font-bold text-gray-900">{currentSearch}</span>"</span>
              )}
            </div>

            {(activeSubject !== "All" || currentSearch || statusFilter !== "all") && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
                >
                  <div className="flex gap-2 mb-3">
                    <div className="h-4 w-16 bg-gray-200 rounded-full" />
                    <div className="h-4 w-14 bg-gray-100 rounded-full" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : questions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {questions.map((question) => (
                <QuestionCard
                  key={question._id}
                  question={question}
                  onClick={() => navigate(`/questions/${question._id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              user={user}
              hasFilters={Boolean(currentSearch || activeSubject !== "All" || statusFilter !== "all")}
              onReset={handleResetFilters}
            />
          )}
        </main>
      </div>

      {/* ── Floating "Ask Question" Button (Desktop & Mobile) ── */}
      {user && (
        <Link
          to="/questions/create"
          className="fixed bottom-24 sm:bottom-8 right-5 sm:right-8 bg-gray-900 hover:bg-red-600 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 z-40 group border border-white/20"
          aria-label="Ask a question"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">
            Ask Question
          </span>
        </Link>
      )}
    </div>
  );
};

export default QuestionsList;
