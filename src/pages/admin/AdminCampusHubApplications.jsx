import React, { useState } from "react";
import { Link } from "react-router-dom";
import { campusHubAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils/imageUrl";

const AdminCampusHubApplications = () => {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["adminCampusHubApplications"],
    queryFn: async () => {
      const res = await campusHubAPI.getProviderApplications();
      return res.data.data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ applicationId, action, rejectionReason: reason }) =>
      campusHubAPI.approveOrRejectApplication({
        applicationId,
        action,
        rejectionReason: reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminCampusHubApplications"]);
      toast.success("Application updated successfully.");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update application"),
  });

  const suspendMutation = useMutation({
    mutationFn: (applicationId) =>
      campusHubAPI.revokeProvider({ applicationId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminCampusHubApplications"]);
      toast.success("Provider suspended. Marketplace access revoked.");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to suspend provider"),
  });

  const deleteAppMutation = useMutation({
    mutationFn: (id) => campusHubAPI.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminCampusHubApplications"]);
      toast.success("Application deleted.");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete application"),
  });

  const pending = applications.filter((a) => a.status === "pending");
  const reviewed = applications.filter((a) => a.status !== "pending");
  const processingId = approveMutation.isPending
    ? approveMutation.variables?.applicationId
    : null;

  if (isLoading) return <Loader />;

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
              <span className="text-xs font-bold text-red-600">
                Provider Applications
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
                Provider <span className="text-red-600">Verification</span>
              </h1>
              {pending.length > 0 && (
                <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-bold">
                  {pending.length} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Verify credentials, approve student service providers, or revoke marketplace access
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

        {/* ── Tab Switcher ─────────────────────────────── */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-full self-start inline-flex mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>Pending Review</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "pending"
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {pending.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("reviewed")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "reviewed"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>Reviewed History</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "reviewed"
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {reviewed.length}
            </span>
          </button>
        </div>

        {/* ── Pending Tab Content ─────────────────────────────── */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                  All caught up!
                </h3>
                <p className="text-xs text-gray-500">
                  There are no pending provider applications awaiting verification.
                </p>
              </div>
            ) : (
              pending.map((app) => {
                const imageUrl = app.providerImage
                  ? getImageUrl(app.providerImage)
                  : null;
                const sampleUrl = app.serviceSampleImage
                  ? getImageUrl(app.serviceSampleImage)
                  : null;
                const isProcessing = processingId === app._id;

                return (
                  <div
                    key={app._id}
                    className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:border-gray-200 transition"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Photo / ID */}
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {imageUrl ? (
                          <div
                            onClick={() => setPreviewImage(imageUrl)}
                            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group bg-gray-50 shrink-0"
                          >
                            <img
                              src={imageUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/70 text-[9px] text-white rounded">
                              ID Photo
                            </span>
                          </div>
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
                            {app.fullName?.charAt(0) || "?"}
                          </div>
                        )}

                        {sampleUrl && (
                          <div
                            onClick={() => setPreviewImage(sampleUrl)}
                            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group bg-gray-50 shrink-0"
                          >
                            <img
                              src={sampleUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/70 text-[9px] text-white rounded">
                              Sample
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-bold text-sm text-gray-900 truncate">
                              {app.fullName || app.user?.name}
                            </h3>
                            <p className="text-xs font-semibold text-red-600">
                              {app.serviceName}
                            </p>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono shrink-0">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-lg text-xs mb-3">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              Student ID
                            </span>
                            <span className="font-semibold text-gray-800">
                              {app.studentId || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              Address
                            </span>
                            <span className="font-semibold text-gray-800 truncate block">
                              {app.address || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              Phone / Email
                            </span>
                            <span className="font-semibold text-gray-800 truncate block">
                              {app.user?.phoneNumber || app.user?.email || "—"}
                            </span>
                          </div>
                        </div>

                        {app.skills && (
                          <p className="text-xs text-gray-600 mb-1">
                            <strong className="text-gray-900 font-semibold">
                              Skills:
                            </strong>{" "}
                            {app.skills}
                          </p>
                        )}

                        {app.description && (
                          <p className="text-xs text-gray-600 mb-4 line-clamp-2">
                            <strong className="text-gray-900 font-semibold">
                              Pitch:
                            </strong>{" "}
                            {app.description}
                          </p>
                        )}

                        {/* Action row with optional rejection input */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-gray-100">
                          <input
                            type="text"
                            placeholder="Reason if declining (optional)..."
                            value={rejectReason[app._id] || ""}
                            onChange={(e) =>
                              setRejectReason((r) => ({
                                ...r,
                                [app._id]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-red-500"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() =>
                                approveMutation.mutate({
                                  applicationId: app._id,
                                  action: "approve",
                                })
                              }
                              disabled={isProcessing}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                approveMutation.mutate({
                                  applicationId: app._id,
                                  action: "reject",
                                  rejectionReason: rejectReason[app._id],
                                })
                              }
                              disabled={isProcessing}
                              className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Reviewed History Tab ─────────────────────────────── */}
        {activeTab === "reviewed" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                      Reviewed Date
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {reviewed.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-10 text-center text-gray-400 font-medium"
                      >
                        No reviewed application records.
                      </td>
                    </tr>
                  ) : (
                    reviewed.map((app) => {
                      const imageUrl = app.providerImage
                        ? getImageUrl(app.providerImage)
                        : null;
                      return (
                        <tr
                          key={app._id}
                          className="hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt=""
                                  onClick={() => setPreviewImage(imageUrl)}
                                  className="w-7 h-7 rounded-lg object-cover border border-gray-200 cursor-pointer"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-400">
                                  {app.fullName?.charAt(0) || "?"}
                                </div>
                              )}
                              <span className="font-bold text-gray-900 truncate max-w-[140px]">
                                {app.fullName || app.user?.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-medium text-gray-800">
                              {app.serviceName || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                app.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                  : app.status === "revoked"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                                    : "bg-red-50 text-red-700 border border-red-200/50"
                              }`}
                            >
                              {app.status === "revoked" ? "Suspended" : app.status}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-[11px]">
                            {new Date(
                              app.reviewedAt || app.updatedAt,
                            ).toLocaleDateString()}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {app.status === "approved" && (
                                <button
                                  onClick={() => suspendMutation.mutate(app._id)}
                                  disabled={suspendMutation.isPending}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                                >
                                  Suspend
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Delete this application record?",
                                    )
                                  ) {
                                    deleteAppMutation.mutate(app._id);
                                  }
                                }}
                                disabled={deleteAppMutation.isPending}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Zoom Preview Modal ─────────────────────────────── */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={previewImage}
              alt="Verification Document"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCampusHubApplications;
