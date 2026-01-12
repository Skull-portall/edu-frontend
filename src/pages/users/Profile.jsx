import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI, questionsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    bio: '',
    status: 'available',
    password: '',
    currentPassword: '',
    passwordConfirmation: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewPicture, setPreviewPicture] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imageError, setImageError] = useState(false);

  const isOwnProfile = currentUser && (currentUser.id === id || currentUser._id === id);

  const getProfilePictureUrl = (picturePath) => {
    if (!picturePath) return null;
    if (picturePath.startsWith('http')) return picturePath;
    if (picturePath.startsWith('/uploads')) return picturePath;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const baseUrl = apiUrl.replace('/api/v1', '');
    // Backend stores path like 'uploads/profile_pictures/xxx.jpg'
    // Backend serves it at '/uploads/...'
    if (picturePath.startsWith('uploads/')) {
      return `${baseUrl}/${picturePath}`;
    }
    return `${baseUrl}/uploads/${picturePath}`;
  };

  useEffect(() => {
    fetchProfile();
    if (!isOwnProfile) {
      fetchRecentQuestions();
    }
    setImageError(false);
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = isOwnProfile 
        ? await usersAPI.getProfile()
        : await usersAPI.getById(id);
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          bio: userData.bio || '',
          status: userData.status || 'available',
          password: '',
          currentPassword: '',
          passwordConfirmation: ''
        });
        if (userData.profilePicture) {
          const picUrl = getProfilePictureUrl(userData.profilePicture);
          setPreviewPicture(picUrl);
        }
        setImageError(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentQuestions = async () => {
    try {
      const response = await questionsAPI.getAll({ user: id, limit: 5 });
      if (response.data.success) {
        setRecentQuestions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching recent questions:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage({ type: '', text: '' });
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('status', formData.status);
      
      if (profilePicture) {
        formDataToSend.append('profile_picture', profilePicture);
      }
      
      if (formData.password) {
        formDataToSend.append('password', formData.password);
        formDataToSend.append('currentPassword', formData.currentPassword);
      }
      
      const response = await usersAPI.updateProfile(formDataToSend);
      if (response.data.success) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        if (updatedUser.profilePicture) {
          setPreviewPicture(getProfilePictureUrl(updatedUser.profilePicture));
        }
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setProfilePicture(null);
        setImageError(false);
        setFormData({
          ...formData,
          password: '',
          currentPassword: '',
          passwordConfirmation: ''
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const errorObj = {};
        error.response.data.errors.forEach(err => {
          errorObj[err.path || err.field || err.param] = err.msg || err.message;
        });
        setErrors(errorObj);
      } else {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 'Failed to update profile' 
        });
      }
    }
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateMonthsActive = () => {
    if (!user?.createdAt) return 0;
    const now = new Date();
    const created = new Date(user.createdAt);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.round(diffDays / 30));
  };

  const profilePictureUrl = user?.profilePicture ? getProfilePictureUrl(user.profilePicture) : null;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-xl font-semibold mb-4">User not found</div>
          <Link to="/dashboard" className="text-red-600 hover:text-red-700 font-medium">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* SECTION 1: Page Title */}
      {isOwnProfile && (
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">My Profile</h1>
      )}

      {/* SECTION 2: Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6 sm:mb-8">
        {/* Profile Header Section */}
        <div className="bg-gradient-to-r from-red-50 to-rose-50 px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-center">
            {/* Profile Picture */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden ring-4 ring-white shadow-xl aspect-square relative">
                  {(previewPicture || profilePictureUrl) && !imageError ? (
                    <img 
                      src={previewPicture || profilePictureUrl} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center rounded-full">
                      <span className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                {user.isAdmin && (
                  <div className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-1.5 ring-2 ring-white">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                )}
                {(user.role === 'class_rep' || user.isClassRep) && !user.isAdmin && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1.5 ring-2 ring-white" title="Verified Class Representative">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="lg:col-span-3 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 sm:mb-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 break-words">{user.name}</h2>
                {(user.role === 'class_rep' || user.isClassRep) && !user.isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200" title="Verified Class Representative">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 break-all flex items-center justify-center lg:justify-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                {user.email}
              </p>
              {/* Bio */}
              {user.bio && (
                <div className="mb-4 sm:mb-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-start gap-2 mb-2">
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">About</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-800 leading-relaxed break-words whitespace-pre-wrap">{user.bio}</p>
                </div>
              )}
              
              {/* Phone Number */}
              {user.phoneNumber ? (
                <div className="mb-3 sm:mb-4">
                  <a
                    href={`https://wa.me/${user.phoneNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm sm:text-base text-green-600 hover:text-green-700 font-medium break-all transition-colors bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="break-all">{user.phoneNumber}</span>
                  </a>
                </div>
              ) : (
                <div className="text-sm text-gray-400 mb-3 sm:mb-4 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">No phone number provided</div>
              )}
              {/* User Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {user.campus && (
                  <div className="flex items-center gap-2 justify-center lg:justify-start bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium break-words">{user.campus.code} - {user.campus.name}</span>
                  </div>
                )}
                {user.department && (
                  <div className="flex items-center gap-2 justify-center lg:justify-start bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium break-words">{user.department.code} - {user.department.name}</span>
                  </div>
                )}
                {user.semester && (
                  <div className="flex items-center gap-2 justify-center lg:justify-start bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium break-words">Semester {user.semester.number} - {user.semester.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 justify-center lg:justify-start bg-white px-3 py-2 rounded-lg border border-gray-200">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-xs sm:text-sm text-gray-700 font-medium">
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Stats */}
        <div className="px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-3 sm:p-4 md:p-6 text-center transform transition-all hover:shadow-lg hover:-translate-y-1 border border-red-100 min-w-0">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-red-600 mb-1 sm:mb-2">{user.questionsCount || 0}</div>
              <div className="text-xs sm:text-sm text-gray-700 font-semibold break-words">Questions Asked</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 md:p-6 text-center transform transition-all hover:shadow-lg hover:-translate-y-1 border border-blue-100 min-w-0">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 mb-1 sm:mb-2">{user.answersCount || 0}</div>
              <div className="text-xs sm:text-sm text-gray-700 font-semibold break-words">Answers Provided</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4 md:p-6 text-center transform transition-all hover:shadow-lg hover:-translate-y-1 border border-purple-100 min-w-0">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-purple-600 mb-1 sm:mb-2">
                {isOwnProfile ? (user.votesCount || 0) : calculateMonthsActive()}
              </div>
              <div className="text-xs sm:text-sm text-gray-700 font-semibold break-words">
                {isOwnProfile ? 'Votes Cast' : 'Months Active'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: Recent Questions (for viewing other users) */}
      {!isOwnProfile && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Recent Questions</h2>
          {recentQuestions.length > 0 ? (
            <div className="space-y-4">
              {recentQuestions.map((question) => (
                <div key={question._id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <Link to={`/questions/${question._id}`} className="text-lg font-semibold text-gray-900 hover:text-red-600 transition-colors">
                    {question.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(question.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No questions yet.</p>
          )}
        </div>
      )}

      {/* SECTION 7: Edit Profile Form (only for own profile) */}
      {isOwnProfile && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8 lg:p-10">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Profile</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
              >
                Edit Profile
              </button>
            )}
          </div>

          {message.text && (
            <div className={`mb-4 sm:mb-6 border-l-4 p-3 sm:p-4 rounded ${
              message.type === 'success' 
                ? 'bg-green-100 border-green-500 text-green-700' 
                : 'bg-red-100 border-red-500 text-red-700'
            }`}>
              <p className="text-sm sm:text-base font-medium">{message.text}</p>
            </div>
          )}

          {editing && (
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" encType="multipart/form-data">
            {/* Profile Picture Upload */}
            <div>
              <label htmlFor="profile_picture" className="block text-sm font-medium text-gray-700 mb-3">
                Profile Picture
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-2 sm:ring-4 ring-red-100 flex-shrink-0 relative">
                  {(previewPicture || profilePictureUrl) && !imageError ? (
                    <img 
                      src={previewPicture || profilePictureUrl}
                      alt={user.name} 
                      id="preview-image"
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center rounded-full">
                      <span className="text-white text-2xl sm:text-3xl font-bold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <input 
                    type="file" 
                    id="profile_picture" 
                    name="profile_picture" 
                    accept="image/*"
                    onChange={handlePictureChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  <p className="mt-2 text-xs sm:text-sm text-gray-500">JPG, PNG or GIF (Max: 2MB)</p>
                </div>
              </div>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number / WhatsApp <span className="text-red-500 text-xs">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                    errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1234567890 or WhatsApp number"
                />
                {errors.phoneNumber && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{errors.phoneNumber}</span>
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 cursor-pointer hover:border-red-300"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="away">Away</option>
                    <option value="offline">Offline</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio <span className="text-gray-500 text-xs">(Optional - Max 500 characters)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                maxLength="500"
                className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-y ${
                  errors.bio ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Tell us about yourself..."
              />
              <p className="mt-1 text-xs text-gray-500">
                <span>{formData.bio.length}</span>/500 characters
              </p>
              {errors.bio && (
                <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{errors.bio}</span>
                </p>
              )}
            </div>

            {/* Password Update Section */}
            <div className="border-t border-gray-200 pt-6 sm:pt-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Change Password</h3>
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password <span className="text-gray-500 text-xs">(Required to change password)</span>
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                      errors.currentPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter current password"
                  />
                  {errors.currentPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>{errors.currentPassword}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                      errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    value={formData.passwordConfirmation}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 sm:pt-6">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                    bio: user.bio || '',
                    status: user.status || 'available',
                    password: '',
                    currentPassword: '',
                    passwordConfirmation: ''
                  });
                  setProfilePicture(null);
                  setPreviewPicture(user.profilePicture || null);
                  setErrors({});
                  setMessage({ type: '', text: '' });
                }}
                className="bg-gray-200 text-gray-700 px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg hover:bg-gray-300 font-semibold text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
              >
                Update Profile
              </button>
            </div>
          </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
