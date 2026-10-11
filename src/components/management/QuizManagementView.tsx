import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  X,
  Search,
  Eye,
  Lock,
  Radio,
  Check,
  Send,
  Archive,
  BarChart2,
  Info,
} from 'lucide-react';
import { DailyQuiz } from '../../types/quiz';
import { formatAlgiersDate, getAlgiersDateKey } from '../../utils/algiersTime';

interface QuizManagementViewProps {
  quizzes: DailyQuiz[];
  isAdmin: boolean;
  onRefresh: () => void;
  onCreateQuiz: (payload: Partial<DailyQuiz>) => Promise<void>;
  onUpdateQuiz: (id: string, payload: Partial<DailyQuiz>) => Promise<void>;
  onPublishQuiz?: (id: string) => Promise<void>;
  onUnpublishQuiz?: (id: string) => Promise<void>;
  onDeleteQuiz: (id: string) => Promise<void>;
}

export const QuizManagementView: React.FC<QuizManagementViewProps> = ({
  quizzes,
  isAdmin,
  onRefresh,
  onCreateQuiz,
  onUpdateQuiz,
  onPublishQuiz,
  onUnpublishQuiz,
  onDeleteQuiz,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<DailyQuiz | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<DailyQuiz | null>(null);
  const [previewSelectedOption, setPreviewSelectedOption] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for one daily multiple-choice question
  const [formTitle, setFormTitle] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectOptionIndex, setFormCorrectOptionIndex] = useState<number>(0);
  const [formPoints, setFormPoints] = useState<number>(10);
  const [formExplanation, setFormExplanation] = useState('');
  const [formDateKey, setFormDateKey] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const todayKey = getAlgiersDateKey(new Date());

  const openCreateModal = () => {
    setModalMode('create');
    setEditingQuiz(null);
    setFormTitle('Specialty Coffee Discovery');
    setFormQuestion('');
    setFormOptions(['', '', '', '']);
    setFormCorrectOptionIndex(0);
    setFormPoints(10);
    setFormExplanation('');
    setFormDateKey(todayKey);
    setFormDescription('Daily multiple-choice palate quiz for VENTY customers.');
    setFormError(null);
  };

  const openEditModal = (q: DailyQuiz) => {
    setModalMode('edit');
    setEditingQuiz(q);
    setFormTitle(q.title || '');
    setFormQuestion(q.question || q.title || '');
    const currentOptions = Array.isArray(q.options) && q.options.length >= 3 ? [...q.options] : ['', '', '', ''];
    while (currentOptions.length < 3) currentOptions.push('');
    setFormOptions(currentOptions);
    setFormCorrectOptionIndex(typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0);
    setFormPoints(typeof q.points === 'number' ? q.points : 10);
    setFormExplanation(q.explanation || '');
    setFormDateKey(q.dateKey || todayKey);
    setFormDescription(q.description || '');
    setFormError(null);
  };

  const handleAddOption = () => {
    if (formOptions.length >= 4) return;
    setFormOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (indexToRemove: number) => {
    if (formOptions.length <= 3) return;
    setFormOptions((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (formCorrectOptionIndex >= indexToRemove && formCorrectOptionIndex > 0) {
      setFormCorrectOptionIndex((prev) => prev - 1);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const validateForm = (): boolean => {
    if (!formQuestion.trim() && !formTitle.trim()) {
      setFormError('Question text is required.');
      return false;
    }
    const cleanOptions = formOptions.map((o) => o.trim()).filter((o) => o.length > 0);
    if (cleanOptions.length < 3 || cleanOptions.length > 4) {
      setFormError('Please provide exactly 3 or 4 non-empty answer options.');
      return false;
    }
    if (formCorrectOptionIndex < 0 || formCorrectOptionIndex >= cleanOptions.length) {
      setFormError('Please select exactly one valid correct answer choice.');
      return false;
    }
    if (formPoints <= 0 || isNaN(formPoints)) {
      setFormError('Points awarded must be a positive number (e.g. 10).');
      return false;
    }
    if (!formDateKey.trim()) {
      setFormError('Quiz business date is required.');
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSave = async (publishImmediately: boolean = false) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const cleanOptions = formOptions.map((o) => o.trim()).filter((o) => o.length > 0);
      const payload: Partial<DailyQuiz> = {
        title: formTitle.trim() || formQuestion.trim(),
        question: formQuestion.trim() || formTitle.trim(),
        options: cleanOptions,
        correctOptionIndex: formCorrectOptionIndex,
        points: Number(formPoints) || 10,
        explanation: formExplanation.trim(),
        description: formDescription.trim(),
        dateKey: formDateKey,
        status: publishImmediately ? 'PUBLISHED' : modalMode === 'edit' && editingQuiz?.status ? editingQuiz.status : 'DRAFT',
        isPublished: publishImmediately || (modalMode === 'edit' && editingQuiz?.isPublished),
        timeLimitSeconds: 120,
      };

      if (modalMode === 'create') {
        await onCreateQuiz(payload);
      } else if (modalMode === 'edit' && editingQuiz) {
        await onUpdateQuiz(editingQuiz.id, payload);
      }
      setModalMode(null);
      onRefresh();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      !searchQuery.trim() ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.question && q.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
      q.dateKey.includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PUBLISHED') return q.status === 'PUBLISHED' || q.isPublished;
    if (statusFilter === 'DRAFT') return q.status === 'DRAFT' || (!q.isPublished && q.status !== 'ARCHIVED');
    if (statusFilter === 'ARCHIVED') return q.status === 'ARCHIVED';

    return true;
  });

  // Calculate high-level metrics
  const publishedTodayQuiz = quizzes.find(
    (q) => (q.status === 'PUBLISHED' || q.isPublished) && q.dateKey === todayKey,
  ) || quizzes.find((q) => q.status === 'PUBLISHED' || q.isPublished);

  const totalSubmissions = quizzes.reduce((sum, q) => sum + (q.stats?.totalAttempts || 0), 0);
  const totalCorrectSubmissions = quizzes.reduce((sum, q) => sum + (q.stats?.correctAttempts || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#20080d] via-[#16080a] to-[#120507] text-[#faf6ee] border border-[#c9833a]/30 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#351016] text-[#f4d19b] text-[10px] font-mono uppercase tracking-wider mb-2 border border-[#c9833a]/30">
            <HelpCircle className="w-3.5 h-3.5 text-[#c9833a]" />
            <span>DAILY ENGAGEMENT & SEPARATE QUIZ POINTS</span>
          </div>
          <h2 className="font-serif font-bold text-2xl text-white">Daily Quiz Manager</h2>
          <p className="font-sans text-xs text-[#e8dcc8]/80 max-w-xl mt-1">
            Author and publish daily specialty coffee multiple-choice questions. Customers answer on the homepage once per day to earn verified Quiz Points, completely independent from purchase loyalty stamps.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c9833a] hover:bg-[#b7742d] text-[#14080a] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Question</span>
          </button>
        )}
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Live Status */}
        <div className="bg-[#17080a] rounded-2xl border border-[#c9833a]/25 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#e8dcc8]/60 mb-2">
            <span>Today's Live Quiz</span>
            <Sparkles className="w-4 h-4 text-[#c9833a]" />
          </div>
          {publishedTodayQuiz ? (
            <div>
              <div className="font-serif font-bold text-sm text-emerald-400 line-clamp-1">
                {publishedTodayQuiz.title}
              </div>
              <div className="text-[10px] font-mono text-[#f4d19b] mt-0.5">
                {publishedTodayQuiz.dateKey} · +{publishedTodayQuiz.points || 10} Quiz Pts
              </div>
            </div>
          ) : (
            <div>
              <div className="font-serif text-sm text-amber-400/90 font-semibold">None Published</div>
              <div className="text-[10px] font-mono text-[#e8dcc8]/50 mt-0.5">Homepage displays empty state</div>
            </div>
          )}
        </div>

        {/* Total Questions */}
        <div className="bg-[#17080a] rounded-2xl border border-[#c9833a]/25 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#e8dcc8]/60 mb-2">
            <span>Total Questions</span>
            <HelpCircle className="w-4 h-4 text-[#c9833a]" />
          </div>
          <div>
            <div className="font-serif font-bold text-2xl text-white">{quizzes.length}</div>
            <div className="text-[10px] font-mono text-[#e8dcc8]/60 mt-0.5">
              {quizzes.filter((q) => q.status === 'PUBLISHED' || q.isPublished).length} Published · {quizzes.filter((q) => q.status === 'DRAFT').length} Drafts
            </div>
          </div>
        </div>

        {/* Total Submissions */}
        <div className="bg-[#17080a] rounded-2xl border border-[#c9833a]/25 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#e8dcc8]/60 mb-2">
            <span>Total Submissions</span>
            <BarChart2 className="w-4 h-4 text-[#c9833a]" />
          </div>
          <div>
            <div className="font-serif font-bold text-2xl text-white">{totalSubmissions}</div>
            <div className="text-[10px] font-mono text-[#e8dcc8]/60 mt-0.5">
              Unique customer attempts recorded
            </div>
          </div>
        </div>

        {/* Correct Answers & Accuracy */}
        <div className="bg-[#17080a] rounded-2xl border border-[#c9833a]/25 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#e8dcc8]/60 mb-2">
            <span>Overall Accuracy</span>
            <Award className="w-4 h-4 text-[#c9833a]" />
          </div>
          <div>
            <div className="font-serif font-bold text-2xl text-[#f4d19b]">
              {totalSubmissions > 0 ? `${Math.round((totalCorrectSubmissions / totalSubmissions) * 100)}%` : '—'}
            </div>
            <div className="text-[10px] font-mono text-[#e8dcc8]/60 mt-0.5">
              {totalCorrectSubmissions} of {totalSubmissions} correct
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#17080a] border border-[#c9833a]/20 w-full sm:w-auto">
          {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#c9833a] text-[#14080a] font-bold shadow-xs'
                  : 'text-[#e8dcc8]/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'ALL' ? 'All Quizzes' : tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 bg-[#1b0c0e] p-2 rounded-xl border border-[#c9833a]/25 w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#c9833a] ml-1.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or date..."
            className="bg-transparent text-xs text-[#faf6ee] placeholder:text-[#e8dcc8]/40 focus:outline-none w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#e8dcc8]/40 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quizzes Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuizzes.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#17080a] border border-[#c9833a]/20 rounded-3xl space-y-3">
            <HelpCircle className="w-8 h-8 text-[#c9833a]/60 mx-auto" />
            <h3 className="font-serif font-bold text-lg text-white">No Quizzes Found</h3>
            <p className="text-xs text-[#e8dcc8]/60 max-w-sm mx-auto">
              {searchQuery ? 'No quizzes match your current search terms.' : 'Create your first daily coffee question to engage customers and award Quiz Points.'}
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#c9833a] hover:bg-[#b7742d] text-[#14080a] font-bold text-xs uppercase"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Question</span>
              </button>
            )}
          </div>
        ) : (
          filteredQuizzes.map((q) => {
            const isPublished = q.status === 'PUBLISHED' || q.isPublished;
            const hasSubmissions = q.hasSubmissions || (q.stats?.totalAttempts || 0) > 0;
            const attemptsCount = q.stats?.totalAttempts || 0;
            const correctCount = q.stats?.correctAttempts || 0;

            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all ${
                  isPublished
                    ? 'bg-[#1a0b0e] border-[#c9833a]/40 shadow-[0_0_15px_rgba(201,131,58,0.08)]'
                    : 'bg-[#150709] border-[#c9833a]/20'
                }`}
              >
                <div>
                  {/* Card Header & Status Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-[#c9833a] font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{q.dateKey} (Africa/Algiers)</span>
                        </span>
                        {q.dateKey === todayKey && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#c9833a]/20 text-[#f4d19b] text-[9px] font-mono font-bold uppercase">
                            TODAY
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-base text-white leading-snug">
                        {q.title}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isPublished ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>PUBLISHED</span>
                        </span>
                      ) : q.status === 'ARCHIVED' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-950/70 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                          <Archive className="w-2.5 h-2.5" />
                          <span>ARCHIVED</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                          DRAFT
                        </span>
                      )}

                      {hasSubmissions && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-500/25 text-[9px] font-mono flex items-center gap-1" title="Submissions recorded: Historical question and answer key are locked">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="p-3 rounded-xl bg-[#1e0c0f] border border-[#c9833a]/15 mb-3">
                    <span className="text-[10px] font-mono text-[#c9833a] block mb-0.5">QUESTION TEXT:</span>
                    <p className="font-sans text-xs text-[#faf6ee] leading-relaxed">
                      {q.question || q.title}
                    </p>
                  </div>

                  {/* Options List with Correct Indicator */}
                  <div className="space-y-1.5 mb-3">
                    <span className="text-[10px] font-mono text-[#e8dcc8]/60 block mb-1">
                      OPTIONS ({q.options?.length || 0}):
                    </span>
                    {(q.options || []).map((opt, optIdx) => {
                      const isCorrect = optIdx === q.correctOptionIndex;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-sans ${
                            isCorrect
                              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 font-medium'
                              : 'bg-[#14080a]/60 text-[#e8dcc8]/80 border border-[#c9833a]/10'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                            isCorrect ? 'bg-emerald-500 text-black' : 'bg-white/10 text-[#e8dcc8]/60'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="truncate flex-1">{opt}</span>
                          {isCorrect && (
                            <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                              CORRECT
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Points & Stats Footer Badge */}
                  <div className="flex items-center justify-between text-xs font-mono text-[#f4d19b] bg-[#250d12] p-2.5 rounded-xl border border-[#c9833a]/20 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#c9833a]" />
                      <span className="font-bold">+{q.points || 10} Quiz Points</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#e8dcc8]/70">
                      <span>{attemptsCount} Attempts</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">{correctCount} Correct</span>
                      {attemptsCount > 0 && (
                        <>
                          <span>·</span>
                          <span>{Math.round((correctCount / attemptsCount) * 100)}% Accuracy</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#c9833a]/15">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewQuiz(q);
                      setPreviewSelectedOption(null);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#e8dcc8]/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#c9833a]" />
                    <span>Customer Preview</span>
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      {isPublished ? (
                        onUnpublishQuiz && (
                          <button
                            type="button"
                            onClick={() => onUnpublishQuiz(q.id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )
                      ) : (
                        onPublishQuiz && (
                          <button
                            type="button"
                            onClick={() => onPublishQuiz(q.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Publish Live</span>
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(q)}
                        className="p-1.5 rounded-lg text-[#c9833a] hover:bg-[#c9833a]/20 cursor-pointer transition-colors"
                        title={hasSubmissions ? "Edit metadata (historical question & answer key locked)" : "Edit Question"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingId(q.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 cursor-pointer transition-colors"
                        title={hasSubmissions ? "Archive Quiz" : "Delete Quiz"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete / Archive Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1b0c0e] border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-serif font-bold text-lg text-white">Remove Daily Quiz?</h3>
            <p className="text-xs text-[#e8dcc8]/80 leading-relaxed">
              If this question has received customer submissions, it will be safely archived to protect past customer attempts and points transaction history.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#e8dcc8]/80 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteQuiz(deletingId);
                  setDeletingId(null);
                  onRefresh();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Customer Preview Modal */}
      {previewQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#14080a] border border-[#c9833a]/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full my-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#c9833a]/20 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#c9833a]" />
                <span className="font-mono text-xs uppercase text-[#f4d19b] font-bold">
                  Customer Homepage Preview Mode
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuiz(null)}
                className="text-[#e8dcc8]/60 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Customer Quiz Card */}
            <div className="rounded-2xl bg-[#1c0c0f] border border-[#c9833a]/30 p-6 space-y-4 shadow-lg text-[#faf6ee]">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#351016] text-[#f4d19b] text-[10px] font-mono border border-[#c9833a]/30">
                  DAILY QUIZ · {previewQuiz.dateKey}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#c9833a]/20 text-[#f4d19b] text-[10px] font-mono font-bold">
                  +{previewQuiz.points || 10} Quiz Points
                </span>
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg text-white">
                  {previewQuiz.title}
                </h3>
                <p className="font-sans text-xs text-[#e8dcc8]/80 mt-1">
                  {previewQuiz.question || previewQuiz.title}
                </p>
              </div>

              {/* Interactive Radio Choices Preview */}
              <div className="space-y-2 pt-1">
                {(previewQuiz.options || []).map((opt, i) => {
                  const isSelected = previewSelectedOption === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewSelectedOption(i)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-sans flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#351016] border-[#c9833a] text-white'
                          : 'bg-[#14080a] border-[#c9833a]/20 text-[#e8dcc8]/85 hover:border-[#c9833a]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-[#c9833a] text-black' : 'bg-white/10 text-[#e8dcc8]/60'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#c9833a] bg-[#c9833a]' : 'border-[#e8dcc8]/30'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-black" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanatory Note Preview (Admin eyes only) */}
              {previewQuiz.explanation && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/20 text-xs text-[#f4d19b] space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#c9833a] block">
                    Post-Submission Explanation (Revealed after answering):
                  </span>
                  <p className="italic text-[#e8dcc8]/90">{previewQuiz.explanation}</p>
                </div>
              )}

              <div className="pt-2 text-center text-[10px] font-mono text-[#e8dcc8]/50">
                This is a mock preview of how customers view the question on the homepage.
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPreviewQuiz(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#c9833a] text-[#14080a] font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1b0c0e] border border-[#c9833a]/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#c9833a]/20 pb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-white">
                  {modalMode === 'create' ? 'Create Daily Quiz Question' : 'Edit Daily Quiz Question'}
                </h3>
                <p className="text-xs text-[#e8dcc8]/70 mt-0.5">
                  Configure one multiple-choice question, answer choices, correct answer, and points reward.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-[#e8dcc8]/60 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submissions Warning Notice */}
            {modalMode === 'edit' && editingQuiz?.hasSubmissions && (
              <div className="p-3.5 rounded-2xl bg-blue-950/60 border border-blue-500/30 text-blue-200 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-semibold block text-blue-300">Historical Submissions Recorded:</strong>
                  Question text, answer options, answer key, and points are locked to protect verified customer ledger integrity. You may archive or unpublish this question instead.
                </div>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-4">
              {/* Question Title & Label */}
              <div>
                <label className="block text-xs font-semibold text-[#f4d19b] mb-1">
                  Quiz Title / Theme
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Specialty Coffee & Terroir Mastery"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs focus:outline-none focus:border-[#c9833a]"
                  required
                />
              </div>

              {/* The Actual Question Text */}
              <div>
                <label className="block text-xs font-semibold text-[#f4d19b] mb-1 flex items-center justify-between">
                  <span>Question Text</span>
                  {editingQuiz?.hasSubmissions && (
                    <span className="text-[10px] font-mono text-blue-300 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </label>
                <textarea
                  value={formQuestion}
                  disabled={Boolean(editingQuiz?.hasSubmissions)}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. What is the primary flavor profile of high-altitude washed Ethiopian Yirgacheffe coffee?"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs focus:outline-none focus:border-[#c9833a] disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Date and Points Reward */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#f4d19b] mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#c9833a]" />
                    <span>Business Date (Africa/Algiers)</span>
                  </label>
                  <input
                    type="date"
                    value={formDateKey}
                    onChange={(e) => setFormDateKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs focus:outline-none focus:border-[#c9833a]"
                    required
                  />
                  <span className="text-[10px] text-[#e8dcc8]/60 mt-1 block">
                    Authoritative date in Africa/Algiers timezone
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#f4d19b] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-[#c9833a]" />
                      <span>Quiz Points Reward</span>
                    </span>
                    {editingQuiz?.hasSubmissions && (
                      <span className="text-[10px] font-mono text-blue-300 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={formPoints}
                    disabled={Boolean(editingQuiz?.hasSubmissions)}
                    onChange={(e) => setFormPoints(Math.max(1, Number(e.target.value) || 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs focus:outline-none focus:border-[#c9833a] disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                  <span className="text-[10px] text-[#e8dcc8]/60 mt-1 block">
                    Points awarded directly to customer account on correct answer
                  </span>
                </div>
              </div>

              {/* 3–4 Answer Options Section */}
              <div className="p-4 rounded-2xl bg-[#14080a] border border-[#c9833a]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-serif font-bold text-sm text-[#f4d19b] block">
                      Answer Choices (3 or 4 Options)
                    </span>
                    <span className="text-[11px] text-[#e8dcc8]/70">
                      Click the radio circle to select exactly ONE correct answer.
                    </span>
                  </div>

                  {!editingQuiz?.hasSubmissions && formOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#c9833a]/20 hover:bg-[#c9833a]/30 text-[#f4d19b] text-xs font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add 4th Option</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  {formOptions.map((opt, idx) => {
                    const isCorrect = formCorrectOptionIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/40'
                            : 'bg-[#1a0b0e] border-[#c9833a]/20'
                        }`}
                      >
                        {/* Radio Selector */}
                        <button
                          type="button"
                          disabled={Boolean(editingQuiz?.hasSubmissions)}
                          onClick={() => setFormCorrectOptionIndex(idx)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-500 text-black'
                              : 'bg-white/10 text-[#e8dcc8]/60 hover:bg-[#c9833a]/40 hover:text-white'
                          }`}
                          title="Click to set as correct answer"
                        >
                          {String.fromCharCode(65 + idx)}
                        </button>

                        {/* Input for option text */}
                        <input
                          type="text"
                          value={opt}
                          disabled={Boolean(editingQuiz?.hasSubmissions)}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + idx)} text...`}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-transparent text-white text-xs focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                          required
                        />

                        {isCorrect && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-950/80 shrink-0">
                            CORRECT ANSWER
                          </span>
                        )}

                        {!editingQuiz?.hasSubmissions && formOptions.length > 3 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1 shrink-0"
                            title="Remove choice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Educational Explanation */}
              <div>
                <label className="block text-xs font-semibold text-[#f4d19b] mb-1">
                  Optional Educational Explanation (Shown after customer answers)
                </label>
                <textarea
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="e.g. Ethiopian Yirgacheffe coffees are famous for high-altitude terroir yielding crisp bergamot and floral jasmine notes."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14080a] border border-[#c9833a]/30 text-white text-xs focus:outline-none focus:border-[#c9833a]"
                />
              </div>

              {/* Submit / Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#c9833a]/20">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold text-[#e8dcc8]/70 hover:bg-white/10"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSave(false)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-[#250d12] hover:bg-[#351016] text-[#f4d19b] border border-[#c9833a]/30 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Draft'}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSave(true)}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full bg-[#c9833a] hover:bg-[#b7742d] text-[#14080a] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Publishing...' : 'Save & Publish Live'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
