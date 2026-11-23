import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { campusHubAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils/imageUrl";
import { uploadToCloudinary } from "../../utils/cloudinary";

const ApplyAsProvider = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const sampleInputRef = useRef(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [fullName, setFullName] = useState(user?.name || "");
  const [address, setAddress] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [providerImage, setProviderImage] = useState(null);
  const [serviceSampleImage, setServiceSampleImage] = useState(null);
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");

  const { data: application, isLoading } = useQuery({
    queryKey: ["campusHubMyApplication"],
    queryFn: async () => {
      const res = await campusHubAPI.getMyApplication();
      return res.data.data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: (formData) => campusHubAPI.applyAsProvider(formData),
    onSuccess: () => {
      setShowResubmitForm(false);
      queryClient.invalidateQueries(["campusHubMyApplication"]);
      toast.success("Application submitted successfully! It is now under review.");
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to submit application";
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (application?.status === "approved" && !showCongratsModal) {
      setShowCongratsModal(true);
    }
  }, [application?.status, showCongratsModal]);

  useEffect(() => {
    if (showResubmitForm && application?.status === "rejected") {
      setFullName(application.fullName || user?.name || "");
      setAddress(application.address || "");
      setServiceName(application.serviceName || "");
      setStudentId(application.studentId || "");
      setProviderImage(null);
      setServiceSampleImage(null);
      setSkills(application.skills || "");
      setDescription(application.description || "");
    }
  }, [showResubmitForm, application, user?.name]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (JPEG, PNG, or WEBP).");
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error("Image must be less than 3MB.");
        return;
      }
      setProviderImage(file);
    }
  };

  const handleServiceSampleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (JPEG, PNG, or WEBP).");
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error("Image must be less than 3MB.");
        return;
      }
      setServiceSampleImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !fullName.trim() ||
      !address.trim() ||
      !serviceName.trim() ||
      !studentId.trim() ||
      !skills.trim() ||
      !description.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!providerImage && !application?.providerImage) {
      toast.error("Please upload your student ID or verification photo.");
      return;
    }

    try {
      setIsUploading(true);
      let providerImageUrl = application?.providerImage;
      if (providerImage) {
        providerImageUrl = await uploadToCloudinary(providerImage);
      }

      let serviceSampleImageUrl = application?.serviceSampleImage;
      if (serviceSampleImage) {
        serviceSampleImageUrl = await uploadToCloudinary(serviceSampleImage);
      }

      applyMutation.mutate({
        fullName: fullName.trim(),
        address: address.trim(),
        serviceName: serviceName.trim(),
        studentId: studentId.trim(),
        skills: skills.trim(),
        description: description.trim(),
        providerImage: providerImageUrl,
        serviceSampleImage: serviceSampleImageUrl,
      });
    } catch (error) {
      toast.error(error.message || "Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // If already an approved provider
  if (user?.role === "provider" || user?.isProvider) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center text-gray-900">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-xs border border-emerald-100">
          <svg
            className="w-8 h-8"
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
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">
          You are a Verified Provider
        </h2>
        <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto mb-6">
          Your provider account is active. Manage your service listings, track incoming
          orders, and communicate with students.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate("/campus-hub/dashboard")}
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition"
          >
            Provider Dashboard
          </button>
          <button
            onClick={() => navigate("/campus-hub/my-services")}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition"
          >
            My Services
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return <Loader />;

  // Existing application status view
  if (application && !showResubmitForm) {
    const isPending = application.status === "pending";
    const isRejected = application.status === "rejected";
    const isApproved = application.status === "approved";
    const imageUrl = application.providerImage
      ? getImageUrl(application.providerImage)
      : null;

    return (
      <div className="min-h-screen bg-[#fafafa] pb-24 text-gray-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
          {/* Back button */}
          <div className="mb-4">
            <Link
              to="/campus-hub"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-red-600 transition"
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
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Campus Hub
            </Link>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {/* Header banner */}
            <div
              className={`h-2 ${
                isPending
                  ? "bg-amber-400"
                  : isRejected
                    ? "bg-red-500"
                    : "bg-emerald-500"
              }`}
            />

            <div className="p-5 sm:p-6">
              {/* Profile & Status header */}
              <div className="flex items-start sm:items-center gap-4 mb-6">
                <div className="relative shrink-0">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Provider verification"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400 border border-gray-200">
                      {application.fullName?.charAt(0) || "?"}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] ${
                      isPending
                        ? "bg-amber-500"
                        : isRejected
                          ? "bg-red-500"
                          : "bg-emerald-500"
                    }`}
                  >
                    {isPending ? "⏳" : isRejected ? "✕" : "✓"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPending
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : isRejected
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {application.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      #{application._id?.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900 truncate">
                    {application.fullName}
                  </h2>
                  <p className="text-xs font-bold text-red-600 truncate">
                    {application.serviceName}
                  </p>
                </div>
              </div>

              {/* Application Details Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Student ID
                    </span>
                    <span className="font-semibold text-gray-800">
                      {application.studentId || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Address / Hostel
                    </span>
                    <span className="font-semibold text-gray-800">
                      {application.address || "—"}
                    </span>
                  </div>
                </div>

                {application.skills && (
                  <div className="text-xs pt-2 border-t border-gray-200/60">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                      Skills
                    </span>
                    <p className="text-gray-700 font-medium">
                      {application.skills}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Notice & Actions */}
              {isPending && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
                  <h4 className="text-xs font-bold text-amber-900 mb-1">
                    Application Under Verification
                  </h4>
                  <p className="text-xs text-amber-700 leading-relaxed max-w-md mx-auto mb-4">
                    Campus moderators are reviewing your credentials. You will be
                    notified as soon as your account is approved.
                  </p>
                  <button
                    onClick={() => navigate("/campus-hub")}
                    className="px-4 py-2 bg-white border border-amber-300 text-amber-800 rounded-full font-bold text-xs transition hover:bg-amber-100"
                  >
                    Browse Campus Hub
                  </button>
                </div>
              )}

              {isRejected && (
                <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl text-center">
                  <h4 className="text-xs font-bold text-red-900 mb-1">
                    Application Declined
                  </h4>
                  <p className="text-xs text-red-700 leading-relaxed max-w-md mx-auto mb-3">
                    Your provider application was not accepted by the
                    administrators.
                  </p>
                  {application.rejectionReason && (
                    <div className="bg-white border border-red-100 p-3 rounded-lg text-left mb-4">
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-0.5">
                        Admin Feedback:
                      </span>
                      <p className="text-xs font-medium text-gray-800">
                        {application.rejectionReason}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setShowResubmitForm(true)}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition"
                  >
                    Re-submit Application
                  </button>
                </div>
              )}

              {isApproved && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                  <h4 className="text-xs font-bold text-emerald-900 mb-1">
                    Application Approved! 🎉
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed max-w-md mx-auto mb-4">
                    You can now create listings, receive student requests, and
                    manage your services.
                  </p>
                  <button
                    onClick={() => navigate("/campus-hub/my-services")}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition"
                  >
                    Go to My Services
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal on approval */}
        {showCongratsModal && isApproved && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowCongratsModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg
                  className="w-8 h-8"
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
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Congratulations!
              </h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                You are now a verified service provider. Setup your listings and
                start offering your services to fellow students.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowCongratsModal(false);
                    navigate("/campus-hub/my-services");
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition"
                >
                  Start Adding Services
                </button>
                <button
                  onClick={() => setShowCongratsModal(false)}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Application / Re-submission Form
  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 text-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/campus-hub"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-red-600 transition"
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
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Campus Hub
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
            Apply as a <span className="text-red-600">Provider</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Join the campus marketplace to offer your skills and earn money on campus.
          </p>
        </div>

        {/* Overlay spinner */}
        {(applyMutation.isPending || isUploading) && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center max-w-xs text-center">
              <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-gray-800">
                {isUploading
                  ? "Uploading verification photos..."
                  : "Submitting application..."}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-6"
        >
          {/* Section 1: Personal Identity */}
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                1. Personal Verification
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                Your legal identity and student credentials
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-red-500"
                  placeholder="As shown on your ID"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Student ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-red-500"
                  placeholder="e.g. 20/CG/12345"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Campus Address / Hostel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-red-500"
                placeholder="e.g. Hall 4, Room B12, or off-campus street"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Student ID or Selfie Photo <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                  providerImage
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-gray-200 hover:border-red-400 hover:bg-red-50/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {providerImage ? (
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={URL.createObjectURL(providerImage)}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover border border-emerald-300"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-emerald-800 truncate max-w-[180px]">
                        {providerImage.name}
                      </p>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-red-600 transition">
                        Click to change photo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-6 h-6 text-gray-400 mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
                      />
                    </svg>
                    <p className="text-xs font-bold text-gray-700">
                      Upload verification photo
                    </p>
                    <p className="text-[10px] text-gray-400">
                      JPEG, PNG or WEBP up to 3MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Service Details */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                2. Service Offerings
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                Information on what you will be offering to peers
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Primary Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-red-500"
                placeholder="e.g. Graphics Design, Python Tutoring, Hair Braiding"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Skills & Relevant Experience <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-red-500"
                placeholder="e.g. Figma, Canva, Adobe Suite, 3 years tutoring"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Service Pitch & Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-red-500 resize-none"
                placeholder="Explain why students should hire you, turnaround times, past work, etc."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Work Sample <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div
                onClick={() => sampleInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition ${
                  serviceSampleImage
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-gray-200 hover:border-red-400 hover:bg-red-50/20"
                }`}
              >
                <input
                  ref={sampleInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleServiceSampleChange}
                  className="hidden"
                />

                {serviceSampleImage ? (
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={URL.createObjectURL(serviceSampleImage)}
                      alt="Sample"
                      className="w-10 h-10 rounded-lg object-cover border border-emerald-300"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-emerald-800 truncate max-w-[180px]">
                        {serviceSampleImage.name}
                      </p>
                      <span className="text-[10px] text-gray-400 hover:text-red-600 transition">
                        Change sample
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 font-medium">
                    Click to attach a portfolio sample image (flyer, note, screenshot)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (showResubmitForm) setShowResubmitForm(false);
                else navigate("/campus-hub");
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applyMutation.isPending || isUploading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyAsProvider;
