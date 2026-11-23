import Loader from "../../components/common/Loader";
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { notesAPI } from "../../services/api";
import { useQuery } from "@tanstack/react-query";
import { timeAgo } from "../../utils/timeAgo";
import toast from "react-hot-toast";

/** Reusable attachment action button with spinner */
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

const NoteDetail = () => {
  const { id } = useParams();

  const { data: noteData, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const response = await notesAPI.getById(id);
      return response.data;
    },
    onError: () => {
      toast.error("Failed to load note");
    },
  });

  const note = noteData?.data;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">
          Note Not Found
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          The note you're looking for might have been moved or deleted.
        </p>
        <Link
          to="/notes"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
        >
          Back to Notes
        </Link>
      </div>
    );
  }

  const authorName = note.user?.name || "Student";
  const course = note.courseName || null;
  const semesterNum = note.semesterId?.number || null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* ── Top Bar: Back Link & Share ── */}
      <div className="flex items-center justify-between mb-4">
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

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm"
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </button>
      </div>

      {/* ── Main Note Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 shadow-sm mb-6">
        {/* Badges & Meta */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
            Study Note
          </span>

          {course && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
              {course}
            </span>
          )}

          {semesterNum && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-500 border border-gray-100">
              Semester {semesterNum}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-3 tracking-tight">
          {note.title}
        </h1>

        {/* Author row */}
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-50 text-xs text-gray-500">
          {note.user?.profilePicture ? (
            <img
              src={note.user.profilePicture}
              alt=""
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px]">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-gray-800">{authorName}</span>
          <span className="text-gray-300">•</span>
          <span>Published {timeAgo(note.createdAt)}</span>
        </div>

        {/* Note Content */}
        <div className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap font-normal mb-6">
          {note.content}
        </div>

        {/* Attachment Card (if any) */}
        {note.attachment &&
          (() => {
            const attachUrl = note.attachment;
            const isCloudinary = attachUrl.includes("cloudinary.com");
            const fileName =
              note.attachmentName ||
              attachUrl.split("/").pop().split("?")[0] ||
              "attachment";
            const baseName =
              fileName
                .replace(/\.[^/.]+$/, "")
                .replace(/[^a-zA-Z0-9_\-]/g, "_") || "download";

            const downloadUrl =
              isCloudinary && attachUrl.includes("/upload/")
                ? attachUrl.replace(
                    "/upload/",
                    `/upload/fl_attachment:${baseName}/`,
                  )
                : attachUrl;

            return (
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
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
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800 block truncate max-w-xs sm:max-w-md">
                      {fileName}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Attached Lecture Material
                    </span>
                  </div>
                </div>

                <ViewAttachmentBtn
                  label="Download"
                  url={downloadUrl}
                  download={fileName}
                  className="bg-gray-900 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs"
                />
              </div>
            );
          })()}
      </div>

      {/* ── Author Profile Card Widget ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {note.user?.profilePicture ? (
            <img
              src={note.user.profilePicture}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <span className="text-xs font-bold text-gray-900 block">
              {authorName}
            </span>
            <span className="text-[10px] text-gray-400 block">
              Note Contributor
            </span>
          </div>
        </div>

        <Link
          to={`/profile/${note.user?._id || note.user?.id}`}
          className="text-xs font-bold text-red-600 hover:underline uppercase tracking-wider"
        >
          View Profile &rarr;
        </Link>
      </div>
    </div>
  );
};

export default NoteDetail;
