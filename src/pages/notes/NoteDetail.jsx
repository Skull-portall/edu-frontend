import Loader from '../../components/common/Loader';
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { notesAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const NoteDetail = () => {
  const { id } = useParams();

  const { data: noteData, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      const response = await notesAPI.getById(id);
      return response.data;
    },
    onError: () => {
      toast.error('Failed to load note');
    }
  });

  const note = noteData?.data;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">Note Not Found</h2>
        <p className="text-gray-500 mb-8 font-medium">The note you're looking for might have been moved or deleted.</p>
        <Link
          to="/notes"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Navigation & Header */}
      <div className="mb-10 animate-fade-in">
        <Link to="/notes" className="inline-flex items-center gap-2 text-gray-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Notes
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-red-50 text-red-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 italic">
                {note.courseName || 'General Knowledge'}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Semester {note.semesterId?.number || 'N/A'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight uppercase tracking-tight break-words">
              {note.title}
            </h1>
          </div>

          <button
            onClick={handleShare}
            className="group relative inline-flex items-center justify-center p-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all active:scale-95 shadow-sm"
            title="Copy Link"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8 animate-slide-up">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-8 sm:p-12">
              <div className="prose prose-red max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg italic font-medium">
                  {note.content}
                </p>
              </div>
            </div>
          </div>

          {note.attachment && (
            <div className="bg-gray-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-600/20 transition-all duration-500"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Attached File</h3>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Study Material</p>
                  </div>
                </div>

                <a
                  href={`/api/${note.attachment}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 bg-white text-gray-900 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl text-sm"
                >
                  Download {note.attachmentName || 'File'}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* Author Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Posted By</h4>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-4 ring-gray-50 flex-shrink-0">
                {note.user?.profilePicture ? (
                  <img src={note.user.profilePicture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white text-xl font-black uppercase">
                    {note.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${note.user?._id || note.user?.id}`} className="block text-xl font-black text-gray-900 hover:text-red-600 transition-colors truncate uppercase tracking-tight">
                  {note.user?.name}
                </Link>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Community Member</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Posted on</span>
                <span className="text-xs font-black text-gray-900">{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <Link
                to={`/profile/${note.user?._id || note.user?.id}`}
                className="block w-full text-center py-3 bg-gray-50 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all border border-gray-100"
              >
                View Profile
              </Link>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-3xl p-8 text-white shadow-xl shadow-red-600/20">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 text-white/60 text-center">Quality Check</h4>
            <p className="text-sm font-medium leading-relaxed text-center italic">
              "This resource has been reviewed for quality. Join the discussion to provide feedback."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;
