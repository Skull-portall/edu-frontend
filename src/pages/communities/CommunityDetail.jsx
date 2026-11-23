import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { communitiesAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "../../utils/timeAgo";
import toast from "react-hot-toast";

const CommunityDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState("");

  const { data: communityData, isLoading } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const response = await communitiesAPI.getById(id);
      return response.data;
    },
    onError: () => toast.error("Failed to load community"),
  });

  const community = communityData?.data;
  const posts = communityData?.data?.posts || [];

  const createPostMutation = useMutation({
    mutationFn: (newPost) => communitiesAPI.createPost(id, newPost),
    onSuccess: () => {
      queryClient.invalidateQueries(["community", id]);
      setPostContent("");
      toast.success("Your message was posted!", {
        position: "top-center",
      });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to post message"),
  });

  const handleSubmitPost = (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    createPostMutation.mutate({ content: postContent });
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
          Community Not Found
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          This community no longer exists or has been removed.
        </p>
        <Link
          to="/communities"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
        >
          Back to Communities
        </Link>
      </div>
    );
  }

  const founderName = community.user?.name || "Student Leader";
  const memberCount =
    community.members_count || community.members?.length || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
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

      {/* ── Community Banner Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
            Study Group
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            <svg
              className="w-3 h-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-xs text-gray-400 font-mono">
            {posts.length} discussions
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-2 tracking-tight">
          {community.name}
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
          {community.description ||
            "Dedicated community for academic collaboration, sharing lecture notes, and peer discussions."}
        </p>

        {/* Founder Info */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-50 text-xs text-gray-400">
          {community.user?.profilePicture ? (
            <img
              src={community.user.profilePicture}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[9px]">
              {founderName.charAt(0).toUpperCase()}
            </div>
          )}
          <span>Created by</span>
          <Link
            to={`/profile/${community.user?._id || community.user?.id}`}
            className="font-semibold text-gray-700 hover:text-red-600 transition-colors"
          >
            {founderName}
          </Link>
          {community.createdAt && (
            <>
              <span className="text-gray-300">•</span>
              <span>{timeAgo(community.createdAt)}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Post Composer ── */}
      {user ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
            Start a Discussion
          </h2>
          <form onSubmit={handleSubmitPost} className="space-y-3">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows="3"
              placeholder="Share updates, ask a course question, or share study tips..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createPostMutation.isPending || !postContent.trim()}
                className={`px-5 py-2 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                  createPostMutation.isPending || !postContent.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
                }`}
              >
                {createPostMutation.isPending ? "Posting..." : "Post Message"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center mb-6">
          <p className="text-xs text-gray-600 font-medium mb-2.5">
            Join the conversation in this community by signing in with your student account.
          </p>
          <Link
            to="/login"
            className="inline-block bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm"
          >
            Login to Participate
          </Link>
        </div>
      )}

      {/* ── Community Discussions Feed ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">
            Discussions <span className="text-red-600">({posts.length})</span>
          </h2>
        </div>

        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-[10px] font-bold">
                    {post.user?.name?.charAt(0) || "U"}
                  </div>
                  <Link
                    to={`/profile/${post.user?._id || post.user?.id}`}
                    className="text-xs font-bold text-gray-800 hover:text-red-600 transition-colors"
                  >
                    {post.user?.name || "Student"}
                  </Link>
                  <span className="text-gray-300">•</span>
                  <span className="text-[11px] text-gray-400">
                    {timeAgo(post.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-2">
                  {post.content}
                </p>

                {post.attachment && (
                  <div className="pt-2">
                    <a
                      href={`/api/${post.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-600 hover:underline bg-red-50 px-2.5 py-1 rounded-lg"
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
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      Attached Resource
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <p className="text-xs text-gray-400 font-medium">
              No discussions yet. Start the first topic!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDetail;
