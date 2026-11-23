import Loader from "../../components/common/Loader";
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const AdminTopics = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: "", courseId: "" });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", courseId: "" });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Topics
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ["adminTopics"],
    queryFn: async () => {
      const response = await adminAPI.getTopics();
      return response.data;
    },
    onError: () => toast.error("Failed to load topics"),
  });

  // Fetch Courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["adminCourses"],
    queryFn: async () => {
      const response = await adminAPI.getCourses();
      return response.data;
    },
    onError: () => toast.error("Failed to load courses"),
  });

  const topics = topicsData?.data || [];
  const courses = coursesData?.data || [];
  const loading = topicsLoading || coursesLoading;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newTopic) => adminAPI.createTopic(newTopic),
    onSuccess: () => {
      toast.success("Topic created successfully!");
      setFormData({ name: "", courseId: "" });
      queryClient.invalidateQueries(["adminTopics"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create topic"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateTopic(id, data),
    onSuccess: () => {
      toast.success("Topic updated successfully!");
      setEditingId(null);
      setEditFormData({ name: "", courseId: "" });
      queryClient.invalidateQueries(["adminTopics"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update topic"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteTopic(id),
    onSuccess: () => {
      toast.success("Topic deleted successfully!");
      queryClient.invalidateQueries(["adminTopics"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete topic"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.courseId) {
      toast.error("Please fill in all fields.");
      return;
    }
    createMutation.mutate({
      name: formData.name.trim(),
      course_id: formData.courseId,
    });
  };

  const handleEdit = (topic) => {
    setEditingId(topic._id);
    setEditFormData({
      name: topic.name || "",
      courseId: topic.course?._id || topic.course_id || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: "", courseId: "" });
  };

  const handleUpdate = (topicId) => {
    if (!editFormData.name.trim() || !editFormData.courseId) {
      toast.error("Please fill in all fields.");
      return;
    }
    updateMutation.mutate({
      id: topicId,
      data: { name: editFormData.name.trim(), course_id: editFormData.courseId },
    });
  };

  const handleDelete = (topicId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this topic? This action cannot be undone!",
      )
    ) {
      deleteMutation.mutate(topicId);
    }
  };

  const filteredTopics = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return topics;
    return topics.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.course?.name?.toLowerCase().includes(q) ||
        t.course?.code?.toLowerCase().includes(q),
    );
  }, [topics, searchQuery]);

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
              <span className="text-xs font-bold text-red-600">Topics</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
                Course <span className="text-red-600">Topics</span>
              </h1>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-bold">
                {topics.length} Total
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Create and manage subject topic tags associated with courses
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

        {/* ── 2-Column Split ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Form Column */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs h-fit">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-1">
              Create New Topic
            </h2>
            <p className="text-[11px] text-gray-400 mb-4">
              Attach a subject topic to a course code
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData({ ...formData, courseId: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-red-500"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Topic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Chemical Bonding, Arrays"
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-red-500"
                >
                </input>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer shadow-xs mt-2"
              >
                {createMutation.isPending ? "Creating..." : "Add Topic"}
              </button>
            </form>
          </div>

          {/* List Column */}
          <div className="md:col-span-2 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search topics or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-500 shadow-xs"
              />
              <svg
                className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
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
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {loading ? (
              <Loader />
            ) : filteredTopics.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-xs font-medium text-gray-400">
                  {searchQuery ? "No topics matched your search." : "No topics created yet."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden divide-y divide-gray-100">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic._id}
                    className="p-3 hover:bg-gray-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    {editingId === topic._id ? (
                      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              name: e.target.value,
                            })
                          }
                          className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold"
                        />
                        <select
                          value={editFormData.courseId}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              courseId: e.target.value,
                            })
                          }
                          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold"
                        >
                          <option value="">Course</option>
                          {courses.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleUpdate(topic._id)}
                            disabled={updateMutation.isPending}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-gray-900 truncate">
                            {topic.name}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {topic.course?.code || ""} · {topic.course?.name || "General"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleEdit(topic)}
                            className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(topic._id)}
                            disabled={deleteMutation.isPending}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete topic"
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
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
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

export default AdminTopics;
