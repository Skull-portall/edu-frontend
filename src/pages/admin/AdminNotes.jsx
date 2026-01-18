import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AdminNotes = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch Notes
  const { data: notesData, isLoading: loading } = useQuery({
    queryKey: ['adminNotes', page],
    queryFn: async () => {
      const response = await adminAPI.getNotes({ page, limit });
      return response.data;
    },
    onError: () => toast.error('Failed to load notes')
  });

  const notes = notesData?.data || [];
  const pendingNotesCount = notesData?.pendingNotesCount || 0;
  const pagination = notesData?.pagination || { page: 1, total: 0, pages: 0 };

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approveNote(id),
    onSuccess: () => {
      toast.success('Note approved and published!', { position: 'top-center' });
      queryClient.invalidateQueries(['adminNotes']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Approval failed')
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => adminAPI.rejectNote(id),
    onSuccess: () => {
      toast.success('Note rejected.', { position: 'top-center' });
      queryClient.invalidateQueries(['adminNotes']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteNote(id),
    onSuccess: () => {
      toast.success('Note deleted permanently.', { position: 'top-center' });
      queryClient.invalidateQueries(['adminNotes']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const handleApprove = (id) => approveMutation.mutate(id);

  const handleReject = (id) => {
    if (window.confirm('Are you sure you want to reject this note?')) rejectMutation.mutate(id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this note permanently?')) deleteMutation.mutate(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      {/* Header Section */}
      <div className="mb-16 animate-fade-in flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight uppercase flex items-center gap-4">
            Note <span className="text-red-600">Moderation</span>
            {pendingNotesCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-600/20">
                {pendingNotesCount} PENDING
              </span>
            )}
          </h1>
          <p className="text-gray-500 font-medium max-w-xl">
            Review and approve study notes shared by students.
          </p>
        </div>

        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] mb-2 transition-colors font-mono"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Admin Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader /></div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100/30 border border-gray-100 overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Title</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Student</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Course</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Date</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {notes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">No Notes Found</h3>
                        <p className="text-gray-400 font-medium italic">There are no study notes pending review.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  notes.map((note) => (
                    <tr key={note._id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="text-sm font-black text-gray-900 uppercase tracking-tight truncate max-w-xs group-hover:text-red-600 transition-colors" title={note.title}>
                          {note.title}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 overflow-hidden">
                            {note.user?.profilePicture ? (
                              <img src={note.user.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : note.user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="text-xs font-black text-gray-900 uppercase tracking-tight leading-none mb-1">{note.user?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-gray-400 font-medium">{note.user?.email || 'No Email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest italic leading-none">
                          {note.courseName || 'GENERAL'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {note.isApproved ? (
                          <span className="inline-flex items-center gap-1.5 text-green-600 text-[10px] font-black uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></div>
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!note.isApproved && (
                            <button
                              onClick={() => handleApprove(note._id)}
                              disabled={approveMutation.isLoading}
                              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-900/10 active:scale-95"
                            >
                              {approveMutation.isLoading ? '...' : 'Approve'}
                            </button>
                          )}
                          <button
                            onClick={() => note.isApproved ? handleDelete(note._id) : handleReject(note._id)}
                            disabled={rejectMutation.isLoading || deleteMutation.isLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/10 active:scale-95"
                          >
                            {rejectMutation.isLoading || deleteMutation.isLoading ? '...' : (note.isApproved ? 'Delete' : 'Reject')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-8 animate-fade-in">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="group flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-600 transition-colors disabled:opacity-0"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">{page}</span>
            <div className="w-8 h-px bg-gray-200"></div>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{pagination.pages}</span>
          </div>

          <button
            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
            disabled={page === pagination.pages}
            className="group flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-600 transition-colors disabled:opacity-0"
          >
            Next
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminNotes;

