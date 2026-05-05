import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const AdminCourses = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    code: "",
    name: "",
    description: "",
  });

  // Fetch Courses
  const { data: coursesData, isLoading: loading } = useQuery({
    queryKey: ["adminCourses"],
    queryFn: async () => {
      const response = await adminAPI.getCourses();
      return response.data;
    },
    onError: () => toast.error("Failed to load courses"),
  });

  const courses = coursesData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newCourse) => adminAPI.createCourse(newCourse),
    onSuccess: () => {
      toast.success("Course added successfully!", { position: "top-center" });
      setFormData({ code: "", name: "", description: "" });
      queryClient.invalidateQueries(["adminCourses"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Operation failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateCourse(id, data),
    onSuccess: () => {
      toast.success("Course updated successfully!", { position: "top-center" });
      setEditingId(null);
      setEditFormData({ code: "", name: "", description: "" });
      queryClient.invalidateQueries(["adminCourses"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteCourse(id),
    onSuccess: () => {
      toast.success("Course deleted successfully!", { position: "top-center" });
      queryClient.invalidateQueries(["adminCourses"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Delete failed"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (course) => {
    setEditingId(course._id);
    setEditFormData({
      code: course.code || "",
      name: course.name || "",
      description: course.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ code: "", name: "", description: "" });
  };

  const handleUpdate = (courseId) => {
    updateMutation.mutate({ id: courseId, data: editFormData });
  };

  const handleDelete = (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      deleteMutation.mutate(courseId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      {/* Header Section */}
      <div className="mb-16 animate-fade-in text-center lg:text-left flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight uppercase">
            Course <span className="text-red-600">Management</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-xl">
            Manage the curriculum. Add, edit, or remove courses from the
            platform.
          </p>
        </div>

        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] mb-2 transition-colors font-mono"
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
              strokeWidth="3"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Management Form */}
        <div className="lg:col-span-1 space-y-8 animate-slide-up">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">
              Add New Course
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                  placeholder="e.g. CS50"
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">
                  Course Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Course Title..."
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief overview..."
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300 italic"
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-gray-900/20 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
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
                  </span>
                ) : (
                  "Add Course"
                )}
              </button>
            </form>
          </div>

          <div className="bg-red-600 rounded-3xl p-8 text-white shadow-2xl shadow-red-600/20 text-center">
            <div className="text-4xl font-black mb-1">{courses.length}</div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
              Total Courses
            </p>
          </div>
        </div>

        {/* Global Catalog */}
        <div
          className="lg:col-span-2 space-y-8 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              Current <span className="text-red-600">Courses</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader />
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 italic font-medium text-gray-400">
              "No courses found in the system."
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500"
                >
                  {editingId === course._id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdate(course._id);
                      }}
                      className="space-y-4"
                    >
                      <input
                        type="text"
                        value={editFormData.code}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            code: e.target.value,
                          })
                        }
                        required
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold"
                      />
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            name: e.target.value,
                          })
                        }
                        required
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold"
                      />
                      <textarea
                        value={editFormData.description}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            description: e.target.value,
                          })
                        }
                        rows="2"
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium italic"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={updateMutation.isPending}
                          className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all"
                        >
                          {updateMutation.isPending ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg
                                className="animate-spin h-3 w-3 text-white"
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
                            </span>
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-6">
                        <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 italic">
                          {course.code}
                        </span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleEdit(course)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Edit Course"
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
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(course._id)}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Course"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tight leading-tight flex-1">
                        {course.name}
                      </h3>

                      {course.description && (
                        <p className="text-gray-400 text-xs font-medium italic mb-6 line-clamp-2">
                          "{course.description}"
                        </p>
                      )}

                      <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {course.topics?.length || 0} Topics Registered
                        </span>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                          <svg
                            className="w-3.5 h-3.5 text-gray-300"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCourses;
