import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { usersAPI, questionsAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const MyQuestions = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["myQuestions", page],
    queryFn: async () => {
      const response = await usersAPI.getMyQuestions(page);
      return response.data; // Assuming API returns { success, data, pagination }
    },
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => questionsAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["myQuestions"]),
    onError: (error) => {
      console.error("Error deleting question:", error);
      alert("Failed to delete question");
    },
  });

  const handleDelete = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    deleteMutation.mutate(questionId);
  };

  const questions = data?.data || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  };

  if (loading && !questions.length) {
    return <Loader />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight uppercase">
              My <span className="text-red-600">Questions</span>
            </h1>
            <p className="text-gray-500 font-medium max-w-xl">
              Manage and track your community inquiries from one central hub.
            </p>
          </div>
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
            Ask New Question
          </Link>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4 lg:space-y-6 max-w-5xl">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <div
              key={question._id}
              className="group bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500 transform hover:-translate-y-2"
            >
              <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
                <div className="flex-1 min-w-0 w-full lg:max-w-3xl">
                  <div className="flex items-center flex-wrap gap-3 mb-6">
                    {(question.isAnonymous || question.is_anonymous) && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
                        Anonymous Post
                      </span>
                    )}
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {new Date(question.createdAt).toLocaleDateString()}
                    </span>
                    {question.courseName && (
                      <span className="px-3 py-1 bg-gray-950 text-white rounded-lg text-[10px] font-black uppercase tracking-widest italic group-hover:bg-red-600 transition-colors shadow-lg">
                        {question.courseName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-red-600 transition-colors uppercase tracking-tight line-clamp-2 leading-tight">
                    <Link to={`/questions/${question._id}`}>
                      {question.title}
                    </Link>
                  </h3>

                  <p className="text-gray-500 font-medium line-clamp-2 leading-relaxed mb-8 italic">
                    "{question.body?.replace(/<[^>]*>/g, "")}"
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        ></path>
                      </svg>
                      <span className="font-medium">
                        {question.answersCount || 0}{" "}
                        {question.answersCount === 1 ? "answer" : "answers"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <svg
                        className="w-5 h-5 text-rose-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        ></path>
                      </svg>
                      <span>{question.views || 0} views</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row lg:flex-col gap-2 lg:gap-3 lg:ml-6 w-full lg:w-auto lg:min-w-[140px]">
                  <Link
                    to={`/questions/${question._id}`}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg active:scale-95"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(question._id)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-100 transition-all active:scale-95"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <p className="text-gray-500 text-lg mb-4">
              You haven't asked any questions yet
            </p>
            <p className="text-gray-400 mb-6">
              Start by asking your first question!
            </p>
            <Link
              to="/questions/create"
              className="inline-flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              <span>Ask Your First Question</span>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page - 1 })
            }
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page + 1 })
            }
            disabled={pagination.page >= pagination.pages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyQuestions;
