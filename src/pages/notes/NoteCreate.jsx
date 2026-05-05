import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { notesAPI, metaAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

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

  const handleSubmit = (e) => {
    e.preventDefault();
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
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
      <div className="mb-10 animate-fade-in text-center">
        <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight">
          Share <span className="text-red-600">Knowledge</span>
        </h1>
        <p className="text-gray-500 font-medium max-w-xl mx-auto">
          Contribute to the community by sharing your study notes. Your input
          helps fellow students excel!
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-10 animate-slide-up"
      >
        <div className="space-y-8">
          {/* Title */}
          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3">
              Note Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Introduction to Thermal Physics - Week 3"
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 transition-all font-medium text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Course Name */}
            <div>
              <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3">
                Refer Q Course <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                required
                placeholder="e.g. Thermodynamics or Quantum Mechanics"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 transition-all font-black text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3">
                Semester <span className="text-red-600">*</span>
              </label>
              <select
                name="semesterId"
                value={formData.semesterId}
                onChange={handleChange}
                required
                disabled={loadingSemesters}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 transition-all font-bold text-gray-700 appearance-none cursor-pointer disabled:opacity-50"
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

          {/* Content */}
          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3">
              Key Concepts / Summary <span className="text-red-600">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows="8"
              placeholder="Highlight the key concepts, formulas, and critical takeaways from this study material..."
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 transition-all font-medium text-gray-900 placeholder-gray-400 leading-relaxed italic"
            />
          </div>

          {/* File Upload */}
          <div className="relative group">
            <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3">
              File Attachment{" "}
              <span className="text-gray-400 font-medium lowercase">
                (PDF, Doc, Image)
              </span>
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="px-5 py-8 bg-dashed bg-red-50 border-2 border-dashed border-red-200 rounded-3xl text-center transition-all group-hover:bg-red-100 group-hover:border-red-400">
                <svg
                  className="w-10 h-10 text-red-400 mx-auto mb-3"
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
                <p className="text-red-600 font-black uppercase tracking-wider text-xs">
                  {file ? file.name : "Click or Drag to Upload File"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:shadow-red-600/40 transform hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </>
              ) : (
                "Post Note"
              )}
            </button>
            <Link
              to="/notes"
              className="px-6 py-3.5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 hover:text-gray-900 transition-all text-center text-sm"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NoteCreate;
