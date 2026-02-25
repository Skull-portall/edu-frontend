import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

import { getImageUrl } from '../../utils/imageUrl';

const CampusHubServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [requesting, setRequesting] = useState(false);

  const { data: service, isLoading } = useQuery({
    queryKey: ['campusHubService', id],
    queryFn: async () => {
      const res = await campusHubAPI.getServiceById(id);
      return res.data.data;
    },
    enabled: !!id,
  });

  const createOrderMutation = useMutation({
    mutationFn: () => campusHubAPI.createOrder(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['campusHubOrders']);
      if (res.data.reused) {
        toast.success('Found your existing chat. Request sent.');
      } else {
        toast.success('Order created. You can chat with the provider now.');
      }
      navigate(`/campus-hub/orders/${res.data.data._id}/chat`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create order');
      setRequesting(false);
    },
  });

  const handleRequestService = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (service.provider._id === user._id || service.provider._id === user.id) {
      toast.error('You cannot request your own service.');
      return;
    }
    setRequesting(true);
    createOrderMutation.mutate();
  };

  if (isLoading || !service) return <Loader />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {(service.images && service.images.length > 0) && (
          <div className="flex gap-2 p-2 overflow-x-auto bg-gray-50">
            {service.images.map((img, i) => (
              <img key={i} src={getImageUrl(img)} alt="" className="w-full max-w-xs h-48 object-cover rounded-lg flex-shrink-0" />
            ))}
          </div>
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
              {service.category}
            </span>
            <span className="text-2xl font-bold text-red-600">₦{Number(service.price).toLocaleString('en-NG')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{service.title}</h1>
          <p className="text-gray-600 whitespace-pre-wrap mb-6">{service.description}</p>
          <div
            className="flex items-center gap-3 py-4 border-t border-gray-200 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors w-fit"
            onClick={() => navigate(`/profile/${service.provider?._id || service.provider?.id}`)}
            title={`View ${service.provider?.name || 'Provider'}'s profile`}
          >
            {service.provider?.profilePicture ? (
              <img src={getImageUrl(service.provider.profilePicture)} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0">
                {service.provider?.name?.charAt(0) || 'P'}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 group-hover:text-red-600 hover:underline">{service.provider?.name}</p>
              <p className="text-sm text-gray-500">Service Provider</p>
            </div>
          </div>
          {user ? (
            (service.provider._id === user._id || service.provider._id === user.id) ? (
              <p className="text-gray-500 text-sm">This is your service. Edit it from My Services.</p>
            ) : (
              <button
                onClick={handleRequestService}
                disabled={requesting || createOrderMutation.isPending}
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
              >
                {requesting || createOrderMutation.isPending ? 'Creating order…' : 'Request Service'}
              </button>
            )
          ) : (
            <p className="text-gray-500">Please log in to request this service.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusHubServiceDetail;
