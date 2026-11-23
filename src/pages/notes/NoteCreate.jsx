import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { notesAPI, metaAPI } from "../../services/api";
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

const NoteCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    courseName: "",
    semesterId: "",
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

  // Mutation for creating note
  const createMutation = useMutation({
    mutationFn: (data) => notesAPI.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["notes"]);
      toast.success(
        "Note submitted! It will be reviewed by an admin before publishing.",
        {
          duration: 5000,
          position: "top-center",
        },
      );
      navigate(`/notes/${res.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to share note");
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a note title");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Please provide summary or concepts for this note");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("content", formData.content);
    formDataToSend.append("courseName", formData.courseName.toUpperCase());
    formDataToSend.append("semesterId", formData.semesterId);
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
          to="/notes"
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
          Back to Notes
        </Link>
      </div>

      {/* ── Compact Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase leading-tight">
          Create <span className="text-red-600">Note</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Share your study guides, lecture summaries, and materials with other students.
        </p>
      </div>

      {/* ── Main Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Note Fields (2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Note Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Introduction to Thermal Physics - Week 3"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-gray-400"
                />
              </div>

              {/* Key Concepts / Content */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Key Concepts & Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows="8"
                  placeholder="Summarize key takeaways, formulas, definitions, or exam tips from this study material..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Context & Metadata Sidebar (1 column on desktop) */}
          <div className="space-y-4">
            {/* Course & Semester Box */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Course / Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Thermodynamics, Calculus"
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

            {/* File Upload Box */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                File Attachment (Optional)
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-[11px] font-bold text-gray-600 block truncate max-w-[200px] mx-auto">
                  {file ? file.name : "Attach PDF / Notes Document"}
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">
                  PDF, DOC, or Image up to 10MB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form Actions Bar ── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-gray-400">
            Notes are briefly reviewed before becoming publicly visible to your peers.
          </p>
          <div className="flex items-center gap-2">
            <Link
              to="/notes"
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
                <span>Publish Note</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NoteCreate;
