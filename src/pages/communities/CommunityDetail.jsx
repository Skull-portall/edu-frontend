import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { communitiesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const CommunityDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState('');

  const { data: communityData, isLoading } = useQuery({
    queryKey: ['community', id],
    queryFn: async () => {
      const response = await communitiesAPI.getById(id);
      return response.data;
    },
    onError: () => toast.error('Failed to load community')
  });

  const community = communityData?.data;
  const posts = communityData?.data?.posts || [];

  const createPostMutation = useMutation({
    mutationFn: (newPost) => communitiesAPI.createPost(id, newPost),
    onSuccess: () => {
      queryClient.invalidateQueries(['community', id]);
      setPostContent('');
      toast.success('Your message has been posted!', {
        position: 'top-center'
      });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to post message')
  });

  const handleSubmitPost = (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    createPostMutation.mutate({ content: postContent });
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Community Not Found</h2>
        <p className="text-gray-500 mb-8 font-medium italic">"This community no longer exists or has been removed."</p>
        <Link to="/communities" className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all">
          Back to Communities
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Hub Context */}
      <div className="mb-12 animate-fade-in">
        <Link to="/communities" className="inline-flex items-center gap-2 text-gray-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] mb-6 transition-colors font-mono">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Communities
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="bg-red-50 text-red-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 italic">
                Active Community
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest font-mono">
                {posts.length} Posts
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight uppercase tracking-tight break-words">
              {community.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
        {/* Moderator & Metadata */}
        <div className="lg:col-span-1 space-y-8 animate-slide-up">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Founder</h3>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-4 ring-gray-50 mb-4">
                {community.user?.profilePicture ? (
                  <img src={community.user.profilePicture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white text-2xl font-black uppercase">
                    {community.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <Link to={`/profile/${community.user?._id || community.user?.id}`} className="text-lg font-black text-gray-900 uppercase tracking-tight hover:text-red-600 transition-colors truncate max-w-[200px]">
                {community.user?.name || 'STUDENT'}
              </Link>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Established {new Date(community.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center text-white">
            <div className="text-3xl font-black mb-1">{community.members_count || 0}</div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Members</p>
          </div>
        </div>

        {/* Hub Feed */}
        <div className="lg:col-span-3 space-y-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">About</h3>
            <p className="text-xl font-medium text-gray-700 leading-relaxed italic border-l-4 border-red-600 pl-6 py-2">
              "{community.description || 'Dedicated space for focused academic collaboration and peer-to-peer knowledge transfer.'}"
            </p>
          </div>

          {/* Create Post */}
          {user && (
            <div className="bg-gray-50 rounded-3xl p-8 sm:p-10 border border-gray-100 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full"></div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">New Post</h3>
              <form onSubmit={handleSubmitPost} className="space-y-4">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows="4"
                  className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-5 text-gray-900 placeholder-gray-400 font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all italic leading-relaxed"
                  placeholder="Share resources, questions, or updates with the community..."
                />
                <button
                  type="submit"
                  disabled={createPostMutation.isPending || !postContent.trim()}
                  className="w-full sm:w-auto bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 shadow-xl text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {createPostMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    'Post Message'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-8 mt-12">
            <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Active <span className="text-red-600">Feed</span></h2>
            </div>

            {posts.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-mono uppercase tracking-widest text-xs italic">Be the first to post!</p>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post._id} className="group bg-white rounded-3xl p-8 border border-gray-50 shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xs font-black text-gray-400 border border-gray-100">
                        {post.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <Link to={`/profile/${post.user?._id || post.user?.id}`} className="block text-sm font-black text-gray-900 hover:text-red-600 transition-colors uppercase tracking-tight truncate max-w-[150px]">
                          {post.user?.name}
                        </Link>
                        <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest font-mono">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 font-medium leading-relaxed italic text-lg mb-6">
                    "{post.content}"
                  </p>

                  {post.attachment && (
                    <div className="pt-6 border-t border-gray-50">
                      <a
                        href={`/api/${post.attachment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline bg-blue-50 px-4 py-2 rounded-xl"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Shared Resource
                      </a>
                    </div>
                  )}
                </article>
              )))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
