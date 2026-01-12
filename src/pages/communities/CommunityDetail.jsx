import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { communitiesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CommunityDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCommunity();
  }, [id]);

  const fetchCommunity = async () => {
    try {
      const response = await communitiesAPI.getById(id);
      setCommunity(response.data.data);
      setPosts(response.data.data.posts || []);
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await communitiesAPI.createPost(id, { content: postContent });
      setPosts([response.data.data, ...posts]);
      setPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl font-semibold mb-4">Community not found</div>
        <Link to="/communities" className="text-red-600 hover:text-red-700 underline">
          Back to Communities
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">{community.name}</h1>
        <p className="text-gray-600 mb-4">{community.description || 'No description'}</p>
        {community.purpose && (
          <p className="text-sm text-gray-500">Purpose: {community.purpose}</p>
        )}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center text-white font-semibold">
            {community.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span>Created by {community.user?.name}</span>
        </div>
      </div>

      {user && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Post</h2>
          <form onSubmit={handleSubmitPost}>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all mb-4"
              placeholder="Write a post to share with the community..."
            />
            <button
              type="submit"
              disabled={submitting || !postContent.trim()}
              className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">Posts</h2>
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center text-white font-semibold text-sm">
                      {post.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <Link
                      to={`/profile/${post.user?._id || post.user?.id}`}
                      className="font-semibold text-gray-900 hover:text-red-600"
                    >
                      {post.user?.name}
                    </Link>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-gray-700">{post.content}</p>
                {post.attachment && (
                  <div className="mt-3">
                    <a
                      href={`http://localhost:5000/${post.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      📎 {post.attachmentName || 'Attachment'}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDetail;
