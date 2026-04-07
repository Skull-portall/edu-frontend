import React from 'react';
import { Link } from 'react-router-dom';
import { campusHubAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/common/Loader';

const AdminCampusHubChats = () => {
 const { data: chats = [], isLoading } = useQuery({
 queryKey: ['adminCampusHubChats'],
 queryFn: async () => {
 const res = await campusHubAPI.adminGetChats();
 return res.data.data || [];
 },
 });

 if (isLoading) return <Loader />;

 return (
 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 <div className="mb-8">
 <Link to="/admin" className="text-gray-600 hover:text-gray-900 text-sm font-medium mb-4 inline-block">← Admin</Link>
 <h1 className="text-2xl font-bold text-gray-900">Campus Hub Chats</h1>
 <p className="text-gray-600">Order-based chats between students and providers. Admin can view any chat from order detail.</p>
 </div>

 <div className="space-y-4">
 {chats.map((chat) => (
 <div key={chat._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
 <div>
 <p className="font-bold text-gray-900">{chat.service?.title}</p>
 <p className="text-sm text-gray-500">Student: {chat.student?.name} · Provider: {chat.provider?.name}</p>
 <p className="text-xs text-gray-400 mt-1">{chat.messageCount || 0} messages · {new Date(chat.updatedAt || chat.createdAt).toLocaleString()}</p>
 </div>
 <Link
 to={`/campus-hub/orders/${chat._id}/chat`}
 className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
 >
 View Chat
 </Link>
 </div>
 ))}
 </div>
 {chats.length === 0 && (
 <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No chats yet.</div>
 )}
 </div>
 );
};

export default AdminCampusHubChats;
