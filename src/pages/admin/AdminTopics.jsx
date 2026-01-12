import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const AdminTopics = () => {
  const [topics, setTopics] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({ name: '', courseId: '' });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', courseId: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topicsRes, coursesRes] = await Promise.all([
        adminAPI.getTopics(),
        adminAPI.getCourses()
      ]);
      if (topicsRes.data.success) {
        setTopics(topicsRes.data.data || []);
      }
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await adminAPI.createTopic({ name: formData.name, course_id: formData.courseId });
      setMessage({ type: 'success', text: 'Topic created successfully!' });
      setFormData({ name: '', courseId: '' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create topic' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (topic) => {
    setEditingId(topic._id);
    setEditFormData({
      name: topic.name || '',
      courseId: topic.course?._id || topic.course_id || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: '', courseId: '' });
  };

  const handleUpdate = async (topicId) => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      await adminAPI.updateTopic(topicId, { name: editFormData.name, course_id: editFormData.courseId });
      setMessage({ type: 'success', text: 'Topic updated successfully!' });
      setEditingId(null);
      setEditFormData({ name: '', courseId: '' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update topic' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic? This action cannot be undone!')) return;
    try {
      await adminAPI.deleteTopic(topicId);
      setMessage({ type: 'success', text: 'Topic deleted successfully!' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete topic' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Manage Topics</h1>
            <p className="text-sm sm:text-base text-gray-600">Add, edit, or remove topics</p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base shadow-md whitespace-nowrap"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`mb-6 border-l-4 p-4 rounded-lg shadow-sm ${
          message.type === 'success' 
            ? 'bg-green-100 border-green-500 text-green-700' 
            : 'bg-red-100 border-red-500 text-red-700'
        }`}>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Topic Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Topic</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>{course.code} - {course.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Topic Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Introduction, Arrays, Functions"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : 'Add Topic'}
            </button>
          </form>
        </div>

        {/* Topics List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Topics</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            </div>
          ) : topics.length === 0 ? (
            <p className="text-gray-500">No topics yet. Add one to get started!</p>
          ) : (
            <div className="space-y-3">
              {topics.map((topic, index) => (
                <div key={topic._id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md">
                  {editingId === topic._id ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdate(topic._id); }}>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
                          <select
                            value={editFormData.courseId}
                            onChange={(e) => setEditFormData({ ...editFormData, courseId: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                          >
                            <option value="">Select Course</option>
                            {courses.map(course => (
                              <option key={course._id} value={course._id}>{course.code} - {course.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                          >
                            {submitting ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                          <p className="text-sm text-gray-600">{topic.course?.code || ''} - {topic.course?.name || 'N/A'}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(topic)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-blue-200"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(topic._id)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 hover:text-red-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-red-200"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTopics;

