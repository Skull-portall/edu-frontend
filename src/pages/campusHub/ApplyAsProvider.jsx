import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

import { getImageUrl } from '../../utils/imageUrl';

const ApplyAsProvider = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [showResubmitForm, setShowResubmitForm] = useState(false);

  const [fullName, setFullName] = useState(user?.name || '');
  const [address, setAddress] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [providerImage, setProviderImage] = useState(null);
  const [serviceSampleImage, setServiceSampleImage] = useState(null);
  const [skills, setSkills] = useState('');
  const [description, setDescription] = useState('');

  const { data: application, isLoading } = useQuery({
    queryKey: ['campusHubMyApplication'],
    queryFn: async () => {
      const res = await campusHubAPI.getMyApplication();
      return res.data.data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: (formData) => campusHubAPI.applyAsProvider(formData),
    onSuccess: () => {
      setShowResubmitForm(false);
      queryClient.invalidateQueries(['campusHubMyApplication']);
      toast.success('Application submitted successfully! It is under review.');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to submit application';
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (application?.status === 'approved' && !showCongratsModal) setShowCongratsModal(true);
  }, [application?.status, showCongratsModal]);

  useEffect(() => {
    if (showResubmitForm && application?.status === 'rejected') {
      setFullName(application.fullName || user?.name || '');
      setAddress(application.address || '');
      setServiceName(application.serviceName || '');
      setStudentId(application.studentId || '');
      setProviderImage(null);
      setServiceSampleImage(null);
      setSkills(application.skills || '');
      setDescription(application.description || '');
    }
  }, [showResubmitForm, application]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPEG, PNG, or GIF).');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Image must be less than 3MB.');
        return;
      }
      setProviderImage(file);
    }
  };

  const handleServiceSampleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPEG, PNG, or GIF).');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Image must be less than 3MB.');
        return;
      }
      setServiceSampleImage(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name is required.');
      return;
    }
    if (!address.trim()) {
      toast.error('Provider address is required.');
      return;
    }
    if (!serviceName.trim()) {
      toast.error('Name of service you want to provide is required.');
      return;
    }
    if (!studentId.trim()) {
      toast.error('Student ID is required.');
      return;
    }
    if (!skills.trim()) {
      toast.error('Skills description is required.');
      return;
    }
    if (!description.trim()) {
      toast.error('Description is required.');
      return;
    }
    if (!providerImage) {
      toast.error('Please upload your photo or ID image.');
      return;
    }

    const formData = new FormData();
    formData.append('fullName', fullName.trim());
    formData.append('address', address.trim());
    formData.append('serviceName', serviceName.trim());
    formData.append('studentId', studentId.trim());
    formData.append('skills', skills.trim());
    formData.append('description', description.trim());
    formData.append('providerImage', providerImage);
    if (serviceSampleImage) formData.append('serviceSampleImage', serviceSampleImage);

    applyMutation.mutate(formData);
  };

  if (user?.role === 'provider') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-800 font-medium">You are already a provider. Manage your services from Campus Hub.</p>
          <button onClick={() => navigate('/campus-hub/my-services')} className="mt-4 text-green-700 font-semibold underline">
            Go to My Services
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return <Loader />;

  if (application && !showResubmitForm) {
    const isPending = application.status === 'pending';
    const isRejected = application.status === 'rejected';
    const isApproved = application.status === 'approved';
    const imageUrl = application.providerImage ? getImageUrl(application.providerImage) : null;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/campus-hub')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back
          </button>
        </div>
        {/* Profile-style status card */}
        <div className={`rounded-2xl overflow-hidden shadow-lg ${isPending ? 'bg-amber-50 border-2 border-amber-200' : isRejected ? 'bg-red-50 border-2 border-red-200' : 'bg-green-50 border-2 border-green-200'}`}>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Profile image */}
              <div className="flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="You"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-500">{application.fullName?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`text-xl sm:text-2xl font-bold mb-1 ${isPending ? 'text-amber-900' : isRejected ? 'text-red-900' : 'text-green-900'}`}>
                  {isPending && 'Application Submitted'}
                  {isRejected && 'Application Rejected'}
                  {isApproved && 'Application Approved'}
                </h2>
                <p className="font-semibold text-gray-800">{application.fullName}</p>
                <p className="text-sm text-gray-600">{application.serviceName}</p>
                {application.studentId && <p className="text-sm text-gray-500 mt-1">Student ID: {application.studentId}</p>}
                {application.address && <p className="text-sm text-gray-500">Address: {application.address}</p>}
                {isPending && (
                  <>
                    <p className="text-amber-800 font-medium mt-4">Wait for admin's review.</p>
                    <p className="text-amber-700 text-sm mt-1">You have already submitted your application. You cannot submit another while this one is pending.</p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="mt-6 px-6 py-2.5 bg-white border-2 border-amber-300 text-amber-800 rounded-xl font-semibold hover:bg-amber-100 transition-colors"
                    >
                      Back to Home
                    </button>
                  </>
                )}
                {isRejected && (
                  <>
                    <p className="text-red-800 font-medium mt-4">Your application was not approved.</p>
                    {application.rejectionReason && <p className="text-red-700 text-sm mt-2 p-3 bg-red-100 rounded-lg">{application.rejectionReason}</p>}
                    <button
                      onClick={() => setShowResubmitForm(true)}
                      className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                    >
                      Re-submit your Application
                    </button>
                  </>
                )}
                {isApproved && (
                  <>
                    <p className="text-green-800 font-medium mt-4">You are now a service provider!</p>
                    <button
                      onClick={() => navigate('/campus-hub/my-services')}
                      className="mt-6 px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                    >
                      Start Now
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Congratulations modal - shown when approved */}
        {showCongratsModal && isApproved && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCongratsModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
              <p className="text-gray-600 mb-6">You are now a service provider. Start offering your services to fellow students.</p>
              <button
                onClick={() => { setShowCongratsModal(false); navigate('/campus-hub/my-services'); }}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
              >
                Start Now
              </button>
              <button
                onClick={() => setShowCongratsModal(false)}
                className="mt-3 text-gray-500 hover:text-gray-700 text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Apply as Service Provider</h1>
      <p className="text-gray-600 mb-6">
        Provide your details so we can verify your identity and reduce scams. Admin will review and approve your application.
      </p>

      {applyMutation.isLoading && (
        <div className="fixed inset-0 bg-white/80 flex flex-col items-center justify-center z-50">
          <Loader />
          <p className="mt-4 text-gray-600 font-medium">Submitting your application...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 relative">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full name *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Your full legal name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service provider address *</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Your address (hostel, off-campus, or contact address)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name of the service you want to provide *</label>
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="e.g. Math tutoring, Note-taking, Printing services"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Student ID *</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Your official student identification number"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your photo / ID image *</label>
          <p className="text-xs text-gray-500 mb-2">Upload a clear photo of yourself or your student ID (JPEG, PNG, or GIF, max 3MB). Helps us verify identity.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {providerImage && (
            <p className="mt-2 text-sm text-green-600">Selected: {providerImage.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service sample / sample of your work</label>
          <p className="text-xs text-gray-500 mb-2">Optional: Upload an image or sample of the service you provide (e.g. sample notes, sample design). JPEG, PNG, or GIF, max 3MB.</p>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleServiceSampleChange}
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {serviceSampleImage && (
            <p className="mt-2 text-sm text-green-600">Selected: {serviceSampleImage.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Skills *</label>
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="e.g. Math tutoring, note-taking, printing, errands..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Describe what services you can offer, your experience, and how students can reach you..."
            required
          />
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            type="submit"
            disabled={applyMutation.isLoading}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Application
          </button>
          <button
            type="button"
            onClick={() => navigate('/campus-hub')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyAsProvider;
