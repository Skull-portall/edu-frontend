import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AdminDepartments = () => {
 const queryClient = useQueryClient();
 const [formData, setFormData] = useState({ name: '', code: '', description: '' });
 const [editingId, setEditingId] = useState(null);
 const [editFormData, setEditFormData] = useState({ name: '', code: '', description: '' });

 // Fetch Departments
 const { data: departmentsData, isLoading: loading } = useQuery({
 queryKey: ['adminDepartments'],
 queryFn: async () => {
 const response = await adminAPI.getDepartments();
 return response.data;
 },
 onError: () => toast.error('Failed to load departments')
 });

 const departments = departmentsData?.data || [];

 // Mutations
 const createMutation = useMutation({
 mutationFn: (newDepartment) => adminAPI.createDepartment(newDepartment),
 onSuccess: () => {
 toast.success('Department created successfully!');
 setFormData({ name: '', code: '', description: '' });
 queryClient.invalidateQueries(['adminDepartments']);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to create department')
 });

 const updateMutation = useMutation({
 mutationFn: ({ id, data }) => adminAPI.updateDepartment(id, data),
 onSuccess: () => {
 toast.success('Department updated successfully!');
 setEditingId(null);
 setEditFormData({ name: '', code: '', description: '' });
 queryClient.invalidateQueries(['adminDepartments']);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to update department')
 });

 const deleteMutation = useMutation({
 mutationFn: (id) => adminAPI.deleteDepartment(id),
 onSuccess: () => {
 toast.success('Department deleted successfully!');
 queryClient.invalidateQueries(['adminDepartments']);
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete department')
 });

 const handleSubmit = (e) => {
 e.preventDefault();
 createMutation.mutate(formData);
 };

 const handleEdit = (department) => {
 setEditingId(department._id);
 setEditFormData({
 name: department.name || '',
 code: department.code || '',
 description: department.description || ''
 });
 };

 const handleCancelEdit = () => {
 setEditingId(null);
 setEditFormData({ name: '', code: '', description: '' });
 };

 const handleUpdate = (deptId) => {
 updateMutation.mutate({ id: deptId, data: editFormData });
 };

 const handleDelete = (deptId) => {
 if (window.confirm('Are you sure you want to delete this department? This action cannot be undone!')) {
 deleteMutation.mutate(deptId);
 }
 };

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8">
 {/* Header Section */}
 <div className="mb-6 lg:mb-8">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Manage Departments</h1>
 <p className="text-sm sm:text-base text-gray-600">Add, edit, or remove departments</p>
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

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Add Department Form */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Department</h2>
 <form onSubmit={handleSubmit}>
 <div className="mb-4">
 <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">Department Code</label>
 <input
 type="text"
 id="code"
 name="code"
 value={formData.code}
 onChange={(e) => setFormData({ ...formData, code: e.target.value })}
 required
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
 placeholder="e.g., CSC, MTH, PHY"
 />
 </div>
 <div className="mb-4">
 <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
 <input
 type="text"
 id="name"
 name="name"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 required
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
 placeholder="e.g., Computer Science"
 />
 </div>
 <div className="mb-4">
 <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
 <textarea
 id="description"
 name="description"
 rows="3"
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
 ></textarea>
 </div>
 <button
 type="submit"
 disabled={createMutation.isPending}
 className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
 >
 {createMutation.isPending ? (
 <>
 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 Loading...
 </>
 ) : (
 'Add Department'
 )}
 </button>
 </form>
 </div>

 {/* Departments List */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Departments</h2>
 {loading ? (
 <Loader />
 ) : departments.length === 0 ? (
 <p className="text-gray-500">No departments yet. Add one to get started!</p>
 ) : (
 <div className="space-y-3">
 {departments.map((department) => (
 <div key={department._id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md">
 {editingId === department._id ? (
 <form onSubmit={(e) => { e.preventDefault(); handleUpdate(department._id); }}>
 <div className="space-y-3">
 <div>
 <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
 <input
 type="text"
 value={editFormData.code}
 onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
 required
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
 />
 </div>
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
 <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
 <textarea
 value={editFormData.description}
 onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
 rows="2"
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
 />
 </div>
 <div className="flex gap-2">
 <button
 type="submit"
 disabled={updateMutation.isPending}
 className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
 >
 {updateMutation.isPending ? (
 <span className="flex items-center justify-center gap-2">
 <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 Loading...
 </span>
 ) : (
 'Save'
 )}
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
 <h3 className="font-semibold text-gray-900">{department.code}</h3>
 <p className="text-sm text-gray-600">{department.name}</p>
 {department.description && (
 <p className="text-xs text-gray-500 mt-1">{department.description.substring(0, 100)}{department.description.length > 100 ? '...' : ''}</p>
 )}
 <p className="text-xs text-gray-400 mt-2">{department.usersCount || 0} students</p>
 </div>
 <div className="flex items-center space-x-2 ml-4">
 <button
 onClick={() => handleEdit(department)}
 className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-blue-200"
 >
 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
 </svg>
 Edit
 </button>
 <button
 onClick={() => handleDelete(department._id)}
 disabled={deleteMutation.isPending}
 className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 hover:text-red-800 transition-all duration-200 text-sm font-medium transform hover:scale-105 hover:shadow-sm border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {deleteMutation.isPending ? (
 <>
 <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 Loading...
 </>
 ) : (
 <>
 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
 </svg>
 Delete
 </>
 )}
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

export default AdminDepartments;

