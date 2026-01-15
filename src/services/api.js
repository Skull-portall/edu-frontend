import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true, // For cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
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
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
  deletePost: (communityId, postId) => api.delete(`/communities/${communityId}/posts/${postId}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
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
  promoteSemester: () => api.post('/admin/users/promote-semester'),

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

export default api;
