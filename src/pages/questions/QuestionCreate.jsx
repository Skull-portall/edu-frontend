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
      toast.success('Your inquiry has been broadcasted!', {
        position: 'top-center'
      });
      navigate(`/questions/${res.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Transmission failed. Try again.');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      {/* Navigation */}
      <div className="mb-12 animate-fade-in">
        <Link to="/questions" className="inline-flex items-center gap-2 text-gray-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Archives
        </Link>
        <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight uppercase tracking-tight">
          Initiate <span className="text-red-600">Inquiry</span>
        </h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-4 italic">"KNOWLEDGE BEGINS WITH A SINGLE QUESTION."</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-slide-up">
        {/* Main Form Fields */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Inquiry Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Core theme of your question..."
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Deep Dive Details</label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                required
                rows="10"
                placeholder="Describe your struggle, provide context, or share what you've tried..."
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-gray-700 font-medium focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300 italic"
              />
            </div>
          </div>

          <div className="bg-gray-900 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Finalize Dispatch</h3>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Double check your details before broadcasting</p>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/questions" className="px-8 py-4 text-white font-black uppercase tracking-widest text-xs hover:text-red-400 transition-colors">Discard</Link>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="bg-white text-gray-900 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 shadow-xl"
                >
                  {createMutation.isLoading ? 'Dispatching...' : 'Broadcast'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Context */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Categorization</h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Course Code</label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. CS50"
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-300"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Academic Stage</label>
                <select
                  name="semesterId"
                  value={formData.semesterId}
                  onChange={handleChange}
                  required
                  disabled={loadingSemesters}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Level</option>
                  {semesters.map(sem => (
                    <option key={sem._id} value={sem._id}>Semester {sem.number}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
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
                  {file ? file.name : 'Upload Data'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 rounded-full peer-checked:bg-red-600 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-red-600 transition-colors">Ghost Mode</span>
            </label>
            <p className="text-[10px] text-gray-400 font-medium mt-3 leading-relaxed">Identity concealment for sensitive inquiries.</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuestionCreate;
