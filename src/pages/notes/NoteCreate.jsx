import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notesAPI, metaAPI } from '../../services/api';

const NoteCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseName: '',
    semesterId: ''
  });
  const [semesters, setSemesters] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await metaAPI.getSemesters();
        setSemesters(response.data.data || []);
      } catch (error) {
        console.error('Error fetching semesters:', error);
        setErrors({ general: 'Failed to load semesters. Please refresh the page.' });
      } finally {
        setLoadingSemesters(false);
      }
    };

    fetchSemesters();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('courseName', formData.courseName);
      formDataToSend.append('semesterId', formData.semesterId);
      if (file) {
        formDataToSend.append('attachment', file);
      }

      const response = await notesAPI.create(formDataToSend);
      navigate(`/notes/${response.data.data._id}`);
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Failed to create note' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Share a Note</h1>
      
      {errors.general && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          <p className="font-medium">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content <span className="text-red-600">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows="12"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            placeholder="Write your note content here..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester <span className="text-red-600">*</span>
            </label>
            <select
              name="semesterId"
              value={formData.semesterId}
              onChange={handleChange}
              required
              disabled={loadingSemesters}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                loadingSemesters ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">{loadingSemesters ? 'Loading semesters...' : 'Select semester'}</option>
              {semesters.map(sem => (
                <option key={sem._id} value={sem._id}>Semester {sem.number}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachment (optional)
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            {loading ? 'Sharing...' : 'Share Note'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/notes')}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoteCreate;
