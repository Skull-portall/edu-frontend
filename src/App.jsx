import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import OnboardingRoute from './components/common/OnboardingRoute';
import ScrollToTop from './components/common/ScrollToTop';
import Layout from './components/layout/Layout';
// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import OnboardingFeedback from './pages/onboarding/OnboardingFeedback';
import Dashboard from './pages/dashboard/Dashboard';
import QuestionsList from './pages/questions/QuestionsList';
import QuestionDetail from './pages/questions/QuestionDetail';
import QuestionCreate from './pages/questions/QuestionCreate';
import NotesList from './pages/notes/NotesList';
import NoteDetail from './pages/notes/NoteDetail';
import NoteCreate from './pages/notes/NoteCreate';
import PassTestsList from './pages/pass-tests/PassTestsList';
import PassTestDetail from './pages/pass-tests/PassTestDetail';
import PassTestCreate from './pages/pass-tests/PassTestCreate';
import CommunitiesList from './pages/communities/CommunitiesList';
import CommunityDetail from './pages/communities/CommunityDetail';
import CommunityCreate from './pages/communities/CommunityCreate';
import SearchResults from './pages/search/SearchResults';
import Notifications from './pages/notifications/Notifications';
import Profile from './pages/users/Profile';
import MyQuestions from './pages/users/MyQuestions';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminNotes from './pages/admin/AdminNotes';
import AdminPassTests from './pages/admin/AdminPassTests';
import AdminSemesters from './pages/admin/AdminSemesters';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminCampuses from './pages/admin/AdminCampuses';
import AdminCourses from './pages/admin/AdminCourses';
import AdminTopics from './pages/admin/AdminTopics';
import AdminCommunities from './pages/admin/AdminCommunities';
import AdminOnboardingFeedback from './pages/admin/AdminOnboardingFeedback';
import AdminEndSeason from './pages/admin/AdminEndSeason';
import AdminCampusHubApplications from './pages/admin/AdminCampusHubApplications';
import AdminCampusHubServices from './pages/admin/AdminCampusHubServices';
import AdminCampusHubOrders from './pages/admin/AdminCampusHubOrders';
import AdminCampusHubChats from './pages/admin/AdminCampusHubChats';
import ClassRepDashboard from './pages/classRep/ClassRepDashboard';
import CampusHub from './pages/campusHub/CampusHub';
import CampusHubServiceDetail from './pages/campusHub/CampusHubServiceDetail';
import ApplyAsProvider from './pages/campusHub/ApplyAsProvider';
import CampusHubOrders from './pages/campusHub/CampusHubOrders';
import CampusHubOrderChat from './pages/campusHub/CampusHubOrderChat';
import CampusHubMyServices from './pages/campusHub/CampusHubMyServices';
import ProviderDashboard from './pages/campusHub/ProviderDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes with onboarding check */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/onboardingFeedback" element={<OnboardingFeedback />} />
          </Route>

          <Route element={<ProtectedRoute><OnboardingRoute><Layout /></OnboardingRoute></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/questions" element={<QuestionsList />} />
            <Route path="/questions/create" element={<QuestionCreate />} />
            <Route path="/questions/:id" element={<QuestionDetail />} />
            <Route path="/notes" element={<NotesList />} />
            <Route path="/notes/create" element={<NoteCreate />} />
            <Route path="/notes/:id" element={<NoteDetail />} />
            <Route path="/pass-tests" element={<PassTestsList />} />
            <Route path="/pass-tests/create" element={<PassTestCreate />} />
            <Route path="/pass-tests/:id" element={<PassTestDetail />} />
            <Route path="/communities" element={<CommunitiesList />} />
            <Route path="/communities/create" element={<CommunityCreate />} />
            <Route path="/communities/:id" element={<CommunityDetail />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/my-questions" element={<MyQuestions />} />

            {/* Campus Hub */}
            <Route path="/campus-hub" element={<CampusHub />} />
            <Route path="/campus-hub/apply" element={<ApplyAsProvider />} />
            <Route path="/campus-hub/services/:id" element={<CampusHubServiceDetail />} />
            <Route path="/campus-hub/orders" element={<CampusHubOrders />} />
            <Route path="/campus-hub/orders/:orderId/chat" element={<CampusHubOrderChat />} />
            <Route path="/campus-hub/my-services" element={<CampusHubMyServices />} />
            <Route path="/campus-hub/provider-dashboard" element={<ProviderDashboard />} />

            {/* Class Rep routes */}
            <Route path="/class-rep/dashboard" element={<ClassRepDashboard />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:id" element={<AdminUserDetail />} />
            <Route path="/admin/notes" element={<AdminNotes />} />
            <Route path="/admin/pass-tests" element={<AdminPassTests />} />
            <Route path="/admin/semesters" element={<AdminSemesters />} />
            <Route path="/admin/departments" element={<AdminDepartments />} />
            <Route path="/admin/campuses" element={<AdminCampuses />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/topics" element={<AdminTopics />} />
            <Route path="/admin/communities" element={<AdminCommunities />} />
            <Route path="/admin/onboarding-feedback" element={<AdminOnboardingFeedback />} />
            <Route path="/admin/end-season" element={<AdminEndSeason />} />
            <Route path="/admin/campus-hub/applications" element={<AdminCampusHubApplications />} />
            <Route path="/admin/campus-hub/services" element={<AdminCampusHubServices />} />
            <Route path="/admin/campus-hub/orders" element={<AdminCampusHubOrders />} />
            <Route path="/admin/campus-hub/chats" element={<AdminCampusHubChats />} />
          </Route>

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

