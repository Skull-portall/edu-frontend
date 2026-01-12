import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionsAPI, metaAPI } from '../../services/api';

const QuestionCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    courseName: '',
    semesterId: '',
    isAnonymous: false
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
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('body', formData.body);
      formDataToSend.append('courseName', formData.courseName);
      formDataToSend.append('semesterId', formData.semesterId);
      formDataToSend.append('isAnonymous', formData.isAnonymous);
      if (file) {
        formDataToSend.append('attachment', file);
      }

      const response = await questionsAPI.create(formDataToSend);
      navigate(`/questions/${response.data.data._id}`);
    } catch (error) {
      if (error.response?.data?.errors) {
        const errorObj = {};
        error.response.data.errors.forEach(err => {
          errorObj[err.path || err.param] = err.msg || err.message;
        });
        setErrors(errorObj);
      } else {
        setErrors({ general: error.response?.data?.message || 'Failed to create question' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6">Ask a Question</h1>

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
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
              errors.title ? 'border-red-500 ring-red-200' : 'border-gray-300'
            }`}
            placeholder="What's your question?"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Body <span className="text-red-600">*</span>
          </label>
          <textarea
            name="body"
            value={formData.body}
            onChange={handleChange}
            required
            rows="10"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
              errors.body ? 'border-red-500 ring-red-200' : 'border-gray-300'
            }`}
            placeholder="Provide details about your question..."
          />
          {errors.body && <p className="text-red-500 text-sm mt-1">{errors.body}</p>}
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
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                errors.courseName ? 'border-red-500 ring-red-200' : 'border-gray-300'
              }`}
              placeholder="e.g., CS101"
            />
            {errors.courseName && <p className="text-red-500 text-sm mt-1">{errors.courseName}</p>}
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
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                errors.semesterId ? 'border-red-500 ring-red-200' : 'border-gray-300'
              } ${loadingSemesters ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">{loadingSemesters ? 'Loading semesters...' : 'Select semester'}</option>
              {semesters.map(sem => (
                <option key={sem._id} value={sem._id}>Semester {sem.number}</option>
              ))}
            </select>
            {errors.semesterId && <p className="text-red-500 text-sm mt-1">{errors.semesterId}</p>}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachment (optional)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              className="mr-2 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Post as anonymous</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
          >
            {loading ? 'Posting...' : 'Post Question'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/questions')}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionCreate;
