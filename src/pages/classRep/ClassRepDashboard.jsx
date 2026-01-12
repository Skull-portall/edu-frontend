import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classRepAPI } from '../../services/api';

const ClassRepDashboard = () => {
  const [pendingNotes, setPendingNotes] = useState([]);
  const [pendingPassTests, setPendingPassTests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await classRepAPI.getDashboard();
      if (response.data.success) {
        setPendingNotes(response.data.data.pendingNotes || []);
        setPendingPassTests(response.data.data.pendingPassTests || []);
        setPendingCount(response.data.data.pendingCount || 0);
        setMessage({ type: '', text: '' });
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to load dashboard' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveNote = async (noteId) => {
    try {
      await classRepAPI.approveNote(noteId);
      setMessage({ type: 'success', text: 'Note approved successfully!' });
      fetchDashboard();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to approve note' 
      });
    }
  };

  const handleRejectNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to reject this note?')) return;
    try {
      await classRepAPI.rejectNote(noteId);
      setMessage({ type: 'success', text: 'Note rejected and deleted!' });
      fetchDashboard();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to reject note' 
      });
    }
  };

  const handleApprovePassTest = async (passTestId) => {
    try {
      await classRepAPI.approvePassTest(passTestId);
      setMessage({ type: 'success', text: 'Pass test approved successfully!' });
      fetchDashboard();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to approve pass test' 
      });
    }
  };

  const handleRejectPassTest = async (passTestId, type) => {
    if (!window.confirm(`Are you sure you want to reject this ${type}?`)) return;
    try {
      await classRepAPI.rejectPassTest(passTestId);
      setMessage({ type: 'success', text: `${type.charAt(0).toUpperCase() + type.slice(1)} rejected and deleted!` });
      fetchDashboard();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to reject pass test' 
      });
    }
  };

  const getAttachmentUrl = (attachmentPath) => {
    if (!attachmentPath) return null;
    if (attachmentPath.startsWith('http')) return attachmentPath;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const baseUrl = apiUrl.replace('/api/v1', '');
    if (attachmentPath.startsWith('uploads/')) {
      return `${baseUrl}/${attachmentPath}`;
    }
    return `${baseUrl}/uploads/${attachmentPath}`;
  };

  const getProfilePictureUrl = (picturePath) => {
    if (!picturePath) return null;
    if (picturePath.startsWith('http')) return picturePath;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const baseUrl = apiUrl.replace('/api/v1', '');
    if (picturePath.startsWith('uploads/')) {
      return `${baseUrl}/${picturePath}`;
    }
    return `${baseUrl}/uploads/${picturePath}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Class Representative Dashboard</h1>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-bold leading-none text-white bg-red-600 rounded-full animate-pulse shadow-lg border-2 border-red-700">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Review and approve notes, tests, and assignments from your department and semester
              {pendingCount > 0 && (
                <span className="text-red-600 font-semibold"> • {pendingCount} pending review</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {message.text && (
        <div className={`mb-6 border-l-4 p-4 rounded-lg shadow-sm ${
          message.type === 'success' 
            ? 'bg-green-100 border-green-500 text-green-700' 
            : 'bg-red-100 border-red-500 text-red-700'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Pending Notes Section */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Pending Notes ({pendingNotes.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingNotes.length > 0 ? (
              pendingNotes.map((note) => (
                <div key={note._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{note.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        {note.user && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <Link to={`/profile/${note.user._id}`} className="text-red-600 hover:text-red-700 hover:underline font-medium">
                              {note.user.name}
                            </Link>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                          </svg>
                          <span>{note.courseName}</span>
                        </div>
                        {note.semester && (
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                              Semester {note.semester.number}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                        {note.content?.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                      
                      {/* Attachment Preview */}
                      {note.attachment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Attachment:</span>
                            <span className="text-sm text-gray-600">{note.attachmentName || 'File'}</span>
                          </div>
                          <a 
                            href={getAttachmentUrl(note.attachment)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium hover:underline"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            View/Download Attachment
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                      <button
                        onClick={() => handleApproveNote(note._id)}
                        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectNote(note._id)}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p className="text-gray-500 text-lg font-medium">No pending notes</p>
                <p className="text-gray-400 text-sm mt-1">Notes from your department and semester will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Pass Tests Section */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              Pending Tests & Assignments ({pendingPassTests.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingPassTests.length > 0 ? (
              pendingPassTests.map((passTest) => (
                <div key={passTest._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{passTest.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                          passTest.type === 'test' 
                            ? 'bg-green-100 text-green-700' 
                            : passTest.type === 'assignment'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {passTest.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        {passTest.user && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <Link to={`/profile/${passTest.user._id}`} className="text-red-600 hover:text-red-700 hover:underline font-medium">
                              {passTest.user.name}
                            </Link>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                          </svg>
                          <span>{passTest.courseName}</span>
                        </div>
                        {passTest.semester && (
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
                              Semester {passTest.semester.number}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span>{new Date(passTest.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                        {passTest.content?.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                      
                      {/* Attachment Preview */}
                      {passTest.attachment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Attachment:</span>
                            <span className="text-sm text-gray-600">{passTest.attachmentName || 'File'}</span>
                          </div>
                          <a 
                            href={getAttachmentUrl(passTest.attachment)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium hover:underline"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            View/Download Attachment
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                      <button
                        onClick={() => handleApprovePassTest(passTest._id)}
                        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectPassTest(passTest._id, passTest.type)}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p className="text-gray-500 text-lg font-medium">No pending tests or assignments</p>
                <p className="text-gray-400 text-sm mt-1">Tests and assignments from your department and semester will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassRepDashboard;

