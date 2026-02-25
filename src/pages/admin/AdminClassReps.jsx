import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import { getImageUrl } from '../../utils/imageUrl';

const AdminClassReps = () => {
    const queryClient = useQueryClient();
    const [selectedCampus, setSelectedCampus] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [emailToSearch, setEmailToSearch] = useState('');

    // Fetch reference data
    const { data: campuses = [] } = useQuery({
        queryKey: ['adminCampuses'],
        queryFn: async () => {
            const res = await adminAPI.getCampuses();
            return res.data.data;
        }
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['adminDepartments'],
        queryFn: async () => {
            const res = await adminAPI.getDepartments();
            return res.data.data;
        }
    });

    const { data: semesters = [] } = useQuery({
        queryKey: ['adminSemesters'],
        queryFn: async () => {
            const res = await adminAPI.getSemesters();
            return res.data.data;
        }
    });

    // Fetch Current Class Reps for selected section
    const { data: currentReps = [], isLoading: loadingReps } = useQuery({
        queryKey: ['adminUsers', 'class_rep', selectedCampus, selectedDepartment, selectedSemester],
        queryFn: async () => {
            const params = { role: 'class_rep' };
            if (selectedCampus) params.campus_id = selectedCampus;
            if (selectedDepartment) params.department_id = selectedDepartment;
            if (selectedSemester) params.semester_id = selectedSemester;
            const res = await adminAPI.getUsers(params);
            return res.data.data;
        },
        enabled: !!(selectedCampus && selectedDepartment && selectedSemester)
    });

    // Search User by Email
    const { data: previewUser, isLoading: searchingEmail, isError: previewIsError, error: previewError } = useQuery({
        queryKey: ['adminUserPreview', emailToSearch],
        queryFn: async () => {
            const res = await adminAPI.previewUserByEmail(emailToSearch);
            return res.data.data;
        },
        enabled: !!emailToSearch,
        retry: false
    });

    // Assign Class Rep Mutation
    const assignMutation = useMutation({
        mutationFn: (data) => adminAPI.assignClassRep(data),
        onSuccess: (res) => {
            toast.success(res.data.message || 'Successfully assigned as Class Rep!');
            queryClient.invalidateQueries(['adminUsers', 'class_rep']);
            setSearchEmail('');
            setEmailToSearch('');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to assign class rep');
        }
    });

    // Revoke Class Rep (Downgrade to Student)
    const revokeMutation = useMutation({
        mutationFn: (userId) => adminAPI.updateUserRole(userId, 'student'),
        onSuccess: () => {
            toast.success('Successfully removed class rep privileges.');
            queryClient.invalidateQueries(['adminUsers', 'class_rep']);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to remove class rep');
        }
    });

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchEmail.trim()) {
            toast.error('Please enter an email address to search.');
            return;
        }
        setEmailToSearch(searchEmail.trim());
    };

    const handleAssign = () => {
        if (!selectedCampus || !selectedDepartment || !selectedSemester) {
            toast.error('Please select Campus, Department, and Semester first.');
            return;
        }
        if (!previewUser) {
            toast.error('No user found to assign.');
            return;
        }

        assignMutation.mutate({
            email: previewUser.email,
            campus: selectedCampus,
            department: selectedDepartment,
            semester: selectedSemester
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <Link to="/admin" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors mb-6">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
            </Link>

            <div className="mb-8 border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Reps <span className="text-red-600">Management</span></h1>
                <p className="mt-2 text-sm text-gray-500 font-medium">Assign and manage Class Representatives across different sections.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side: Section Selection & Assignment */}
                <div className="flex-1 space-y-8">
                    {/* Section Selection Box */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">1. Select Target Section</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Campus</label>
                                <select
                                    value={selectedCampus}
                                    onChange={(e) => setSelectedCampus(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-red-500 focus:border-red-500 p-2.5 outline-none transition-colors"
                                >
                                    <option value="">Select Campus</option>
                                    {campuses.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Department</label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-red-500 focus:border-red-500 p-2.5 outline-none transition-colors"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d._id} value={d._id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Semester</label>
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-red-500 focus:border-red-500 p-2.5 outline-none transition-colors"
                                >
                                    <option value="">Select Semester</option>
                                    {semesters.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {(!selectedCampus || !selectedDepartment || !selectedSemester) && (
                            <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Please select all three fields to view currently assigned class reps and enable assignment.
                            </p>
                        )}
                    </div>

                    {/* User Search & Assignment Box */}
                    <div className={`bg-white rounded-2xl shadow-sm border p-6 transition-all duration-300 ${(!selectedCampus || !selectedDepartment || !selectedSemester) ? 'opacity-50 pointer-events-none border-gray-200' : 'border-red-200 shadow-md ring-1 ring-red-50'}`}>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center justify-between">
                            <span>2. Search & Assign Student</span>
                            {(!selectedCampus || !selectedDepartment || !selectedSemester) && <span className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">Locked</span>}
                        </h2>

                        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                            <input
                                type="email"
                                placeholder="Enter student's email address..."
                                className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-red-500 focus:border-red-500 p-3 outline-none"
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors flex items-center gap-2 text-sm"
                                disabled={searchingEmail}
                            >
                                {searchingEmail ? (
                                    <>Searching...</>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                        Check Email
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Error State */}
                        {previewIsError && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span className="text-sm font-medium">{previewError?.response?.data?.message || 'User not found in the system.'}</span>
                            </div>
                        )}

                        {/* Found User Card Display */}
                        {previewUser && !searchingEmail && !previewIsError && (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 animate-fade-in shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    {previewUser.profilePicture ? (
                                        <img src={getImageUrl(previewUser.profilePicture)} alt={previewUser.name} className="w-16 h-16 rounded-full object-cover border-2 border-green-200" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-black text-2xl border-2 border-white">
                                            {previewUser.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{previewUser.name}</h3>
                                        <p className="text-sm text-gray-600 font-medium">{previewUser.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${previewUser.role === 'class_rep' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700'}`}>
                                                Role: {previewUser.role.replace('_', ' ')}
                                            </span>
                                            {previewUser.campus && (
                                                <span className="text-[10px] bg-white border border-gray-200 text-gray-500 uppercase tracking-widest px-2 py-0.5 rounded-full font-medium">
                                                    {previewUser.campus?.code || previewUser.campus?.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-green-200/50 pt-4 flex justify-end">
                                    <button
                                        onClick={handleAssign}
                                        disabled={assignMutation.isPending}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-green-600/20 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                                    >
                                        {assignMutation.isPending ? 'Assigning...' : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                Assign as Class Rep
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Existing Reps for Section */}
                <div className="lg:w-[400px]">
                    <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 p-6 h-full flex flex-col">
                        <h2 className="text-lg font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-4">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            Assigned Representatives
                        </h2>

                        {(!selectedCampus || !selectedDepartment || !selectedSemester) ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-800/50 rounded-xl border border-gray-700/50 border-dashed">
                                <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <p className="text-sm text-gray-400 font-medium">Select a section on the left to view its active Class Representatives.</p>
                            </div>
                        ) : loadingReps ? (
                            <div className="flex-1 flex items-center justify-center p-6"><Loader /></div>
                        ) : currentReps.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/30">
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </div>
                                <h3 className="text-white font-bold mb-1">No Assigned Reps</h3>
                                <p className="text-sm text-gray-400">There are currently no Class Representatives assigned to this specific section.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {currentReps.map((rep) => (
                                    <div key={rep._id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col gap-3 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-2 h-full bg-red-600 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex items-center gap-3">
                                            {rep.profilePicture ? (
                                                <img src={getImageUrl(rep.profilePicture)} alt={rep.name} className="w-12 h-12 rounded-full object-cover shadow-md" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-red-500 font-black text-xl shadow-inner">
                                                    {rep.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="text-white font-bold text-sm tracking-wide">{rep.name}</h4>
                                                <p className="text-gray-400 text-xs font-mono">{rep.email}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => window.confirm(`Are you sure you want to revoke Class Rep privileges from ${rep.name}?`) && revokeMutation.mutate(rep._id)}
                                            disabled={revokeMutation.isPending}
                                            className="mt-2 w-full py-2 bg-gray-700 hover:bg-red-600/20 text-gray-300 hover:text-red-400 border border-transparent hover:border-red-600/30 text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95"
                                        >
                                            {revokeMutation.isPending ? 'Revoking...' : 'Revoke Status'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminClassReps;
