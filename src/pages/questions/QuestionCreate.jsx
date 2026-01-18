import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { questionsAPI, metaAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const QuestionCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    courseName: '',
    semesterId: '',
    isAnonymous: false
  });
  const [file, setFile] = useState(null);

  // Fetch Semesters
  const { data: semesters = [], isLoading: loadingSemesters } = useQuery({
    queryKey: ['metaSemesters'],
    queryFn: async () => {
      const response = await metaAPI.getSemesters();
      return response.data.data || [];
    }
  });

  // Mutation for creating question
  const createMutation = useMutation({
    mutationFn: (data) => questionsAPI.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['questions']);
      toast.success('Your question has been posted!', {
        position: 'top-center'
      });
      navigate(`/questions/${res.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to post question. Try again.');
    }
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    if (file) {
      formDataToSend.append('attachment', file);
    }

    createMutation.mutate(formDataToSend);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      {/* Navigation */}
      <div className="mb-12 animate-fade-in">
        <Link to="/questions" className="inline-flex items-center gap-2 text-gray-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Questions
        </Link>
        <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight uppercase tracking-tight">
          Ask a <span className="text-red-600">Question</span>
        </h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-4 italic">"ASK ANYTHING AND GET HELP FROM THE COMMUNITY."</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-slide-up">
        {/* Main Form Fields */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Question Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="What exactly are you trying to solve or understand?"
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Question Details</label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                required
                rows="10"
                placeholder="Structure your question with clear details. Share your approach, any steps you've taken, and define exactly where you're stuck..."
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-gray-700 font-medium focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300 italic"
              />
            </div>
          </div>

        </div>

        {/* Sidebar Context */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Course & Semester</h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Refer Q Course</label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Advanced Calculus"
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Semester</label>
                <select
                  name="semesterId"
                  value={formData.semesterId}
                  onChange={handleChange}
                  required
                  disabled={loadingSemesters}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Semester</option>
                  {semesters.map(sem => (
                    <option key={sem._id} value={sem._id}>Semester {sem.number}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Attachments</h3>
            <div className="relative group overflow-hidden bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 hover:border-red-100 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="p-6 text-center">
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {file ? file.name : 'Upload Image/File'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative shrink-0 mt-1">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-red-600 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-red-600 transition-colors block">Post Anonymously</span>
                <p className="text-[10px] text-gray-400 font-medium mt-2 leading-tight">Your identity will be hidden.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="lg:col-span-12 mt-8">
          <div className="bg-gray-900 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Post Question</h3>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Double check your details before posting</p>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/questions" className="px-8 py-4 text-white font-black uppercase tracking-widest text-xs hover:text-red-400 transition-colors">Cancel</Link>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="bg-white text-gray-900 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 shadow-xl text-sm cursor-pointer flex items-center gap-2"
                >
                  {createMutation.isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    'Post Question'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuestionCreate;
