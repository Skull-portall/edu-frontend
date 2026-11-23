import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { questionsAPI, metaAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const SUGGESTED_SUBJECTS = [
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

const QuestionCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    courseName: "",
    semesterId: "",
    isAnonymous: false,
  });
  const [file, setFile] = useState(null);

  // Fetch Semesters
  const { data: semesters = [], isLoading: loadingSemesters } = useQuery({
    queryKey: ["metaSemesters"],
    queryFn: async () => {
      const response = await metaAPI.getSemesters();
      return response.data.data || [];
    },
  });

  // Mutation for creating question
  const createMutation = useMutation({
    mutationFn: (data) => questionsAPI.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["questions"]);
      toast.success("Your question has been posted!", {
        position: "top-center",
      });
      navigate(`/questions/${res.data.data._id}`);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to post question. Try again.",
      );
    },
  });

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a question title");
      return;
    }
    if (!formData.body.trim()) {
      toast.error("Please provide question details");
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });
    if (file) {
      formDataToSend.append("attachment", file);
    }

    createMutation.mutate(formDataToSend);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* ── Top Bar: Back Link ── */}
      <div className="mb-4">
        <Link
          to="/questions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 uppercase tracking-wider transition-colors"
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
      </div>

      {/* ── Compact Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase leading-tight">
          Ask a <span className="text-red-600">Question</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Post your question to get solutions and insights from students and tutors.
        </p>
      </div>

      {/* ── Main Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Question Fields (2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Question Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. How does cognitive dissonance affect decision making?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-gray-400"
                />
              </div>

              {/* Details input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Question Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  required
                  rows="7"
                  placeholder="Provide context, share what you've already attempted, or paste excerpts..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Context & Metadata Sidebar (1 column on desktop) */}
          <div className="space-y-4">
            {/* Subject / Course & Semester */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Course or Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Psychology, Calculus"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-400"
                />

                {/* Quick Subject Chips */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {SUGGESTED_SUBJECTS.slice(0, 5).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setFormData({ ...formData, courseName: sub })}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      +{sub}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  name="semesterId"
                  value={formData.semesterId}
                  onChange={handleChange}
                  required
                  disabled={loadingSemesters}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all cursor-pointer"
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem._id} value={sem._id}>
                      Semester {sem.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Attachment */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Attachment (Optional)
              </label>
              <div className="relative group overflow-hidden bg-gray-50 rounded-xl border border-dashed border-gray-200 hover:border-red-300 transition-colors p-3.5 text-center cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <svg
                  className="w-5 h-5 text-gray-400 mx-auto mb-1 group-hover:text-red-500 transition-colors"
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
                <span className="text-[11px] font-bold text-gray-600 block truncate max-w-[200px] mx-auto">
                  {file ? file.name : "Attach Image / Doc"}
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">
                  PDF, PNG, JPG up to 10MB
                </span>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                    Post Anonymously
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Hide your name on this question
                  </span>
                </div>
                <div className="relative shrink-0">
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-red-600 transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ── Form Actions Bar ── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-gray-400">
            Make sure your question follows community guidelines before submitting.
          </p>
          <div className="flex items-center gap-2">
            <Link
              to="/questions"
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-red-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {createMutation.isPending ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Question</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuestionCreate;
