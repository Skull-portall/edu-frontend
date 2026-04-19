import axios from 'axios';
//https://edu-live-vwds.onrender.com/api/v1
//http://localhost:5000/api/v1

// Default to the API URL from environment variables
const VITE_API_URL = import.meta.env.VITE_API_URL;
let backendUrl = VITE_API_URL || 'https://edu-live-vwds.onrender.com/api/v1';

// --- PRODUCTION FAIL-SAFE ---
// If we are on the production domain but the URL is still localhost, force the live URL
const isProductionDomain = window.location.hostname.includes('edulive.com.ng');
if (isProductionDomain && backendUrl.includes('localhost')) {
  console.warn('[API] Production domain detected but VITE_API_URL is pointing to localhost. Forcing live backend.');
  backendUrl = 'https://edu-live-vwds.onrender.com/api/v1';
}

// Only handle dynamic IP replacement if we are in DEV mode AND using a localhost URL
if (import.meta.env.DEV && backendUrl.includes('localhost')) {
  // Dynamically grab the host IP instead of hardcoding localhost
  // so it works when testing on a mobile phone on the same local network
  backendUrl = `http://${window.location.hostname}:5000/api/v1`;
}

console.log(`[API] Resolved Backend URL: ${backendUrl}`);

export const API_BASE_URL = backendUrl;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Map to store pending requests
const pendingRequests = new Map();

// Helper to generate a unique key for each request
const getRequestKey = (config) => {
  return `${config.method}:${config.url}`;
};

// Helper to add a request to the pending map
const addPendingRequest = (config) => {
  // Only deduplicate state-modifying requests (POST, PUT, DELETE, PATCH)
  // Allow GET requests to run in parallel (e.g. strict mode double invoke)
  if (config.method.toLowerCase() === 'get') {
    return;

  }

  const key = getRequestKey(config);
  // If a request with the same key is already pending, cancel it
  if (pendingRequests.has(key)) {
    const controller = pendingRequests.get(key);
    controller.abort('Duplicated request cancelled');
    pendingRequests.delete(key);
  }

  // Create a new AbortController for the current request
  const controller = new AbortController();
  config.signal = controller.signal;
  pendingRequests.set(key, controller);
};

// Helper to remove a request from the pending map
const removePendingRequest = (config) => {
  if (!config) return;
  const key = getRequestKey(config);
  if (pendingRequests.has(key)) {
    const controller = pendingRequests.get(key);
    // Only remove if it's the same controller (don't remove a newer request's controller)
    if (controller.signal === config.signal) {
      pendingRequests.delete(key);
    }
  }
};

// Request interceptor - Add token to requests and handle deduplication
api.interceptors.request.use(
  (config) => {
    // Add deduplication logic
    addPendingRequest(config);

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If data is FormData, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    removePendingRequest(error.config);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally and clean up pending requests
api.interceptors.response.use(
  (response) => {
    removePendingRequest(response.config);
    return response;
  },
  (error) => {
    removePendingRequest(error.config);

    // Ignore cancellations to prevent UI errors for debounced requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/user'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Questions API
export const questionsAPI = {
  getAll: (params) => api.get('/questions', { params }),
  getById: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
};

// Answers API
export const answersAPI = {
  create: (questionId, data) => api.post(`/questions/${questionId}/answers`, data),
  update: (id, data) => api.put(`/answers/${id}`, data),
  delete: (id) => api.delete(`/answers/${id}`),
  accept: (id) => api.post(`/answers/${id}/accept`),
};

// Votes API
export const votesAPI = {
  voteAnswer: (answerId, isUpvote) => api.post(`/answers/${answerId}/votes`, { isUpvote }),
};

// Users API
export const usersAPI = {
  getById: (id) => api.get(`/users/${id}`),
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => {
    // If FormData, don't set Content-Type header (browser will set it with boundary)
    const isFormData = data instanceof FormData;
    return api.put('/users/me', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
  getMyQuestions: () => api.get('/users/me/questions'),
  getMyRepresentative: () => api.get('/users/me/representative'),
};

// Notes API
export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// Pass Tests API
export const passTestsAPI = {
  getAll: (params) => api.get('/pass-tests', { params }),
  getById: (id) => api.get(`/pass-tests/${id}`),
  create: (data) => api.post('/pass-tests', data),
  update: (id, data) => api.put(`/pass-tests/${id}`, data),
  delete: (id) => api.delete(`/pass-tests/${id}`),
  approve: (id) => api.post(`/pass-tests/${id}/approve`),
  reject: (id) => api.post(`/pass-tests/${id}/reject`),
};

// Communities API
export const communitiesAPI = {
  getAll: (params) => api.get('/communities', { params }),
  getById: (id) => api.get(`/communities/${id}`),
  create: (data) => api.post('/communities', data),
  update: (id, data) => api.put(`/communities/${id}`, data),
  delete: (id) => api.delete(`/communities/${id}`),
  createPost: (communityId, data) => api.post(`/communities/${communityId}/posts`, data),
  joinCommunity: (id) => api.post(`/communities/${id}/join`),
  leaveCommunity: (id) => api.post(`/communities/${id}/leave`),
  reactToPost: (communityId, postId, type) => api.post(`/communities/${communityId}/posts/${postId}/react`, { type }),
  deletePost: (communityId, postId) => api.delete(`/communities/${communityId}/posts/${postId}`),
  pinResource: (id, resourceId) => api.post(`/communities/${id}/pin`, { resourceId }),
  unpinResource: (id, resourceId) => api.delete(`/communities/${id}/pin/${resourceId}`),
  getPostThread: (communityId, postId) => api.get(`/communities/${communityId}/posts/${postId}/thread`),
  repostPost: (communityId, postId, content) => api.post(`/communities/${communityId}/posts/${postId}/repost`, { content }),
  getCategories: () => api.get('/communities/categories/list'),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  clearAll: () => api.delete('/notifications/clear-all'),
};

// Search API
export const searchAPI = {
  search: (query) => api.get('/search', { params: { q: query } }),
};

// Stats API (for landing page)
export const statsAPI = {
  getStats: () => api.get('/stats'),
};

// Class Rep API
export const classRepAPI = {
  getDashboard: () => api.get('/class-rep/dashboard'),
  approveNote: (id) => api.post(`/class-rep/notes/${id}/approve`),
  rejectNote: (id) => api.post(`/class-rep/notes/${id}/reject`),
  approvePassTest: (id) => api.post(`/class-rep/pass-tests/${id}/approve`),
  rejectPassTest: (id) => api.post(`/class-rep/pass-tests/${id}/reject`),
};

// Admin API
export const adminAPI = {
  // Stats
  getStats: () => api.get('/admin/stats'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  suspendUser: (id, reason) => api.post(`/admin/users/${id}/suspend`, { reason }),
  reactivateUser: (id) => api.post(`/admin/users/${id}/reactivate`),
  deleteUser: (id, reason) => api.delete(`/admin/users/${id}`, { data: { reason } }),
  updateUserSemester: (id, semesterId) =>
    api.post(`/admin/users/${id}/semester`, { semester_id: semesterId }),
  updateUserCampus: (id, campusId) =>
    api.post(`/admin/users/${id}/campus`, { campus_id: campusId }),
  updateUserDepartment: (id, departmentId) =>
    api.post(`/admin/users/${id}/department`, { department_id: departmentId }),
  promoteSemester: () => api.post('/admin/users/promote-semester'),

  // Class Reps
  previewUserByEmail: (email) => api.get(`/admin/users/preview/${email}`),
  assignClassRep: (data) => api.post('/admin/class-reps/assign', data),

  // Admins
  getAdmins: () => api.get('/admin/management/admins'),
  assignAdminRole: (data) => api.post('/admin/management/assign', data),
  revokeAdminRole: (userId) => api.post('/admin/management/revoke', { userId }),

  // Notes
  getNotes: (params) => api.get('/admin/notes', { params }),
  approveNote: (id) => api.post(`/admin/notes/${id}/approve`),
  rejectNote: (id) => api.post(`/admin/notes/${id}/reject`),
  deleteNote: (id) => api.delete(`/admin/notes/${id}`),

  // Pass Tests
  getPassTests: (params) => api.get('/admin/pass-tests', { params }),
  approvePassTest: (id) => api.post(`/admin/pass-tests/${id}/approve`),
  rejectPassTest: (id) => api.post(`/admin/pass-tests/${id}/reject`),
  deletePassTest: (id) => api.delete(`/admin/pass-tests/${id}`),

  // Semesters
  getSemesters: () => api.get('/admin/semesters'),
  createSemester: (data) => api.post('/admin/semesters', data),
  updateSemester: (id, data) => api.put(`/admin/semesters/${id}`, data),
  deleteSemester: (id) => api.delete(`/admin/semesters/${id}`),

  // Departments
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),

  // Campuses
  getCampuses: () => api.get('/admin/campuses'),
  createCampus: (data) => api.post('/admin/campuses', data),
  updateCampus: (id, data) => api.put(`/admin/campuses/${id}`, data),
  deleteCampus: (id) => api.delete(`/admin/campuses/${id}`),

  // Courses
  getCourses: () => api.get('/admin/courses'),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),

  // Topics
  getTopics: () => api.get('/admin/topics'),
  createTopic: (data) => api.post('/admin/topics', data),
  updateTopic: (id, data) => api.put(`/admin/topics/${id}`, data),
  deleteTopic: (id) => api.delete(`/admin/topics/${id}`),

  // Community Categories
  getCommunityCategories: () => api.get('/admin/community-categories'),
  createCommunityCategory: (data) => api.post('/admin/community-categories', data),
  updateCommunityCategory: (id, data) => api.put(`/admin/community-categories/${id}`, data),
  deleteCommunityCategory: (id) => api.delete(`/admin/community-categories/${id}`),

  // Communities
  getCommunities: (params) => api.get('/admin/communities', { params }),
  toggleCommunity: (id) => api.post(`/admin/communities/${id}/toggle`),
  deleteCommunity: (id) => api.delete(`/admin/communities/${id}`),

  // Onboarding Feedback
  getOnboardingFeedback: (params) => api.get('/admin/onboarding-feedback', { params }),

  // End Season
  getStudentCounts: (campusId, departmentId) =>
    api.get('/admin/end-season/student-counts', {
      params: { campus_id: campusId, department_id: departmentId },
    }),
  promoteUsersByCampusDepartment: (campusId, departmentId) =>
    api.post('/admin/end-season/promote', { campus_id: campusId, department_id: departmentId }),
};

// Meta API (for registration forms)
export const metaAPI = {
  getSemesters: () => api.get('/meta/semesters'),
  getDepartments: () => api.get('/meta/departments'),
  getCampuses: () => api.get('/meta/campuses'),
};

// Onboarding API
export const onboardingAPI = {
  getOptions: () => api.get('/onboarding/options'),
  getStatus: () => api.get('/onboarding/status'),
  submitFeedback: (feedback) => api.post('/onboarding/feedback', { onboardingFeedback: feedback }),
};

// Campus Hub API
export const campusHubAPI = {
  // Provider application (data can be FormData for apply with image)
  applyAsProvider: (data) => api.post('/campus-hub/providers/apply', data),
  getMyApplication: () => api.get('/campus-hub/providers/my-application'),
  getProviderApplications: (params) => api.get('/campus-hub/providers/applications', { params }),
  approveOrRejectApplication: (data) => api.post('/campus-hub/providers/approve', data),
  revokeProvider: (data) => api.post('/campus-hub/providers/revoke', data),
  deleteApplication: (id) => api.delete(`/campus-hub/providers/applications/${id}`),
  // Services
  getServices: (params) => api.get('/campus-hub/services', { params }),
  getServiceById: (id) => api.get(`/campus-hub/services/${id}`),
  getMyServices: () => api.get('/campus-hub/services/my/list'),
  createService: (data) => api.post('/campus-hub/services', data),
  updateService: (id, data) => api.put(`/campus-hub/services/${id}`, data),
  deleteService: (id) => api.delete(`/campus-hub/services/${id}`),
  // Orders
  createOrder: (payload) => api.post('/campus-hub/orders', payload),
  getMyOrders: () => api.get('/campus-hub/orders'),
  getOrderById: (id) => api.get(`/campus-hub/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/campus-hub/orders/${id}/status`, { status }),
  // Chat
  getChatMessages: (orderId) => api.get(`/campus-hub/chat/${orderId}`),
  sendChatMessage: (orderId, data) => api.post(`/campus-hub/chat/${orderId}`, data),
  getUnreadCount: () => api.get('/campus-hub/chat/unread'),
  // Admin
  adminGetServices: () => api.get('/campus-hub/admin/services'),
  adminUpdateService: (id, data) => api.patch(`/campus-hub/admin/services/${id}`, data),
  adminDeleteService: (id) => api.delete(`/campus-hub/admin/services/${id}`),
  adminGetOrders: () => api.get('/campus-hub/admin/orders'),
  adminGetChats: () => api.get('/campus-hub/admin/chats'),
};

export default api;
