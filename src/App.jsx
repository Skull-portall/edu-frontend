import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import OnboardingRoute from "./components/common/OnboardingRoute";
import ScrollToTop from "./components/common/ScrollToTop";
import PwaInstallPrompt from "./components/common/PwaInstallPrompt";
import WhatsAppSupport from "./components/common/WhatsAppSupport";
import Layout from "./components/layout/Layout";
import Loader from "./components/common/Loader";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
const ForgotPassword = React.lazy(() => import("./pages/auth/ForgotPassword"));
const OnboardingFeedback = React.lazy(
  () => import("./pages/onboarding/OnboardingFeedback"),
);
const Dashboard = React.lazy(() => import("./pages/dashboard/Dashboard"));
const QuestionsList = React.lazy(
  () => import("./pages/questions/QuestionsList"),
);
const QuestionDetail = React.lazy(
  () => import("./pages/questions/QuestionDetail"),
);
const QuestionCreate = React.lazy(
  () => import("./pages/questions/QuestionCreate"),
);
const NotesList = React.lazy(() => import("./pages/notes/NotesList"));
const NoteDetail = React.lazy(() => import("./pages/notes/NoteDetail"));
const NoteCreate = React.lazy(() => import("./pages/notes/NoteCreate"));
const PassTestsList = React.lazy(
  () => import("./pages/pass-tests/PassTestsList"),
);
const PassTestDetail = React.lazy(
  () => import("./pages/pass-tests/PassTestDetail"),
);
const PassTestCreate = React.lazy(
  () => import("./pages/pass-tests/PassTestCreate"),
);
const CommunitiesList = React.lazy(
  () => import("./pages/communities/CommunitiesList"),
);
const CommunityDetail = React.lazy(
  () => import("./pages/communities/CommunityDetail"),
);
const CommunityCreate = React.lazy(
  () => import("./pages/communities/CommunityCreate"),
);
const SearchResults = React.lazy(() => import("./pages/search/SearchResults"));
const Notifications = React.lazy(
  () => import("./pages/notifications/Notifications"),
);
const Profile = React.lazy(() => import("./pages/users/Profile"));
const MyQuestions = React.lazy(() => import("./pages/users/MyQuestions"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = React.lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = React.lazy(
  () => import("./pages/admin/AdminUserDetail"),
);
const AdminNotes = React.lazy(() => import("./pages/admin/AdminNotes"));
const AdminPassTests = React.lazy(() => import("./pages/admin/AdminPassTests"));
const AdminSemesters = React.lazy(() => import("./pages/admin/AdminSemesters"));
const AdminDepartments = React.lazy(
  () => import("./pages/admin/AdminDepartments"),
);
const AdminCampuses = React.lazy(() => import("./pages/admin/AdminCampuses"));
const AdminCourses = React.lazy(() => import("./pages/admin/AdminCourses"));
const AdminClassReps = React.lazy(() => import("./pages/admin/AdminClassReps"));
const AdminAdmins = React.lazy(() => import("./pages/admin/AdminAdmins"));
const AdminTopics = React.lazy(() => import("./pages/admin/AdminTopics"));
const AdminCommunities = React.lazy(
  () => import("./pages/admin/AdminCommunities"),
);
const AdminOnboardingFeedback = React.lazy(
  () => import("./pages/admin/AdminOnboardingFeedback"),
);
const AdminEndSeason = React.lazy(() => import("./pages/admin/AdminEndSeason"));
const AdminCampusHubApplications = React.lazy(
  () => import("./pages/admin/AdminCampusHubApplications"),
);
const AdminCampusHubServices = React.lazy(
  () => import("./pages/admin/AdminCampusHubServices"),
);
const AdminCampusHubOrders = React.lazy(
  () => import("./pages/admin/AdminCampusHubOrders"),
);
const AdminCampusHubChats = React.lazy(
  () => import("./pages/admin/AdminCampusHubChats"),
);
const ClassRepDashboard = React.lazy(
  () => import("./pages/classRep/ClassRepDashboard"),
);
const CampusHub = React.lazy(() => import("./pages/campusHub/CampusHub"));
const CampusHubServiceDetail = React.lazy(
  () => import("./pages/campusHub/CampusHubServiceDetail"),
);
const ApplyAsProvider = React.lazy(
  () => import("./pages/campusHub/ApplyAsProvider"),
);
const CampusHubOrders = React.lazy(
  () => import("./pages/campusHub/CampusHubOrders"),
);
const CampusHubOrderChat = React.lazy(
  () => import("./pages/campusHub/CampusHubOrderChat"),
);
const CampusHubMyServices = React.lazy(
  () => import("./pages/campusHub/CampusHubMyServices"),
);
const ProviderDashboard = React.lazy(
  () => import("./pages/campusHub/ProviderDashboard"),
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <PwaInstallPrompt />
            <ScrollToTop />
            <Suspense fallback={<Loader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected routes with onboarding check */}
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="/onboardingFeedback"
                    element={<OnboardingFeedback />}
                  />
                </Route>

                <Route
                  element={
                    <ProtectedRoute>
                      <OnboardingRoute>
                        <Layout />
                      </OnboardingRoute>
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/questions" element={<QuestionsList />} />
                  <Route
                    path="/questions/create"
                    element={<QuestionCreate />}
                  />
                  <Route path="/questions/:id" element={<QuestionDetail />} />
                  <Route path="/notes" element={<NotesList />} />
                  <Route path="/notes/create" element={<NoteCreate />} />
                  <Route path="/notes/:id" element={<NoteDetail />} />
                  <Route path="/pass-tests" element={<PassTestsList />} />
                  <Route
                    path="/pass-tests/create"
                    element={<PassTestCreate />}
                  />
                  <Route path="/pass-tests/:id" element={<PassTestDetail />} />
                  <Route path="/communities" element={<CommunitiesList />} />
                  <Route
                    path="/communities/create"
                    element={<CommunityCreate />}
                  />
                  <Route
                    path="/communities/:id"
                    element={<CommunityDetail />}
                  />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/profile/:id" element={<Profile />} />
                  <Route path="/my-questions" element={<MyQuestions />} />

                  {/* Campus Hub */}
                  <Route path="/campus-hub" element={<CampusHub />} />
                  <Route
                    path="/campus-hub/apply"
                    element={<ApplyAsProvider />}
                  />
                  <Route
                    path="/campus-hub/services/:id"
                    element={<CampusHubServiceDetail />}
                  />
                  <Route
                    path="/campus-hub/orders"
                    element={<CampusHubOrders />}
                  />
                  <Route
                    path="/campus-hub/orders/:orderId/chat"
                    element={<CampusHubOrderChat />}
                  />
                  <Route
                    path="/campus-hub/my-services"
                    element={<CampusHubMyServices />}
                  />
                  <Route
                    path="/campus-hub/provider-dashboard"
                    element={<ProviderDashboard />}
                  />

                  {/* Class Rep routes */}
                  <Route
                    path="/class-rep/dashboard"
                    element={<ClassRepDashboard />}
                  />

                  {/* Admin routes */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route
                    path="/admin/users/:id"
                    element={<AdminUserDetail />}
                  />
                  <Route path="/admin/notes" element={<AdminNotes />} />
                  <Route
                    path="/admin/pass-tests"
                    element={<AdminPassTests />}
                  />
                  <Route path="/admin/semesters" element={<AdminSemesters />} />
                  <Route
                    path="/admin/departments"
                    element={<AdminDepartments />}
                  />
                  <Route path="/admin/campuses" element={<AdminCampuses />} />
                  <Route path="/admin/courses" element={<AdminCourses />} />
                  <Route
                    path="/admin/class-reps"
                    element={<AdminClassReps />}
                  />
                  <Route path="/admin/management" element={<AdminAdmins />} />
                  <Route path="/admin/topics" element={<AdminTopics />} />
                  <Route
                    path="/admin/communities"
                    element={<AdminCommunities />}
                  />
                  <Route
                    path="/admin/onboarding-feedback"
                    element={<AdminOnboardingFeedback />}
                  />
                  <Route
                    path="/admin/end-season"
                    element={<AdminEndSeason />}
                  />
                  <Route
                    path="/admin/campus-hub/applications"
                    element={<AdminCampusHubApplications />}
                  />
                  <Route
                    path="/admin/campus-hub/services"
                    element={<AdminCampusHubServices />}
                  />
                  <Route
                    path="/admin/campus-hub/orders"
                    element={<AdminCampusHubOrders />}
                  />
                  <Route
                    path="/admin/campus-hub/chats"
                    element={<AdminCampusHubChats />}
                  />
                </Route>

                {/* Redirect unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
