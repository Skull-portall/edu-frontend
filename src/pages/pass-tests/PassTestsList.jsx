import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { passTestsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const PassTestsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentType = searchParams.get('type') || '';
  const currentStatus = searchParams.get('status') || 'approved';

  const [search, setSearch] = useState(currentSearch);
  const [actionId, setActionId] = useState(null);

  // Fetch Tests
  const { data: tests = [], isLoading: loading } = useQuery({
    queryKey: ['passTests', { search: currentSearch, type: currentType, status: currentStatus }],
    queryFn: async () => {
      const params = { status: currentStatus };
      if (currentSearch) params.search = currentSearch;
      if (currentType) params.type = currentType;
      const response = await passTestsAPI.getAll(params);
      return response.data.data || [];
    },
    keepPreviousData: true,
  });

  // Action Mutation
  const mutation = useMutation({
    mutationFn: ({ id, action }) =>
      action === 'approve' ? passTestsAPI.approve(id) : passTestsAPI.reject(id),
    onSettled: () => setActionId(null),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['passTests']);
      toast.success(`Paper ${variables.action === 'approve' ? 'approved' : 'rejected'} successfully!`, {
        position: 'top-center'
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  });

  const handleAction = (e, id, action) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to ${action} this paper?`)) {
      setActionId(id);
      mutation.mutate({ id, action });
    }
  };

  const updateFilters = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    navigate(`/pass-tests?${params.toString()}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search });
  };

  if (loading && !tests.length) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="mb-16 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight uppercase">
              Past <span className="text-red-600">Papers</span>
            </h1>
            <p className="text-gray-500 font-medium max-w-xl">
              Access previous exams, tests, and assignments from the community library.
            </p>
          </div>

          <div className="shrink-0">
            {user && (
              <Link
                to="/pass-tests/create"
                className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:shadow-gray-900/30 transform hover:-translate-y-1 active:scale-95 transition-all text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                </svg>
                Upload Paper
              </Link>
            )}
          </div>
        </div>

        {/* Global Control Interface */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white p-2 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col sm:flex-row gap-2">
            <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
              <svg className="absolute left-6 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by course name, year, or exam type..."
                className="w-full bg-transparent border-none py-4 pl-16 pr-8 text-lg font-bold text-gray-900 placeholder-gray-400 focus:ring-0"
              />
            </form>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-red-600 text-white rounded-[1.2rem] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95 text-[10px]"
            >
              Search Papers
            </button>
          </div>

          {/* Quick Filters */}
          <div className="bg-gray-100 p-2 rounded-[2rem] flex items-center gap-2">
            {[
              { id: '', label: 'All' },
              { id: 'test', label: 'Tests' },
              { id: 'assignment', label: 'Assignments' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => updateFilters({ type: type.id })}
                className={`px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${currentType === type.id
                  ? 'bg-gray-900 text-white shadow-xl'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                  }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="animate-slide-up">
        {tests.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 animate-fade-in">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">No Papers Found</h3>
            <p className="text-gray-500 font-medium mb-10 max-w-sm mx-auto">No past papers match your search. Try different keywords.</p>
            <button
              onClick={() => navigate('/pass-tests')}
              className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 text-sm"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {tests.map((test, index) => (
              <article
                key={test._id}
                onClick={() => navigate(`/pass-tests/${test._id}`)}
                className="group bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer flex flex-col"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border italic shadow-sm transition-all group-hover:scale-105 ${test.type === 'test'
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                      {test.type}
                    </span>
                    {test.isVerified && (
                      <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-400 italic shadow-sm animate-pulse flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                        Verified
                      </span>
                    )}
                    {test.isFresh && (
                      <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-sm">
                        Fresh
                      </span>
                    )}
                  </div>

                  {user?.isAdmin && !test.isApproved && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleAction(e, test._id, 'approve')}
                        disabled={mutation.isPending && actionId === test._id}
                        className={`p-3 bg-emerald-50 text-emerald-600 rounded-xl transition-all shadow-sm ${mutation.isPending && actionId === test._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-600 hover:text-white'}`}
                      >
                        {mutation.isPending && actionId === test._id && mutation.variables?.action === 'approve' ? (
                          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => handleAction(e, test._id, 'reject')}
                        disabled={mutation.isPending && actionId === test._id}
                        className={`p-3 bg-red-50 text-red-600 rounded-xl transition-all shadow-sm ${mutation.isPending && actionId === test._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600 hover:text-white'}`}
                      >
                        {mutation.isPending && actionId === test._id && mutation.variables?.action === 'reject' ? (
                          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-red-600 transition-colors uppercase tracking-tight line-clamp-2 leading-tight">
                  {test.title}
                </h2>
                <p className="text-gray-500 font-medium line-clamp-3 leading-relaxed mb-10 italic flex-1">
                  "{test.content?.replace(/<[^>]*>/g, '').substring(0, 150)}..."
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-gray-50 w-full mt-auto">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg ring-2 ring-gray-100">
                    {test.user?.profilePicture ? (
                      <img src={test.user.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white text-[10px] font-black">
                        {test.user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Submitted by</span>
                    <span className="block text-xs font-black text-gray-900 uppercase truncate max-w-[120px]">{test.user?.name || 'STUDENT'}</span>
                  </div>
                  {test.courseName && (
                    <div className="ml-auto">
                      <div className="bg-gray-950 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl group-hover:bg-red-600 transition-colors italic">
                        {test.courseName}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassTestsList;
