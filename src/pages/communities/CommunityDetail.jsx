import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { communitiesAPI } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'helpful', emoji: '💡', label: 'Helpful' },
  { type: 'insightful', emoji: '🧠', label: 'Insight' },
];

const CommunityDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('Update');
  const [quickTakeaway, setQuickTakeaway] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostTarget, setRepostTarget] = useState(null);
  const [repostContent, setRepostContent] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const { data: communityData, isLoading } = useQuery({
    queryKey: ['community', id],
    queryFn: async () => {
      const response = await communitiesAPI.getById(id);
      return response.data;
    },
    onError: () => toast.error('Failed to load community')
  });

  const { data: approvedNotes, isLoading: loadingNotes } = useQuery({
    queryKey: ['approvedNotes', noteSearch],
    queryFn: async () => {
      const response = await api.get('/notes', { params: { isApproved: true, search: noteSearch } });
      return response.data.data || [];
    },
    enabled: showPinModal
  });

  const community = communityData?.data;
  const posts = communityData?.data?.posts || [];

  const createPostMutation = useMutation({
    mutationFn: (newPost) => communitiesAPI.createPost(id, newPost),
    onSuccess: () => {
      queryClient.invalidateQueries(['community', id]);
      setPostContent('');
      setQuickTakeaway('');
      setPostType('Update');
      setReplyTo(null);
      toast.success(replyTo ? 'Reply sent!' : 'Post shared!', {
        position: 'top-right',
        icon: replyTo ? '💬' : '📡'
      });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to post message')
  });

  const repostMutation = useMutation({
    mutationFn: ({ postId, content }) => communitiesAPI.repostPost(id, postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['community', id]);
      setShowRepostModal(false);
      setRepostTarget(null);
      setRepostContent('');
      toast.success('Reposted to community!', { icon: '🔄' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to repost')
  });

  const pinResourceMutation = useMutation({
    mutationFn: (resourceId) => communitiesAPI.pinResource(id, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['community', id]);
      toast.success('Resource pinned to the hub!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to pin resource')
  });

  const unpinResourceMutation = useMutation({
    mutationFn: (resourceId) => communitiesAPI.unpinResource(id, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['community', id]);
      toast.success('Resource unpinned');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to unpin resource')
  });

  const reactMutation = useMutation({
    mutationFn: ({ postId, type }) => communitiesAPI.reactToPost(id, postId, type),
    onSuccess: () => {
      queryClient.invalidateQueries(['community', id]);
    }
  });

  const joinMutation = useMutation({
    mutationFn: () => communitiesAPI.joinCommunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['community', id]);
      toast.success('Joined the community!', { icon: '👋' });
    }
  });

  const leaveMutation = useMutation({
    mutationFn: () => communitiesAPI.leaveCommunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['community', id]);
      toast.success('Successfully disconnected', { icon: '📡' });
    }
  });

  const isMember = community?.members?.includes(user?._id || user?.id);

  const handleToggleJoin = () => {
    if (!user) return toast.error('Login to join this community');
    if (isMember) {
      if (window.confirm('Are you sure you want to leave this community?')) {
        leaveMutation.mutate();
      }
    } else {
      joinMutation.mutate();
    }
  };

  const handleSubmitPost = (e) => {
    e.preventDefault();
    if (!isMember && community?.user?._id !== user?.id) {
       return toast.error('Join the community to broadcast updates');
    }
    if (!postContent.trim()) return;
    createPostMutation.mutate({ 
      content: postContent,
      postType,
      quickTakeaway: postType === 'Question' || postType === 'Note-Hub' ? quickTakeaway : undefined,
      parentPost: replyTo?._id
    });
  };

  const handleToggleReaction = (postId, type) => {
    if (!user) return toast.error('Please login to react');
    if (!isMember) return toast.error('Join the community to interact with posts');
    reactMutation.mutate({ postId, type });
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/communities/${id}`; // Simplified link to community
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!', { position: 'bottom-center' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 text-center shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Community Not Found</h2>
          <p className="text-gray-500 mb-10 font-medium italic leading-relaxed">"This academic space has dissolved back into the void."</p>
          <Link to="/communities" className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-900/20">
            Return to Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/communities" className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">
                    {community.category || 'General'}
                  </span>
                  <span className="text-gray-400 text-sm">{posts.length} Posts</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-2 mr-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                    ?
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-900 flex items-center justify-center text-[10px] text-white font-bold">
                  +{community.members_count || 0}
                </div>
              </div>
              <button 
                onClick={handleToggleJoin}
                disabled={joinMutation.isPending || leaveMutation.isPending}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  isMember 
                  ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600' 
                  : 'bg-red-600 text-white shadow-md hover:shadow-lg'
                }`}>
                  {isMember ? 'Joined' : 'Join Community'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-6">
            {/* About Box */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">About this Community</h3>
              <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                {community.description || 'Welcome to our community! Join the discussion and collaborate with peers to achieve our learning goals together.'}
              </p>
            </div>

            {/* Composer */}
            {/* Composer */}
            {user && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
                <div className="flex gap-4">
                  {[
                    { val: 'Update', label: 'Update' }, 
                    { val: 'Question', label: 'Question' }, 
                    { val: 'Note-Hub', label: 'Resource Share' }
                  ].map((type) => (
                    <button
                      key={type.val}
                      type="button"
                      onClick={() => setPostType(type.val)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        postType === type.val 
                        ? 'bg-red-600 text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmitPost} className="space-y-4">
                  {replyTo && (
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        Replying to <span className="text-red-600">@{replyTo.user?.name}</span>
                      </p>
                      <button 
                        type="button" 
                        onClick={() => setReplyTo(null)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  )}
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none text-sm"
                    placeholder={replyTo ? "Write your reply..." : postType === 'Question' ? "Ask a question to the community..." : "Share an update with members..."}
                  />

                  {(postType === 'Question' || postType === 'Note-Hub') && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <label className="block text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">Quick Takeaway / TL;DR</label>
                      <input
                        type="text"
                        value={quickTakeaway}
                        onChange={(e) => setQuickTakeaway(e.target.value)}
                        className="w-full bg-white border border-red-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500"
                        placeholder="Summarize the core insight..."
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 text-gray-400">
                       {/* Placeholder for future attachments */}
                    </div>
                    <button
                      type="submit"
                      disabled={createPostMutation.isPending || !postContent.trim()}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:shadow-md transition-all disabled:opacity-50 text-sm"
                    >
                      {createPostMutation.isPending ? 'Sending...' : replyTo ? 'Reply' : 'Post Update'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Feed */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 italic">No updates available yet.</p>
                </div>
              ) : (
                posts
                  .filter(post => !post.parentPost) // Only main posts in main feed
                  .map((post) => (
                  <article key={post._id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm transition-all hover:shadow-md">
                    {/* Repost Header */}
                    {post.originalPost && (
                      <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.293.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66-4.01H7.26V1.42c0-.293-.237-.53-.53-.53-.293 0-.53.237-.53.53v10.74c0 .293.237.53.53.53h6.38c.293 0 .53-.237.53-.53 0-.293-.238-.53-.53-.53zM.23 8.33c.293.293.768.293 1.06 0l2.22-2.22V16.35c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.336-.75-.75-.75H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.11l2.22 2.22c.293.293.768.293 1.06 0s.293-.768 0-1.06l-3.5-3.5c-.145-.147-.337-.22-.53-.22s-.383.072-.53.22l-3.5 3.5c-.294.292-.294.767 0 1.06z"/></svg>
                        {post.user?.name} reposted
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                          {post.user?.profilePicture ? (
                            <img src={post.user.profilePicture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-red-600 flex items-center justify-center text-white text-xs font-bold uppercase">
                              {post.user?.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <Link to={`/profile/${post.user?._id || post.user?.id}`} className="block text-sm font-bold text-gray-900 hover:text-red-600 transition-colors">
                            {post.user?.name}
                          </Link>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {post.isPinned && (
                        <div className="text-red-600">
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05l-3.293 3.293a1 1 0 01-1.414 0l-3.293-3.293a1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z"/></svg>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Original Post Content if it's a quote/repost */}
                      {post.originalPost && (
                        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-4 pointer-events-none opacity-80 scale-95 origin-left">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center text-[8px] font-bold text-red-600 uppercase">
                                 {post.originalPost.user?.name?.charAt(0)}
                              </div>
                              <span className="text-[10px] font-bold text-gray-900">{post.originalPost.user?.name}</span>
                           </div>
                           <p className="text-xs text-gray-600 line-clamp-3">{post.originalPost.content}</p>
                        </div>
                      )}

                      <p className="text-gray-700 leading-relaxed text-sm">
                        {post.content}
                      </p>

                      {post.quickTakeaway && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                           <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>
                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Key Takeaway</span>
                           </div>
                           <p className="text-sm text-amber-900 italic">{post.quickTakeaway}</p>
                        </div>
                      )}

                      {post.attachment && (
                        <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-red-600 shadow-sm border border-gray-100">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                              </div>
                              <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{post.attachmentName || 'Attachment'}</span>
                           </div>
                           <a href={`/api/${post.attachment}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-red-600 hover:underline">Download</a>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-6">
                           {/* Reply */}
                           <button 
                             onClick={() => {
                               setReplyTo(post);
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                             }}
                             className="flex items-center gap-2 text-gray-400 hover:text-red-600 transition-colors group"
                            >
                              <div className="p-2 rounded-full group-hover:bg-red-50 transition-all">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                              </div>
                              <span className="text-xs font-medium">{post.replies?.length || 0}</span>
                           </button>

                           {/* Repost */}
                           <button 
                             onClick={() => {
                               setRepostTarget(post);
                               setShowRepostModal(true);
                             }}
                             className="flex items-center gap-2 text-gray-400 hover:text-emerald-600 transition-colors group"
                            >
                              <div className="p-2 rounded-full group-hover:bg-emerald-50 transition-all">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                              </div>
                              <span className="text-xs font-medium">{post.repost_count || 0}</span>
                           </button>

                           {/* Like */}
                           <button 
                             onClick={() => handleToggleReaction(post._id, 'like')}
                             className={`flex items-center gap-2 transition-colors group ${post.reactions?.some(r => r.user === user?._id && r.type === 'like') ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                            >
                              <div className={`p-2 rounded-full transition-all ${post.reactions?.some(r => r.user === user?._id && r.type === 'like') ? 'bg-red-50' : 'group-hover:bg-red-50'}`}>
                                 <svg className={`w-5 h-5 ${post.reactions?.some(r => r.user === user?._id && r.type === 'like') ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                              </div>
                              <span className="text-xs font-medium">{post.reactions?.filter(r => r.type === 'like').length || 0}</span>
                           </button>
                        </div>

                        {/* Share */}
                        <button 
                          onClick={() => handleShare(post._id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-2.684 3 3 0 000 2.684zm0 12.684a3 3 0 100-2.684 3 3 0 000 2.684z"/></svg>
                        </button>
                      </div>

                      {/* Thread Replies (Nested) */}
                      {post.replies && post.replies.length > 0 && (
                        <div className="mt-4 ml-12 space-y-4 border-l-2 border-gray-100 pl-4">
                           {post.replies.map(reply => (
                             <div key={reply._id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                   {reply.user?.profilePicture ? (
                                     <img src={reply.user.profilePicture} alt="" className="w-full h-full object-cover" />
                                   ) : (
                                     <div className="w-full h-full bg-red-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                       {reply.user?.name?.charAt(0)}
                                     </div>
                                   )}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-gray-900">{reply.user?.name}</span>
                                      <span className="text-[10px] text-gray-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                   </div>
                                   <p className="text-xs text-gray-600 leading-relaxed">{reply.content}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  </article>
                )))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-10">
             {/* Creator Box */}
             <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Community Creator</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    {community.user?.profilePicture ? (
                      <img src={community.user.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-red-600 flex items-center justify-center text-white text-xl font-bold uppercase">
                        {community.user?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <Link to={`/profile/${community.user?._id || community.user?.id}`} className="text-lg font-bold text-gray-900 shadow-sm hover:text-red-600 transition-colors">
                      {community.user?.name || 'Creator'}
                    </Link>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Community Admin</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Members</span>
                    <span className="block text-xl font-bold text-gray-900">{community.members_count || 0}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Posts</span>
                    <span className="block text-xl font-bold text-gray-900">{posts.length}</span>
                  </div>
                </div>
             </div>

             {/* Metadata */}
             <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Information</h3>
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Category</span>
                      <span className="font-bold text-gray-900">{community.category || 'General'}</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className="font-bold text-emerald-600">Active</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Privacy</span>
                      <span className="font-bold text-gray-900">Public</span>
                   </div>
                </div>
            </div>

             {/* Pinned Resources Sidebar */}
             <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pinned Resources</h3>
                   {community.user?._id === user?._id && (
                     <button 
                       onClick={() => setShowPinModal(true)}
                       className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                     </button>
                   )}
                </div>
                {community.pinnedResources && community.pinnedResources.length > 0 ? (
                   <div className="space-y-3">
                      {community.pinnedResources.map((res, i) => (
                         <div key={i} className="group p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all relative">
                            <div className="flex items-start gap-3">
                               <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-red-600 shadow-sm border border-gray-100">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                               </div>
                               <div className="flex-1 min-w-0">
                                  <span className="block text-xs font-bold text-gray-900 truncate">{res.resourceId?.title || 'Resource'}</span>
                                  <span className="block text-[10px] text-gray-500 mt-1">By {res.pinnedBy?.name || 'Admin'}</span>
                               </div>
                               {community.user?._id === user?._id && (
                                 <button 
                                   onClick={() => unpinResourceMutation.mutate(res.resourceId?._id)}
                                   className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full text-gray-300 hover:text-red-600 shadow-sm border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                 >
                                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                 </button>
                               )}
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                   <p className="text-xs text-gray-400 italic text-center py-4">No pinned resources yet.</p>
                )}
             </div>

            {/* Selection Modal */}
            {showPinModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowPinModal(false)}></div>
                <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                   <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                         <div>
                            <h3 className="text-xl font-bold text-gray-900">Pin Resource</h3>
                            <p className="text-xs text-gray-500 mt-1">Select an approved resource to pin at the top.</p>
                         </div>
                         <button onClick={() => setShowPinModal(false)} className="p-2 text-gray-400 hover:text-red-600 transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                         </button>
                      </div>

                      <div className="relative mb-6">
                        <input
                          type="text"
                          value={noteSearch}
                          onChange={(e) => setNoteSearch(e.target.value)}
                          placeholder="Search resources..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-red-500 transition-all"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                      </div>

                      <div className="max-h-[350px] overflow-y-auto space-y-2">
                         {loadingNotes ? (
                           <div className="py-8 text-center text-sm text-gray-400 animate-pulse">Scanning resources...</div>
                         ) : approvedNotes?.length > 0 ? (
                           approvedNotes.map((note) => (
                             <div 
                               key={note._id}
                               onClick={() => {
                                 pinResourceMutation.mutate(note._id);
                                 setShowPinModal(false);
                               }}
                               className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-red-50 cursor-pointer border border-transparent hover:border-red-100 transition-all"
                             >
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-600 shadow-sm group-hover:shadow transition-all">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                   </div>
                                   <div>
                                      <span className="block text-sm font-bold text-gray-900 truncate max-w-[300px]">{note.title}</span>
                                      <span className="block text-[10px] text-gray-500 mt-0.5">{note.courseName} • {note.user?.name}</span>
                                   </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-300 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                             </div>
                           ))
                         ) : (
                           <div className="py-8 text-center">
                              <p className="text-sm text-gray-400 italic">No approved resources found.</p>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              </div>
            )}
            {/* Repost Modal */}
            {showRepostModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setShowRepostModal(false); setRepostTarget(null); }}></div>
                <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                   <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                         <h3 className="text-xl font-bold text-gray-900">Repost Update</h3>
                         <button onClick={() => { setShowRepostModal(false); setRepostTarget(null); }} className="p-2 text-gray-400 hover:text-red-600 transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                         </button>
                      </div>

                      {repostTarget && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center text-[8px] font-bold text-white uppercase">
                                 {repostTarget.user?.name?.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-gray-900">{repostTarget.user?.name}</span>
                           </div>
                           <p className="text-xs text-gray-600 line-clamp-2">{repostTarget.content}</p>
                        </div>
                      )}

                      <div className="space-y-4">
                         <textarea
                           value={repostContent}
                           onChange={(e) => setRepostContent(e.target.value)}
                           rows="3"
                           className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-500 transition-all resize-none"
                           placeholder="Add a comment (optional)..."
                         />
                         <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => { setShowRepostModal(false); setRepostTarget(null); }}
                              className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => repostMutation.mutate({ postId: repostTarget._id, content: repostContent })}
                              disabled={repostMutation.isPending}
                              className="bg-red-600 text-white px-8 py-2 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                            >
                              {repostMutation.isPending ? 'Reposting...' : 'Repost Now'}
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
