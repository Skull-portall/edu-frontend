import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { communitiesAPI } from "../../services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const CommunityCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    purpose: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => communitiesAPI.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["communities"]);
      toast.success("Your community has been created!", {
        position: "top-center",
      });
      navigate(`/communities/${res.data.data._id}`);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to create community.",
      );
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
    if (!formData.name.trim()) {
      toast.error("Please provide a community name");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* ── Top Bar: Back Link ── */}
      <div className="mb-4">
        <Link
          to="/communities"
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
          Back to Communities
        </Link>
      </div>

      {/* ── Compact Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase leading-tight">
          Create <span className="text-red-600">Community</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Start a study circle, departmental group, or project collaboration hub.
        </p>
      </div>

      {/* ── Main Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Inputs (2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Community Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Computer Science 2026, Quantum Physics Group"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="What is this community about? Who should join?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Mission or Learning Goal
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  rows="3"
                  placeholder="What should members expect to achieve or collaborate on?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Sidebar Guidance (1 col on desktop) */}
          <div className="space-y-4">
            <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-red-500 uppercase tracking-wider">
                Community Tips
              </h3>
              <ul className="space-y-2.5 text-xs text-gray-300">
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">1.</span>
                  <span>Use clear, descriptive titles so peers can discover your circle easily.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">2.</span>
                  <span>Encourage active question asking, sharing resources, and notes.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">3.</span>
                  <span>Keep discussions supportive and focused on academic growth.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Form Actions Bar ── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-gray-400">
            Communities are publicly open for all students to discover and join.
          </p>
          <div className="flex items-center gap-2">
            <Link
              to="/communities"
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
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Community</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CommunityCreate;
