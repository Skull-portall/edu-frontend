import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { questionsAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const QuestionsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(currentSearch);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["questions", { search: currentSearch }],
    queryFn: async () => {
      const params = {
        search: currentSearch,
      };
      const response = await questionsAPI.getAll(params);
      return response.data;
    },
    keepPreviousData: true,
  });

  const questions = data?.data || [];
  const pagination = data?.pagination || {};

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    navigate(`/questions?${params.toString()}`);
  };

  if (loading && !questions.length) {
    return <Loader />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header Section */}
      <div className="mb-12 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight uppercase">
              Questions & <span className="text-red-600">Answers</span>
            </h1>
            <p className="text-gray-500 font-medium max-w-xl">
              Explore and contribute to our community of curious students. Every
              question is a step towards mastery.
            </p>
          </div>

          <div className="shrink-0">
            {user ? (
              <Link
                to="/questions/create"
                className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:shadow-gray-900/30 transform hover:-translate-y-1 active:scale-95 transition-all text-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
                Ask Question
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-3 bg-red-600 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/10 hover:shadow-red-600/30 transform hover:-translate-y-1 active:scale-95 transition-all text-sm"
              >
                Login to Ask
              </Link>
            )}
          </div>
        </div>

        {/* Global Search Interface */}
        <div className="bg-white p-2 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col sm:flex-row gap-2 max-w-3xl">
          <form
            onSubmit={handleSearch}
            className="flex-1 relative flex items-center"
          >
            <svg
              className="absolute left-6 w-5 h-5 text-gray-400"
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
              placeholder="What are you looking for today? (e.g. 'Calculus help' or 'Physics theory')"
              className="w-full bg-transparent border-none py-4 pl-16 pr-8 text-lg font-bold text-gray-900 placeholder-gray-400 focus:ring-0"
            />
          </form>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-red-600 text-white rounded-[1.2rem] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95 text-[10px]"
          >
            Search Questions
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {questions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {questions.map((question, index) => (
              <article
                key={question._id}
                onClick={() => navigate(`/questions/${question._id}`)}
                className="group bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-8">
                  <span
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border italic shadow-sm transition-all group-hover:scale-105 ${
                      question.answersCount > 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}
                  >
                    {question.answersCount > 0 ? "Answered" : "Unsolved"}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-red-600 transition-colors uppercase tracking-tight line-clamp-2 leading-tight">
                  {question.title}
                </h2>

                <p className="text-gray-500 font-medium line-clamp-3 leading-relaxed mb-10 italic flex-1">
                  "{question.body?.replace(/<[^>]*>/g, "")}"
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-gray-50 w-full mt-auto">
                  {!(question.isAnonymous || question.is_anonymous) ? (
                    <>
                      <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg ring-2 ring-gray-100 flex-shrink-0">
                        {question.user?.profilePicture ? (
                          <img
                            src={question.user.profilePicture}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white text-[10px] font-black uppercase">
                            {question.user?.name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                          Asked by
                        </span>
                        <span className="block text-xs font-black text-gray-900 uppercase truncate max-w-[100px]">
                          {question.user?.name || "STUDENT"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                          Asked by
                        </span>
                        <span className="block text-xs font-black text-gray-400 uppercase">
                          ANONYMOUS
                        </span>
                      </div>
                    </>
                  )}

                  {(question.course_name || question.courseName) && (
                    <div className="ml-auto">
                      <div className="bg-gray-950 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl group-hover:bg-red-600 transition-colors italic">
                        {question.course_name || question.courseName}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300"
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
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">
              No questions found
            </h3>
            <p className="text-gray-500 font-medium mb-10 max-w-sm mx-auto text-sm sm:text-base">
              No questions match your criteria. Why not start a new discussion?
            </p>
            {user && (
              <Link
                to="/questions/create"
                className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:shadow-gray-900/30 transition-all text-sm sm:text-base"
              >
                Ask Something
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionsList;
