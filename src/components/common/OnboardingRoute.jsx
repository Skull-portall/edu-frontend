import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { onboardingAPI } from "../../services/api";

const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated || !user) {
        setCheckingOnboarding(false);
        return;
      }

      // Admins should skip onboarding
      if (user.isAdmin === true) {
        setNeedsOnboarding(false);
        setCheckingOnboarding(false);
        return;
      }

      // If user already has onboarding feedback, they don't need onboarding
      if (user.onboardingFeedback) {
        setNeedsOnboarding(false);
        setCheckingOnboarding(false);
        return;
      }

      try {
        const res = await onboardingAPI.getStatus();
        setNeedsOnboarding(res.data.needsOnboarding);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // If error, allow access (fail gracefully)
        setNeedsOnboarding(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      checkOnboarding();
    } else if (!authLoading && !isAuthenticated) {
      setCheckingOnboarding(false);
    }
  }, [isAuthenticated, authLoading, user]);

  if (authLoading || checkingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user needs onboarding, redirect to onboarding page
  if (needsOnboarding) {
    return <Navigate to="/onboardingFeedback" replace />;
  }

  return children;
};

export default OnboardingRoute;
