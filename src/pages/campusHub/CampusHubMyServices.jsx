import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { campusHubAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import CampusHubHeader from "../../components/campusHub/CampusHubHeader";
import { getImageUrl } from "../../utils/imageUrl";
import { uploadToCloudinary } from "../../utils/cloudinary";

const POPULAR_CATEGORIES = [
  "Design & Creative",
  "Tutoring & Academic",
  "Tech & Coding",
  "Writing & Translation",
  "Photography",
  "Delivery & Errands",
  "Other",
];

const CampusHubMyServices = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    status: "active",
  });
  const [createImages, setCreateImages] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["campusHubMyServices"],
    queryFn: async () => {
      const res = await campusHubAPI.getMyServices();
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (formData) => campusHubAPI.createService(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(["campusHubMyServices"]);
      setShowCreate(false);
      setForm({
        title: "",
        description: "",
        category: "",
        price: "",
        status: "active",
      });
      setCreateImages([]);
      toast.success("Service published successfully! 🚀");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create service"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => campusHubAPI.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["campusHubMyServices"]);
      setEditing(null);
      toast.success("Service updated successfully.");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => campusHubAPI.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["campusHubMyServices"]);
      toast.success("Service deleted.");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete"),
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    if (createImages.length < 1 || createImages.length > 3) {
      toast.error("Please add between 1 and 3 images.");
      return;
    }
    try {
      setIsUploading(true);
      const imageUrls = await Promise.all(
        Array.from(createImages).map((file) => uploadToCloudinary(file)),
      );

      createMutation.mutate({
        title: form.title.trim(),
        description: form.description.trim(),
        category: (form.category || "General").trim(),
        price: form.price || "0",
        images: imageUrls,
      });
    } catch (error) {
      toast.error(error.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editing || !form.title.trim()) return;
    updateMutation.mutate({ id: editing._id, data: form });
  };

  const startEdit = (svc) => {
    setEditing(svc);
    setForm({
      title: svc.title,
      description: svc.description,
      category: svc.category || "",
      price: String(svc.price ?? ""),
      status: svc.status || "active",
    });
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditing(null);
    setCreateImages([]);
    setForm({
      title: "",
      description: "",
      category: "",
      price: "",
      status: "active",
    });
  };

  const removeSelectedImage = (indexToRemove) => {
    setCreateImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      const matchesStatus =
        statusFilter === "all" || svc.status === statusFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        svc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [services, statusFilter, searchQuery]);

  if (isLoading) return <Loader />;

  const activeCount = services.filter((s) => s.status === "active").length;
  const totalValue = services.reduce((acc, s) => acc + Number(s.price || 0), 0);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <CampusHubHeader activePage="services" />

        {/* ── Page Header & Stats Bar ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
              My <span className="text-red-600">Services</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Manage your campus service listings, pricing, and visibility
            </p>
          </div>

          <button
            onClick={() => {
              setShowCreate(true);
              setEditing(null);
              setCreateImages([]);
              setForm({
                title: "",
                description: "",
                category: "",
                price: "",
                status: "active",
              });
            }}
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Service
          </button>
        </div>

        {/* ── Compact 3-Column Stats ─────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Listings
              </p>
              <p className="text-base sm:text-xl font-black text-gray-900 leading-tight">
                {services.length}
              </p>
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Active
              </p>
              <p className="text-base sm:text-xl font-black text-emerald-600 leading-tight">
                {activeCount}
              </p>
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0">
              <span className="font-black text-xs">₦</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 truncate">
                Total Reach
              </p>
              <p className="text-base sm:text-xl font-black text-gray-900 truncate leading-tight">
                ₦{totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Row ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-full self-start">
            {[
              { id: "all", label: "All" },
              { id: "active", label: `Active (${activeCount})` },
              {
                id: "inactive",
                label: `Inactive (${services.length - activeCount})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my services..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-800 focus:outline-none focus:border-red-500 shadow-xs"
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
        </div>

        {/* ── Services Grid ─────────────────────────────── */}
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((svc) => (
              <div
                key={svc._id}
                className="group bg-white rounded-xl border border-gray-100 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex gap-3.5">
                  {/* Thumbnail */}
                  <Link
                    to={`/campus-hub/service/${svc._id}`}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0 relative block"
                  >
                    {svc.images?.length > 0 ? (
                      <img
                        src={getImageUrl(svc.images[0])}
                        alt={svc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    {svc.images?.length > 1 && (
                      <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white px-1.5 py-0.5 rounded">
                        +{svc.images.length - 1}
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider truncate">
                        {svc.category || "General"}
                      </span>
                      <span className="text-sm font-black text-red-600 shrink-0">
                        ₦{Number(svc.price).toLocaleString()}
                      </span>
                    </div>

                    <Link
                      to={`/campus-hub/service/${svc._id}`}
                      className="block font-bold text-sm text-gray-900 group-hover:text-red-600 transition-colors line-clamp-1 mb-1"
                    >
                      {svc.title}
                    </Link>

                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">
                      {svc.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          svc.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            svc.status === "active"
                              ? "bg-emerald-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {svc.status === "active" ? "Active" : "Inactive"}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        #{svc._id?.slice(-5).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    to={`/campus-hub/service/${svc._id}`}
                    className="text-xs font-bold text-gray-500 hover:text-red-600 flex items-center gap-1"
                  >
                    View Listing
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(svc)}
                      className="px-3 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this service listing?",
                          )
                        ) {
                          deleteMutation.mutate(svc._id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete service"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {searchQuery || statusFilter !== "all"
                ? "No matching services found"
                : "No services created yet"}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search query or status filter."
                : "Start offering your skills to peers on campus by creating your first listing."}
            </p>
            {searchQuery || statusFilter !== "all" ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-bold text-gray-700 transition"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition"
              >
                Create First Service
              </button>
            )}
          </div>
        )}

        {/* ── Create / Edit Modal ─────────────────────────────── */}
        {(showCreate || editing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={closeModal}
            />

            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editing ? "Edit Service" : "Create New Service"}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {editing
                      ? "Update your service details and pricing"
                      : "Add your skills and pricing to the campus marketplace"}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold transition"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={editing ? handleUpdate : handleCreate}
                className="p-5 space-y-4 max-h-[80vh] overflow-y-auto"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Service Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="e.g. Professional Resume & CV Redesign"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={3}
                    placeholder="Describe what you provide, your process, turnaround time, etc."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                      placeholder="e.g. Design, Tutoring"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Starting Price (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price: e.target.value }))
                      }
                      placeholder="0.00"
                      min="0"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                {/* Quick Category Chips */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Suggested Categories:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setForm((f) => ({ ...f, category: cat }))}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition cursor-pointer ${
                          form.category === cat
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {editing && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Visibility Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, status: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-red-500"
                    >
                      <option value="active">Active (Visible in Marketplace)</option>
                      <option value="inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                )}

                {/* Image Upload for New Services */}
                {!editing && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Showcase Images (1 to 3 images){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-red-400 hover:bg-red-50/20 transition cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files).slice(0, 3);
                          setCreateImages(files);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-7 h-7 text-gray-400 mb-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-xs font-bold text-gray-700">
                          Click to select photos
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          PNG, JPG, or WEBP up to 5MB each
                        </p>
                      </div>
                    </div>

                    {createImages.length > 0 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto py-1">
                        {createImages.map((file, idx) => (
                          <div
                            key={idx}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 group"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                            <button
                              type="button"
                              onClick={() => removeSelectedImage(idx)}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isUploading ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isUploading ? (
                      <>
                        <svg
                          className="w-3.5 h-3.5 animate-spin"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Uploading...</span>
                      </>
                    ) : editing ? (
                      "Save Changes"
                    ) : (
                      "Publish Service"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Mobile Floating Action Button ─────────────────────────────── */}
        <button
          onClick={() => {
            setShowCreate(true);
            setEditing(null);
            setCreateImages([]);
            setForm({
              title: "",
              description: "",
              category: "",
              price: "",
              status: "active",
            });
          }}
          className="sm:hidden fixed bottom-24 right-5 z-40 bg-red-600 hover:bg-red-700 text-white p-3.5 rounded-full shadow-lg transition active:scale-90 flex items-center justify-center cursor-pointer"
          title="Add New Service"
          aria-label="Add New Service"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CampusHubMyServices;
