import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI, questionsAPI, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../../components/common/Loader';


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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imageError, setImageError] = useState(false);
  const [originalData, setOriginalData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    bio: '',
    status: 'available'
  });

 const isOwnProfile = currentUser && (currentUser.id === id || currentUser._id === id);

 // Check if form has any changes
 const hasChanges = () => {
 // Check if profile picture changed
 if (profilePicture instanceof File) return true;

 // Check if password fields have values
 if (formData.password || formData.currentPassword) return true;

 // Check if basic fields changed
 const fieldsToCheck = ['name', 'email', 'phoneNumber', 'bio', 'status'];
 return fieldsToCheck.some(field => {
 const currentValue = formData[field] || '';
 const originalValue = originalData[field] || '';
 return currentValue !== originalValue;
 });
 };

 const getProfilePictureUrl = (picturePath) => {
 if (!picturePath) return null;
 if (picturePath.startsWith('http')) return picturePath;
 if (picturePath.startsWith('/uploads')) return picturePath;
 const apiUrl = API_BASE_URL;
 const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
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
        const initialData = {
          name: userData.name || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          bio: userData.bio || '',
          status: userData.status || 'available',
          password: '',
          currentPassword: '',
          passwordConfirmation: ''
        };
        setFormData(initialData);
        setOriginalData({
          name: userData.name || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          bio: userData.bio || '',
          status: userData.status || 'available'
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
 const questions = response.data.data || [];
 // Filter out anonymous questions from public profile views
 setRecentQuestions(isOwnProfile ? questions : questions.filter(q => !q.isAnonymous && !q.is_anonymous));
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

 const uploadToCloudinary = async (file) => {
 // These should be in your .env file
 const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
 const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

 if (!cloudName || !uploadPreset) {
 throw new Error('Cloudinary credentials missing in .env (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)');
 }

 const formData = new FormData();
 formData.append('file', file);
 formData.append('upload_preset', uploadPreset);

 const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
 method: 'POST',
 body: formData,
 });

 if (!response.ok) {
 const errorData = await response.json();
 throw new Error(errorData.error?.message || 'Cloudinary upload failed');
 }

 const data = await response.json();
 return data.secure_url;
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 setErrors({});
 setMessage({ type: '', text: '' });

 setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('status', formData.status);

 if (profilePicture instanceof File) {
 try {
 const imageUrl = await uploadToCloudinary(profilePicture);
 formDataToSend.append('profile_picture', imageUrl);
 } catch (uploadError) {
 setLoading(false);
 setMessage({
 type: 'error',
 text: `Image upload failed: ${uploadError.message}. Please check your connection or Cloudinary settings.`
 });
 return;
 }
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
        setLoading(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setProfilePicture(null);
        setImageError(false);
        const updatedFormData = {
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          phoneNumber: updatedUser.phoneNumber || '',
          bio: updatedUser.bio || '',
          status: updatedUser.status || 'available',
          password: '',
          currentPassword: '',
          passwordConfirmation: ''
        };
        setFormData(updatedFormData);
        setOriginalData({
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          phoneNumber: updatedUser.phoneNumber || '',
          bio: updatedUser.bio || '',
          status: updatedUser.status || 'available'
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    } catch (error) {
      setLoading(false);
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
 <Loader />
 );
 }

 if (!user) {
 return (
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
 <div className="text-center py-12">
 <div className="text-red-600 text-xl font-semibold mb-4">User not found</div>
 <Link to="/dashboard" className="text-red-600 hover:text-red-700 font-medium">Back to Dashboard</Link>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 animate-fade-in">
 {/* Page Title */}
 {isOwnProfile && (
 <div className="flex items-center justify-between mb-6 sm:mb-8">
 <div>
 <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">My Profile</h1>
 <p className="text-gray-500 text-sm mt-0.5">Manage your account and academic info</p>
 </div>
 </div>
 )}

 {/* Profile Hero Card */}
 <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-red-900/5 border border-red-50 overflow-hidden mb-8">
 {/* Top gradient banner */}
 <div className="h-32 sm:h-48 bg-gradient-to-r from-red-600 via-rose-500 to-red-500 relative">
 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
 </div>

 {/* Avatar + Info */}
 <div className="px-6 sm:px-10 lg:px-12 pb-8">
 {/* Avatar row */}
 <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-24 mb-8 gap-4">
 <div className="relative isolate">
 <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-[2rem] overflow-hidden ring-[8px] ring-white shadow-2xl bg-white relative z-10 transition-transform hover:scale-105 duration-300">
 {(previewPicture || profilePictureUrl) && !imageError ? (
 <img
 src={previewPicture || profilePictureUrl}
 alt={user.name}
 className="w-full h-full object-cover"
 onError={() => setImageError(true)}
 />
 ) : (
 <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
 <span className="text-white text-6xl font-black shadow-sm">
 {user.name?.charAt(0).toUpperCase() || 'U'}
 </span>
 </div>
 )}
 </div>
 {/* Decorative behind-avatar blur */}
 <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full scale-110 z-0"></div>

 {user.isAdmin && (
 <div className="absolute -bottom-2 -right-2 bg-red-600 text-white rounded-2xl p-2.5 ring-4 ring-white shadow-lg z-20">
 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
 </div>
 )}
 {(user.role === 'class_rep' || user.isClassRep) && !user.isAdmin && (
 <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-2xl p-2.5 ring-4 ring-white shadow-lg z-20" title="Verified Class Representative">
 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
 </div>
 )}
 </div>

 {/* Role badges */}
 <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
 {user.isAdmin && <span className="px-5 py-2 bg-red-100 text-red-700 text-sm font-bold rounded-full border border-red-200 shadow-sm transition-transform hover:scale-105">Admin</span>}
 {(user.role === 'class_rep' || user.isClassRep) && !user.isAdmin && <span className="px-5 py-2 bg-blue-100 text-blue-700 text-sm font-bold rounded-full border border-blue-200 shadow-sm transition-transform hover:scale-105">Class Rep</span>}
 {(user.role === 'provider' || user.isProvider) && <span className="px-5 py-2 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full border border-emerald-200 shadow-sm transition-transform hover:scale-105">Provider</span>}
 </div>
 </div>

            {/* User Info */}
            <div className="lg:col-span-3 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 sm:mb-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 break-words">{user.name}</h2>
                {(user.role === 'class_rep' || user.isClassRep) && !user.isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200" title="Verified Class Representative">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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

 {/* Info Cards Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
 {user.campus && (
 <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-red-100 shadow-sm hover:shadow-md transition-shadow group">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-red-600 shadow-sm group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
 <div><div className="text-[10px] font-black uppercase text-red-400 tracking-wider mb-0.5">Campus</div><div className="font-bold text-gray-900">{user.campus.name}</div></div>
 </div>
 )}
 {user.department && (
 <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow group">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
 <div><div className="text-[10px] font-black uppercase text-blue-400 tracking-wider mb-0.5">Department</div><div className="font-bold text-gray-900">{user.department.name}</div></div>
 </div>
 )}
 {user.semester && (
 <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow group">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
 <div><div className="text-[10px] font-black uppercase text-purple-400 tracking-wider mb-0.5">Semester</div><div className="font-bold text-gray-900">Semester {user.semester.number}</div></div>
 </div>
 )}
 <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-600 shadow-sm group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
 <div><div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-0.5">Joined</div><div className="font-bold text-gray-900">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div></div>
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
 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
 <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">Recent Questions</h2>
 {recentQuestions.length > 0 ? (
 <div className="space-y-3">
 {recentQuestions.map((question) => (
 <div key={question._id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
 <Link to={`/questions/${question._id}`} className="text-base font-semibold text-gray-900 hover:text-red-600:text-red-400 transition-colors">
 {question.title}
 </Link>
 <p className="text-xs text-gray-400 mt-1">
 {new Date(question.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
 </p>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-gray-400 text-sm">No questions yet.</p>
 )}
 </div>
 )}

 {/* SECTION 7: Edit Profile Form (only for own profile) */}
 {isOwnProfile && (
 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 lg:p-10">
 <div className="flex flex-wrap gap-4 items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Profile Settings</h2>
            <div className="flex items-center gap-3">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
                >
                  Edit Profile
                </button>
              )}
              {isOwnProfile && (
                <button
                  onClick={async () => {
                    if (logout) {
                      await logout();
                      window.location.href = '/login';
                    }
                  }}
                  className="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 font-semibold flex items-center gap-2 border border-red-200 shadow-sm transition-all hover:border-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>

 {message.text && (
 <div className={`mb-4 sm:mb-6 border-l-4 p-3 sm:p-4 rounded ${message.type === 'success'
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
              < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >
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
                    className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
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
                    className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
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
                    className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
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
              </div >

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
 className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-y ${errors.bio ? 'border-red-500' : 'border-gray-300'
 }`}
 placeholder="Tell us about yourself..."
 />
 <p className="mt-1 text-xs text-gray-500">
 <span>{formData.bio.length}</span>/500 characters
 </p>
 {
 errors.bio && (
 <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
 </svg>
 <span>{errors.bio}</span>
 </p>
 )
 }
 </div>

 {/* Password Update Section */}
 <div className="border-t border-gray-200 pt-6 sm:pt-8">
 <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Change Password</h3>
 <p className="text-sm text-gray-600 mb-4 sm:mb-6">
 {user.password ?
 'Enter your current password to set a new one.' :
 'You can set a password for your account. Current password is not required for initial setup.'}
 </p>
 <div className="space-y-4 sm:space-y-5">
 <div>
 <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
 Current Password <span className="text-gray-500 text-xs">{user.password ? '(Required)' : '(Not required for initial setup)'}</span>
 </label>
 <div className="relative">
 <input
 type={showCurrentPassword ? "text" : "password"}
 id="currentPassword"
 name="currentPassword"
 value={formData.currentPassword}
 onChange={handleChange}
 className={`appearance-none block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${errors.currentPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
 }`}
 placeholder="Enter current password"
 />
 <button
 type="button"
 onClick={() => setShowCurrentPassword(!showCurrentPassword)}
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
 >
 {showCurrentPassword ? (
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
 </svg>
 ) : (
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
 </svg>
 )}
 </button>
 </div>
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
 <div className="relative">
 <input
 type={showNewPassword ? "text" : "password"}
 id="password"
 name="password"
 value={formData.password}
 onChange={handleChange}
 className={`appearance-none block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
 }`}
 placeholder="Enter new password (optional)"
 />
 <button
 type="button"
 onClick={() => setShowNewPassword(!showNewPassword)}
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
 >
 {showNewPassword ? (
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
 </svg>
 ) : (
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
 </svg>
 )}
 </button>
 </div>
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
 <div className="relative">
 <input
 type={showConfirmPassword ? "text" : "password"}
 id="passwordConfirmation"
 name="passwordConfirmation"
 value={formData.passwordConfirmation}
 onChange={handleChange}
 className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
 placeholder="Confirm new password"
 />
 <button
 type="button"
 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
 >
 {showConfirmPassword ? (
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
 </svg>
 ) : (
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
 </svg>
 )}
 </button>
 </div>
 </div>
 </div>
 </div >

 {/* Submit Button */}
 < div className="flex justify-end gap-3 pt-4 sm:pt-6" >
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
 disabled={loading || !hasChanges()}
 className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loading ? (
 <>
 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 Loading...
 </>
 ) : (
 'Update Profile'
 )}
 </button>
 </div >
 </form >
 )}
 </div >
 )}
 </div >
 );
};

export default Profile;
