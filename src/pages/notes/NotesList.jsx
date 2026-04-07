import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { notesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const NotesList = () => {
 const { user } = useAuth();
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const [search, setSearch] = useState(searchParams.get('search') || '');

 // Fetch Notes
 const { data: notes = [], isLoading: loading } = useQuery({
 queryKey: ['notes', { search: searchParams.get('search') || '' }],
 queryFn: async () => {
 const params = {};
 const searchVal = searchParams.get('search');
 if (searchVal) params.search = searchVal;
 const response = await notesAPI.getAll(params);
 return response.data.data || [];
 },
 keepPreviousData: true,
 });

 const handleSearch = (e) => {
 e.preventDefault();
 const params = new URLSearchParams(searchParams);
 if (search) params.set('search', search);
 else params.delete('search');
 navigate(`/notes?${params.toString()}`);
 };

 if (loading && !notes.length) {
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
 Study <span className="text-red-600">Notes</span>
 </h1>
 <p className="text-gray-500 font-medium max-w-xl">
 Explore and share lecture notes, study guides, and learning materials from the community.
 </p>
 </div>

 <div className="shrink-0">
 {user ? (
 <Link
 to="/notes/create"
 className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:shadow-gray-900/30 transform hover:-translate-y-1 active:scale-95 transition-all text-sm"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
 </svg>
 Create Note
 </Link>
 ) : (
 <Link
 to="/login"
 className="inline-flex items-center gap-3 bg-gray-100 text-gray-500 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all text-sm"
 >
 Login to Share
 </Link>
 )}
 </div>
 </div>

 {/* Global Search Interface */}
 <div className="bg-white p-2 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col sm:flex-row gap-2 max-w-3xl">
 <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
 <svg className="absolute left-6 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
 </svg>
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search study notes, summaries, or lecture topics..."
 className="w-full bg-transparent border-none py-4 pl-16 pr-8 text-lg font-bold text-gray-900 placeholder-gray-400 focus:ring-0"
 />
 </form>
 <button
 onClick={handleSearch}
 className="px-6 py-2.5 bg-red-600 text-white rounded-[1.2rem] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95 text-[10px]"
 >
 Search Notes
 </button>
 </div>
 </div>

 <div className="animate-slide-up">
 {notes.length === 0 ? (
 <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 animate-fade-in">
 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
 </svg>
 </div>
 <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">No Notes Found</h3>
 <p className="text-gray-500 font-medium mb-10 max-w-sm mx-auto">No notes match your search. Try different keywords.</p>
 <button
 onClick={() => navigate('/notes')}
 className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 text-sm"
 >
 Clear Search
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
 {notes.map((note, index) => (
 <article
 key={note._id}
 onClick={() => navigate(`/notes/${note._id}`)}
 className="group bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer flex flex-col"
 >
 <div className="flex items-start justify-between mb-8">
 <span className="bg-red-50 text-red-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 italic shadow-sm transition-all group-hover:scale-105">
 Note
 </span>
 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
 <svg className="w-4 h-4 text-gray-300 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
 </svg>
 </div>
 </div>

 <h2 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-red-600 transition-colors uppercase tracking-tight line-clamp-2 leading-tight">
 {note.title}
 </h2>
 <p className="text-gray-500 font-medium line-clamp-3 leading-relaxed mb-10 italic flex-1">
 "{note.content?.replace(/<[^>]*>/g, '').substring(0, 150)}..."
 </p>

 <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-50 w-full mt-auto">
 <div className="flex items-center gap-2">
 <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg ring-2 ring-gray-100">
 {note.user?.profilePicture ? (
 <img src={note.user.profilePicture} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white text-[10px] font-black">
 {note.user?.name?.charAt(0) || 'U'}
 </div>
 )}
 </div>
 <div>
 <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Author</span>
 <span className="block text-xs font-black text-gray-900 uppercase truncate max-w-[120px]">{note.user?.name}</span>
 </div>
 </div>
 {note.courseName && (
 <div className=" ">
 <div className="bg-gray-950 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl group-hover:bg-red-600 transition-colors italic">
 {note.courseName}
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

export default NotesList;
