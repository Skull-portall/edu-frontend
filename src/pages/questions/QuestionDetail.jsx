import Loader from '../../components/common/Loader';
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { questionsAPI, answersAPI, votesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [answerBody, setAnswerBody] = useState('');

  // Fetch Question and Answers
  const { data: questionData, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: async () => {
      const response = await questionsAPI.getById(id);
      return response.data;
    },
    onError: () => {
      toast.error('Failed to load question');
    }
  });

  const question = questionData?.data;
  const answers = questionData?.data?.answers || [];

  // Submit Answer Mutation
  const submitAnswerMutation = useMutation({
    mutationFn: (newAnswer) => answersAPI.create(id, newAnswer),
    onSuccess: () => {
      queryClient.invalidateQueries(['question', id]);
      setAnswerBody('');
      toast.success('Your answer was posted!', {
        position: 'top-center'
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit answer');
    }
  });

  // Vote Mutation
  const voteMutation = useMutation({
    mutationFn: ({ answerId, isUpvote }) => votesAPI.voteAnswer(answerId, isUpvote),
    onSuccess: () => {
      queryClient.invalidateQueries(['question', id]);
    },
    onError: () => {
      toast.error('Unable to cast vote');
    },
  });

  // Accept Answer Mutation
  const acceptAnswerMutation = useMutation({
    mutationFn: (answerId) => answersAPI.accept(answerId),
    onSuccess: () => {
      queryClient.invalidateQueries(['question', id]);
      toast.success('You accepted this solution!');
    },
    onError: () => toast.error('Failed to accept answer')
  });

  // Delete Question Mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: () => questionsAPI.delete(id),
    onSuccess: () => {
      toast.success('Question deleted successfully');
      navigate('/questions');
    },
    onError: () => toast.error('You are not authorized to delete this question')
  });

  const handleSubmitAnswer = (e) => {
    e.preventDefault();
    if (!answerBody.trim()) return;
    submitAnswerMutation.mutate({ body: answerBody });
  };

  const handleDelete = () => {
    if (window.confirm('This action cannot be undone. Delete this question?')) {
      deleteQuestionMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase">Question Not Found</h2>
        <p className="text-gray-500 mb-8 font-medium italic">"The question you are looking for may have been deleted or moved."</p>
        <Link to="/questions" className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all">
          Back to Questions
        </Link>
      </div>
    );
  }

  const isOwner = user && (user.id === question.user?._id || user._id === question.user?._id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Question Context */}
      <div className="mb-10 animate-fade-in">
        <Link to="/questions" className="inline-flex items-center gap-2 text-gray-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] mb-6 transition-colors font-mono">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Questions
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="bg-red-50 text-red-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 italic">
                {question.courseName || 'General'}
              </span>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest font-mono">
                Thread #{id.slice(-6).toUpperCase()}
              </span>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest font-mono">
                {answers.length} Responses
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight uppercase tracking-tight break-words">
              {question.title}
            </h1>
          </div>

          {isOwner && (
            <button
              onClick={handleDelete}
              className="px-6 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all active:scale-95"
            >
              Delete Question
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mb-16">
        {/* Author Stats */}
        <div className="lg:col-span-1 space-y-8 animate-slide-up">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Asked By</h4>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-4 ring-gray-100 mb-4 transition-transform group-hover:scale-110">
                {!(question.isAnonymous || question.is_anonymous) ? (
                  question.user?.profilePicture ? (
                    <img src={question.user.profilePicture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white text-2xl font-black uppercase">
                      {question.user?.name?.charAt(0) || 'U'}
                    </div>
                  )
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              {!(question.isAnonymous || question.is_anonymous) ? (
                <Link
                  to={`/profile/${question.user?._id || question.user?.id}`}
                  className="text-lg font-black text-gray-900 truncate uppercase tracking-tight hover:text-red-600"
                >
                  {question.user?.name || 'STUDENT'}
                </Link>
              ) : (
                <span className="text-lg font-black text-gray-400 uppercase tracking-tight">ANONYMOUS</span>
              )}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                Posted {new Date(question.createdAt).toLocaleDateString()}
              </p>

            </div>
          </div>

          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 text-center">
            <div className="text-3xl font-black text-gray-900 mb-1">{question.views || 0}</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Views</p>
          </div>
        </div>

        {/* Question Content */}
        <div className="lg:col-span-3 space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-8 sm:p-12">
              <div className="prose prose-red max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg font-medium italic">
                  "{question.body}"
                </p>
              </div>

              {question.attachment && (
                <div className="mt-10 pt-10 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 overflow-hidden text-ellipsis max-w-[200px] sm:max-w-md">
                        {question.attachmentName || 'Supplemental Material'}
                      </h4>
                      <a
                        href={`/api/${question.attachment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-red-600 uppercase tracking-[.2em] hover:underline"
                      >
                        Download File
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Answer Area */}
          {user && (
            <div className="bg-gray-900 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              <div className="relative z-10">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">Your Answer</h2>
                <form onSubmit={handleSubmitAnswer} className="space-y-6">
                  <textarea
                    value={answerBody}
                    onChange={(e) => setAnswerBody(e.target.value)}
                    rows="5"
                    className="w-full bg-white/5 border-white/10 rounded-2xl px-6 py-5 text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-red-500 focus:bg-white/10 transition-all italic"
                    placeholder="Write your answer here..."
                  />
                  <button
                    type="submit"
                    disabled={submitAnswerMutation.isLoading || !answerBody.trim()}
                    className="bg-white text-gray-900 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 shadow-xl text-sm"
                  >
                    {submitAnswerMutation.isLoading ? 'Posting...' : 'Post Answer'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Answers List */}
      <div className="max-w-4xl mx-auto space-y-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between border-b-2 border-gray-100 pb-6 mb-10">
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            Community <span className="text-red-600">Answers</span>
          </h2>
          <span className="bg-gray-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
            {answers.length} Answers
          </span>
        </div>

        {answers.length > 0 ? (
          <div className="space-y-12">
            {answers.sort((a, b) => b.isAccepted - a.isAccepted).map((answer) => (
              <div
                key={answer._id}
                className={`relative group bg-white rounded-3xl p-8 sm:p-10 border-2 transition-all hover:shadow-2xl hover:shadow-gray-200/50 ${answer.isAccepted ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-gray-50'
                  }`}
              >
                {answer.isAccepted && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg z-20">
                    Accepted Answer
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-8">
                  {/* Voting */}
                  <div className="flex flex-row sm:flex-col items-center justify-center gap-4 bg-gray-50 rounded-2xl p-3 sm:px-4 sm:py-6 self-start">
                    <button
                      onClick={() => handleVote(answer._id, true)}
                      className="text-gray-400 hover:text-emerald-500 transition-colors transform hover:scale-125"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <span className="font-black text-xl text-gray-900 font-mono leading-none">{answer.votesCount || 0}</span>
                    <button
                      onClick={() => handleVote(answer._id, false)}
                      className="text-gray-400 hover:text-red-500 transition-colors transform hover:scale-125"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        {((question.isAnonymous || question.is_anonymous) &&
                          (question.user?._id === (answer.user?._id || answer.user?.id) ||
                            question.user?.id === (answer.user?._id || answer.user?.id))) ? (
                          <>
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <span className="block text-xs font-black text-gray-400 uppercase tracking-tight">ANONYMOUS (AUTHOR)</span>
                              <span className="block text-[8px] font-black text-gray-300 uppercase tracking-widest font-mono mt-1">
                                {new Date(answer.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-black uppercase text-gray-400 overflow-hidden shadow-sm">
                              {answer.user?.profilePicture ? (
                                <img src={answer.user.profilePicture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span>{answer.user?.name?.charAt(0) || 'U'}</span>
                              )}
                            </div>
                            <div>
                              <Link
                                to={`/profile/${answer.user?._id || answer.user?.id}`}
                                className="block text-sm font-black text-gray-900 hover:text-red-600 transition-colors uppercase tracking-tight"
                              >
                                {answer.user?.name}
                              </Link>
                              <span className="block text-[8px] font-black text-gray-300 uppercase tracking-widest font-mono mt-1">
                                {new Date(answer.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {isOwner && !answer.isAccepted && (
                        <button
                          onClick={() => handleAcceptAnswer(answer._id)}
                          className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors border-2 border-emerald-100 px-4 py-2 rounded-xl bg-emerald-50"
                        >
                          Accept Answer
                        </button>
                      )}
                    </div>

                    <div className="prose prose-sm max-w-none text-gray-700 font-medium leading-relaxed italic">
                      <p className="whitespace-pre-wrap">"{answer.body}"</p>
                    </div>

                    {answer.attachment && (
                      <div className="mt-6">
                        <a
                          href={`/api/${answer.attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline bg-blue-50 px-4 py-2 rounded-xl"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Attachment
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium font-mono uppercase tracking-[0.2em] text-xs">No answers yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;
