import React, { useState } from 'react';
import {
  Trophy,
  Gift,
  Plus,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  X,
  Dice5,
  Search,
} from 'lucide-react';
import {
  WeeklyCompetition,
  CompetitionPrize,
  CompetitionEligibility,
  WinnerSelectionRule,
  PrizeType,
} from '../../types/competitions';

interface CompetitionManagementViewProps {
  competitions: WeeklyCompetition[];
  isAdmin: boolean;
  onRefresh: () => void;
  onCreateCompetition: (payload: Partial<WeeklyCompetition>) => Promise<void>;
  onDrawCompetition: (id: string) => Promise<{ winners: any[]; message: string }>;
  onDeleteCompetition: (id: string) => Promise<void>;
}

export const CompetitionManagementView: React.FC<CompetitionManagementViewProps> = ({
  competitions,
  isAdmin,
  onRefresh,
  onCreateCompetition,
  onDrawCompetition,
  onDeleteCompetition,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'create' | null>(null);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [drawResult, setDrawResult] = useState<{ winners: any[]; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWeekNumber, setFormWeekNumber] = useState<number>(41);
  const [formYear, setFormYear] = useState<number>(2026);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formEligibility, setFormEligibility] = useState<CompetitionEligibility>('ALL_CUSTOMERS');
  const [formSelectionRule, setFormSelectionRule] = useState<WinnerSelectionRule>('RANDOM_DRAW');
  const [formPrizes, setFormPrizes] = useState<CompetitionPrize[]>([
    {
      id: 'prz-1',
      title: '1st Place: Free Specialty Drink & Whole Bean Bag (250g)',
      description: 'Choice of any signature drink on the menu plus single-origin beans.',
      type: 'FREE_DRINK',
      bonusStamps: 7,
      quantity: 1,
    },
    {
      id: 'prz-2',
      title: '2nd Place: Artisanal Basque Burnt Cheesecake & Drink',
      description: 'Freshly baked Basque cheesecake slice with any hot or iced latte.',
      type: 'FREE_DESSERT',
      bonusStamps: 4,
      quantity: 2,
    },
    {
      id: 'prz-3',
      title: '3rd Place: 20% Off Weekend Order Coupon',
      description: '20% discount on your next online order tray at VENTY THE COFFEE.',
      type: 'DISCOUNT_COUPON',
      discountPercentage: 20,
      quantity: 5,
    },
  ]);

  const openCreateModal = () => {
    setModalMode('create');
    setFormTitle('Miliana Coffee Lovers Weekly Cup');
    setFormDescription('All active customers placing pickup orders or earning loyalty stamps this week are eligible to win artisan rewards.');
    setFormWeekNumber(41);
    setFormYear(2026);
    const now = new Date();
    setFormStartDate(now.toLocaleDateString('en-CA'));
    const nextWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    setFormEndDate(nextWeek.toLocaleDateString('en-CA'));
    setFormEligibility('ALL_CUSTOMERS');
    setFormSelectionRule('RANDOM_DRAW');
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Competition title is required.');
      return;
    }
    if (!formStartDate || !formEndDate) {
      setFormError('Start date and end date are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload: Partial<WeeklyCompetition> = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        weekNumber: Number(formWeekNumber) || 41,
        year: Number(formYear) || 2026,
        startDate: formStartDate,
        endDate: formEndDate,
        eligibilityRule: formEligibility,
        winnerSelectionRule: formSelectionRule,
        prizes: formPrizes,
        isActive: true,
      };

      await onCreateCompetition(payload);
      setModalMode(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create competition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteDraw = async (competitionId: string) => {
    setIsSubmitting(true);
    try {
      const res = await onDrawCompetition(competitionId);
      setDrawResult(res);
      setDrawingId(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to draw competition winners.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#20080d] to-[#14080a] text-[#faf6ee] border border-[#c9833a]/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#351016] text-[#f4d19b] text-[10px] font-mono uppercase tracking-wider mb-2 border border-[#c9833a]/30">
            <Trophy className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>WEEKLY COMMUNITY ENGAGEMENT</span>
          </div>
          <h2 className="font-serif font-bold text-2xl text-white">Weekly Competition & Rewards Manager</h2>
          <p className="font-sans text-xs text-[#e8dcc8]/80 max-w-xl mt-1">
            Configure competitions, eligibility rules, and prizes (free drinks, desserts, coupons, loyalty stamps). Run server-side winner draws that issue real redeemable rewards directly into customer accounts.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c9833a] hover:bg-[#b7742d] text-[#14080a] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Weekly Competition</span>
          </button>
        )}
      </div>

      {/* Draw Result Notice */}
      {drawResult && (
        <div className="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-serif font-bold text-base text-white">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{drawResult.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setDrawResult(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {drawResult.winners.map((win, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20">
                <div className="font-bold text-white">{win.customerName}</div>
                <div className="text-emerald-300 text-[11px]">{win.prizeTitle}</div>
                <div className="font-mono text-[10px] text-emerald-400/80">{win.customerPhone}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitions List */}
      <div className="space-y-4">
        {competitions.map((comp) => {
          const eligibleCount = (comp.participants || []).filter((p) => p.isEligible !== false).length;

          return (
            <div
              key={comp.id}
              className="bg-[#17080a] rounded-3xl border border-[#c9833a]/25 p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-[#c9833a] font-bold">
                      Week {comp.weekNumber} · {comp.year}
                    </span>
                    <span className="text-[#e8dcc8]/40">·</span>
                    <span className="font-mono text-xs text-[#e8dcc8]/70">
                      {comp.startDate} → {comp.endDate}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-white">{comp.title}</h3>
                  <p className="font-sans text-xs text-[#e8dcc8]/80 mt-1">{comp.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      comp.isDrawn
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                        : comp.isActive
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {comp.isDrawn ? 'Drawn & Completed' : comp.isActive ? 'Active Draw' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Rules & Participants Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#1f0c10] border border-[#c9833a]/15 text-xs">
                <div>
                  <span className="font-mono text-[10px] text-[#e8dcc8]/60 block">Eligibility:</span>
                  <strong className="text-white">
                    {comp.eligibilityRule === 'ALL_CUSTOMERS'
                      ? 'All Customers'
                      : comp.eligibilityRule === 'MIN_ORDERS_1'
                      ? 'Min 1 Order this Week'
                      : comp.eligibilityRule === 'MIN_STAMPS_3'
                      ? 'Min 3 Loyalty Stamps'
                      : 'VIP Members'}
                  </strong>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-[#e8dcc8]/60 block">Winner Selection:</span>
                  <strong className="text-white">
                    {comp.winnerSelectionRule === 'MOST_ORDERS'
                      ? 'Most Orders Placed'
                      : comp.winnerSelectionRule === 'HIGHEST_STAMPS'
                      ? 'Highest Stamp Count'
                      : 'Random Verified Draw'}
                  </strong>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-[#e8dcc8]/60 block">Participants:</span>
                  <strong className="text-[#f4d19b]">
                    {eligibleCount} Eligible ({comp.participants?.length || 0} Total)
                  </strong>
                </div>
              </div>

              {/* Prizes Grid */}
              <div>
                <h4 className="font-serif font-bold text-sm text-[#f4d19b] mb-2 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-[#c9833a]" />
                  <span>Configured Prizes:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {comp.prizes.map((prz, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#14080a] border border-[#c9833a]/20 text-xs"
                    >
                      <div className="flex items-center justify-between text-[#c9833a] font-bold mb-1">
                        <span>Prize #{i + 1}</span>
                        <span className="font-mono text-[10px] bg-[#351016] px-1.5 py-0.2 rounded">
                          Qty: {prz.quantity}
                        </span>
                      </div>
                      <div className="font-semibold text-white truncate">{prz.title}</div>
                      <div className="text-[11px] text-[#e8dcc8]/70 mt-0.5">{prz.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#c9833a]/15">
                <span className="text-[10px] font-mono text-[#e8dcc8]/50">ID: {comp.id}</span>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    {!comp.isDrawn && (
                      <button
                        type="button"
                        onClick={() => handleExecuteDraw(comp.id)}
                        disabled={isSubmitting || eligibleCount === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#c9833a] hover:bg-[#b7742d] text-[#14080a] text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                        title={
                          eligibleCount === 0
                            ? 'Cannot draw: No eligible participants'
                            : 'Draw winners and automatically issue real rewards'
                        }
                      >
                        <Dice5 className="w-3.5 h-3.5" />
                        <span>Run Winner Draw</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteCompetition(comp.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 cursor-pointer"
                      title="Delete Competition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1b0c0e] border border-[#c9833a]/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#c9833a]/20 pb-4">
              <h3 className="font-serif font-bold text-xl text-white">Create Weekly Competition</h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-[#e8dcc8]/60 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#f4d19b] mb-1">
                  Competition Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Miliana Coffee Lovers Weekly Cup & Rewards"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs focus:outline-none focus:border-[#c9833a]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f4d19b] mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs focus:outline-none focus:border-[#c9833a]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#f4d19b] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#f4d19b] mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#f4d19b] mb-1">
                    Eligibility Rule
                  </label>
                  <select
                    value={formEligibility}
                    onChange={(e) => setFormEligibility(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs"
                  >
                    <option value="ALL_CUSTOMERS">All Customers (Free Entry)</option>
                    <option value="MIN_ORDERS_1">Min 1 Order this Week</option>
                    <option value="MIN_STAMPS_3">Min 3 Active Stamps</option>
                    <option value="VIP_MEMBERS">VIP Members (14+ Lifetime Stamps)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#f4d19b] mb-1">
                    Winner Selection Rule
                  </label>
                  <select
                    value={formSelectionRule}
                    onChange={(e) => setFormSelectionRule(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs"
                  >
                    <option value="RANDOM_DRAW">Random Verified Draw</option>
                    <option value="MOST_ORDERS">Most Orders Placed</option>
                    <option value="HIGHEST_STAMPS">Highest Stamp Collectors</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#c9833a]/20">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#e8dcc8]/70 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#c9833a] hover:bg-[#b7742d] text-[#14080a] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Competition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
