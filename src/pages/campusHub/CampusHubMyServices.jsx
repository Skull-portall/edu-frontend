import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { campusHubAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import CampusHubHeader from "../../components/campusHub/CampusHubHeader";
import { getImageUrl } from "../../utils/imageUrl";
import { uploadToCloudinary } from "../../utils/cloudinary";

const CampusHubMyServices = () => {
  const navigate = useNavigate();
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
      toast.success("Service created! 🚀");
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
      toast.error("Title and description required.");
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

  if (isLoading) return <Loader />;

  const activeCount = services.filter(s => s.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        <CampusHubHeader activePage="services" />

        {/* ── Stats Overview ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between h-44 group hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Listings</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tight">{services.length}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between h-44 group hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Services</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tight">{activeCount}</h3>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-8 shadow-2xl shadow-gray-900/20 text-white flex flex-col justify-between h-44 group hover:-translate-y-1 transition-all duration-300">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-red-500 backdrop-blur-md shadow-inner group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"></path></svg>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Market Reach</p>
              <h3 className="text-4xl font-black tracking-tight">₦{Number(services.reduce((acc, s) => acc + Number(s.price), 0)).toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* ── Action Bar ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">My <span className="text-red-600">Services</span></h1>
            <p className="text-gray-500 font-bold">Showcase your skills to the campus community.</p>
          </div>
          <button
            onClick={() => {
              setShowCreate(true);
              setEditing(null);
              setCreateImages([]);
              setForm({ title: "", description: "", category: "", price: "", status: "active" });
            }}
            className="group px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            </div>
            Add New Service
          </button>
        </div>

        {/* ── Form Modal/Section ─────────────────────────────── */}
        {(showCreate || editing) && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => { setShowCreate(false); setEditing(null); }} />
            <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
              <div className="h-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-600"></div>
              <div className="p-8 sm:p-12">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{editing ? "Edit Service" : "New Service"}</h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Professional Portfolio Item</p>
                  </div>
                  <button onClick={() => { setShowCreate(false); setEditing(null); }} className="w-12 h-12 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-8">
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Service Title</label>
                      <input
                        value={form.title}
                        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="What are you offering?"
                        className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-200 font-bold text-gray-900 transition-all placeholder-gray-300 shadow-inner"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Detailed Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={4}
                        placeholder="Describe your service in detail..."
                        className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-200 font-medium text-gray-800 transition-all placeholder-gray-300 shadow-inner resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                        <input
                          value={form.category}
                          onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                          placeholder="e.g. Design, Tutoring"
                          className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-200 font-bold text-gray-900 transition-all placeholder-gray-300 shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Price (₦)</label>
                        <input
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                          placeholder="0.00"
                          className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-200 font-bold text-gray-900 transition-all placeholder-gray-300 shadow-inner"
                          required
                        />
                      </div>
                    </div>

                    {!editing && (
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Showcase Images (1-3)</label>
                        <div className="relative border-2 border-dashed border-gray-100 rounded-[2rem] px-8 py-10 hover:border-red-400 hover:bg-red-50/30 transition-all duration-300 group text-center cursor-pointer shadow-inner">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setCreateImages(Array.from(e.target.files).slice(0, 3))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-lg group-hover:scale-110 transition-transform">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            </div>
                            <p className="font-black text-gray-700 text-sm">Upload Service Media</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PNG, JPG or WEBP · MAX 5MB</p>
                          </div>
                        </div>
                        {createImages.length > 0 && (
                          <div className="mt-4 flex gap-3 overflow-x-auto p-2 scrollbar-hide">
                            {Array.from(createImages).map((file, idx) => (
                              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 bg-red-600/10" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {editing && (
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Visibility Status</label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                          className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-200 font-bold text-gray-900 transition-all shadow-inner appearance-none"
                        >
                          <option value="active">Active (Public)</option>
                          <option value="inactive">Inactive (Private)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isUploading || createMutation.isPending || updateMutation.isPending}
                      className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-900/20 hover:bg-black transition-all disabled:opacity-50"
                    >
                      {isUploading ? "Uploading..." : editing ? "Save Changes" : "Publish Service"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreate(false); setEditing(null); }}
                      className="px-8 py-5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── Service List ─────────────────────────────── */}
        <div className="space-y-8">
          {services.map((svc) => (
            <div
              key={svc._id}
              className="group bg-white rounded-[3rem] border border-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(239,68,68,0.12)] hover:border-red-100 transition-all duration-500 overflow-hidden flex flex-col md:flex-row"
            >
              {/* Image Section */}
              <div className="w-full md:w-80 h-64 md:h-auto relative overflow-hidden flex-shrink-0">
                {svc.images?.length > 0 ? (
                  <>
                    <img
                      src={getImageUrl(svc.images[0])}
                      alt={svc.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {svc.images.length > 1 && (
                      <div className="absolute bottom-6 left-6 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                        +{svc.images.length - 1} Images
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gray-50 flex items-center justify-center text-gray-200">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <span className="px-4 py-2 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-100">
                      {svc.category || "General"}
                    </span>
                    <span className="text-3xl font-black text-red-600 tracking-tighter">
                      ₦{Number(svc.price).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 group-hover:text-red-600 transition-colors tracking-tight leading-tight">
                    {svc.title}
                  </h2>
                  <p className="text-gray-500 font-medium text-base mb-8 line-clamp-2 leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${svc.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                      <span className={`w-2 h-2 rounded-full ${svc.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                      {svc.status}
                    </div>
                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      ID: #{svc._id?.slice(-6).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(svc)}
                      className="px-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if(window.confirm("Delete this service?")) deleteMutation.mutate(svc._id); }}
                      className="w-12 h-12 bg-white border border-red-50 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {services.length === 0 && !showCreate && !editing && (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 mt-8 shadow-inner">
            <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-2">No Services Yet</h3>
            <p className="text-gray-400 font-bold max-w-sm mx-auto mb-10">Start your journey as a provider by creating your first service listing.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-900/20 hover:bg-black hover:-translate-y-1 transition-all"
            >
              Create First Listing
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusHubMyServices;
