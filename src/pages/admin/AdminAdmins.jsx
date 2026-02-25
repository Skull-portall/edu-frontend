import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import { getImageUrl } from '../../utils/imageUrl';
import { useAuth } from '../../contexts/AuthContext';

const AdminAdmins = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [selectedRole, setSelectedRole] = useState('');
    const [selectedCampus, setSelectedCampus] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
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

    // Fetch Current Admins
    const { data: currentAdmins = [], isLoading: loadingAdmins } = useQuery({
        queryKey: ['adminManagementAdmins'],
        queryFn: async () => {
            const res = await adminAPI.getAdmins();
            return res.data.data;
        }
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

    // Assign Admin Mutation
    const assignMutation = useMutation({
        mutationFn: (data) => adminAPI.assignAdminRole(data),
        onSuccess: (res) => {
            toast.success(res.data.message || 'Successfully assigned admin privileges.');
            queryClient.invalidateQueries(['adminManagementAdmins']);
            setSearchEmail('');
            setEmailToSearch('');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to assign admin role');
        }
    });

    // Revoke Admin
    const revokeMutation = useMutation({
        mutationFn: (userId) => adminAPI.revokeAdminRole(userId),
        onSuccess: () => {
            toast.success('Successfully revoked admin privileges.');
            queryClient.invalidateQueries(['adminManagementAdmins']);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to revoke admin privileges');
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
        if (!selectedRole) {
            toast.error('Please select an Administrator Role first.');
            return;
        }

        if (selectedRole === 'campus_admin' && !selectedCampus) {
            toast.error('Campus is required for Campus Admins.');
            return;
        }

        if (selectedRole === 'department_admin' && (!selectedCampus || !selectedDepartment)) {
            toast.error('Both Campus and Department are required for Department Admins.');
            return;
        }

        if (!previewUser) {
            toast.error('No user found to assign.');
            return;
        }

        assignMutation.mutate({
            email: previewUser.email,
            adminRole: selectedRole,
            campus: selectedCampus || null,
            department: selectedDepartment || null
        });
    };

    const countSuperAdmins = currentAdmins.filter(a => a.adminRole === 'super_admin' || (!a.adminRole && a.isAdmin)).length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <Link to="/admin" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors mb-6">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
            </Link>

            <div className="mb-8 border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">System <span className="text-red-600">Administrators</span></h1>
                <p className="mt-2 text-sm text-gray-500 font-medium">Manage top-level administrators across the platform architecture.</p>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Left Side: Assignment Engine */}
                <div className="flex-1 space-y-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center justify-between">
                            1. Select Administrator Scope
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Administrative Role</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => {
                                        setSelectedRole(e.target.value);
                                        // Reset child selections if moving to a higher scope
                                        if (e.target.value === 'super_admin') {
                                            setSelectedCampus('');
                                            setSelectedDepartment('');
                                        } else if (e.target.value === 'campus_admin') {
                                            setSelectedDepartment('');
                                        }
                                    }}
                                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-red-500 focus:border-red-500 p-3 outline-none transition-colors"
                                >
                                    <option value="">Select an Admin Role Scope...</option>
                                    <option value="super_admin">Super Admin (Max 3, Platform-Wide)</option>
                                    <option value="campus_admin">Campus Admin (Restricted to specific Campus)</option>
                                    <option value="department_admin">Department Admin (Restricted to specific Campus & Department)</option>
                                </select>
                            </div>

                            {['super_admin', 'campus_admin', 'department_admin'].includes(selectedRole) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                    <div className={`${selectedRole === 'super_admin' ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Assigned Campus</label>
                                        <select
                                            value={selectedCampus}
                                            onChange={(e) => setSelectedCampus(e.target.value)}
                                            disabled={selectedRole === 'super_admin'}
                                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-red-500 focus:border-red-500 p-2.5 outline-none transition-colors"
                                        >
                                            <option value="">{selectedRole === 'super_admin' ? 'All Campuses' : 'Select Campus'}</option>
                                            {campuses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className={`${['super_admin', 'campus_admin'].includes(selectedRole) ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Assigned Department</label>
                                        <select
                                            value={selectedDepartment}
                                            onChange={(e) => setSelectedDepartment(e.target.value)}
                                            disabled={['super_admin', 'campus_admin'].includes(selectedRole)}
                                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-red-500 focus:border-red-500 p-2.5 outline-none transition-colors"
                                        >
                                            <option value="">{['super_admin', 'campus_admin'].includes(selectedRole) ? 'All Departments' : 'Select Department'}</option>
                                            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search and Attach */}
                    <div className={`bg-white rounded-2xl shadow-sm border p-6 transition-all duration-300 ${!selectedRole ? 'opacity-50 pointer-events-none border-gray-200' : 'border-red-200 shadow-md ring-1 ring-red-50'}`}>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center justify-between">
                            <span>2. Locate Target User</span>
                            {!selectedRole && <span className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">Locked</span>}
                        </h2>

                        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                            <input
                                type="email"
                                placeholder="Enter administrator candidate's email..."
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
                                {searchingEmail ? 'Querying...' : 'Verify Email'}
                            </button>
                        </form>

                        {previewIsError && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span className="text-sm font-medium">{previewError?.response?.data?.message || 'User not found.'}</span>
                            </div>
                        )}

                        {previewUser && !searchingEmail && !previewIsError && (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4 animate-fade-in shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    {previewUser.profilePicture ? (
                                        <img src={getImageUrl(previewUser.profilePicture)} alt={previewUser.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-200" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-black text-2xl border-2 border-white">
                                            {previewUser.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{previewUser.name}</h3>
                                        <p className="text-sm text-gray-600 font-medium">{previewUser.email}</p>
                                    </div>
                                </div>

                                <div className="border-t border-blue-200/50 pt-4 flex justify-end">
                                    <button
                                        onClick={handleAssign}
                                        disabled={assignMutation.isPending || (selectedRole === 'super_admin' && countSuperAdmins >= 3 && !previewUser.isAdmin)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                                    >
                                        {assignMutation.isPending ? 'Propagating Credentials...' : 'Grant Administration Axis'}
                                    </button>
                                </div>
                                {selectedRole === 'super_admin' && countSuperAdmins >= 3 && !previewUser.isAdmin && (
                                    <p className="text-red-500 text-xs font-bold mt-2 text-right">Max 3 Super Admins reached.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Existing Admins */}
                <div className="xl:w-[450px]">
                    <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
                            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                Active Architects
                            </h2>
                            <span className="text-xs font-bold text-gray-400 bg-gray-800 px-3 py-1 rounded-full uppercase tracking-widest">{currentAdmins.length} Total</span>
                        </div>

                        {loadingAdmins ? (
                            <div className="flex-1 flex items-center justify-center p-6"><Loader /></div>
                        ) : currentAdmins.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center text-center p-6 text-gray-500">
                                No Administrators found.
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                                {currentAdmins.map((admin) => {
                                    const isMe = admin._id.toString() === user?._id?.toString() || admin.id === user?.id;
                                    let roleLabel = 'Super Admin';
                                    let roleColor = 'text-red-400';
                                    let detailLabel = 'Full Platform Access';

                                    if (admin.adminRole === 'campus_admin') {
                                        roleLabel = 'Campus Admin';
                                        roleColor = 'text-blue-400';
                                        detailLabel = admin.campus?.name || 'Unknown Campus';
                                    } else if (admin.adminRole === 'department_admin') {
                                        roleLabel = 'Department Admin';
                                        roleColor = 'text-purple-400';
                                        detailLabel = `${admin.department?.code || '?'} @ ${admin.campus?.code || '?'}`;
                                    }

                                    return (
                                        <div key={admin._id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col gap-3 relative">
                                            {isMe && <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg rounded-tr-lg tracking-widest">You</div>}

                                            <div className="flex items-center gap-3">
                                                {admin.profilePicture ? (
                                                    <img src={getImageUrl(admin.profilePicture)} alt={admin.name} className={`w-12 h-12 rounded-full object-cover border-2 border-gray-700`} />
                                                ) : (
                                                    <div className={`w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-black text-xl border-2 border-gray-600`}>
                                                        {admin.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-white font-bold text-sm tracking-wide">{admin.name}</h4>
                                                    <p className="text-gray-400 text-xs font-mono">{admin.email}</p>
                                                    <div className="flex flex-col mt-1 gap-0.5">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${roleColor}`}>{roleLabel}</span>
                                                        <span className="text-[10px] text-gray-500 font-medium truncate w-40">{detailLabel}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {!isMe && (
                                                <button
                                                    onClick={() => window.confirm(`Revoke admin privileges for ${admin.name}?`) && revokeMutation.mutate(admin._id)}
                                                    disabled={revokeMutation.isPending}
                                                    className="mt-2 w-full py-2 bg-gray-700/50 hover:bg-red-600/20 text-gray-400 hover:text-red-400 border border-transparent hover:border-red-600/30 text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95"
                                                >
                                                    {revokeMutation.isPending ? 'Revoking...' : 'Revoke Privileges'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAdmins;
