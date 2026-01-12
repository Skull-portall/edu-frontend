import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { onboardingAPI } from '../../services/api';

const OnboardingFeedback = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedFeedback, setSelectedFeedback] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is admin - admins should skip onboarding
    if (user && user.isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Check if user already provided feedback
    const checkStatus = async () => {
      try {
        const statusRes = await onboardingAPI.getStatus();
        if (statusRes.data.hasFeedback) {
          // User already provided feedback, redirect to dashboard
          navigate('/dashboard');
          return;
        }
        
        // Fetch options
        const optionsRes = await onboardingAPI.getOptions();
        setOptions(optionsRes.data.data || []);
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
        // Show error but don't block the page
        setError('Failed to load onboarding options. Please refresh the page.');
        // Set default options in case API fails
        setOptions([
          { value: 'classmate', label: 'Classmate' },
          { value: 'school', label: 'School' },
          { value: 'department', label: 'Department' },
          { value: 'teacher', label: 'Teacher' },
          { value: 'friend', label: 'Friend' },
          { value: 'social_media', label: 'Social Media' },
          { value: 'other', label: 'Other' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkStatus();
    } else {
      setLoading(false);
      setError('Please log in to continue');
    }
  }, [navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFeedback) {
      setError('Please select how you found us');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await onboardingAPI.submitFeedback(selectedFeedback);
      // Redirect to dashboard after successful submission
      navigate('/dashboard', { 
        state: { message: 'Thank you for your feedback! Welcome to eDu Live!' }
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-xl p-8 animate-fade-in">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Welcome to eDu Live!
          </h2>
          <p className="text-gray-600">
            Help us understand how you found us
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              How did you hear about eDu Live? <span className="text-red-600">*</span>
            </label>
            <div className="space-y-3">
              {options.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedFeedback === option.value
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="feedback"
                    value={option.value}
                    checked={selectedFeedback === option.value}
                    onChange={(e) => setSelectedFeedback(e.target.value)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-700 font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedFeedback}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {submitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Continue to Dashboard'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingFeedback;
