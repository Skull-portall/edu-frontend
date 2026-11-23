import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { campusHubAPI } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils/imageUrl";

const CampusHubServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [requesting, setRequesting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: service, isLoading } = useQuery({
    queryKey: ["campusHubService", id],
    queryFn: async () => {
      const res = await campusHubAPI.getServiceById(id);
      return res.data.data;
    },
    enabled: !!id,
  });

  const createOrderMutation = useMutation({
    mutationFn: () => campusHubAPI.createOrder({ serviceId: id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["campusHubOrders"]);
      if (res.data.reused) {
        toast.success("Found your existing chat. Request sent.");
      } else {
        toast.success("Order created! You can chat with the provider now.");
      }
      navigate(`/campus-hub/orders/${res.data.data._id}/chat`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create order");
      setRequesting(false);
    },
  });

  const handleRequestService = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (
      String(service?.provider?._id || service?.provider?.id) ===
      String(user._id || user.id)
    ) {
      toast.error("You cannot request your own service.");
      return;
    }
    setRequesting(true);
    createOrderMutation.mutate();
  };

  if (isLoading || !service) return <Loader />;

  const images = service.images || [];
  const isOwner =
    user &&
    String(service?.provider?._id || service?.provider?.id) ===
      String(user._id || user.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* ── Top Bar: Back Link ── */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/campus-hub")}
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
          Back to Campus Hub
        </button>
      </div>

      {/* ── Main Service Container ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Main Photo View */}
          <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
            {images.length > 0 ? (
              <img
                src={getImageUrl(images[activeImageIndex])}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg
                  className="w-12 h-12"
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

            {/* Category Badge Tag */}
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider rounded-md">
                {service.category || "Service"}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border transition-all ${
                    activeImageIndex === i
                      ? "ring-2 ring-red-600 border-transparent shadow-sm"
                      : "opacity-60 hover:opacity-100 border-gray-200"
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Order Details & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
            {/* Price & Rating */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  Starting Price
                </span>
                <span className="text-2xl font-black text-red-600 font-mono">
                  ₦{Number(service.price).toLocaleString("en-NG")}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    className="w-3.5 h-3.5 text-amber-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>

            {/* Service Title */}
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                {service.title}
              </h1>
            </div>

            {/* Description */}
            <div className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {service.description}
            </div>

            {/* Provider Info Card */}
            <div
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-red-200 transition-all cursor-pointer"
              onClick={() =>
                navigate(
                  `/profile/${service.provider?._id || service.provider?.id}`,
                )
              }
            >
              <div className="relative">
                {service.provider?.profilePicture ? (
                  <img
                    src={getImageUrl(service.provider.profilePicture)}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                    {service.provider?.name?.charAt(0) || "P"}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Service Provider
                </span>
                <span className="text-xs font-bold text-gray-900 truncate block">
                  {service.provider?.name}
                </span>
              </div>
              <span className="text-[10px] font-bold text-red-600">
                Profile &rarr;
              </span>
            </div>

            {/* Order Action Button */}
            {user ? (
              isOwner ? (
                <div className="text-center p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-xs text-red-700 font-bold">
                    This is your published service.
                  </p>
                  <Link
                    to="/campus-hub/my-services"
                    className="mt-1 inline-block text-[11px] font-black uppercase text-red-600 hover:underline"
                  >
                    Manage in My Services &rarr;
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleRequestService}
                  disabled={requesting || createOrderMutation.isPending}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-red-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {requesting || createOrderMutation.isPending ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      <span>Opening Order Chat...</span>
                    </>
                  ) : (
                    <span>Request Service & Chat</span>
                  )}
                </button>
              )
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-sm"
              >
                Log In to Request Service
              </button>
            )}
          </div>

          {/* Safe Trade Notice Widget */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Campus Safety & Quality</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Orders open a direct chat thread with the provider where you can discuss deadlines, milestones, and deliverables safely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusHubServiceDetail;
