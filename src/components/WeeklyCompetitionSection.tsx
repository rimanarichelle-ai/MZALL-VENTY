import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Gift,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  LogIn,
  AlertCircle,
  Tag,
  Coffee,
  Cake,
} from 'lucide-react';
import { WeeklyCompetition } from '../types/competitions';
import { fetchCurrentCompetitionFromBackend, joinCompetitionOnBackend } from '../services/loyaltyApi';
import { getActiveCustomer } from '../services/loyalty';
import { LoyaltyCustomer } from '../types/loyalty';

interface WeeklyCompetitionSectionProps {
  onOpenCustomerAuth?: (mode: 'login' | 'signup' | 'card') => void;
  onOpenLoyalty?: () => void;
  onOpenOrderModal?: () => void;
}

export const WeeklyCompetitionSection: React.FC<WeeklyCompetitionSectionProps> = ({
  onOpenCustomerAuth,
  onOpenLoyalty,
  onOpenOrderModal,
}) => {
  const [competition, setCompetition] = useState<WeeklyCompetition | null>(null);
  const [isParticipating, setIsParticipating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCustomer, setActiveCustomerState] = useState<LoyaltyCustomer | null>(() =>
    getActiveCustomer(),
  );

  const loadCompetition = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchCurrentCompetitionFromBackend();
      if (data && data.competition) {
        setCompetition(data.competition);
        setIsParticipating(data.isParticipating);
      } else {
        setCompetition(null);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompetition();

    const handleAuthChange = () => {
      setActiveCustomerState(getActiveCustomer());
      loadCompetition();
    };

    window.addEventListener('venty:loyalty:updated', handleAuthChange);
    window.addEventListener('venty-loyalty-updated', handleAuthChange);
    return () => {
      window.removeEventListener('venty:loyalty:updated', handleAuthChange);
      window.removeEventListener('venty-loyalty-updated', handleAuthChange);
    };
  }, []);

  const handleJoin = async () => {
    if (!competition) return;
    if (!activeCustomer) {
      if (onOpenCustomerAuth) {
        onOpenCustomerAuth('login');
      } else if (onOpenLoyalty) {
        onOpenLoyalty();
      }
      return;
    }

    setIsJoining(true);
    setErrorMessage(null);
    setFeedbackMessage(null);
    try {
      const res = await joinCompetitionOnBackend(competition.id);
      if (res && res.success) {
        setIsParticipating(true);
        setFeedbackMessage(res.message);
        loadCompetition();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not join competition. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!competition) {
    return null;
  }

  const eligibleParticipantsCount = (competition.participants || []).filter(
    (p) => p.isEligible !== false,
  ).length;

  return (
    <section id="weekly-competition" className="py-14 sm:py-20 bg-[#f7f2e7] border-y border-[#dfd5c3] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Ribbon */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#351016] text-[#faf6ee] text-[10px] font-sans font-bold uppercase tracking-[0.2em] mb-3 border border-[#c9833a]/30">
            <Trophy className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>WEEK {competition.weekNumber} · COMMUNITY REWARDS</span>
          </div>

          <h2 className="font-serif italic font-bold text-3xl sm:text-4xl md:text-5xl text-[#2d1217] tracking-tight">
            {competition.title}
          </h2>

          <p className="font-sans text-xs sm:text-sm md:text-base text-[#614f44] mt-2.5 leading-relaxed">
            {competition.description}
          </p>

          <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono text-[#8a7a6f]">
            <Calendar className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>Active through {competition.endDate}</span>
            <span>·</span>
            <Users className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>{eligibleParticipantsCount} coffee lovers entered</span>
          </div>
        </div>

        {/* Competition Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Prizes Showcase (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#ded7c8] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-[#ded7c8]">
                <h3 className="font-serif font-bold text-xl text-[#2d1217] flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#c9833a]" />
                  <span>Featured Prizes & Rewards</span>
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a7a6f] bg-[#eee9de] px-2 py-0.5 rounded">
                  Weekly Selection
                </span>
              </div>

              <div className="space-y-3.5">
                {competition.prizes.map((prize, idx) => (
                  <div
                    key={prize.id || idx}
                    className="p-4 rounded-2xl bg-[#faf6ef] border border-[#ded7c8] flex items-start gap-3.5 hover:border-[#c9833a]/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#351016] text-[#f4d19b] flex items-center justify-center shrink-0 border border-[#c9833a]/30 font-serif font-bold text-sm">
                      #{idx + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="font-serif font-bold text-base text-[#2d1217]">
                          {prize.title}
                        </h4>
                        <span className="text-[11px] font-mono font-semibold text-[#c9833a] shrink-0">
                          {prize.quantity} winner{prize.quantity > 1 ? 's' : ''}
                        </span>
                      </div>

                      <p className="font-sans text-xs text-[#614f44] mt-1 leading-relaxed">
                        {prize.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligibility Note */}
            <div className="mt-6 pt-4 border-t border-[#ded7c8] flex items-center justify-between text-xs text-[#8a7a6f]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#c9833a]" />
                Selection rule:{' '}
                <strong>
                  {competition.winnerSelectionRule === 'MOST_ORDERS'
                    ? 'Most orders placed this week'
                    : competition.winnerSelectionRule === 'HIGHEST_STAMPS'
                    ? 'Top stamp collectors'
                    : 'Random verified draw'}
                </strong>
              </span>

              {onOpenOrderModal && (
                <button
                  type="button"
                  onClick={onOpenOrderModal}
                  className="text-[#6b3a1f] font-semibold underline underline-offset-2 hover:text-[#351016] cursor-pointer"
                >
                  Order to Qualify →
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Entry Status / Winners Banner (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-[#351016] text-[#faf6ee] border border-[#c9833a]/40 shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-[#f4d19b]" />
                <h3 className="font-serif font-bold text-xl text-white">
                  {competition.isDrawn ? 'Winners Announced!' : 'Enter the Weekly Draw'}
                </h3>
              </div>

              {competition.isDrawn && competition.winners.length > 0 ? (
                /* Winners Display */
                <div className="space-y-3">
                  <p className="font-sans text-xs text-[#d8cbb8]">
                    The official draw has concluded! Congratulations to this week's community winners:
                  </p>
                  <div className="space-y-2 mt-3">
                    {competition.winners.map((win, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/10 border border-[#c9833a]/30 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-serif font-bold text-sm text-[#f4d19b]">
                            {win.customerName}
                          </div>
                          <div className="font-sans text-xs text-white/80">{win.prizeTitle}</div>
                        </div>
                        <span className="font-mono text-[10px] bg-[#c9833a]/25 text-[#f4d19b] px-2 py-0.5 rounded">
                          Claimed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Participant Entry Status */
                <div className="space-y-4">
                  <p className="font-sans text-xs sm:text-sm text-[#e8dfd1] leading-relaxed">
                    Participation is complimentary for all VENTY customers. Earn extra chances with
                    every fresh espresso, pour-over, mocktail, or pastry order placed this week.
                  </p>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#f4d19b]">
                      <span>Your Registration Status:</span>
                      <strong className="font-mono">
                        {isParticipating ? 'Registered' : 'Not Registered'}
                      </strong>
                    </div>

                    {activeCustomer ? (
                      <div className="flex items-center justify-between text-[#e8dfd1]">
                        <span>Customer Account:</span>
                        <span>{activeCustomer.name}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#f4d19b]/80 italic">
                        Log in or create a customer profile to track your weekly entry.
                      </div>
                    )}
                  </div>

                  {feedbackMessage && (
                    <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{feedbackMessage}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Area */}
            {!competition.isDrawn && (
              <div className="pt-6 mt-6 border-t border-white/10">
                {isParticipating ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-300 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>You're in this week's draw!</span>
                    </span>

                    {onOpenOrderModal && (
                      <button
                        type="button"
                        onClick={onOpenOrderModal}
                        className="px-4 py-2 rounded-xl bg-[#c9833a] hover:bg-[#b7742d] text-[#1b0d09] text-xs font-bold transition-all cursor-pointer"
                      >
                        Boost Chances (+1 Order)
                      </button>
                    )}
                  </div>
                ) : activeCustomer ? (
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#c9833a] to-[#b7742d] hover:brightness-110 text-[#1b0d09] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isJoining ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-[#1b0d09] border-t-transparent rounded-full animate-spin" />
                        <span>Entering Draw...</span>
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4" />
                        <span>Enter Weekly Competition Free</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCustomerAuth) {
                        onOpenCustomerAuth('login');
                      } else if (onOpenLoyalty) {
                        onOpenLoyalty();
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#faf6ee] hover:bg-[#f4d19b] text-[#2d1217] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In to Enter Competition</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
