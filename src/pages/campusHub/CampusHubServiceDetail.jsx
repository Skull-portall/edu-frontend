import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
        toast.success("Order created. You can chat with the provider now.");
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Bar */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-white rounded-full text-sm font-bold transition-all shadow-sm transform hover:-translate-x-1"
        >
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
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          Back to Hub
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-gray-100 shadow-2xl border border-gray-100">
            {images.length > 0 ? (
              <img
                src={getImageUrl(images[activeImageIndex])}
                alt={service.title}
                className="w-full h-full object-cover transition-all duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg
                  className="w-20 h-20 opacity-20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
            )}
            <div className="absolute top-6 left-6">
              <span className="px-4 py-2 bg-black/60 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest rounded-xl">
                {service.category || "General"}
              </span>
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-4 p-4 bg-gray-50 rounded-[2rem] border border-gray-100 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 ${
                    activeImageIndex === i
                      ? "ring-4 ring-red-500 scale-95 shadow-lg"
                      : "opacity-60 hover:opacity-100"
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

        {/* Right Column: Service Details */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-50"></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl font-black text-rose-600">
                  ₦{Number(service.price).toLocaleString("en-NG")}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      className="w-5 h-5 text-amber-400 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                {service.title}
              </h1>

              <p className="text-gray-500 font-medium text-lg leading-relaxed mb-10 whitespace-pre-wrap">
                {service.description}
              </p>

              {/* Provider Info */}
              <div
                className="group flex items-center gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100 hover:border-red-200 hover:bg-white transition-all duration-300 cursor-pointer mb-10"
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
                      className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center text-red-700 font-black text-xl shadow-sm">
                      {service.provider?.name?.charAt(0) || "P"}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-gray-50 group-hover:border-white rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    Service Provider
                  </p>
                  <p className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                    {service.provider?.name}
                  </p>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-6 h-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </div>
              </div>

              {/* Action Button */}
              {user ? (
                String(service?.provider?._id || service?.provider?.id) ===
                String(user._id || user.id) ? (
                  <div className="text-center p-6 bg-red-50 rounded-3xl border border-red-100">
                    <p className="text-red-700 font-bold">
                      This is your service portfolio item.
                    </p>
                    <button
                      onClick={() => navigate("/campus-hub/my-services")}
                      className="mt-2 text-sm font-black uppercase text-red-600 hover:underline"
                    >
                      Edit from My Services
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleRequestService}
                    disabled={requesting || createOrderMutation.isPending}
                    className="w-full py-5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-red-500/40 hover:shadow-2xl hover:shadow-red-500/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none ring-4 ring-red-50 ring-offset-4 ring-offset-white"
                  >
                    {requesting || createOrderMutation.isPending ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg
                          className="animate-spin h-6 w-6 text-white"
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
                        Sending Request...
                      </span>
                    ) : (
                      "Request Service Now"
                    )}
                  </button>
                )
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-xl shadow-xl shadow-gray-900/20 hover:bg-black transition-all"
                >
                  Log in to Request
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats / Info Card */}
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Why choose this service?
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm font-medium">
                  Secure student-to-student transactions
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm font-medium">
                  Direct chat with the service provider
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm font-medium">
                  Verified campus community members only
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusHubServiceDetail;
