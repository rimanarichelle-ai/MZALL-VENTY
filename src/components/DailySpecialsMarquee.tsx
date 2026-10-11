import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Coffee,
  Cookie,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Flame,
  GlassWater,
  Leaf,
  Cake,
  Clock,
} from 'lucide-react';
import {
  DailySpecial,
  ResolvedDailySpecial,
  getCurrentDailySpecial,
} from '../data/dailySpecialsData';
import { OfficialMenuItem, getOfficialProductById } from '../data/officialMenuData';
import { TodaySpecialItem, SpecialCategory } from '../types/specials';
import { DietaryBadge } from './DietaryBadge';

interface DailySpecialsMarqueeProps {
  onAddToCart?: (item: OfficialMenuItem & { notes?: string; customPrice?: number }) => void;
  onOpenOrderModal?: () => void;
  onSelectCategory?: (category: string) => void;
}

export const DailySpecialsMarquee: React.FC<DailySpecialsMarqueeProps> = ({
  onAddToCart,
  onOpenOrderModal,
}) => {
  const [dailyData, setDailyData] = useState<ResolvedDailySpecial>(() => getCurrentDailySpecial());
  const [publishedSpecial, setPublishedSpecial] = useState<TodaySpecialItem | null>(null);
  const [customSpecials, setCustomSpecials] = useState<TodaySpecialItem[]>([]);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch from /api/menu/daily-specials with local fallback
  useEffect(() => {
    let isMounted = true;
    async function fetchDailySpecials() {
      try {
        const res = await fetch('/api/menu/daily-specials');
        if (res.ok) {
          const data = await res.json();
          if (data && isMounted) {
            if (data.publishedSpecial) {
              setPublishedSpecial(data.publishedSpecial);
            } else if (data.special && data.special.publishedSpecial) {
              setPublishedSpecial(data.special.publishedSpecial);
            } else {
              setPublishedSpecial(null);
            }

            if (data.special) {
              const coffeeProduct = getOfficialProductById(data.special.coffeeItemId);
              const sweetProduct = getOfficialProductById(data.special.sweetItemId);
              setDailyData({
                special: data.special,
                coffeeProduct,
                sweetProduct,
              });
            }
            if (Array.isArray(data.specials)) {
              setCustomSpecials(data.specials);
            }
          }
        }
      } catch (err) {
        // Fallback already initialized synchronously
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDailySpecials();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickAdd = (
    item: OfficialMenuItem | undefined,
    fallbackName: string,
    fallbackPriceNum: number,
    category: 'coffee' | 'sweets' | 'desserts',
    e?: React.MouseEvent,
  ) => {
    if (e) {
      e.stopPropagation();
    }
    const resolvedItem: OfficialMenuItem = item || {
      id: `daily-special-${category}`,
      name: fallbackName,
      price: `${fallbackPriceNum} DA`,
      priceNum: fallbackPriceNum,
      category: category === 'sweets' ? 'sweets' : category,
      subCategory: 'DAILY SPECIAL',
      currency: 'DA',
      available: true,
    };

    if (onAddToCart) {
      onAddToCart(resolvedItem);
      const itemId = resolvedItem.id;
      setAddedIds((prev) => ({ ...prev, [itemId]: true }));
      window.setTimeout(() => {
        setAddedIds((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      }, 1500);
    }
  };

  const handleAddCustomSpecial = (special: TodaySpecialItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (onAddToCart) {
      const resolvedCategory: 'coffee' | 'drinks' | 'fresh' | 'sweets' | 'desserts' =
        special.category === 'juice'
          ? 'fresh'
          : special.category === 'mocktails' || special.category === 'drinks'
          ? 'drinks'
          : special.category === 'desserts'
          ? 'desserts'
          : special.category === 'offers' || special.category === 'coffee'
          ? 'coffee'
          : 'coffee';

      const customItem: OfficialMenuItem & { notes?: string; customPrice?: number } = {
        id: special.id,
        name: special.title,
        price: `${special.priceDzd} DA`,
        priceNum: special.priceDzd,
        category: resolvedCategory,
        subCategory: special.badgeText || "TODAY'S SPECIAL",
        currency: 'DA',
        available: true,
        description: special.description,
        notes: special.perkText ? `Special: ${special.perkText}` : "Today's Special Selection",
        customPrice: special.priceDzd,
      };

      onAddToCart(customItem);
      setAddedIds((prev) => ({ ...prev, [special.id]: true }));
      window.setTimeout(() => {
        setAddedIds((prev) => {
          const next = { ...prev };
          delete next[special.id];
          return next;
        });
      }, 1500);
    }
  };

  const handleAddBoth = () => {
    const { special, coffeeProduct, sweetProduct } = dailyData;
    handleQuickAdd(
      coffeeProduct,
      special.coffeeHighlight.title,
      coffeeProduct ? coffeeProduct.priceNum : 250,
      'coffee',
    );
    setTimeout(() => {
      handleQuickAdd(
        sweetProduct,
        special.sweetHighlight.title,
        sweetProduct ? sweetProduct.priceNum : 350,
        'sweets',
      );
    }, 180);
  };

  const { special, coffeeProduct, sweetProduct } = dailyData;
  const isCoffeeRecentlyAdded = coffeeProduct && addedIds[coffeeProduct.id];
  const isSweetRecentlyAdded = sweetProduct && addedIds[sweetProduct.id];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coffee':
        return <Coffee className="w-2.5 h-2.5" />;
      case 'drinks':
        return <GlassWater className="w-2.5 h-2.5" />;
      case 'juice':
        return <Leaf className="w-2.5 h-2.5" />;
      case 'mocktails':
        return <Sparkles className="w-2.5 h-2.5" />;
      case 'desserts':
        return <Cake className="w-2.5 h-2.5" />;
      case 'offers':
        return <Tag className="w-2.5 h-2.5" />;
      default:
        return <Sparkles className="w-2.5 h-2.5" />;
    }
  };

  const filteredCustomSpecials = customSpecials.filter((item) => {
    if (selectedCategoryTab === 'all') return true;
    return item.category === selectedCategoryTab;
  });

  return (
    <div className="w-full relative z-20 mb-8 sm:mb-12">
      {/* 1. Subtle Marquee Ribbon Banner */}
      <div className="w-full bg-gradient-to-r from-[#281015] via-[#351016] to-[#240c11] text-[#faf6ee] border-y border-[#c9833a]/30 shadow-[0_4px_20px_-4px_rgba(53,16,22,0.35)] relative overflow-hidden group">
        {/* Subtle Ambient Gold Hairline on top and bottom */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f4d19b]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9833a]/30 to-transparent" />

        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Fixed Kicker Pill */}
          <div className="shrink-0 flex items-center gap-2 px-3 sm:px-5 py-2.5 bg-[#20080d]/90 border-r border-[#c9833a]/25 z-10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f4d19b] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c9833a]" />
            </span>
            <div className="flex items-center gap-1.5 font-sans font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#f4d19b]">
              <Sparkles className="w-3 h-3 text-[#c9833a]" />
              <span className="hidden xs:inline">TODAY'S SPECIALS</span>
              <span className="xs:hidden">SPECIALS</span>
            </div>
            {customSpecials.length > 0 && (
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full bg-[#c9833a]/30 text-[9px] font-mono text-[#f4d19b] font-bold">
                {customSpecials.length} Drops
              </span>
            )}
            <span className="hidden md:inline-block w-1 h-1 rounded-full bg-[#c9833a]/60" />
            <span className="hidden md:inline-block font-serif text-[11px] italic text-[#d8cbb8]">
              {special.dayName}
            </span>
          </div>

          {/* Center Infinite Smooth Marquee Track */}
          <div
            className="flex-1 overflow-hidden whitespace-nowrap py-2 relative flex items-center mask-gradient"
            tabIndex={0}
            aria-label="Daily Specials continuous ticker"
          >
            {/* Inline track 1 & 2 for smooth continuous looping animation */}
            <div className="animate-marquee-continuous gap-6 sm:gap-8 will-change-transform">
              {[0, 1].map((copyIndex) => (
                <div key={copyIndex} className="inline-flex items-center gap-6 sm:gap-8">
                  {/* Authoritative Published Today's Special Highlight */}
                  {publishedSpecial && (
                    <React.Fragment key={`${copyIndex}-published-special`}>
                      <button
                        type="button"
                        onClick={() => setIsExpanded(true)}
                        className="inline-flex items-center gap-2 hover:text-[#f4d19b] transition-colors cursor-pointer text-left px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40"
                      >
                        <span className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-[#c9833a] text-[#150a0c] flex items-center justify-center shrink-0 font-bold text-[10px]">
                          ★
                        </span>
                        <span className="font-sans text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                          {publishedSpecial.badgeText || "TODAY'S SPECIAL"}:
                        </span>
                        <span className="font-serif font-bold text-xs sm:text-sm text-white underline decoration-amber-400/60 underline-offset-2">
                          {publishedSpecial.title}
                        </span>
                        <span className="font-mono text-xs text-amber-300 font-bold bg-black/30 px-1.5 py-0.2 rounded">
                          {publishedSpecial.priceDzd} DA
                        </span>
                      </button>
                      <span className="text-[#c9833a] text-xs font-bold">✦</span>
                    </React.Fragment>
                  )}

                  {/* Custom Active Specials in Ticker */}
                  {customSpecials.map((spec) => (
                    <React.Fragment key={`${copyIndex}-${spec.id}`}>
                      <button
                        type="button"
                        onClick={() => setIsExpanded(true)}
                        className="inline-flex items-center gap-2 hover:text-[#f4d19b] transition-colors cursor-pointer text-left"
                      >
                        <span className="w-4 h-4 rounded-full bg-[#c9833a]/25 text-[#f4d19b] flex items-center justify-center shrink-0">
                          {getCategoryIcon(spec.category)}
                        </span>
                        <span className="font-sans text-[10px] uppercase tracking-wider text-[#d8cbb8]/80 font-medium">
                          {spec.badgeText || spec.category}:
                        </span>
                        <span className="font-serif font-bold text-xs sm:text-sm text-[#faf6ee] underline decoration-[#c9833a]/50 underline-offset-2">
                          {spec.title}
                        </span>
                        <span className="font-mono text-xs text-[#f4d19b] font-semibold bg-white/10 px-1.5 py-0.2 rounded">
                          {spec.priceDzd} DA
                        </span>
                        {spec.originalPriceDzd && spec.originalPriceDzd > spec.priceDzd && (
                          <span className="font-mono text-[10px] text-white/40 line-through">
                            {spec.originalPriceDzd} DA
                          </span>
                        )}
                      </button>
                      <span className="text-[#c9833a]/60 text-xs">✦</span>
                    </React.Fragment>
                  ))}

                  {/* Coffee Highlight */}
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-2 hover:text-[#f4d19b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#c9833a]/25 text-[#f4d19b] flex items-center justify-center shrink-0">
                      <Coffee className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-sans text-[10px] uppercase tracking-wider text-[#d8cbb8]/80 font-medium">
                      Barista Coffee:
                    </span>
                    <span className="font-serif font-bold text-xs sm:text-sm text-[#faf6ee] underline decoration-[#c9833a]/50 underline-offset-2">
                      {special.coffeeHighlight.title}
                    </span>
                    <span className="font-mono text-xs text-[#f4d19b] font-semibold bg-white/10 px-1.5 py-0.2 rounded">
                      {special.coffeeHighlight.specialPrice}
                    </span>
                  </button>

                  <span className="text-[#c9833a]/60 text-xs">✦</span>

                  {/* Sweet Special Item */}
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-2 hover:text-[#f4d19b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#c9833a]/25 text-[#f4d19b] flex items-center justify-center shrink-0">
                      <Cookie className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-sans text-[10px] uppercase tracking-wider text-[#d8cbb8]/80 font-medium">
                      Sweet:
                    </span>
                    <span className="font-serif font-bold text-xs sm:text-sm text-[#faf6ee] underline decoration-[#c9833a]/50 underline-offset-2">
                      {special.sweetHighlight.title}
                    </span>
                    <span className="font-mono text-xs text-[#f4d19b] font-semibold bg-white/10 px-1.5 py-0.2 rounded">
                      {special.sweetHighlight.specialPrice}
                    </span>
                  </button>

                  <span className="text-[#c9833a]/60 text-xs">✦</span>

                  {/* Promotion Perk */}
                  <div className="inline-flex items-center gap-1.5 text-xs text-[#f4d19b] font-medium bg-[#c9833a]/15 border border-[#c9833a]/30 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3 text-[#f4d19b]" />
                    <span>{special.pairPerk}</span>
                  </div>

                  <span className="text-[#c9833a]/60 text-xs">✦</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Action Button: Toggle Pair Details */}
          <div className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-[#20080d]/90 border-l border-[#c9833a]/25 z-10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#f4d19b] hover:text-white px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 transition-all cursor-pointer"
              aria-expanded={isExpanded}
              aria-label="Toggle featured daily special pairing details"
            >
              <span>{isExpanded ? 'Hide Details' : 'View Specials'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 text-[#c9833a]" />
              ) : (
                <ChevronDown className="w-3 h-3 text-[#c9833a]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 1B. Published Today's Special Spotlight Showcase on Public Homepage */}
      {publishedSpecial && (
        <div className="w-full bg-gradient-to-b from-[#20090d] via-[#2a0c12] to-[#1e080d] text-[#faf6ee] border-b border-[#c9833a]/30 py-6 sm:py-8 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#190609]/90 rounded-3xl border border-[#c9833a]/40 p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
              {/* Image Preview Container */}
              <div className="relative w-full lg:w-72 h-56 sm:h-64 rounded-2xl overflow-hidden shrink-0 border border-[#c9833a]/30 shadow-md">
                <img
                  src={publishedSpecial.image}
                  alt={publishedSpecial.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#351016]/90 text-[10px] font-mono uppercase tracking-wider text-[#f4d19b] border border-[#c9833a]/30">
                    {getCategoryIcon(publishedSpecial.category)}
                    <span>{publishedSpecial.category}</span>
                  </span>
                  {publishedSpecial.originalPriceDzd && publishedSpecial.originalPriceDzd > publishedSpecial.priceDzd && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold font-mono shadow">
                      -{Math.round(((publishedSpecial.originalPriceDzd - publishedSpecial.priceDzd) / publishedSpecial.originalPriceDzd) * 100)}%
                    </span>
                  )}
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-[#c9833a] text-[#150a0c] text-[10px] font-extrabold uppercase tracking-wider shadow">
                    {publishedSpecial.badgeText || "TODAY'S SPECIAL"}
                  </span>
                </div>
              </div>

              {/* Special Details & Ordering CTA */}
              <div className="flex-1 space-y-3.5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#351016] border border-[#c9833a]/30 text-amber-300 text-[10px] font-mono uppercase tracking-wider font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#c9833a]" />
                  <span>TODAY'S FEATURED SPECIAL · MILIANA SELECTION</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white">
                    {publishedSpecial.title}
                  </h3>
                  <div className="flex items-baseline justify-center sm:justify-end gap-2">
                    <span className="font-mono text-2xl font-bold text-[#f4d19b]">
                      {publishedSpecial.priceDzd} DA
                    </span>
                    {publishedSpecial.originalPriceDzd && (
                      <span className="font-mono text-sm text-[#e8dcc8]/50 line-through">
                        {publishedSpecial.originalPriceDzd} DA
                      </span>
                    )}
                  </div>
                </div>

                <p className="font-sans text-xs sm:text-sm text-[#e8dfd1] leading-relaxed max-w-2xl">
                  {publishedSpecial.description || 'Specialty creation freshly crafted by our baristas in Miliana.'}
                </p>

                {publishedSpecial.perkText && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-[#f4d19b] font-medium bg-[#c9833a]/15 px-3 py-1 rounded-full border border-[#c9833a]/30">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{publishedSpecial.perkText}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleAddCustomSpecial(publishedSpecial, e)}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 ${
                      addedIds[publishedSpecial.id]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-[#c9833a] to-[#b7742d] hover:brightness-110 text-[#1b0d09]'
                    }`}
                  >
                    {addedIds[publishedSpecial.id] ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Tray</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Order Today's Special ({publishedSpecial.priceDzd} DA)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#f4d19b] hover:text-white text-xs font-semibold border border-[#c9833a]/30 transition-all cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide All Drops' : `View All ${customSpecials.length} Specials & Drops`}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Expandable Featured Cards Banner */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden bg-[#faf6ef] border-b border-[#ded7c8]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
              {/* SECTION A: ACTIVE TODAY'S SPECIALS FROM MANAGER */}
              {customSpecials.length > 0 && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#ded7c8]/80">
                    <div>
                      <div className="inline-flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#351016] text-[#faf6ee] text-[10px] font-sans font-bold uppercase tracking-wider">
                          Curated Today
                        </span>
                        <span className="font-serif italic text-sm text-[#c9833a] font-medium">
                          {customSpecials.length} Limited-Time Items
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#2d1217] mt-1">
                        Today's Featured Drops & Limited Specials
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-[#614f44]">
                        Single-origin roasts, cold-pressed market juices, signature mocktails, and fresh patisserie crafted daily in Miliana.
                      </p>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'coffee', label: 'Coffee' },
                        { id: 'drinks', label: 'Drinks' },
                        { id: 'juice', label: 'Juices' },
                        { id: 'mocktails', label: 'Mocktails' },
                        { id: 'desserts', label: 'Desserts' },
                        { id: 'offers', label: 'Offers' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedCategoryTab(tab.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategoryTab === tab.id
                              ? 'bg-[#351016] text-white shadow-sm'
                              : 'bg-[#eee9de] text-[#614f44] hover:bg-[#e2dacb]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid of Active Specials */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCustomSpecials.map((spec) => {
                      const isRecentlyAdded = addedIds[spec.id];
                      const discountPct =
                        spec.originalPriceDzd && spec.originalPriceDzd > spec.priceDzd
                          ? Math.round(
                              ((spec.originalPriceDzd - spec.priceDzd) / spec.originalPriceDzd) * 100,
                            )
                          : null;

                      return (
                        <div
                          key={spec.id}
                          className="bg-white rounded-2xl border border-[#ded7c8] overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                        >
                          <div>
                            {/* Card Media Banner */}
                            <div className="relative h-44 w-full bg-[#20090d] overflow-hidden group">
                              <img
                                src={spec.image}
                                alt={spec.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#351016]/90 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-[#f4d19b] border border-[#c9833a]/30 shadow">
                                  {getCategoryIcon(spec.category)}
                                  <span>{spec.category}</span>
                                </span>

                                {discountPct && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold font-mono shadow">
                                    -{discountPct}%
                                  </span>
                                )}
                              </div>

                              <div className="absolute bottom-2.5 left-2.5">
                                <span className="px-2.5 py-0.5 rounded bg-[#c9833a] text-[#150a0c] text-[10px] font-bold uppercase tracking-wider shadow">
                                  {spec.badgeText || "TODAY'S SPECIAL"}
                                </span>
                              </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-4 space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-serif font-bold text-base text-[#2d1217] leading-snug line-clamp-1">
                                  {spec.title}
                                </h4>
                                <div className="text-right shrink-0">
                                  <div className="font-mono text-base font-bold text-[#6b3a1f]">
                                    {spec.priceDzd} DA
                                  </div>
                                  {spec.originalPriceDzd && (
                                    <div className="font-mono text-xs text-[#8a7a6f] line-through">
                                      {spec.originalPriceDzd} DA
                                    </div>
                                  )}
                                </div>
                              </div>

                              <p className="font-sans text-xs text-[#59493f] leading-relaxed line-clamp-2">
                                {spec.description}
                              </p>

                              {spec.perkText && (
                                <div className="inline-flex items-center gap-1.5 text-[11px] text-[#6b3a1f] font-medium bg-[#eee9de] px-2 py-0.5 rounded-full border border-[#ded7c8]">
                                  <Flame className="w-3 h-3 text-[#c9833a] shrink-0" />
                                  <span className="truncate">{spec.perkText}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Add Button */}
                          <div className="p-3 bg-[#faf6ee] border-t border-[#ded7c8] flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[#8a7a6f]">
                              Special Price
                            </span>

                            <button
                              type="button"
                              onClick={(e) => handleAddCustomSpecial(spec, e)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                                isRecentlyAdded
                                  ? 'bg-[#2e7d32] text-white'
                                  : 'bg-[#351016] text-[#faf6ee] hover:bg-[#c9833a] hover:text-white'
                              }`}
                            >
                              {isRecentlyAdded ? (
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
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION B: DAILY BARISTA PAIRING RECOMMENDATION */}
              <div className="pt-2 border-t border-[#ded7c8]/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="space-y-0.5">
                    <div className="inline-flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#351016] text-[#faf6ee] text-[10px] font-sans font-bold uppercase tracking-wider">
                        {special.dayName} Recommendation
                      </span>
                      <span className="font-serif italic text-sm text-[#c9833a] font-medium">
                        {special.theme}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-lg text-[#2d1217]">
                      Curated Coffee & Sweet Pairing
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddBoth}
                    className="self-start sm:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#c9833a] to-[#b7742d] hover:brightness-110 text-[#1b0d09] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Order Both Pairing (+2 Stamps)</span>
                  </button>
                </div>

                {/* Two Column Grid: Coffee Item & Sweet Item */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Featured Coffee Card */}
                  <div className="relative p-5 rounded-2xl bg-[#351016] text-[#faf6ee] border border-[#c9833a]/40 shadow-sm flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9833a]/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#c9833a]/25 text-[#f4d19b] flex items-center justify-center shrink-0 border border-[#c9833a]/40">
                            <Coffee className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#f4d19b]/80 block">
                              Featured Coffee
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-serif font-bold text-lg text-white">
                                {special.coffeeHighlight.title}
                              </h5>
                              {coffeeProduct?.dietary && (
                                <div className="flex items-center gap-1">
                                  {coffeeProduct.dietary.map((tag) => (
                                    <DietaryBadge key={tag} tag={tag} theme="dark" size="xs" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="font-mono text-base font-bold text-[#f4d19b] bg-white/10 px-2.5 py-1 rounded-lg border border-[#c9833a]/30">
                          {special.coffeeHighlight.specialPrice}
                        </span>
                      </div>

                      <p className="font-sans text-xs sm:text-sm text-[#e8dfd1] leading-relaxed">
                        {special.coffeeHighlight.tastingNotes}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between relative z-10">
                      <span className="text-[11px] font-sans text-[#f4d19b]/90 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#c9833a]" />
                        Single-Origin Extraction
                      </span>

                      <button
                        type="button"
                        onClick={(e) =>
                          handleQuickAdd(
                            coffeeProduct,
                            special.coffeeHighlight.title,
                            coffeeProduct ? coffeeProduct.priceNum : 250,
                            'coffee',
                            e,
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          isCoffeeRecentlyAdded
                            ? 'bg-[#2e7d32] text-white'
                            : 'bg-[#faf6ee] text-[#351016] hover:bg-[#c9833a] hover:text-white'
                        }`}
                      >
                        {isCoffeeRecentlyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
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

                  {/* 2. Featured Sweet Card */}
                  <div className="relative p-5 rounded-2xl bg-[#faf6ef] text-[#2d1217] border border-[#ded7c8] shadow-sm flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9833a]/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#351016]/10 text-[#6b3a1f] flex items-center justify-center shrink-0 border border-[#6b3a1f]/20">
                            <Cookie className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#8a7a6f] block">
                              Featured Sweet
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-serif font-bold text-lg text-[#2d1217]">
                                {special.sweetHighlight.title}
                              </h5>
                              {sweetProduct?.dietary && (
                                <div className="flex items-center gap-1">
                                  {sweetProduct.dietary.map((tag) => (
                                    <DietaryBadge key={tag} tag={tag} theme="cream" size="xs" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="font-mono text-base font-bold text-[#6b3a1f] bg-[#eee9de] px-2.5 py-1 rounded-lg border border-[#ded7c8]">
                          {special.sweetHighlight.specialPrice}
                        </span>
                      </div>

                      <p className="font-sans text-xs sm:text-sm text-[#59493f] leading-relaxed">
                        {special.sweetHighlight.tastingNotes}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#ded7c8] flex items-center justify-between relative z-10">
                      <span className="text-[11px] font-sans text-[#6b3a1f] flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-[#c9833a]" />
                        Fresh Miliana Patisserie
                      </span>

                      <button
                        type="button"
                        onClick={(e) =>
                          handleQuickAdd(
                            sweetProduct,
                            special.sweetHighlight.title,
                            sweetProduct ? sweetProduct.priceNum : 350,
                            'sweets',
                            e,
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          isSweetRecentlyAdded
                            ? 'bg-[#2e7d32] text-white'
                            : 'bg-[#351016] text-[#faf6ee] hover:bg-[#c9833a] hover:text-white'
                        }`}
                      >
                        {isSweetRecentlyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
