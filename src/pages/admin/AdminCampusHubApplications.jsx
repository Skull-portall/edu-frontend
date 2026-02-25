import React from 'react';
import { Link } from 'react-router-dom';
import { campusHubAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

import { getImageUrl } from '../../utils/imageUrl';

const AdminCampusHubApplications = () => {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = React.useState({});

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['adminCampusHubApplications'],
    queryFn: async () => {
      const res = await campusHubAPI.getProviderApplications();
      return res.data.data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ applicationId, action, rejectionReason: reason }) =>
      campusHubAPI.approveOrRejectApplication({ applicationId, action, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCampusHubApplications']);
      toast.success('Application updated.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const suspendMutation = useMutation({
    mutationFn: (applicationId) => campusHubAPI.revokeProvider({ applicationId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCampusHubApplications']);
      toast.success('Provider suspended. User can no longer offer services.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteAppMutation = useMutation({
    mutationFn: (id) => campusHubAPI.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCampusHubApplications']);
      toast.success('Application deleted.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const pending = applications.filter((a) => a.status === 'pending');
  const reviewed = applications.filter((a) => a.status !== 'pending');
  const processingId = approveMutation.isPending ? approveMutation.variables?.applicationId : null;

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Admin
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Provider Applications</h1>
        <p className="text-gray-600">Approve, reject, suspend, or delete provider applications. Suspend blocks the user from offering services; Delete removes the application and their provider access.</p>
      </div>

      <div className="space-y-6">
        {pending.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No pending applications.
          </div>
        )}
        {pending.map((app) => {
          const imageUrl = app.providerImage ? getImageUrl(app.providerImage) : null;
          const isProcessing = processingId === app._id;
          return (
            <div key={app._id} className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Profile image - prominent */}
                  <div className="flex-shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={app.fullName || 'Provider'}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover ring-2 ring-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gray-100 flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-400">{app.fullName?.charAt(0) || '?'}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2 text-center">Provider photo / ID</p>
                    {app.serviceSampleImage && (
                      <div className="mt-3">
                        <img src={getImageUrl(app.serviceSampleImage)} alt="Service sample" className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover ring-2 ring-gray-200" />
                        <p className="text-xs text-gray-500 mt-2 text-center">Service sample</p>
                      </div>
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900">{app.fullName || app.user?.name}</h3>
                    <p className="text-sm text-gray-500">{app.user?.email}</p>
                    {app.user?.phoneNumber && <p className="text-sm text-gray-500">{app.user.phoneNumber}</p>}
                    <div className="mt-4 space-y-2 text-sm">
                      <p><strong>Service:</strong> {app.serviceName}</p>
                      <p><strong>Student ID:</strong> {app.studentId}</p>
                      <p><strong>Address:</strong> {app.address}</p>
                      <p><strong>Skills:</strong> {app.skills}</p>
                      <p><strong>Description:</strong> {app.description}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{new Date(app.createdAt).toLocaleString()}</p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Rejection reason (optional)"
                        value={rejectReason[app._id] || ''}
                        onChange={(e) => setRejectReason((r) => ({ ...r, [app._id]: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 max-w-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveMutation.mutate({ applicationId: app._id, action: 'approve' })}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px] flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          Approve
                        </button>
                        <button
                          onClick={() => approveMutation.mutate({ applicationId: app._id, action: 'reject', rejectionReason: rejectReason[app._id] })}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px] flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reviewed.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Reviewed</h2>
          <div className="space-y-4">
            {reviewed.map((app) => {
              const imageUrl = app.providerImage ? getImageUrl(app.providerImage) : null;
              const isSuspending = suspendMutation.isPending && suspendMutation.variables === app._id;
              return (
                <div key={app._id} className="bg-gray-50 rounded-xl p-4 flex flex-wrap items-center gap-4">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-500">{app.fullName?.charAt(0) || '?'}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900">{app.fullName || app.user?.name}</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded ${app.status === 'approved' ? 'bg-green-100 text-green-800' : app.status === 'revoked' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      {app.status === 'revoked' ? 'Suspended' : app.status}
                    </span>
                    {app.serviceName && <span className="ml-2 text-sm text-gray-500">· {app.serviceName}</span>}
                  </div>
                  <span className="text-sm text-gray-500">{new Date(app.reviewedAt || app.updatedAt).toLocaleString()}</span>
                  <div className="flex gap-2 flex-shrink-0">
                    {app.status === 'approved' && (
                      <button
                        onClick={() => suspendMutation.mutate(app._id)}
                        disabled={isSuspending}
                        className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 disabled:opacity-70"
                      >
                        {isSuspending ? 'Suspending…' : 'Suspend'}
                      </button>
                    )}
                    <button
                      onClick={() => window.confirm(app.status === 'approved' ? 'Delete this application? User will be removed from provider role.' : 'Delete this application from the list?') && deleteAppMutation.mutate(app._id)}
                      disabled={deleteAppMutation.isPending}
                      className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-800 rounded-lg hover:bg-red-200 disabled:opacity-70"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampusHubApplications;
