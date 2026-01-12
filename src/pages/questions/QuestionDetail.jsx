import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { questionsAPI, answersAPI, votesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const response = await questionsAPI.getById(id);
      setQuestion(response.data.data);
      setAnswers(response.data.data.answers || []);
    } catch (error) {
      console.error('Error fetching question:', error);
      setError('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerBody.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await answersAPI.create(id, { body: answerBody });
      setAnswers([response.data.data, ...answers]);
      setAnswerBody('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await answersAPI.accept(answerId);
      fetchQuestion();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to accept answer');
    }
  };

  const handleVote = async (answerId, isUpvote) => {
    try {
      const response = await votesAPI.voteAnswer(answerId, isUpvote);
      setAnswers(answers.map(a => 
        a._id === answerId 
          ? { ...a, votesCount: response.data.data.answer.votesCount }
          : a
      ));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await questionsAPI.delete(id);
      navigate('/questions');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete question');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl font-semibold mb-4">Question not found</div>
        <Link to="/questions" className="text-red-600 hover:text-red-700 underline">
          Back to Questions
        </Link>
      </div>
    );
  }

  const isOwner = user && (user.id === question.user?._id || user.id === question.user?.id || user._id === question.user?._id || user._id === question.user?.id);
  const canAccept = isOwner;

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg animate-fade-in">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Question */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 card-hover">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center flex-wrap gap-2 mb-3">
              {question.isAnonymous && !user?.isAdmin ? (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">Anonymous</span>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center text-white text-xs font-semibold">
                      {question.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <Link
                    to={`/profile/${question.user?._id || question.user?.id}`}
                    className="text-xs sm:text-sm text-gray-600 hover:text-red-600 font-semibold transition-colors"
                  >
                    {question.user?.name}
                  </Link>
                </div>
              )}
              <span className="text-gray-400 hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm text-gray-500">
                {new Date(question.createdAt).toLocaleDateString()}
              </span>
              {question.courseName && (
                <span className="bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
                  {question.courseName}
                </span>
              )}
              {question.semester?.number && (
                <span className="bg-rose-100 text-rose-700 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
                  Semester {question.semester.number}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 break-words">{question.title}</h1>
            
            <div className="prose max-w-none mb-4">
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                {question.body}
              </p>
            </div>
            
            {question.attachment && (
              <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{question.attachmentName || 'Attachment'}</p>
                    <a
                      href={`http://localhost:5000/${question.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span>{question.views || 0} views</span>
              <span>{answers.length} {answers.length === 1 ? 'answer' : 'answers'}</span>
            </div>
          </div>
          
          {isOwner && (
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Answer Form */}
      {user && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Answer</h2>
          <form onSubmit={handleSubmitAnswer}>
            <textarea
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              rows="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              placeholder="Write your answer here..."
            />
            <button
              type="submit"
              disabled={submitting || !answerBody.trim()}
              className="mt-4 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              {submitting ? 'Submitting...' : 'Post Answer'}
            </button>
          </form>
        </div>
      )}

      {/* Answers */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>
        <div className="space-y-6">
          {answers.map((answer) => (
            <div
              key={answer._id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                answer.isAccepted ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleVote(answer._id, true)}
                    className="text-gray-400 hover:text-green-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <span className="font-semibold text-gray-900 my-1">{answer.votesCount || 0}</span>
                  <button
                    onClick={() => handleVote(answer._id, false)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {answer.isAccepted && (
                    <div className="mt-2 text-green-600 font-semibold">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      to={`/profile/${answer.user?._id || answer.user?.id}`}
                      className="font-semibold text-red-600 hover:text-red-700 hover:underline"
                    >
                      {answer.user?.name}
                    </Link>
                    <span className="text-sm text-gray-500">
                      {new Date(answer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700">{answer.body}</p>
                  </div>
                  
                  {answer.attachment && (
                    <div className="mt-3">
                      <a
                        href={`http://localhost:5000/${answer.attachment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        📎 {answer.attachmentName || 'Attachment'}
                      </a>
                    </div>
                  )}
                  
                  {canAccept && !answer.isAccepted && (
                    <button
                      onClick={() => handleAcceptAnswer(answer._id)}
                      className="mt-4 text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      ✓ Accept Answer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {answers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500">No answers yet. Be the first to answer!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;
