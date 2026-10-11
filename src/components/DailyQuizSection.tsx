import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  LogIn,
  AlertCircle,
  Check,
  Clock,
  Coffee,
  RotateCcw,
} from 'lucide-react';
import { DailyQuiz, QuizAttempt } from '../types/quiz';
import { fetchTodayQuizFromBackend, submitQuizAnswersToBackend, fetchCustomerQuizPointsFromBackend } from '../services/loyaltyApi';
import { getActiveCustomer } from '../services/loyalty';
import { LoyaltyCustomer } from '../types/loyalty';
import { CelebratoryConfetti } from './CelebratoryConfetti';

interface DailyQuizSectionProps {
  onOpenCustomerAuth?: (mode: 'login' | 'signup' | 'card') => void;
  onOpenLoyalty?: () => void;
}

export const DailyQuizSection: React.FC<DailyQuizSectionProps> = ({
  onOpenCustomerAuth,
  onOpenLoyalty,
}) => {
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [hasAttempted, setHasAttempted] = useState<boolean>(false);
  const [userAttempt, setUserAttempt] = useState<QuizAttempt | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(-1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [customerQuizPoints, setCustomerQuizPoints] = useState<number | null>(null);
  const [activeCustomer, setActiveCustomerState] = useState<LoyaltyCustomer | null>(() =>
    getActiveCustomer(),
  );

  // Celebratory Confetti Animation State (triggers on correct answer)
  const [showCelebrationConfetti, setShowCelebrationConfetti] = useState<boolean>(false);
  const hasAutoCelebratedRef = useRef<boolean>(false);

  const loadQuiz = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchTodayQuizFromBackend();
      if (data && data.quiz) {
        setQuiz(data.quiz);
        setHasAttempted(Boolean(data.hasAttempted));
        setUserAttempt(data.userAttempt || null);

        if (data.userAttempt && typeof data.userAttempt.selectedOptionIndex === 'number') {
          setSelectedOptionIndex(data.userAttempt.selectedOptionIndex);
        } else if (data.userAttempt && Array.isArray(data.userAttempt.answers) && typeof data.userAttempt.answers[0] === 'number') {
          setSelectedOptionIndex(data.userAttempt.answers[0]);
        }

        // Auto trigger celebratory confetti once if customer has answered correctly
        if (data.userAttempt?.isCorrect && !hasAutoCelebratedRef.current) {
          hasAutoCelebratedRef.current = true;
          setShowCelebrationConfetti(true);
        }
      } else {
        setQuiz(null);
      }
    } catch {
      // Graceful fallback on network glitch
      setQuiz(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerPoints = async () => {
    if (!getActiveCustomer()) {
      setCustomerQuizPoints(null);
      return;
    }
    try {
      const res = await fetchCustomerQuizPointsFromBackend();
      if (res && typeof res.pointsBalance === 'number') {
        setCustomerQuizPoints(res.pointsBalance);
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    loadQuiz();
    loadCustomerPoints();

    const handleAuthChange = () => {
      setActiveCustomerState(getActiveCustomer());
      loadQuiz();
      loadCustomerPoints();
    };

    window.addEventListener('venty:loyalty:updated', handleAuthChange);
    window.addEventListener('venty-loyalty-updated', handleAuthChange);
    return () => {
      window.removeEventListener('venty:loyalty:updated', handleAuthChange);
      window.removeEventListener('venty-loyalty-updated', handleAuthChange);
    };
  }, []);

  const handleSubmit = async () => {
    if (!quiz) return;

    if (!activeCustomer) {
      if (onOpenCustomerAuth) {
        onOpenCustomerAuth('login');
      } else if (onOpenLoyalty) {
        onOpenLoyalty();
      }
      return;
    }

    if (selectedOptionIndex < 0) {
      setErrorMessage('Please select one of the answer choices above before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await submitQuizAnswersToBackend(quiz.id, selectedOptionIndex);
      if (res && res.success) {
        setSubmissionResult(res);
        setHasAttempted(true);
        setUserAttempt(res.attempt);
        if (typeof res.quizPointsBalance === 'number') {
          setCustomerQuizPoints(res.quizPointsBalance);
        }
        if (res.isCorrect) {
          setShowCelebrationConfetti(true);
        }
        // Update customer profile event
        window.dispatchEvent(new CustomEvent('venty:loyalty:updated'));
      }
    } catch (err: any) {
      if (err?.status === 409 || err?.message?.includes('already')) {
        setErrorMessage('You have already answered today\'s quiz. One attempt allowed per customer.');
        setHasAttempted(true);
      } else {
        setErrorMessage(err?.message || 'Failed to submit quiz. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <section className="py-14 sm:py-20 bg-[#faf6ef]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block w-8 h-8 border-3 border-[#c9833a] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  // 2. Polished Empty State when no quiz is currently published
  if (!quiz) {
    return (
      <section id="daily-quiz" className="py-14 sm:py-20 bg-[#faf6ef] relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#351016] text-[#faf6ee] text-[10px] font-sans font-bold uppercase tracking-[0.2em] mb-3 border border-[#c9833a]/30">
              <HelpCircle className="w-3.5 h-3.5 text-[#c9833a]" />
              <span>VENTY DAILY PALATE QUIZ</span>
            </div>
            <h2 className="font-serif italic font-bold text-3xl sm:text-4xl text-[#2d1217] tracking-tight">
              Daily Quiz
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-[#ded7c8] p-8 sm:p-12 text-center shadow-[0_15px_40px_-15px_rgba(53,16,22,0.08)] space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#351016]/10 text-[#351016] flex items-center justify-center mx-auto border border-[#c9833a]/25">
              <Coffee className="w-6 h-6 text-[#c9833a]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-[#2d1217]">
                Today's Daily Question is Brewing
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#614f44] max-w-md mx-auto leading-relaxed">
                Our baristas are preparing today's question. Check back soon to test your coffee knowledge and earn daily Quiz Points on your account!
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-[#8a7a6f]">
              <Sparkles className="w-3.5 h-3.5 text-[#c9833a]" />
              <span>One attempt per customer per day · +10 Quiz Points on correct answer</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 3. Normal Active / Attempted Quiz View
  const questionText = quiz.question || quiz.title;
  const optionsList = Array.isArray(quiz.options) && quiz.options.length > 0
    ? quiz.options
    : Array.isArray(quiz.questions?.[0]?.options)
    ? quiz.questions[0].options
    : [];

  const pointsReward = typeof quiz.points === 'number' ? quiz.points : 10;
  const isCompleted = hasAttempted || Boolean(submissionResult);
  const isAnswerCorrect = submissionResult?.isCorrect ?? userAttempt?.isCorrect ?? false;
  const revealedCorrectIndex = submissionResult?.correctOptionIndex ?? quiz.correctOptionIndex ?? userAttempt?.selectedOptionIndex ?? -1;
  const explanationText = submissionResult?.explanation || quiz.explanation || '';

  return (
    <section id="daily-quiz" className="py-14 sm:py-20 bg-[#faf6ef] relative overflow-hidden">
      {/* Decorative ambient coffee background accents */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-[#c9833a]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#351016]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header Ribbon */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#351016] text-[#faf6ee] text-[10px] font-sans font-bold uppercase tracking-[0.2em] mb-3 border border-[#c9833a]/30 shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>VENTY DAILY PALATE QUIZ</span>
          </div>

          <h2 className="font-serif italic font-bold text-3xl sm:text-4xl text-[#2d1217] tracking-tight">
            Daily Quiz
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#614f44] mt-2 leading-relaxed">
            {quiz.description || 'Test your palate and specialty coffee expertise. Answer today’s question correctly to earn verified Quiz Points!'}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#c9833a]/15 text-[#6b3a1f] text-xs font-semibold border border-[#c9833a]/30">
              <Award className="w-3.5 h-3.5 text-[#c9833a]" />
              <span>+{pointsReward} Quiz Points on Correct Answer</span>
            </div>

            {customerQuizPoints !== null && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#351016]/10 text-[#351016] text-xs font-semibold border border-[#351016]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#c9833a]" />
                <span>Your Balance: {customerQuizPoints} pts</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Quiz Card */}
        <div className="bg-white rounded-3xl border border-[#ded7c8] shadow-[0_15px_40px_-15px_rgba(53,16,22,0.12)] overflow-hidden relative">
          {/* Celebratory Confetti Animation */}
          <CelebratoryConfetti
            active={showCelebrationConfetti}
            onComplete={() => setShowCelebrationConfetti(false)}
            particleCount={140}
            durationMs={4200}
          />

          {/* Quiz Card Header HUD */}
          <div className="px-6 sm:px-8 py-4 bg-[#f8f4ec] border-b border-[#ded7c8] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#8a7a6f]">
                {quiz.dateKey}
              </span>
              <span className="text-[#ded7c8]">·</span>
              <span className="text-xs font-serif font-bold text-[#2d1217]">
                {quiz.title}
              </span>
            </div>

            {isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0eae1] text-[#351016] border border-[#ded7c8] text-[11px] font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Attempt Completed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#351016] text-[#faf6ee] text-[11px] font-mono font-bold border border-[#c9833a]/40">
                <span>1 Attempt Allowed Today</span>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Status Feedback Banner if already completed */}
            {isCompleted && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  isAnswerCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                {isAnswerCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1">
                  <div className="font-serif font-bold text-base leading-snug">
                    {isAnswerCorrect
                      ? `Brilliant! You answered today's Daily Quiz correctly.`
                      : `Nice try! That wasn't the correct answer today.`}
                  </div>
                  <p className="font-sans text-xs leading-relaxed opacity-90">
                    {isAnswerCorrect
                      ? `+${pointsReward} Quiz Points have been awarded to your account.`
                      : 'No points awarded this time. A fresh question will be published tomorrow!'}
                  </p>
                  <p className="text-[11px] font-mono text-[#614f44] pt-1">
                    ✓ You have completed today's attempt. Answers are locked.
                  </p>
                </div>
              </div>
            )}

            {/* The Question Text */}
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#c9833a] font-bold block">
                Today's Question:
              </span>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#2d1217] leading-snug">
                {questionText}
              </h3>
            </div>

            {/* 3 or 4 Answer Options */}
            <div
              role="radiogroup"
              aria-label="Daily Quiz Answer Choices"
              className="space-y-2.5"
            >
              {optionsList.map((optionText, idx) => {
                const isSelected = selectedOptionIndex === idx;
                const isCorrectOption = isCompleted && revealedCorrectIndex === idx;
                const isCustomerPickWrong = isCompleted && isSelected && !isAnswerCorrect;

                return (
                  <button
                    key={idx}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isCompleted || isSubmitting}
                    onClick={() => {
                      if (!isCompleted) {
                        setSelectedOptionIndex(idx);
                        setErrorMessage(null);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-2xl border text-sm font-sans flex items-center justify-between transition-all cursor-pointer disabled:cursor-default ${
                      isCorrectOption
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs font-medium ring-1 ring-emerald-400'
                        : isCustomerPickWrong
                        ? 'bg-rose-50 border-rose-300 text-rose-950 opacity-90'
                        : isSelected
                        ? 'bg-[#351016] border-[#351016] text-[#faf6ee] shadow-sm font-medium'
                        : 'bg-[#faf6ef]/60 hover:bg-[#faf6ef] border-[#ded7c8] text-[#351016] hover:border-[#c9833a]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 pr-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                          isCorrectOption
                            ? 'bg-emerald-600 text-white'
                            : isCustomerPickWrong
                            ? 'bg-rose-600 text-white'
                            : isSelected
                            ? 'bg-[#c9833a] text-[#14080a]'
                            : 'bg-black/5 text-[#8a7a6f]'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-snug">{optionText}</span>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isCorrectOption ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold uppercase">
                          <Check className="w-3 h-3" />
                          <span>Correct</span>
                        </span>
                      ) : isCustomerPickWrong ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold uppercase">
                          <XCircle className="w-3 h-3" />
                          <span>Your Pick</span>
                        </span>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#c9833a] bg-[#c9833a]'
                              : 'border-[#ded7c8] bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-[#14080a] stroke-[3]" />}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Educational Explanation Box (Shown after submission) */}
            {isCompleted && explanationText && (
              <div className="p-4 rounded-2xl bg-[#faf6ef] border border-[#ded7c8] text-xs text-[#4a3931] space-y-1.5">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#c9833a] uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Barista Master Note</span>
                </div>
                <p className="font-sans leading-relaxed text-[#351016]">
                  {explanationText}
                </p>
              </div>
            )}

            {/* Error Message Notice */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#ded7c8]">
              <div className="text-xs text-[#8a7a6f]">
                {activeCustomer ? (
                  <span className="flex items-center gap-1">
                    Playing as <strong className="text-[#351016]">{activeCustomer.name}</strong>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[#614f44]">
                    <LogIn className="w-3.5 h-3.5 text-[#c9833a]" />
                    <span>Log in to record your score & save earned Quiz Points</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {isCompleted ? (
                  onOpenLoyalty && (
                    <button
                      type="button"
                      onClick={onOpenLoyalty}
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#351016] hover:bg-[#20080d] text-[#faf6ee] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Award className="w-4 h-4 text-[#c9833a]" />
                      <span>View Quiz Points & Account</span>
                    </button>
                  )
                ) : !activeCustomer ? (
                  <button
                    type="button"
                    onClick={() => onOpenCustomerAuth ? onOpenCustomerAuth('login') : onOpenLoyalty ? onOpenLoyalty() : null}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#c9833a] hover:bg-[#b7742d] text-[#14080a] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In to Submit Answer</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting || selectedOptionIndex < 0}
                    onClick={handleSubmit}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#c9833a] hover:bg-[#b7742d] text-[#14080a] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#14080a] border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Answer...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Answer (+{pointsReward} Pts)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
