import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const NotesList = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [search]);

  const fetchNotes = async () => {
    try {
      const params = search ? { search } : {};
      const response = await notesAPI.getAll(params);
      setNotes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNotes();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
              All Notes
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Browse and explore notes shared by the community
            </p>
          </div>
        </div>
        
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes by title, content, or course..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-base"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold whitespace-nowrap"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchNotes();
                }}
                className="bg-gray-100 text-gray-700 px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {user && (
          <Link
            to="/notes/create"
            className="btn-create btn-create-animate inline-flex items-center gap-2"
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="btn-text">Share Note</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-lg">No notes found</p>
          </div>
        ) : (
          notes.map((note) => (
            <Link
              key={note._id}
              to={`/notes/${note._id}`}
              className="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 card-hover"
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-900 line-clamp-2">{note.title}</h2>
              <p className="text-gray-600 mb-4 text-sm line-clamp-3">{note.content?.substring(0, 150)}...</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center text-white text-xs font-semibold">
                    {note.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span>{note.user?.name}</span>
                </div>
                {note.courseName && (
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                    {note.courseName}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesList;
