import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { notesAPI } from '../../services/api';

const NoteDetail = () => {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await notesAPI.getById(id);
      setNote(response.data.data);
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl font-semibold mb-4">Note not found</div>
        <Link to="/notes" className="text-red-600 hover:text-red-700 underline">
          Back to Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">{note.title}</h1>
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center text-white font-semibold">
              {note.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <Link
              to={`/profile/${note.user?._id || note.user?.id}`}
              className="font-semibold text-gray-700 hover:text-red-600"
            >
              {note.user?.name}
            </Link>
          </div>
          <span>•</span>
          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
          {note.courseName && (
            <>
              <span>•</span>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                {note.courseName}
              </span>
            </>
          )}
        </div>
        <div className="prose max-w-none mb-4">
          <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{note.content}</p>
        </div>
        {note.attachment && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <a
              href={`http://localhost:5000/${note.attachment}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {note.attachmentName || 'Download Attachment'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteDetail;
