import Loader from '../../components/common/Loader';
import React from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';

const AdminDashboard = () => {
 const { data, isLoading: loading } = useQuery({
 queryKey: ['adminStats'],
 queryFn: async () => {
 const response = await adminAPI.getStats();
 return response.data.data;
 },
 });

 const stats = data || {};
 const pendingCounts = data?.pendingCounts || {};

 if (loading && !data) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-white">
 <Loader />
 </div>
 );
 }

 const statCards = [
 { label: 'Total Users', value: stats?.users || 0, icon: 'users', color: 'bg-blue-600' },
 { label: 'Total Questions', value: stats?.questions || 0, icon: 'chat', color: 'bg-red-600' },
 { label: 'Total Courses', value: stats?.courses || 0, icon: 'book', color: 'bg-amber-500' },
 { label: 'Total Semesters', value: stats?.semesters || 0, icon: 'calendar', color: 'bg-emerald-500' },
 { label: 'Total Departments', value: stats?.departments || 0, icon: 'office', color: 'bg-purple-600' },
 { label: 'Total Campuses', value: stats?.campuses || 0, icon: 'location', color: 'bg-gray-900' },
 ];

 const getIcon = (name) => {
 switch (name) {
 case 'users': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354l1.108 2.246 2.477.359-1.791 1.747.423 2.467L12 9.92l-2.217 1.153.423-2.467-1.791-1.747 2.477-.359L12 4.354z" />;
 case 'chat': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />;
 case 'book': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />;
 case 'calendar': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
 case 'office': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />;
 case 'location': return (
 <>
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
 </>
 );
 default: return null;
 }
 };

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
 {/* Header Section */}
 <div className="mb-16 animate-fade-in text-center lg:text-left">
 <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight uppercase leading-none">
 Admin <span className="text-red-600 italic">Dashboard</span>
 </h1>
 <p className="text-gray-500 font-medium max-w-xl">
 Manage users, courses, and materials across the entire platform.
 </p>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-16">
 {statCards.map((card, idx) => (
 <div
 key={card.label}
 className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500 transform hover:-translate-y-2 animate-slide-up"
 style={{ animationDelay: `${idx * 0.05}s` }}
 >
 <div className={`w-12 h-12 rounded-2xl ${card.color} text-white flex items-center justify-center mb-6 shadow-xl group-hover:rotate-12 transition-transform duration-500`}>
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 {getIcon(card.icon)}
 </svg>
 </div>
 <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">{card.label}</div>
 <div className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter">
 {card.value}
 </div>
 </div>
 ))}
 </div>

 {/* Primary Operation Banner */}
 <div className="relative group overflow-hidden bg-gray-900 rounded-[2.5rem] p-12 mb-16 animate-fade-in border border-gray-800 shadow-3xl shadow-gray-900/20">
 <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 -mr-40 -mt-40 rounded-full blur-[100px] pointer-events-none"></div>
 <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-600/5 -ml-20 -mb-20 rounded-full blur-[80px] pointer-events-none"></div>

 <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 text-center lg:text-left">
 <div className="max-w-2xl">
 <div className="flex items-center gap-4 mb-8 justify-center lg:justify-start">
 <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-600/40">
 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
 </svg>
 </div>
 <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] font-mono animate-pulse">Administrative Action</span>
 </div>

 <h2 className="text-3xl lg:text-5xl font-black text-white mb-6 uppercase tracking-tight leading-none">
 Semester <span className="text-red-500">Update</span>
 </h2>
 <p className="text-gray-400 font-medium text-lg leading-relaxed italic">
 Promote students to the next semester. This will update all student records to their next academic level.
 </p>
 </div>

 <Link
 to="/admin/end-season"
 className="group/btn relative inline-flex items-center justify-center px-12 py-6 font-black text-white bg-red-600 rounded-3xl overflow-hidden shadow-2xl shadow-red-600/30 hover:shadow-red-600/60 transition-all hover:scale-105 active:scale-95"
 >
 <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-700 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
 <span className="relative z-10 flex items-center gap-3 uppercase tracking-widest text-xs">
 Update Semester
 <svg className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
 </svg>
 </span>
 </Link>
 </div>
 </div>

 {/* Control Nodes */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {[
 { to: '/admin/management', title: 'System Administrators', desc: 'Manage platform architecture roles (Super, Campus, Department).', countKey: null },
 { to: '/admin/users', title: 'User Management', desc: 'Review student accounts, roles, and permissions.', countKey: 'newUsers', countLabel: 'New' },
 { to: '/admin/notes', title: 'Study Notes', desc: 'Review, approve, or delete study notes shared by students.', countKey: 'pendingNotes', countLabel: 'Pending' },
 { to: '/admin/pass-tests', title: 'Past Papers', desc: 'Manage previous exam papers, tests, and assignments.', countKey: 'pendingPassTests', countLabel: 'Pending' },
 { to: '/admin/communities', title: 'Communities', desc: 'Manage student discussion groups and communities.', countKey: 'inactiveCommunities', countLabel: 'New' },
 { to: '/admin/class-reps', title: 'Reps Management', desc: 'Assign class representatives for specific semesters and sections.' },
 { to: '/admin/courses', title: 'Courses', desc: 'Add or modify courses and academic programs.' },
 { to: '/admin/departments', title: 'Departments', desc: 'Manage academic departments and faculty divisions.' },
 { to: '/admin/campuses', title: 'Campuses', desc: 'Manage physical and virtual campus locations.' },
 { to: '/admin/semesters', title: 'Semesters', desc: 'Manage academic semesters and timeframes.' },
 { to: '/admin/topics', title: 'Topics', desc: 'Manage forum categories and discussion topics.' },
 { to: '/admin/onboarding-feedback', title: 'Feedback', desc: 'View and analyze feedback from students.' },
 { to: '/admin/campus-hub/applications', title: 'Campus Hub · Applications', desc: 'Approve or reject provider applications.', countKey: 'pendingProviderApplications', countLabel: 'Pending' },
 { to: '/admin/campus-hub/services', title: 'Campus Hub · Services', desc: 'Monitor all Campus Hub services.' },
 { to: '/admin/campus-hub/orders', title: 'Campus Hub · Orders', desc: 'Monitor all service orders.' },
 { to: '/admin/campus-hub/chats', title: 'Campus Hub · Chats', desc: 'Monitor order chats between students and providers.' },
 ].map((item, idx) => (
 <Link
 key={item.to}
 to={item.to}
 className="group relative bg-white p-10 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/20 hover:shadow-3xl hover:shadow-red-600/10 transition-all duration-500 transform hover:-translate-y-2 animate-slide-up"
 style={{ animationDelay: `${(idx + 6) * 0.05}s` }}
 >
 <div className="flex items-start justify-between mb-8">
 <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-red-50 group-hover:rotate-6 transition-all duration-500">
 <svg className="w-7 h-7 text-gray-300 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
 </svg>
 </div>
 {item.countKey && pendingCounts?.[item.countKey] > 0 && (
 <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg animate-bounce">
 <span className="text-[10px] font-black uppercase tracking-widest leading-none">
 {pendingCounts[item.countKey]} {item.countLabel}
 </span>
 </div>
 )}
 </div>

 <h3 className="text-2xl font-black text-gray-900 group-hover:text-red-600 transition-colors mb-3 uppercase tracking-tight">{item.title}</h3>
 <p className="text-gray-400 font-medium italic mb-10 leading-relaxed text-sm">{item.desc}</p>

 <div className="flex items-center text-[10px] font-black text-gray-300 group-hover:text-red-500 uppercase tracking-[0.2em] transition-all">
 Open Management
 <svg className="w-4 h-4 ml-3 group-hover:translate-x-3 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
 </svg>
 </div>
 </Link>
 ))}
 </div>
 </div>
 );
};

export default AdminDashboard;
