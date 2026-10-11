import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Coffee,
  GlassWater,
  Leaf,
  Cake,
  Tag,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Check,
  X,
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  Flame,
  Image as ImageIcon,
  Percent,
  Layers,
  ArrowRight,
  Smartphone,
  Monitor,
  ShoppingBag,
  Globe,
  Lock,
} from 'lucide-react';
import {
  TodaySpecialItem,
  SpecialCategory,
  SPECIAL_CATEGORIES,
  getSpecialScheduleStatus,
} from '../../types/specials';

// Default cafe photography presets for quick selection
import imgIcedSpecialty from '../../assets/images/venty_iced_specialty_1790355101617.jpg';
import imgFreshJuice from '../../assets/images/venty_fresh_juices_1790355062682.jpg';
import imgOreoCheesecake from '../../assets/images/venty_oreo_cheesecake_1790355045456.jpg';
import imgCoffeeMoments from '../../assets/images/venty_coffee_moments_1790355076056.jpg';
import imgLatteArt from '../../assets/images/menu_latte_art_1790335455563.jpg';
import imgV60Filter from '../../assets/images/menu_v60_filter_1790335465755.jpg';
import imgPastriesCounter from '../../assets/images/menu_pastries_counter_1790335484429.jpg';
import imgBrunchToast from '../../assets/images/menu_brunch_toast_1790335474886.jpg';

const IMAGE_PRESETS = [
  { label: 'Iced Specialty Latte', src: imgIcedSpecialty },
  { label: 'Fresh Cold-Pressed Juice', src: imgFreshJuice },
  { label: 'Basque & Oreo Cheesecake', src: imgOreoCheesecake },
  { label: 'Summer Mojito / Mocktail', src: imgCoffeeMoments },
  { label: 'Artisan Latte Art', src: imgLatteArt },
  { label: 'Hand-Brewed V60 Filter', src: imgV60Filter },
  { label: 'Fresh Counter Pastries', src: imgPastriesCounter },
  { label: 'Brunch Toast / Sweets', src: imgBrunchToast },
];

interface SpecialsManagementViewProps {
  specials: TodaySpecialItem[];
  publishedSpecialId?: string | null;
  isAdmin: boolean;
  onRefresh: () => void;
  onCreateSpecial: (payload: Partial<TodaySpecialItem>) => Promise<void>;
  onUpdateSpecial: (id: string, payload: Partial<TodaySpecialItem>) => Promise<void>;
  onPublishSpecial?: (id: string) => Promise<void>;
  onUnpublishSpecial?: (id: string) => Promise<void>;
  onToggleActive: (id: string) => Promise<void>;
  onDeleteSpecial: (id: string) => Promise<void>;
}

export const SpecialsManagementView: React.FC<SpecialsManagementViewProps> = ({
  specials,
  publishedSpecialId,
  isAdmin,
  onRefresh,
  onCreateSpecial,
  onUpdateSpecial,
  onPublishSpecial,
  onUnpublishSpecial,
  onToggleActive,
  onDeleteSpecial,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal states
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingSpecial, setEditingSpecial] = useState<TodaySpecialItem | null>(null);
  const [previewSpecial, setPreviewSpecial] = useState<TodaySpecialItem | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'mobile' | 'desktop'>('mobile');
  const [simulatedCartCount, setSimulatedCartCount] = useState<number>(0);
  const [simulatedToast, setSimulatedToast] = useState<string | null>(null);
  const [isSimulatedAdded, setIsSimulatedAdded] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<SpecialCategory>('coffee');
  const [formPriceDzd, setFormPriceDzd] = useState<number | string>(450);
  const [formOriginalPriceDzd, setFormOriginalPriceDzd] = useState<number | string>('');
  const [formImage, setFormImage] = useState(imgIcedSpecialty);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formBadgeText, setFormBadgeText] = useState("TODAY'S SPECIAL");
  const [formPerkText, setFormPerkText] = useState('+2 Bonus Loyalty Stamps');
  const [formFeatured, setFormFeatured] = useState(false);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('coffee');
    setFormPriceDzd(450);
    setFormOriginalPriceDzd('');
    setFormImage(imgIcedSpecialty);
    setFormIsActive(true);
    setFormStartDate('');
    setFormEndDate('');
    setFormBadgeText("TODAY'S SPECIAL");
    setFormPerkText('+2 Bonus Loyalty Stamps');
    setFormFeatured(false);
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingSpecial(null);
    setModalMode('create');
  };

  const openEditModal = (special: TodaySpecialItem) => {
    setEditingSpecial(special);
    setFormTitle(special.title);
    setFormDescription(special.description);
    setFormCategory(special.category);
    setFormPriceDzd(special.priceDzd);
    setFormOriginalPriceDzd(special.originalPriceDzd ? special.originalPriceDzd : '');
    setFormImage(special.image || imgIcedSpecialty);
    setFormIsActive(special.isActive);
    setFormStartDate(special.startDate ? special.startDate.slice(0, 10) : '');
    setFormEndDate(special.endDate ? special.endDate.slice(0, 10) : '');
    setFormBadgeText(special.badgeText || "TODAY'S SPECIAL");
    setFormPerkText(special.perkText || '');
    setFormFeatured(Boolean(special.featured));
    setFormError(null);
    setModalMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Please enter a title for the special.');
      return;
    }
    const numericPrice = Number(formPriceDzd);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFormError('Please enter a valid special price in DZD.');
      return;
    }
    const numericOriginal =
      formOriginalPriceDzd !== '' && !isNaN(Number(formOriginalPriceDzd))
        ? Number(formOriginalPriceDzd)
        : null;

    if (numericOriginal !== null && numericOriginal < numericPrice) {
      setFormError('Original regular price should be greater than the special discount price.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: Partial<TodaySpecialItem> = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        priceDzd: Math.round(numericPrice),
        originalPriceDzd: numericOriginal ? Math.round(numericOriginal) : null,
        image: formImage.trim() || imgIcedSpecialty,
        isActive: formIsActive,
        startDate: formStartDate ? formStartDate : null,
        endDate: formEndDate ? formEndDate : null,
        badgeText: formBadgeText.trim() || "TODAY'S SPECIAL",
        perkText: formPerkText.trim(),
        featured: formFeatured,
      };

      if (modalMode === 'create') {
        await onCreateSpecial(payload);
      } else if (modalMode === 'edit' && editingSpecial) {
        await onUpdateSpecial(editingSpecial.id, payload);
      }
      setModalMode(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save special.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    let activeCount = 0;
    let scheduledCount = 0;
    let featuredItem: TodaySpecialItem | null = null;

    specials.forEach((item) => {
      const status = getSpecialScheduleStatus(item);
      if (status === 'ACTIVE') {
        activeCount++;
        if (item.featured && !featuredItem) {
          featuredItem = item;
        }
      } else if (status === 'SCHEDULED') {
        scheduledCount++;
      }
    });

    if (!featuredItem && specials.length > 0) {
      featuredItem = specials.find((s) => s.isActive) || specials[0];
    }

    return {
      total: specials.length,
      active: activeCount,
      scheduled: scheduledCount,
      featured: featuredItem,
    };
  }, [specials]);

  // Filtered specials
  const filteredSpecials = useMemo(() => {
    return specials.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      const status = getSpecialScheduleStatus(item);
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'ACTIVE' && status !== 'ACTIVE') return false;
        if (selectedStatus === 'SCHEDULED' && status !== 'SCHEDULED') return false;
        if (selectedStatus === 'INACTIVE' && (status === 'ACTIVE' || status === 'SCHEDULED')) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesBadge = (item.badgeText || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesBadge) return false;
      }
      return true;
    });
  }, [specials, selectedCategory, selectedStatus, searchQuery]);

  const getCategoryIcon = (category: SpecialCategory) => {
    switch (category) {
      case 'coffee':
        return <Coffee className="w-3.5 h-3.5" />;
      case 'drinks':
        return <GlassWater className="w-3.5 h-3.5" />;
      case 'juice':
        return <Leaf className="w-3.5 h-3.5" />;
      case 'mocktails':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'desserts':
        return <Cake className="w-3.5 h-3.5" />;
      case 'offers':
        return <Tag className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="bg-[#1b0c0e] rounded-2xl p-5 md:p-6 text-[#f5efe6] border border-[#c9833a]/20 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#c9833a]/20 text-[#c9833a]">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#f5efe6]">
                Today's Special Manager
              </h2>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-[#c9833a]/30 text-[#f4d19b] border border-[#c9833a]/40">
                LIVE MENU SYNC
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#e8dcc8]/75 leading-relaxed max-w-2xl">
              Create, schedule, activate, and preview featured specials across coffee, drinks, fresh juices, mocktails, desserts, and bundle offers. All active specials update the customer marquee and menu in real time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-[#2a1317] hover:bg-[#381c22] text-[#e8dcc8] transition-all cursor-pointer border border-[#c9833a]/20"
              title="Refresh Specials"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9833a] hover:bg-[#b5732d] text-[#150a0c] font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Special</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Metric Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#c9833a]/15">
          <div className="bg-[#240e11]/80 rounded-xl p-3 border border-[#c9833a]/15">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#e8dcc8]/60">
              Total Specials
            </div>
            <div className="text-xl font-serif font-bold text-white mt-0.5">
              {metrics.total}
            </div>
          </div>
          <div className="bg-[#240e11]/80 rounded-xl p-3 border border-emerald-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Now
            </div>
            <div className="text-xl font-serif font-bold text-emerald-300 mt-0.5">
              {metrics.active}
            </div>
          </div>
          <div className="bg-[#240e11]/80 rounded-xl p-3 border border-blue-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-blue-400" />
              Scheduled
            </div>
            <div className="text-xl font-serif font-bold text-blue-300 mt-0.5">
              {metrics.scheduled}
            </div>
          </div>
          <div className="bg-[#240e11]/80 rounded-xl p-3 border border-[#c9833a]/25">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#c9833a] truncate">
              Featured Highlight
            </div>
            <div className="text-xs font-serif font-bold text-white truncate mt-1">
              {metrics.featured?.title || 'None selected'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-[#2a1317]/90 rounded-xl p-4 border border-[#c9833a]/20 shadow-sm flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e8dcc8]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search specials by title, description or badge..."
            className="w-full bg-[#1b0c0e] text-[#f5efe6] placeholder-[#e8dcc8]/40 text-xs rounded-lg pl-9 pr-3.5 py-2.5 border border-[#c9833a]/25 focus:outline-none focus:border-[#c9833a]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e8dcc8]/50 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#c9833a] text-[#150a0c]'
                : 'bg-[#1b0c0e] text-[#e8dcc8]/70 hover:text-white border border-[#c9833a]/20'
            }`}
          >
            All Categories
          </button>
          {SPECIAL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#c9833a] text-[#150a0c]'
                  : 'bg-[#1b0c0e] text-[#e8dcc8]/70 hover:text-white border border-[#c9833a]/20'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Status Filter Dropdown */}
        <div className="shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#1b0c0e] text-[#f5efe6] text-xs rounded-lg px-3 py-2 border border-[#c9833a]/25 focus:outline-none focus:border-[#c9833a]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Now</option>
            <option value="SCHEDULED">Scheduled Only</option>
            <option value="INACTIVE">Inactive / Expired</option>
          </select>
        </div>
      </div>

      {/* 3. Specials Grid Showcase */}
      {filteredSpecials.length === 0 ? (
        <div className="bg-[#1b0c0e] rounded-2xl p-12 text-center border border-[#c9833a]/20">
          <Sparkles className="w-10 h-10 text-[#c9833a]/40 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-white mb-1">
            No Specials Found
          </h3>
          <p className="text-xs text-[#e8dcc8]/70 max-w-md mx-auto mb-5">
            {searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
              ? 'Try resetting your search query or filter selections to view all specials.'
              : 'No specials have been added to the system yet. Click below to create your first special!'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9833a] text-[#150a0c] font-bold text-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Special</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredSpecials.map((special) => {
            const status = getSpecialScheduleStatus(special);
            const discountPct =
              special.originalPriceDzd && special.originalPriceDzd > special.priceDzd
                ? Math.round(
                    ((special.originalPriceDzd - special.priceDzd) / special.originalPriceDzd) * 100,
                  )
                : null;

            return (
              <div
                key={special.id}
                className={`bg-[#1e0d10] rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  special.featured
                    ? 'border-[#c9833a] shadow-[0_0_15px_rgba(201,131,58,0.2)]'
                    : 'border-[#c9833a]/25 hover:border-[#c9833a]/60'
                }`}
              >
                <div>
                  {/* Card Media Header with Badges */}
                  <div className="relative h-44 w-full bg-[#14090b] overflow-hidden group">
                    <img
                      src={special.image}
                      alt={special.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        // Fallback image if broken
                        (e.target as HTMLImageElement).src = imgIcedSpecialty;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e0d10] via-transparent to-black/60 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-[#f4d19b] border border-[#c9833a]/40">
                        {getCategoryIcon(special.category)}
                        <span>{special.category}</span>
                      </span>

                      {/* Status Indicator Pill */}
                      {status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-300 text-[10px] font-mono uppercase tracking-wider border border-emerald-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Active Now</span>
                        </span>
                      )}
                      {status === 'SCHEDULED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/90 text-blue-300 text-[10px] font-mono uppercase tracking-wider border border-blue-500/40">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>Scheduled</span>
                        </span>
                      )}
                      {status === 'EXPIRED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/90 text-amber-300 text-[10px] font-mono uppercase tracking-wider border border-amber-500/40">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Expired</span>
                        </span>
                      )}
                      {status === 'INACTIVE' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 text-zinc-400 text-[10px] font-mono uppercase tracking-wider border border-zinc-700">
                          <span>Deactivated</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay: Badge Text & Featured Pin */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {special.badgeText && (
                          <span className="px-2 py-0.5 rounded bg-[#c9833a] text-[#150a0c] text-[10px] font-bold uppercase tracking-wider shadow">
                            {special.badgeText}
                          </span>
                        )}
                        {(special.id === publishedSpecialId || special.isPublished) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-[#c9833a] text-[#150a0c] text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                            <Sparkles className="w-2.5 h-2.5 text-[#150a0c]" />
                            <span>★ Live on Homepage</span>
                          </span>
                        )}
                      </div>
                      {special.featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#351016]/90 text-[#f4d19b] text-[10px] font-semibold border border-[#c9833a]/40 ml-auto">
                          <Sparkles className="w-2.5 h-2.5 text-[#c9833a]" />
                          <span>Featured Drop</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif font-bold text-base sm:text-lg text-[#faf6ee] leading-snug line-clamp-1">
                        {special.title}
                      </h3>
                      {/* Price Section */}
                      <div className="text-right shrink-0">
                        <div className="font-mono text-base font-bold text-[#f4d19b]">
                          {special.priceDzd} DA
                        </div>
                        {special.originalPriceDzd && (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="font-mono text-xs text-[#e8dcc8]/50 line-through">
                              {special.originalPriceDzd} DA
                            </span>
                            {discountPct && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1 rounded">
                                -{discountPct}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#e8dcc8]/80 leading-relaxed line-clamp-2">
                      {special.description}
                    </p>

                    {/* Perk & Scheduling details */}
                    <div className="space-y-1.5 pt-1">
                      {special.perkText && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#f4d19b] font-medium bg-[#c9833a]/10 px-2 py-1 rounded-md border border-[#c9833a]/25">
                          <Flame className="w-3 h-3 text-[#c9833a] shrink-0" />
                          <span className="truncate">{special.perkText}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#e8dcc8]/60">
                        <Clock className="w-3 h-3 text-[#c9833a]/60 shrink-0" />
                        <span>
                          {special.startDate || special.endDate
                            ? `${special.startDate || 'Now'} → ${special.endDate || 'Ongoing'}`
                            : 'Active daily (no date restriction)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-[#17080a] border-t border-[#c9833a]/15 flex items-center justify-between gap-2">
                  {/* Inline Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => onToggleActive(special.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      special.isActive
                        ? 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800/80 border border-emerald-500/30'
                        : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                    title={special.isActive ? 'Click to deactivate special' : 'Click to activate special'}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        special.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                      }`}
                    />
                    <span>{special.isActive ? 'Active' : 'Disabled'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Publish / Unpublish to Homepage Button */}
                    {isAdmin && onPublishSpecial && (
                      special.id === publishedSpecialId || special.isPublished ? (
                        <button
                          type="button"
                          onClick={() => onUnpublishSpecial?.(special.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all cursor-pointer"
                          title="Unpublish from public homepage"
                        >
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                          <span>Published</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onPublishSpecial?.(special.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#c9833a] hover:bg-[#b5732d] text-[#150a0c] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                          title={`Publish "${special.title}" as Today's Special on the public homepage`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#150a0c]" />
                          <span>Publish to Home</span>
                        </button>
                      )
                    )}

                    {/* Live Customer Home Screen Preview Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSimulatedCartCount(0);
                        setSimulatedToast(null);
                        setIsSimulatedAdded(false);
                        setPreviewSpecial(special);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c9833a]/20 hover:bg-[#c9833a]/35 text-[#f4d19b] hover:text-white border border-[#c9833a]/40 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                      title={`Preview how customer will see "${special.title}" on the home screen`}
                    >
                      <Eye className="w-3.5 h-3.5 text-[#c9833a]" />
                      <span>Preview</span>
                    </button>

                    {/* Edit Button */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => openEditModal(special)}
                        className="p-1.5 rounded-lg text-[#c9833a] hover:text-[#f4d19b] hover:bg-[#c9833a]/15 transition-colors cursor-pointer"
                        title="Edit Special"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Button */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setDeletingId(special.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Special"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Create / Edit Special Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1e0d10] border border-[#c9833a]/30 rounded-2xl w-full max-w-2xl text-[#f5efe6] shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-[#c9833a]/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c9833a]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  {modalMode === 'create' ? "Create New Today's Special" : `Edit Special: ${editingSpecial?.title}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-lg text-[#e8dcc8]/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#c9833a] font-semibold">
                    Title / Special Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Iced Pistachio Spanish Latte"
                    className="w-full bg-[#14090b] text-white text-xs rounded-xl px-3.5 py-2.5 border border-[#c9833a]/30 focus:outline-none focus:border-[#c9833a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#c9833a] font-semibold">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SpecialCategory)}
                    className="w-full bg-[#14090b] text-white text-xs rounded-xl px-3 py-2.5 border border-[#c9833a]/30 focus:outline-none focus:border-[#c9833a]"
                  >
                    <option value="coffee">Coffee</option>
                    <option value="drinks">Drinks & Lattes</option>
                    <option value="juice">Fresh Juices</option>
                    <option value="mocktails">Mocktails & Coolers</option>
                    <option value="desserts">Desserts & Sweets</option>
                    <option value="offers">Combo Offers</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#c9833a] font-semibold">
                  Tasting Notes & Ingredients Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detail origins, flavor profile, artisanal preparation, and ingredients..."
                  className="w-full bg-[#14090b] text-white text-xs rounded-xl p-3 border border-[#c9833a]/30 focus:outline-none focus:border-[#c9833a]"
                />
              </div>

              {/* Pricing in DZD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#14090b] rounded-xl border border-[#c9833a]/20">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#f4d19b] font-semibold flex items-center justify-between">
                    <span>Special Price in DZD *</span>
                    <span className="text-[10px] text-[#e8dcc8]/60">DZD (DA)</span>
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    required
                    value={formPriceDzd}
                    onChange={(e) => setFormPriceDzd(e.target.value)}
                    placeholder="450"
                    className="w-full bg-[#20090d] text-white font-mono font-bold text-sm rounded-lg px-3 py-2 border border-[#c9833a]/40 focus:outline-none focus:border-[#c9833a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#e8dcc8]/80 font-semibold flex items-center justify-between">
                    <span>Original Price (Optional)</span>
                    <span className="text-[10px] text-emerald-400">Shows Strikethrough & %</span>
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={formOriginalPriceDzd}
                    onChange={(e) => setFormOriginalPriceDzd(e.target.value)}
                    placeholder="e.g. 550"
                    className="w-full bg-[#20090d] text-white font-mono text-sm rounded-lg px-3 py-2 border border-[#c9833a]/25 focus:outline-none focus:border-[#c9833a]"
                  />
                </div>
              </div>

              {/* Badge & Perk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#c9833a] font-semibold">
                    Badge Ribbon Text
                  </label>
                  <input
                    type="text"
                    value={formBadgeText}
                    onChange={(e) => setFormBadgeText(e.target.value)}
                    placeholder="TODAY'S SPECIAL"
                    className="w-full bg-[#14090b] text-white text-xs rounded-xl px-3 py-2 border border-[#c9833a]/30 focus:outline-none focus:border-[#c9833a]"
                  />
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {["TODAY'S SPECIAL", 'BARISTA PICK', 'LIMITED DROP', 'CHEF SIGNATURE', 'HAPPY HOUR'].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setFormBadgeText(pill)}
                        className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 hover:bg-[#c9833a]/20 text-[#e8dcc8] border border-white/10"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#c9833a] font-semibold">
                    Guest Perk / Bonus Note
                  </label>
                  <input
                    type="text"
                    value={formPerkText}
                    onChange={(e) => setFormPerkText(e.target.value)}
                    placeholder="e.g. +2 Bonus Loyalty Stamps"
                    className="w-full bg-[#14090b] text-white text-xs rounded-xl px-3 py-2 border border-[#c9833a]/30 focus:outline-none focus:border-[#c9833a]"
                  />
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {['+2 Bonus Loyalty Stamps', 'Complimentary Extra Shot', 'Served over mountain ice'].map((perk) => (
                      <button
                        key={perk}
                        type="button"
                        onClick={() => setFormPerkText(perk)}
                        className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 hover:bg-[#c9833a]/20 text-[#e8dcc8] border border-white/10 truncate max-w-[180px]"
                      >
                        {perk}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scheduling Start & End Dates */}
              <div className="p-3.5 bg-[#14090b] rounded-xl border border-[#c9833a]/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#c9833a]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#f4d19b] font-semibold">
                    Scheduling & Calendar Window
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#e8dcc8]/70 block">
                      Start Date (Leave empty to start immediately)
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full bg-[#20090d] text-white text-xs rounded-lg px-3 py-2 border border-[#c9833a]/30 focus:outline-none focus:border-[#c9833a]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#e8dcc8]/70 block">
                      End Date (Leave empty for ongoing special)
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full bg-[#20090d] text-white text-xs rounded-lg px-3 py-2 border border-[#c9833a]/30 focus:outline-none focus:border-[#c9833a]"
                    />
                  </div>
                </div>
              </div>

              {/* Image Selection Presets + URL */}
              <div className="space-y-2 p-3.5 bg-[#14090b] rounded-xl border border-[#c9833a]/20">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#f4d19b] font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#c9833a]" />
                    <span>Special Photo Asset</span>
                  </label>
                  <span className="text-[10px] text-[#e8dcc8]/60">
                    Pick a preset or supply URL
                  </span>
                </div>

                {/* Quick Presets Carousel */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormImage(preset.src)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        formImage === preset.src
                          ? 'border-[#c9833a] ring-2 ring-[#c9833a]/50 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.src}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="Image asset path or HTTPS URL..."
                    className="w-full bg-[#20090d] text-white text-xs rounded-lg px-3 py-2 border border-[#c9833a]/30 focus:outline-none focus:border-[#c9833a]"
                  />
                </div>
              </div>

              {/* Switches: IsActive & Featured */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#c9833a] focus:ring-[#c9833a] bg-[#14090b] border-[#c9833a]/40"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Active Special</div>
                    <div className="text-[10px] text-[#e8dcc8]/60">
                      When enabled and within schedule dates, guests can order this special.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#c9833a] focus:ring-[#c9833a] bg-[#14090b] border-[#c9833a]/40"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#f4d19b]">Pin as Featured</div>
                    <div className="text-[10px] text-[#e8dcc8]/60">
                      Highlights prominently in the top ticker marquee.
                    </div>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#c9833a]/20 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const candidate: TodaySpecialItem = {
                      id: editingSpecial?.id || `preview-${Date.now()}`,
                      title: formTitle.trim() || 'Featured Special (Draft)',
                      description: formDescription.trim() || 'Artisanal craft specialty prepared freshly in Miliana.',
                      category: formCategory,
                      priceDzd: Number(formPriceDzd) || 450,
                      originalPriceDzd: formOriginalPriceDzd ? Number(formOriginalPriceDzd) : null,
                      image: formImage.trim() || imgIcedSpecialty,
                      isActive: formIsActive,
                      startDate: formStartDate || null,
                      endDate: formEndDate || null,
                      badgeText: formBadgeText.trim() || "TODAY'S SPECIAL",
                      perkText: formPerkText.trim(),
                      featured: formFeatured,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                    setSimulatedCartCount(0);
                    setSimulatedToast(null);
                    setIsSimulatedAdded(false);
                    setPreviewSpecial(candidate);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#f4d19b] hover:text-white border border-[#c9833a]/30 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#c9833a]" />
                  <span>Preview on Home Screen</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#e8dcc8] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#c9833a] hover:bg-[#b5732d] disabled:opacity-50 text-[#150a0c] font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : modalMode === 'create'
                      ? 'Create Special'
                      : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Live Customer Home Screen Preview Simulation Modal */}
      {previewSpecial && (
        <div className="fixed inset-0 z-[160] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div
            className={`bg-[#1c0c0e] rounded-3xl text-[#f5efe6] shadow-2xl overflow-hidden border border-[#c9833a]/40 transition-all duration-300 flex flex-col my-auto max-h-[92vh] ${
              previewViewport === 'mobile' ? 'w-full max-w-[420px]' : 'w-full max-w-4xl'
            }`}
          >
            {/* Simulation Browser Bar */}
            <div className="p-3.5 bg-[#250d11] border-b border-[#c9833a]/25 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="hidden xs:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14080a] text-[10px] font-mono text-[#e8dcc8]/75 border border-[#c9833a]/20">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>ventycoffee.com/#specials</span>
                </div>
              </div>

              {/* Viewport Mode Switcher */}
              <div className="flex items-center gap-1 bg-[#14080a] p-1 rounded-xl border border-[#c9833a]/25">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    previewViewport === 'mobile'
                      ? 'bg-[#c9833a] text-[#150a0c]'
                      : 'text-[#e8dcc8]/70 hover:text-white'
                  }`}
                  title="Mobile Viewport (380px phone simulation)"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    previewViewport === 'desktop'
                      ? 'bg-[#c9833a] text-[#150a0c]'
                      : 'text-[#e8dcc8]/70 hover:text-white'
                  }`}
                  title="Desktop Viewport"
                >
                  <Monitor className="w-3 h-3" />
                  <span>Desktop</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewSpecial(null)}
                className="p-1.5 rounded-xl text-[#e8dcc8]/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Home Screen Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Customer Home Screen Viewport Body */}
            <div className="flex-1 overflow-y-auto bg-[#faf6ef] text-[#221a14] relative">
              {/* Simulated Home Screen Top Navbar */}
              <div className="bg-[#1b0c0e] text-[#f5efe6] px-4 py-3 border-b border-[#c9833a]/20 sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#c9833a]/30 flex items-center justify-center text-[#f4d19b] font-serif font-bold text-xs border border-[#c9833a]/50">
                    V
                  </div>
                  <div>
                    <div className="font-serif font-bold text-xs tracking-wider text-white">
                      VENTY THE COFFEE
                    </div>
                    <div className="text-[9px] font-mono text-[#c9833a]">
                      Miliana Flagship · Daily 17:00 – 1:00
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative px-2.5 py-1 rounded-full bg-[#351016] text-[#f4d19b] text-[10px] font-mono font-semibold flex items-center gap-1.5 border border-[#c9833a]/30">
                    <ShoppingBag className="w-3 h-3 text-[#c9833a]" />
                    <span>Tray ({simulatedCartCount})</span>
                  </div>
                </div>
              </div>

              {/* Simulated Customer Home Screen Live Marquee Banner */}
              <div className="bg-gradient-to-r from-[#281015] via-[#351016] to-[#240c11] text-[#faf6ee] px-4 py-2.5 border-b border-[#c9833a]/30 relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden truncate">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f4d19b] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c9833a]" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#f4d19b] font-bold shrink-0">
                      {previewSpecial.badgeText || "TODAY'S SPECIAL"}:
                    </span>
                    <span className="font-serif font-bold text-white truncate underline decoration-[#c9833a]/50 underline-offset-2">
                      {previewSpecial.title}
                    </span>
                    <span className="font-mono text-xs text-[#f4d19b] font-semibold bg-white/10 px-1.5 py-0.2 rounded shrink-0">
                      {previewSpecial.priceDzd} DA
                    </span>
                    {previewSpecial.originalPriceDzd &&
                      previewSpecial.originalPriceDzd > previewSpecial.priceDzd && (
                        <span className="font-mono text-[10px] text-white/40 line-through shrink-0">
                          {previewSpecial.originalPriceDzd} DA
                        </span>
                      )}
                  </div>

                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-[#f4d19b]">
                    Active on Home Screen
                  </span>
                </div>
              </div>

              {/* Simulated Home Screen Customer Spotlight Container */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* Home Screen Curated Specials Section Header */}
                <div className="text-center max-w-lg mx-auto space-y-1.5">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-5 h-[1px] bg-[#c9833a]" />
                    <span className="font-mono uppercase text-[10px] tracking-widest text-[#8a7a6f] font-semibold">
                      HOME SCREEN SPECIALS
                    </span>
                    <span className="w-5 h-[1px] bg-[#c9833a]" />
                  </div>
                  <h3 className="font-serif italic font-bold text-2xl sm:text-3xl text-[#2d1217]">
                    Today's Curated Drops & Limited Specials
                  </h3>
                  <p className="font-sans text-xs text-[#614f44]">
                    Single-origin roasts, cold-pressed market juices, signature mocktails, and fresh patisserie crafted daily in Miliana.
                  </p>
                </div>

                {/* The Exact Customer Card */}
                <div className="max-w-md mx-auto bg-white rounded-3xl border border-[#ded7c8] overflow-hidden shadow-lg flex flex-col transform transition-transform">
                  {/* Card Media Header */}
                  <div className="relative h-56 w-full bg-[#1b0c0e] overflow-hidden group">
                    <img
                      src={previewSpecial.image}
                      alt={previewSpecial.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = imgIcedSpecialty;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#351016]/90 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-[#f4d19b] border border-[#c9833a]/30 shadow">
                        {getCategoryIcon(previewSpecial.category)}
                        <span>{previewSpecial.category}</span>
                      </span>

                      {previewSpecial.originalPriceDzd &&
                        previewSpecial.originalPriceDzd > previewSpecial.priceDzd && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold font-mono shadow">
                            -
                            {Math.round(
                              ((previewSpecial.originalPriceDzd - previewSpecial.priceDzd) /
                                previewSpecial.originalPriceDzd) *
                                100,
                            )}
                            %
                          </span>
                        )}
                    </div>

                    {/* Bottom Ribbon */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-3 py-1 rounded-lg bg-[#c9833a] text-[#150a0c] text-[10px] font-bold uppercase tracking-wider shadow">
                        {previewSpecial.badgeText || "TODAY'S SPECIAL"}
                      </span>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a7a6f] block">
                          Miliana Special
                        </span>
                        <h4 className="font-serif font-bold text-xl text-[#2d1217] leading-snug">
                          {previewSpecial.title}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-lg font-bold text-[#6b3a1f]">
                          {previewSpecial.priceDzd} DA
                        </div>
                        {previewSpecial.originalPriceDzd && (
                          <div className="font-mono text-xs text-[#8a7a6f] line-through">
                            {previewSpecial.originalPriceDzd} DA
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="font-sans text-xs sm:text-sm text-[#59493f] leading-relaxed">
                      {previewSpecial.description || 'Specialty creation freshly prepared daily in Miliana.'}
                    </p>

                    {previewSpecial.perkText && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-[#6b3a1f] font-medium bg-[#eee9de] px-3 py-1 rounded-full border border-[#ded7c8]">
                        <Flame className="w-3.5 h-3.5 text-[#c9833a]" />
                        <span>{previewSpecial.perkText}</span>
                      </div>
                    )}

                    {/* Interactive Customer Add to Tray Button */}
                    <div className="pt-3.5 border-t border-[#ded7c8] flex items-center justify-between">
                      <span className="text-[11px] font-sans text-[#8a7a6f] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#c9833a]" />
                        Miliana Flagship Selection
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSimulatedAdded(true);
                          setSimulatedCartCount((prev) => prev + 1);
                          setSimulatedToast(
                            `✓ Added to Tray · ${previewSpecial.title} (${previewSpecial.priceDzd} DA)`,
                          );
                          window.setTimeout(() => {
                            setIsSimulatedAdded(false);
                          }, 1600);
                          window.setTimeout(() => {
                            setSimulatedToast(null);
                          }, 3200);
                        }}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer active:scale-95 shadow ${
                          isSimulatedAdded
                            ? 'bg-emerald-700 text-white'
                            : 'bg-[#351016] text-[#faf6ee] hover:bg-[#c9833a] hover:text-white'
                        }`}
                      >
                        {isSimulatedAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added to Tray</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Tray</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulated Customer Toast Notification */}
                {simulatedToast && (
                  <div className="p-3 bg-[#351016] text-[#f4d19b] rounded-xl text-xs text-center border border-[#c9833a]/40 shadow-md font-mono">
                    {simulatedToast}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="p-3.5 bg-[#17080a] border-t border-[#c9833a]/25 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] font-mono text-[#e8dcc8]/70 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#c9833a]" />
                <span>Simulating live customer experience on home screen</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && onPublishSpecial && previewSpecial && (
                  previewSpecial.id === publishedSpecialId || previewSpecial.isPublished ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await onUnpublishSpecial?.(previewSpecial.id);
                        setPreviewSpecial((prev) => (prev ? { ...prev, isPublished: false } : null));
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unpublish from Homepage</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await onPublishSpecial?.(previewSpecial.id);
                        setPreviewSpecial((prev) => (prev ? { ...prev, isPublished: true } : null));
                      }}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#c9833a] hover:brightness-110 text-[#150a0c] text-xs font-extrabold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#150a0c]" />
                      <span>Publish as Today's Special on Homepage</span>
                    </button>
                  )
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const specToEdit = previewSpecial;
                      setPreviewSpecial(null);
                      openEditModal(specToEdit);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#c9833a]/20 hover:bg-[#c9833a]/30 text-[#f4d19b] text-xs font-semibold border border-[#c9833a]/40 cursor-pointer"
                  >
                    Edit Special
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewSpecial(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e0d10] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full text-[#f5efe6] shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-serif text-lg font-bold text-white">Delete Special?</h3>
            </div>
            <p className="text-xs text-[#e8dcc8]/80 leading-relaxed mb-5">
              Are you sure you want to permanently delete this special? It will be immediately removed from the customer menu and marquee.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#e8dcc8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteSpecial(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
