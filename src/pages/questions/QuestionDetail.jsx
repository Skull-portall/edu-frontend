import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { questionsAPI, answersAPI, votesAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "../../utils/timeAgo";
import toast from "react-hot-toast";

/** Reusable attachment download/view button */
const ViewAttachmentBtn = ({
  label,
  url,
  download: dlName,
  className = "",
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (!dlName) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    setLoading(true);
    const a = document.createElement("a");
    a.href = url;
    a.download = dlName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider text-xs transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
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
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      )}
      {loading ? "Downloading..." : label}
    </button>
  );
};

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [answerBody, setAnswerBody] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);
  const [votingId, setVotingId] = useState(null);

  // Fetch Question and Answers
  const { data: questionData, isLoading } = useQuery({
    queryKey: ["question", id],
    queryFn: async () => {
      const response = await questionsAPI.getById(id);
      return response.data;
    },
    onError: () => {
      toast.error("Failed to load question");
    },
  });

  const question = questionData?.data;
  const answers = questionData?.data?.answers || [];

  // Submit Answer Mutation
  const submitAnswerMutation = useMutation({
    mutationFn: (newAnswer) => answersAPI.create(id, newAnswer),
    onSuccess: () => {
      queryClient.invalidateQueries(["question", id]);
      setAnswerBody("");
      toast.success("Your answer was posted!", {
        position: "top-center",
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to submit answer");
    },
  });

  // Vote Mutation
  const voteMutation = useMutation({
    mutationFn: ({ answerId, isUpvote }) =>
      votesAPI.voteAnswer(answerId, isUpvote),
    onSuccess: () => {
      queryClient.invalidateQueries(["question", id]);
      setVotingId(null);
    },
    onError: () => {
      toast.error("Unable to cast vote");
      setVotingId(null);
    },
  });

  // Accept Answer Mutation
  const acceptAnswerMutation = useMutation({
    mutationFn: (answerId) => answersAPI.accept(answerId),
    onSettled: () => setAcceptingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries(["question", id]);
      toast.success("Accepted as correct solution!");
    },
    onError: () => toast.error("Failed to accept answer"),
  });

  // Delete Question Mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: () => questionsAPI.delete(id),
    onSuccess: () => {
      toast.success("Question deleted successfully");
      navigate("/questions");
    },
    onError: () =>
      toast.error("You are not authorized to delete this question"),
  });

  const handleSubmitAnswer = (e) => {
    e.preventDefault();
    if (!answerBody.trim()) return;
    submitAnswerMutation.mutate({ body: answerBody });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate();
    }
  };

  const handleVote = (answerId, isUpvote) => {
    setVotingId(answerId);
    voteMutation.mutate({ answerId, isUpvote });
  };

  const handleAcceptAnswer = (answerId) => {
    if (window.confirm("Accept this answer as the correct solution?")) {
      setAcceptingId(answerId);
      acceptAnswerMutation.mutate(answerId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">
          Question Not Found
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          The question you are looking for may have been deleted or moved.
        </p>
        <Link
          to="/questions"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
        >
          Back to Questions
        </Link>
      </div>
    );
  }

  const isOwner =
    user && (user.id === question.user?._id || user._id === question.user?._id);
  const isAnon = question.isAnonymous || question.is_anonymous;
  const authorName = isAnon ? "Anonymous" : question.user?.name || "Student";
  const course = question.courseName || question.course_name || null;
  const isAnswered = answers.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* ── Top Bar: Back & Delete (if owner) ── */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/questions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors uppercase tracking-wider"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Questions
        </Link>

        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleteQuestionMutation.isPending}
            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            {deleteQuestionMutation.isPending ? "Deleting..." : "Delete Question"}
          </button>
        )}
      </div>

      {/* ── Main Question Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 shadow-sm mb-6">
        {/* Badges & Meta */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isAnswered
                ? "bg-emerald-500 text-white"
                : "border border-gray-300 text-gray-500 bg-white"
            }`}
          >
            {isAnswered ? "Answered" : "Unanswered"}
          </span>

          {course && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
              {course}
            </span>
          )}

          <span className="text-gray-300">•</span>
          <span className="text-xs text-gray-400 font-mono">
            {question.views || 0} views
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-3 tracking-tight">
          {question.title}
        </h1>

        {/* Author row */}
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-50 text-xs text-gray-500">
          {!isAnon && question.user?.profilePicture ? (
            <img
              src={question.user.profilePicture}
              alt=""
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px]">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-gray-800">
            {authorName}
          </span>
          <span className="text-gray-300">•</span>
          <span>Asked {timeAgo(question.createdAt)}</span>
        </div>

        {/* Question Body */}
        <div className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap font-normal mb-4">
          {question.body}
        </div>

        {/* Attachment (if any) */}
        {question.attachment &&
          (() => {
            const attachUrl = question.attachment || "";
            let fileUrl = attachUrl.startsWith("http")
              ? attachUrl
              : `/api/${attachUrl}`;
            const isCloudinary = attachUrl.includes("cloudinary.com");
            const fileName =
              question.attachmentName ||
              attachUrl.split("/").pop().split("?")[0] ||
              "Supplemental_Material";
            const baseName =
              fileName
                .replace(/\.[^/.]+$/, "")
                .replace(/[^a-zA-Z0-9_\-]/g, "_") || "download";

            let downloadUrl = fileUrl;
            if (isCloudinary && attachUrl.includes("/upload/")) {
              downloadUrl = attachUrl.replace(
                "/upload/",
                `/upload/fl_attachment:${baseName}/`,
              );
            }

            return (
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800 truncate block max-w-xs">
                      {fileName}
                    </span>
                    <span className="text-[10px] text-gray-400">Attached Study Resource</span>
                  </div>
                </div>

                <ViewAttachmentBtn
                  label="Download"
                  url={downloadUrl}
                  download={fileName}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3.5 py-1.5 rounded-lg"
                />
              </div>
            );
          })()}
      </div>

      {/* ── Add Answer Form ── */}
      {user ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm mb-8">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
            Your Contribution / Answer
          </h2>
          <form onSubmit={handleSubmitAnswer} className="space-y-3">
            <textarea
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              rows="4"
              placeholder="Write a clear, helpful answer to this question..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitAnswerMutation.isPending || !answerBody.trim()}
                className={`px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                  submitAnswerMutation.isPending || !answerBody.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
                }`}
              >
                {submitAnswerMutation.isPending ? "Posting..." : "Post Answer"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center mb-8">
          <p className="text-xs text-gray-600 font-medium mb-3">
            Want to help answer this question? Sign in with your student account.
          </p>
          <Link
            to="/login"
            className="inline-block bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm"
          >
            Login to Answer
          </Link>
        </div>
      )}

      {/* ── Answers Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">
            Answers <span className="text-red-600">({answers.length})</span>
          </h2>
        </div>

        {answers.length > 0 ? (
          <div className="space-y-3">
            {answers
              .sort((a, b) => (b.isAccepted ? 1 : 0) - (a.isAccepted ? 1 : 0))
              .map((answer) => (
                <div
                  key={answer._id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
                    answer.isAccepted
                      ? "border-emerald-500 ring-1 ring-emerald-500 shadow-sm"
                      : "border-gray-100 shadow-sm"
                  }`}
                >
                  {/* Accepted Badge */}
                  {answer.isAccepted && (
                    <div className="inline-flex items-center gap-1 mb-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Accepted Solution
                    </div>
                  )}

                  <div className="flex gap-4">
                    {/* Voting Column */}
                    <div className="flex flex-col items-center justify-start gap-1 shrink-0 pt-0.5">
                      <button
                        onClick={() => handleVote(answer._id, true)}
                        disabled={votingId === answer._id}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-emerald-600 transition-colors"
                        title="Upvote"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className="font-bold text-xs font-mono text-gray-700">
                        {answer.votesCount || 0}
                      </span>
                      <button
                        onClick={() => handleVote(answer._id, false)}
                        disabled={votingId === answer._id}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                        title="Downvote"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[9px] font-bold">
                            {answer.user?.name?.charAt(0) || "U"}
                          </div>
                          <span className="text-xs font-bold text-gray-800">
                            {answer.user?.name || "Student"}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-[11px] text-gray-400">
                            {timeAgo(answer.createdAt)}
                          </span>
                        </div>

                        {/* Accept button for question owner */}
                        {isOwner && !answer.isAccepted && (
                          <button
                            onClick={() => handleAcceptAnswer(answer._id)}
                            disabled={acceptingId === answer._id}
                            className="text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-lg transition-all"
                          >
                            {acceptingId === answer._id ? "Accepting..." : "Accept as Answer"}
                          </button>
                        )}
                      </div>

                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {answer.body}
                      </div>

                      {/* Answer Attachment */}
                      {answer.attachment &&
                        (() => {
                          const attachUrl = answer.attachment || "";
                          let fileUrl = attachUrl.startsWith("http")
                            ? attachUrl
                            : `/api/${attachUrl}`;
                          const fileName =
                            attachUrl.split("/").pop().split("?")[0] ||
                            "Attachment";

                          return (
                            <div className="mt-2.5">
                              <ViewAttachmentBtn
                                label="Download File"
                                url={fileUrl}
                                download={fileName}
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-md text-[10px]"
                              />
                            </div>
                          );
                        })()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <p className="text-xs text-gray-400 font-medium">
              No answers posted yet. Be the first to share an answer!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;
