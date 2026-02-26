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
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    notes: '',
    deadline: ''
  });

  const { data: service, isLoading } = useQuery({
    queryKey: ['campusHubService', id],
    queryFn: async () => {
      const res = await campusHubAPI.getServiceById(id);
      return res.data.data;
    },
    enabled: !!id,
  });

  const createOrderMutation = useMutation({
    mutationFn: (payload) => campusHubAPI.createOrder({ serviceId: id, ...payload }),
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
    setShowQuoteModal(true);
  };

  const confirmRequest = (e) => {
    e.preventDefault();
    setRequesting(true);
    createOrderMutation.mutate(quoteForm);
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

      {/* Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up border border-gray-100">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Request <span className="text-red-600">Quotation</span></h2>
                  <p className="text-sm text-gray-500 font-medium">Specify your requirements to the provider</p>
                </div>
                <button onClick={() => setShowQuoteModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <form onSubmit={confirmRequest} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 italic">Requirement Details</label>
                  <textarea
                    required
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({...quoteForm, notes: e.target.value})}
                    placeholder="Describe what you need in detail (e.g., 'I need a 5-page summary of BIO101 by Friday')..."
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-red-500 focus:bg-white transition-all text-sm font-bold placeholder-gray-300 min-h-[120px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 italic">Desired Deadline (Optional)</label>
                  <input
                    type="date"
                    value={quoteForm.deadline}
                    onChange={(e) => setQuoteForm({...quoteForm, deadline: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-red-500 focus:bg-white transition-all text-sm font-bold cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requesting}
                    className="flex-3 w-2/3 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {requesting ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    ) : 'Confirm Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusHubServiceDetail;
