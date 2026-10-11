import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Zap,
  Clock,
  Award,
  Sparkles,
  RefreshCw,
  Flame,
  User,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';
import { QuizLeaderboardData, QuizLeaderboardEntry } from '../types/quiz';
import { fetchQuizLeaderboardFromBackend } from '../services/loyaltyApi';
import { getActiveCustomer } from '../services/loyalty';
import { LoyaltyCustomer } from '../types/loyalty';

interface QuizLeaderboardSectionProps {
  onOpenCustomerAuth?: (mode: 'login' | 'signup' | 'card') => void;
  onOpenLoyalty?: () => void;
}

export const QuizLeaderboardSection: React.FC<QuizLeaderboardSectionProps> = ({
  onOpenCustomerAuth,
  onOpenLoyalty,
}) => {
  const [leaderboardData, setLeaderboardData] = useState<QuizLeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<LoyaltyCustomer | null>(() =>
    getActiveCustomer(),
  );

  const loadLeaderboard = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setFetchError(null);

    try {
      const res = await fetchQuizLeaderboardFromBackend();
      if (res && res.success && res.data) {
        setLeaderboardData(res.data);
      } else {
        setFetchError('Unable to load leaderboard results.');
      }
    } catch {
      setFetchError('Connection error while fetching leaderboard. Please retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();

    const handleUpdate = () => {
      setActiveCustomer(getActiveCustomer());
      loadLeaderboard(true);
    };

    window.addEventListener('venty:loyalty:updated', handleUpdate);
    window.addEventListener('venty-loyalty-updated', handleUpdate);

    return () => {
      window.removeEventListener('venty:loyalty:updated', handleUpdate);
      window.removeEventListener('venty-loyalty-updated', handleUpdate);
    };
  }, []);

  const handleScrollToQuiz = () => {
    const el = document.getElementById('daily-quiz');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-[#f5efe6]/70 border-t border-[#ded7c8]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-[#c9833a] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs text-[#8a7a6f]">Loading live daily quiz rankings from server...</p>
        </div>
      </section>
    );
  }

  if (fetchError) {
    return (
      <section className="py-16 bg-[#faf6ef] border-t border-[#ded7c8]">
        <div className="max-w-md mx-auto px-4 text-center p-6 bg-white rounded-3xl border border-[#ded7c8] shadow-sm space-y-3">
          <Trophy className="w-8 h-8 text-[#c9833a] mx-auto opacity-60" />
          <h3 className="font-serif font-bold text-lg text-[#2d1217]">Today&apos;s Quiz Leaderboard</h3>
          <p className="text-xs text-[#614f44]">{fetchError}</p>
          <button
            type="button"
            onClick={() => loadLeaderboard(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#351016] text-[#faf6ee] text-xs font-bold hover:bg-[#c9833a] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      </section>
    );
  }

  const entries = leaderboardData?.entries || [];
  const top1 = entries[0] || null;
  const top2 = entries[1] || null;
  const top3 = entries[2] || null;
  const userEntry = leaderboardData?.currentUserEntry;

  // Key summary metrics
  const fastestTime = top1?.speedFormatted || '—';
  const totalCount = leaderboardData?.totalParticipants ?? entries.length;
  const perfectScoreCount = entries.filter((e) => e.isPerfectScore).length;
  const isNoQuizScheduled = leaderboardData?.quizStatus === 'NO_QUIZ_TODAY' || !leaderboardData?.quizId;

  return (
    <section
      id="quiz-leaderboard"
      className="py-16 sm:py-24 bg-gradient-to-b from-[#faf6ef] via-[#f7f2e7] to-[#faf6ef] border-t border-[#ded7c8] relative overflow-hidden"
    >
      {/* Decorative ambient coffee background lighting */}
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-[#c9833a]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-[#351016]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#351016] text-[#f4d19b] text-[10px] font-sans font-bold uppercase tracking-[0.2em] mb-3 border border-[#c9833a]/30 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>DAILY PALATE PODIUM</span>
          </div>

          <h2 className="font-serif italic font-bold text-3xl sm:text-4xl text-[#2d1217] tracking-tight">
            Today&apos;s Quiz Leaderboard
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#614f44] mt-2.5 leading-relaxed">
            Fastest extraction masters and specialty coffee palates. Rankings are determined by score
            accuracy first, with fastest speed (in seconds) serving as the ultimate tie-breaker within
            the 2-minute challenge window!
          </p>

          {/* Quick Metrics Strip */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto">
            <div className="p-2.5 rounded-2xl bg-white border border-[#ded7c8] shadow-sm text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#8a7a6f]">
                <Zap className="w-3 h-3 text-[#c9833a]" />
                <span>Fastest Speed</span>
              </div>
              <div className="font-serif font-bold text-base text-[#2d1217] mt-0.5">
                {fastestTime}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-[#ded7c8] shadow-sm text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#8a7a6f]">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>Perfect Scores</span>
              </div>
              <div className="font-serif font-bold text-base text-[#2d1217] mt-0.5">
                {perfectScoreCount}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-[#ded7c8] shadow-sm text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#8a7a6f]">
                <Clock className="w-3 h-3 text-[#c9833a]" />
                <span>Time Limit</span>
              </div>
              <div className="font-serif font-bold text-base text-[#2d1217] mt-0.5">
                {leaderboardData?.timeLimitSeconds ? `${leaderboardData.timeLimitSeconds}s` : '120s'}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-[#ded7c8] shadow-sm text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#8a7a6f]">
                <User className="w-3 h-3 text-[#8a7a6f]" />
                <span>Participants</span>
              </div>
              <div className="font-serif font-bold text-base text-[#2d1217] mt-0.5">
                {totalCount}
              </div>
            </div>
          </div>
        </div>

        {/* Current User Rank Card (if participated) OR Call to Action */}
        <div className="mb-8">
          {userEntry ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#351016] via-[#2a0c12] to-[#20080d] text-[#faf6ee] border border-[#c9833a]/40 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#c9833a]/20 border border-[#c9833a]/40 flex items-center justify-center text-[#f4d19b] font-mono font-bold text-lg shrink-0">
                  #{userEntry.rank}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c9833a]/30 text-[#f4d19b] text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3 text-[#c9833a]" />
                    <span>Your Recorded Ranking</span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-white">
                    {userEntry.customerDisplayName} · Rank #{userEntry.rank} of {totalCount}
                  </h4>
                  <p className="text-xs text-[#e8dcc8]/80 mt-0.5">
                    Score: {userEntry.score} / {userEntry.totalQuestions} ({userEntry.accuracyPercent}%) · Speed: {userEntry.speedFormatted}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {userEntry.isPerfectScore && (
                  <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                    🥇 Perfect Score
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => loadLeaderboard(true)}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#f4d19b] transition-all cursor-pointer"
                  title="Refresh Leaderboard"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#f7f2e7] border border-[#ded7c8] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#351016] text-[#c9833a] shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#2d1217]">
                    Haven&apos;t taken today&apos;s 2-minute challenge yet?
                  </h4>
                  <p className="text-xs text-[#614f44] mt-0.5">
                    Test your palate speed on today&apos;s 3 questions to claim your spot on the podium!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleScrollToQuiz}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#351016] hover:bg-[#c9833a] text-[#faf6ee] hover:text-white font-sans text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
              >
                <span>Take Daily Quiz</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Podium Layout for Top 3 */}
        {entries.length > 0 && (
          <div className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
              {/* 2nd Place Podium */}
              {top2 && (
                <div className="order-2 md:order-1 bg-white rounded-3xl p-5 border-2 border-slate-300 shadow-md relative transition-transform hover:-translate-y-1">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-200 border border-slate-400 text-slate-800 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Medal className="w-3 h-3 text-slate-500" />
                    <span>2nd Place</span>
                  </div>

                  <div className="text-center pt-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-serif font-bold text-xl mb-2">
                      2
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#2d1217] truncate">
                      {top2.customerDisplayName}
                    </h3>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-mono font-semibold">
                      <Zap className="w-3 h-3 text-slate-600" />
                      <span>{top2.speedFormatted}</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-around text-xs">
                      <div>
                        <span className="text-[#8a7a6f] block text-[10px]">Score</span>
                        <strong className="text-[#2d1217] font-mono">
                          {top2.score}/{top2.totalQuestions}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#8a7a6f] block text-[10px]">Accuracy</span>
                        <strong className="text-emerald-700 font-mono">
                          {top2.accuracyPercent}%
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place Champion Podium */}
              {top1 && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-[#fffaf2] to-white rounded-3xl p-6 border-2 border-amber-400 shadow-[0_20px_45px_-15px_rgba(201,131,58,0.25)] relative transform md:-translate-y-3">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-[#c9833a] text-white font-serif font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                    <Crown className="w-3.5 h-3.5 text-amber-100 animate-bounce" />
                    <span>1st Champion</span>
                  </div>

                  <div className="text-center pt-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 border-2 border-amber-500 flex items-center justify-center text-[#351016] font-serif font-bold text-2xl shadow-inner mb-2">
                      🥇
                    </div>
                    <h3 className="font-serif font-bold text-lg text-[#2d1217] truncate">
                      {top1.customerDisplayName}
                    </h3>

                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100/90 text-amber-900 text-xs font-mono font-bold border border-amber-300">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>{top1.speedFormatted} (Fastest)</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-200/60 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-1.5 rounded-lg bg-amber-50/50">
                        <span className="text-[#8a7a6f] block text-[10px]">Score</span>
                        <strong className="text-[#2d1217] font-mono text-sm">
                          {top1.score}/{top1.totalQuestions}
                        </strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-50/60">
                        <span className="text-[#8a7a6f] block text-[10px]">Accuracy</span>
                        <strong className="text-emerald-700 font-mono text-sm">
                          {top1.accuracyPercent}%
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place Podium */}
              {top3 && (
                <div className="order-3 bg-white rounded-3xl p-5 border-2 border-amber-700/30 shadow-md relative transition-transform hover:-translate-y-1">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-900/10 border border-amber-800/30 text-amber-900 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Medal className="w-3 h-3 text-amber-700" />
                    <span>3rd Place</span>
                  </div>

                  <div className="text-center pt-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-900 font-serif font-bold text-xl mb-2">
                      3
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#2d1217] truncate">
                      {top3.customerDisplayName}
                    </h3>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-mono font-semibold">
                      <Zap className="w-3 h-3 text-amber-700" />
                      <span>{top3.speedFormatted}</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-around text-xs">
                      <div>
                        <span className="text-[#8a7a6f] block text-[10px]">Score</span>
                        <strong className="text-[#2d1217] font-mono">
                          {top3.score}/{top3.totalQuestions}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#8a7a6f] block text-[10px]">Accuracy</span>
                        <strong className="text-emerald-700 font-mono">
                          {top3.accuracyPercent}%
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Leaderboard Table (Ranks 4 and beyond) */}
        <div className="bg-white rounded-3xl border border-[#ded7c8] shadow-[0_10px_35px_-10px_rgba(53,16,22,0.08)] overflow-hidden">
          <div className="px-6 py-4 bg-[#f7f2e7] border-b border-[#ded7c8] flex items-center justify-between">
            <h4 className="font-serif font-bold text-sm text-[#2d1217] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#c9833a]" />
              <span>Full Daily Participants Standings</span>
            </h4>

            <button
              type="button"
              onClick={() => loadLeaderboard(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 text-xs text-[#614f44] hover:text-[#351016] font-mono cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <HelpCircle className="w-8 h-8 text-[#c9833a] mx-auto opacity-70" />
              <p className="font-serif font-semibold text-base text-[#2d1217]">
                No quiz attempts recorded yet today.
              </p>
              <p className="text-xs text-[#614f44]">
                Be the first coffee lover to take the quiz above and claim Rank #1!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#ded7c8]/60 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[540px]">
                <thead>
                  <tr className="bg-[#faf6ef]/70 text-[11px] font-mono uppercase tracking-wider text-[#8a7a6f]">
                    <th className="py-3 px-5">Rank</th>
                    <th className="py-3 px-5">Connoisseur</th>
                    <th className="py-3 px-5 text-center">Score</th>
                    <th className="py-3 px-5 text-center">Speed</th>
                    <th className="py-3 px-5 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ded7c8]/40 text-xs font-sans">
                  {entries.map((entry) => {
                    const isUserRow = entry.isCurrentUser;
                    return (
                      <tr
                        key={entry.rank}
                        className={`transition-colors ${
                          isUserRow
                            ? 'bg-[#c9833a]/15 font-semibold text-[#2d1217]'
                            : 'hover:bg-[#faf6ef] text-[#2d1217]'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-5">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-mono text-xs font-bold ${
                              entry.rank === 1
                                ? 'bg-amber-400 text-[#351016]'
                                : entry.rank === 2
                                ? 'bg-slate-300 text-slate-800'
                                : entry.rank === 3
                                ? 'bg-amber-700/30 text-amber-900'
                                : 'bg-[#eee9de] text-[#614f44]'
                            }`}
                          >
                            {entry.rank}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <span>{entry.customerDisplayName}</span>
                            {isUserRow && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#351016] text-[#f4d19b]">
                                You
                              </span>
                            )}
                            {entry.isPerfectScore && (
                              <span className="text-[10px] text-amber-700 font-mono hidden sm:inline">
                                ★ Perfect
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-3 px-5 text-center font-mono font-bold">
                          {entry.score} / {entry.totalQuestions}
                        </td>

                        {/* Speed */}
                        <td className="py-3 px-5 text-center">
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-[#614f44] bg-[#f7f2e7] px-2.5 py-1 rounded-full border border-[#ded7c8]">
                            <Zap className="w-3 h-3 text-[#c9833a]" />
                            {entry.speedFormatted}
                          </span>
                        </td>

                        {/* Accuracy */}
                        <td className="py-3 px-5 text-right font-mono font-semibold text-emerald-800">
                          {entry.accuracyPercent}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
