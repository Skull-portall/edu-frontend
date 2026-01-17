import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, metaAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AdminEndSeason = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ campus_id: '', department_id: '' });
  const [showPreview, setShowPreview] = useState(false);

  // Fetch Metadata
  const { data: metaData, isLoading: metaLoading } = useQuery({
    queryKey: ['adminEndSeasonMeta'],
    queryFn: async () => {
      const [campusesRes, departmentsRes, semestersRes] = await Promise.all([
        metaAPI.getCampuses(),
        metaAPI.getDepartments(),
        metaAPI.getSemesters()
      ]);
      return {
        campuses: campusesRes.data.data || [],
        departments: departmentsRes.data.data || [],
        semesters: semestersRes.data.data || []
      };
    },
    onError: () => toast.error('Failed to load metadata')
  });

  const campuses = metaData?.campuses || [];
  const departments = metaData?.departments || [];
  const semesters = metaData?.semesters || [];

  // Fetch Student Counts
  const { data: studentCountsData, isLoading: countsLoading } = useQuery({
    queryKey: ['adminStudentCounts', formData.campus_id, formData.department_id],
    queryFn: async () => {
      const response = await adminAPI.getStudentCounts(formData.campus_id, formData.department_id);
      return response.data.data || {};
    },
    enabled: !!(formData.campus_id && formData.department_id),
    onSuccess: () => setShowPreview(true)
  });

  const studentCounts = studentCountsData || {};

  // Mutation
  const promoteMutation = useMutation({
    mutationFn: () => adminAPI.promoteUsersByCampusDepartment(formData.campus_id, formData.department_id),
    onSuccess: (response) => {
      toast.success(response.data.message || 'Students promoted successfully!');
      setFormData({ campus_id: '', department_id: '' });
      setShowPreview(false);
      queryClient.invalidateQueries(['adminStudentCounts']);
      queryClient.invalidateQueries(['adminUsers']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to promote students')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to promote all students from the selected campus and department to the next semester? This action cannot be undone.')) {
      return;
    }
    promoteMutation.mutate();
  };

  const selectedCampus = campuses.find(c => c._id === formData.campus_id);
  const selectedDepartment = departments.find(d => d._id === formData.department_id);
  const uniqueSemesters = Array.from(new Map(semesters.map(s => [s.number, s])).values()).sort((a, b) => a.number - b.number);
  const maxSemester = uniqueSemesters.length > 0 ? Math.max(...uniqueSemesters.map(s => s.number)) : 0;

  if (metaLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header Section */}
        <header className="mb-6 sm:mb-8 lg:mb-10 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 sm:gap-4 mb-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                    Semester Update
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1.5 leading-relaxed">
                    Promote students to the next semester level
                  </p>
                </div>
              </div>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-sm sm:text-base font-bold whitespace-nowrap w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>
        </header>

        {/* Info Alert Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl shadow-sm p-5 sm:p-6 mb-6 sm:mb-8 animate-slide-in">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 bg-blue-500 rounded-lg shadow-sm flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-sm sm:text-base font-bold text-blue-900 mb-2">Important Notice</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                This action will promote all students from the selected campus and department to the next semester level.
                Students already in the highest semester will be automatically skipped.
                <strong className="text-blue-900 font-semibold"> This action cannot be undone.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Promotion Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6 sm:mb-8">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 sm:px-8 sm:py-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Semester Promotion Form</h2>
                <p className="text-red-50 text-sm mt-0.5">Select campus and department to proceed</p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10 space-y-8">
            {/* Campus Selection */}
            <div className="mb-6">
              <label htmlFor="campus_id" className="flex items-center gap-2 mb-3 text-base font-semibold text-gray-800">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                <span>Select Campus <span className="text-red-600">*</span></span>
              </label>
              <select
                id="campus_id"
                name="campus_id"
                value={formData.campus_id}
                onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                required
                className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 font-medium focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300 hover:border-gray-400"
              >
                <option value="">-- Select Campus --</option>
                {campuses.map(campus => (
                  <option key={campus._id} value={campus._id}>
                    {campus.name} ({campus.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Department Selection */}
            <div className="mb-6">
              <label htmlFor="department_id" className="flex items-center gap-2 mb-3 text-base font-semibold text-gray-800">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <span>Select Department <span className="text-red-600">*</span></span>
              </label>
              <select
                id="department_id"
                name="department_id"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                required
                className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 font-medium focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300 hover:border-gray-400"
              >
                <option value="">-- Select Department --</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Preview Section */}
            {showPreview && selectedCampus && selectedDepartment && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 sm:p-6 border-2 border-green-200 shadow-sm animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 bg-green-500 rounded-lg shadow-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className="text-sm sm:text-base font-bold text-green-900 mb-2">Ready to Proceed</h4>
                    <p className="text-sm text-green-800 mb-2 leading-relaxed">
                      All students from <span className="font-semibold">{selectedCampus.name}</span> -
                      <span className="font-semibold"> {selectedDepartment.name}</span> will be promoted to the next semester level.
                    </p>
                    <p className="text-xs text-green-700 italic">
                      Note: Students already in the highest semester will be automatically skipped.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 sm:pt-8 border-t-2 border-gray-100">
              <Link
                to="/admin"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>Cancel</span>
              </Link>
              <button
                type="submit"
                disabled={promoteMutation.isLoading || !formData.campus_id || !formData.department_id}
                className="inline-flex items-center justify-center px-12 py-4 sm:px-16 sm:py-5 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-red-600 via-red-600 to-rose-600 rounded-xl hover:from-red-700 hover:via-red-700 hover:to-rose-700 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.03] active:translate-y-0 active:scale-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none w-full sm:w-auto gap-3"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
                <span>{promoteMutation.isLoading ? 'Promoting...' : 'Promote All Students'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Current Semester Structure */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 sm:px-8 sm:py-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Current Semester Structure</h2>
                <p className="text-indigo-100 text-sm mt-0.5">View all available semester levels</p>
              </div>
            </div>
          </div>

          {/* Semester Cards Grid */}
          <div className="p-6 sm:p-8">
            {countsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading student counts...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {uniqueSemesters.map((semester) => (
                  <div
                    key={semester._id}
                    className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative"
                  >
                    {semester.number < maxSemester ? (
                      <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-green-100 rounded-full shadow-sm flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                        </svg>
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full shadow-sm">
                          FINAL
                        </span>
                      </div>
                    )}
                    <div className="mb-3">
                      <p className="font-bold text-gray-900 text-lg sm:text-xl">Semester {semester.number}</p>
                      {semester.name && semester.name !== `Semester ${semester.number}` && (
                        <p className="text-sm text-gray-500 font-medium mt-1">{semester.name}</p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <span>
                          {studentCounts[semester._id] !== undefined
                            ? `${studentCounts[semester._id]} student${studentCounts[semester._id] !== 1 ? 's' : ''}`
                            : 'Select campus & department'
                          }
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminEndSeason;

