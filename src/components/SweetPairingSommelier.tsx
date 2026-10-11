import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Coffee,
  Cookie,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wine,
  UtensilsCrossed,
  ArrowRight,
} from 'lucide-react';
import {
  getSweetPairingForDrink,
  POPULAR_PAIRING_DRINKS,
  ResolvedPairing,
} from '../data/sweetPairingsData';
import {
  OfficialMenuItem,
  getAllOfficialProducts,
} from '../data/officialMenuData';
import { CartItem } from '../types/coffee';
import { DietaryBadge } from './DietaryBadge';

interface SweetPairingSommelierProps {
  cart?: CartItem[];
  onAddToCart?: (item: OfficialMenuItem & { notes?: string; customPrice?: number }) => void;
  onOpenOrderModal?: () => void;
}

export const SweetPairingSommelier: React.FC<SweetPairingSommelierProps> = ({
  cart = [],
  onAddToCart,
  onOpenOrderModal,
}) => {
  // All drink items from official menu for the dropdown
  const allDrinks = useMemo(() => {
    return getAllOfficialProducts().filter(
      (p) => p.category === 'coffee' || p.category === 'drinks' || p.category === 'fresh',
    );
  }, []);

  // Detect if user has a coffee or specialty drink in their cart
  const drinkInCart = useMemo(() => {
    return cart.find((item) => {
      const match = allDrinks.find(
        (d) => d.id === item.id || d.name.toLowerCase() === item.name.toLowerCase(),
      );
      return Boolean(match);
    });
  }, [cart, allDrinks]);

  // Initial selection: cart drink if available, otherwise Spanish Latte
  const [selectedDrinkId, setSelectedDrinkId] = useState<string>(() => {
    if (drinkInCart) {
      const matched = allDrinks.find(
        (d) => d.id === drinkInCart.id || d.name.toLowerCase() === drinkInCart.name.toLowerCase(),
      );
      return matched ? matched.id : 'latte-spanish-latte';
    }
    return 'latte-spanish-latte';
  });

  // Keep synced if a new drink is added to cart
  useEffect(() => {
    if (drinkInCart) {
      const matched = allDrinks.find(
        (d) => d.id === drinkInCart.id || d.name.toLowerCase() === drinkInCart.name.toLowerCase(),
      );
      if (matched && matched.id !== selectedDrinkId) {
        setSelectedDrinkId(matched.id);
      }
    }
  }, [drinkInCart, allDrinks]);

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Resolve pairing object based on selectedDrinkId
  const pairing: ResolvedPairing = useMemo(() => {
    return getSweetPairingForDrink(selectedDrinkId);
  }, [selectedDrinkId]);

  const handleAddSweet = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onAddToCart) return;
    onAddToCart(pairing.sweet);
    const id = pairing.sweet.id;
    setAddedIds((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      setAddedIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 1500);
  };

  const handleAddPairingBoth = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onAddToCart) return;
    onAddToCart(pairing.drink);
    setTimeout(() => {
      onAddToCart(pairing.sweet);
    }, 160);

    const drinkId = pairing.drink.id;
    const sweetId = pairing.sweet.id;
    setAddedIds((prev) => ({ ...prev, [drinkId]: true, [sweetId]: true }));
    window.setTimeout(() => {
      setAddedIds((prev) => {
        const next = { ...prev };
        delete next[drinkId];
        delete next[sweetId];
        return next;
      });
    }, 1500);
  };

  const isSweetAdded = Boolean(addedIds[pairing.sweet.id]);
  const isPairingAdded = Boolean(addedIds[pairing.drink.id] && addedIds[pairing.sweet.id]);

  const totalPairingPrice = pairing.drink.priceNum + pairing.sweet.priceNum;

  return (
    <div className="w-full mb-10 sm:mb-14">
      <div className="relative rounded-2xl sm:rounded-3xl bg-[#f7f2e7] border border-[#ded5c3] p-4 sm:p-7 shadow-[0_6px_25px_-8px_rgba(53,16,22,0.08)] overflow-hidden transition-all">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#c9833a]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#351016]/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ded5c3]/80 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#351016] text-[#f4d19b] flex items-center justify-center shrink-0 shadow-xs border border-[#c9833a]/30">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-[10px] uppercase font-bold tracking-[0.2em] text-[#c9833a]">
                  VENTY SOMMELIER
                </span>
                {drinkInCart && (
                  <span className="inline-flex items-center gap-1 bg-[#351016]/10 text-[#351016] text-[9.5px] font-semibold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32]" />
                    Cart Match
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2d1217] leading-tight">
                Artisanal Sweet Pairing Guide
              </h3>
            </div>
          </div>

          {/* Toggle Expand / Collapse */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b3a1f] hover:text-[#351016] px-3 py-1.5 rounded-full bg-white/60 hover:bg-white border border-[#ded5c3] transition-all cursor-pointer"
              aria-expanded={isExpanded}
              aria-label="Toggle sweet pairing interactive tool"
            >
              <span>{isExpanded ? 'Collapse' : 'Explore Pairings'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#c9833a]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#c9833a]" />
              )}
            </button>
          </div>
        </div>

        {/* 2. Interactive Tool Body */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pt-4 space-y-5 relative z-10"
            >
              {/* Drink Selector Strip */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <label
                    htmlFor="sommelier-drink-select"
                    className="font-sans text-xs font-medium text-[#614f44] flex items-center gap-1.5"
                  >
                    <Coffee className="w-3.5 h-3.5 text-[#c9833a]" />
                    <span>Choose your coffee or specialty drink:</span>
                  </label>

                  {/* Dropdown for All Drinks */}
                  <div className="relative">
                    <select
                      id="sommelier-drink-select"
                      value={selectedDrinkId}
                      onChange={(e) => setSelectedDrinkId(e.target.value)}
                      className="text-xs font-sans font-medium text-[#2d1217] bg-white border border-[#ded5c3] rounded-xl px-3 py-1.5 pr-8 hover:border-[#c9833a] focus:outline-none focus:ring-2 focus:ring-[#c9833a]/40 cursor-pointer shadow-2xs appearance-none"
                    >
                      <optgroup label="Popular Coffees">
                        {POPULAR_PAIRING_DRINKS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="All Menu Coffees & Drinks">
                        {allDrinks
                          .filter((d) => !POPULAR_PAIRING_DRINKS.some((p) => p.id === d.id))
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.price})
                            </option>
                          ))}
                      </optgroup>
                    </select>
                    <ChevronDown className="w-3 h-3 text-[#6b3a1f] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Popular Drink Quick Select Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {POPULAR_PAIRING_DRINKS.map((drink) => {
                    const isSelected = selectedDrinkId === drink.id;
                    return (
                      <button
                        key={drink.id}
                        type="button"
                        onClick={() => setSelectedDrinkId(drink.id)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-[#351016] text-[#faf6ee] shadow-xs'
                            : 'bg-white/80 hover:bg-white text-[#614f44] border border-[#ded5c3]'
                        }`}
                      >
                        {drink.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pairing Result Card: Left Beverage Badge + Right Artisanal Sweet Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Left: Your Drink Summary */}
                <div className="lg:col-span-4 p-4 rounded-2xl bg-white/70 border border-[#ded5c3] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#8a7a6f] block mb-1">
                      Your Selected Beverage
                    </span>
                    <h4 className="font-serif font-bold text-lg text-[#2d1217]">
                      {pairing.drink.name}
                    </h4>
                    <span className="font-mono text-xs font-semibold text-[#c9833a] block mt-0.5">
                      {pairing.drink.price}
                    </span>
                    <p className="font-sans text-xs text-[#614f44] mt-2 leading-relaxed">
                      {pairing.drink.description ||
                        'Crafted daily with single-origin beans and precision temperature extraction.'}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#ded5c3]/80 flex items-center justify-between flex-wrap gap-1.5">
                    <span className="text-[11px] font-sans text-[#8a7a6f]">
                      Category: <span className="capitalize">{pairing.drink.category}</span>
                    </span>
                    {pairing.drink.dietary && pairing.drink.dietary.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {pairing.drink.dietary.map((tag) => (
                          <DietaryBadge
                            key={tag}
                            tag={tag}
                            theme="cream"
                            size="xs"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Center / Right: Suggested Artisanal Sweet Card */}
                <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-[#351016] text-[#faf6ee] border border-[#c9833a]/50 shadow-md flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#c9833a]/15 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-3 relative z-10">
                    <div className="flex flex-wrap items-start justify-between gap-2.5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#c9833a]/25 text-[#f4d19b] border border-[#c9833a]/40 text-[10px] font-sans font-bold uppercase tracking-wider">
                            ★ Recommended Sweet
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#faf6ee] text-[10px] font-sans font-semibold">
                            {pairing.recommendation.pairProfileBadge}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-xl sm:text-2xl text-white">
                          {pairing.sweet.name}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-base sm:text-lg font-bold text-[#f4d19b] bg-white/10 px-2.5 py-1 rounded-lg border border-[#c9833a]/30 inline-block">
                          {pairing.sweet.price}
                        </span>
                        {pairing.sweet.dietary && pairing.sweet.dietary.length > 0 && (
                          <div className="flex items-center justify-end gap-1 mt-1.5 flex-wrap">
                            {pairing.sweet.dietary.map((tag) => (
                              <DietaryBadge
                                key={tag}
                                tag={tag}
                                theme="dark"
                                size="xs"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sommelier Tasting Notes */}
                    <p className="font-sans text-xs sm:text-sm text-[#e8dfd1] leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/10">
                      “{pairing.recommendation.sommelierNotes}”
                    </p>

                    {/* Flavor highlights */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#f4d19b]/80 mr-1">
                        Flavor Notes:
                      </span>
                      {pairing.recommendation.flavorHighlights.map((flavor) => (
                        <span
                          key={flavor}
                          className="text-[11px] font-sans text-[#faf6ee] bg-[#220a0e] border border-[#c9833a]/40 px-2 py-0.5 rounded-md"
                        >
                          {flavor}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <span className="text-xs font-sans text-[#f4d19b] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#c9833a]" />
                      <span>
                        Pairing total:{' '}
                        <strong className="text-white font-mono">{totalPairingPrice} DA</strong>
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Button 1: Add Sweet Only */}
                      <button
                        type="button"
                        onClick={handleAddSweet}
                        className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          isSweetAdded
                            ? 'bg-[#2e7d32] text-white'
                            : 'bg-white/10 hover:bg-white/20 text-[#faf6ee] border border-white/20'
                        }`}
                      >
                        {isSweetAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Sweet Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-[#f4d19b]" />
                            <span>Add {pairing.sweet.name}</span>
                          </>
                        )}
                      </button>

                      {/* Button 2: Add Complete Pairing */}
                      <button
                        type="button"
                        onClick={handleAddPairingBoth}
                        className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                          isPairingAdded
                            ? 'bg-[#2e7d32] text-white'
                            : 'bg-gradient-to-r from-[#c9833a] to-[#df9e59] hover:brightness-110 text-[#1b0d09]'
                        }`}
                      >
                        {isPairingAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Pairing Added!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Order Full Pairing</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
