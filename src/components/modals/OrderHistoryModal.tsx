import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  LogOut,
  Edit3,
  Check,
  Coffee,
  Phone,
  Mail,
  KeyRound,
  Plus,
} from 'lucide-react';
import { PastOrder, CartItem } from '../../types/coffee';
import { LoyaltyCustomer } from '../../types/loyalty';
import {
  getCustomerOrders,
  syncCustomerOrdersFromBackend,
} from '../../utils/orderStorage';
import {
  getActiveCustomer,
  requestCustomerOtp,
  verifyCustomerOtp,
  logoutLoyaltyCustomer,
  updateLoyaltyCustomerProfile,
  isQualifyingLoyaltyItem,
} from '../../services/loyalty';
import {
  formatAlgiersDate,
  formatAlgiersTime,
  formatAlgiersDateTime,
} from '../../utils/algiersTime';
import { OrderStatusTracker } from '../OrderStatusTracker';
import { VentyLogo } from '../VentyLogo';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReorder: (items: CartItem[]) => void;
  onQuickReorderItem?: (item: CartItem) => void;
  onOpenNewOrder: () => void;
  onOpenLoyalty?: () => void;
  cart?: CartItem[];
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  onReorder,
  onQuickReorderItem,
  onOpenNewOrder,
  onOpenLoyalty,
  cart = [],
}) => {
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(() => getActiveCustomer());
  const [orders, setOrders] = useState<PastOrder[]>(() => getCustomerOrders());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [reorderedItemsMap, setReorderedItemsMap] = useState<Record<string, boolean>>({});

  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    favouriteDrink: 'Flat White',
  });

  // Auth Mode when logged out ('login' | 'signup')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginStep, setLoginStep] = useState<'form' | 'code'>('form');
  const [signupStep, setSignupStep] = useState<'form' | 'code'>('form');
  const [signupCode, setSignupCode] = useState('');
  const [signupForm, setSignupForm] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [isAuthBusy, setIsAuthBusy] = useState(false);

  const showFeedback = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const refreshState = async () => {
    const active = getActiveCustomer();
    setCustomer(active);
    if (active) {
      setProfileForm({
        name: active.name || '',
        phone: active.phone || '',
        email: active.email || '',
        favouriteDrink: active.favouriteDrink || 'Flat White',
      });
      const localOrders = getCustomerOrders(active.id);
      setOrders(localOrders);
      if (localOrders.length > 0 && !expandedOrderId) {
        setExpandedOrderId(localOrders[0].orderId || localOrders[0].id);
      }
      setIsLoading(true);
      const synced = await syncCustomerOrdersFromBackend();
      setOrders(synced);
      if (synced.length > 0 && !expandedOrderId) {
        setExpandedOrderId(synced[0].orderId || synced[0].id);
      }
      setIsLoading(false);
    } else {
      setOrders([]);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshState();

    const handleOrdersUpdated = () => {
      const active = getActiveCustomer();
      setCustomer(active);
      setOrders(active ? getCustomerOrders(active.id) : []);
    };

    const handleLoyaltyUpdated = () => {
      const active = getActiveCustomer();
      setCustomer(active);
      setOrders(active ? getCustomerOrders(active.id) : []);
    };

    window.addEventListener('venty:orders:updated', handleOrdersUpdated);
    window.addEventListener('venty:loyalty:updated', handleLoyaltyUpdated);

    // Poll backend order history every 6s while modal is open for live status updates
    const interval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const active = getActiveCustomer();
      if (active) {
        syncCustomerOrdersFromBackend().then((synced) => {
          if (synced.length > 0) setOrders(synced);
        });
      }
    }, 6000);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('venty:orders:updated', handleOrdersUpdated);
      window.removeEventListener('venty:loyalty:updated', handleLoyaltyUpdated);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const handleReorderClick = (order: PastOrder) => {
    onReorder(order.items);
    onClose();
  };

  const handleQuickReorderSingleItem = (
    item: CartItem,
    orderId: string,
    itemIdx: number,
  ) => {
    if (onQuickReorderItem) {
      onQuickReorderItem(item);
    } else {
      onReorder([item]);
    }

    const key = `${orderId}-${item.id}-${itemIdx}`;
    setReorderedItemsMap((prev) => ({ ...prev, [key]: true }));

    const customParts = [
      item.notes,
      item.milk ? `Milk: ${item.milk}` : null,
      item.grind ? `Grind: ${item.grind}` : null,
    ]
      .filter(Boolean)
      .join(', ');

    showFeedback(
      `✓ Added "${item.name}"${customParts ? ` (${customParts})` : ''} to your active tray!`,
    );

    window.setTimeout(() => {
      setReorderedItemsMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 2000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginStep === 'form') {
      if (!loginPhone.trim() || !loginEmail.trim()) {
        showFeedback('Please enter both your phone number and email.');
        return;
      }
      setIsAuthBusy(true);
      try {
        const res = await requestCustomerOtp({
          phone: loginPhone.trim(),
          email: loginEmail.trim(),
          purpose: 'LOGIN',
        });
        showFeedback(res.message);
        if (res.success) {
          setLoginStep('code');
          if (res.testCode) {
            setLoginCode(res.testCode);
          }
        }
      } finally {
        setIsAuthBusy(false);
      }
      return;
    }

    // Verify Code
    if (!loginCode.trim() || loginCode.trim().length !== 6) {
      showFeedback('Please enter the 6-digit verification code.');
      return;
    }
    setIsAuthBusy(true);
    try {
      const res = await verifyCustomerOtp({
        phone: loginPhone.trim(),
        email: loginEmail.trim(),
        code: loginCode.trim(),
      });
      showFeedback(res.message);
      if (res.success && res.customer) {
        setCustomer(res.customer);
        setLoginPhone('');
        setLoginEmail('');
        setLoginCode('');
        setLoginStep('form');
        await refreshState();
      }
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupStep === 'form') {
      if (!signupForm.name.trim() || !signupForm.phone.trim() || !signupForm.email.trim()) {
        showFeedback('Full Name, Phone Number, and Email are required.');
        return;
      }
      setIsAuthBusy(true);
      try {
        const res = await requestCustomerOtp({
          name: signupForm.name.trim(),
          phone: signupForm.phone.trim(),
          email: signupForm.email.trim(),
          purpose: 'SIGNUP',
        });
        showFeedback(res.message);
        if (res.success) {
          setSignupStep('code');
          if (res.testCode) {
            setSignupCode(res.testCode);
          }
        }
      } finally {
        setIsAuthBusy(false);
      }
      return;
    }

    // Verify Signup Code
    if (!signupCode.trim() || signupCode.trim().length !== 6) {
      showFeedback('Please enter the 6-digit verification code.');
      return;
    }
    setIsAuthBusy(true);
    try {
      const res = await verifyCustomerOtp({
        name: signupForm.name.trim(),
        phone: signupForm.phone.trim(),
        email: signupForm.email.trim(),
        code: signupCode.trim(),
      });
      showFeedback(res.message);
      if (res.success && res.customer) {
        setCustomer(res.customer);
        setSignupForm({
          name: '',
          phone: '',
          email: '',
        });
        setSignupCode('');
        setSignupStep('form');
        await refreshState();
      }
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    await logoutLoyaltyCustomer();
    setCustomer(null);
    setOrders([]);
    setIsEditingProfile(false);
    showFeedback('Logged out of your customer profile.');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.phone.trim()) return;
    const res = await updateLoyaltyCustomerProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
      favouriteDrink: profileForm.favouriteDrink,
    });
    showFeedback(res.message);
    if (res.success && res.customer) {
      setCustomer(res.customer);
      setIsEditingProfile(false);
    }
  };

  const getCanonicalStatus = (status: string): string => {
    return String(status || 'PENDING').toUpperCase();
  };

  const didOrderEarnStamp = (order: PastOrder): boolean => {
    const statusUpper = getCanonicalStatus(order.status);
    if (statusUpper === 'CANCELLED' || order.loyaltyReversed) return false;
    if (order.loyaltyStampAwarded) return true;
    const qualifies =
      order.qualifiesForLoyalty !== undefined
        ? order.qualifiesForLoyalty
        : (order.items || []).some(isQualifyingLoyaltyItem);
    return Boolean(qualifies && (order.loyaltyProcessed || statusUpper === 'COMPLETED' || statusUpper === 'READY'));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#faf6ef] border border-[#ded7c8] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-[#221a14] rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#ded7c8] flex items-center justify-between bg-[#faf6ef]">
          <div className="flex items-center gap-3">
            <VentyLogo
              className="h-9 w-auto max-w-[130px]"
              imgClassName="h-full w-auto max-h-9 max-w-[130px] object-contain block"
            />
            <div>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8a7b70] font-semibold block">
                VENTY THE COFFEE · Miliana (Africa/Algiers)
              </span>
              <h3 className="font-serif font-bold text-2xl text-[#2d1217]">
                My Orders & Customer Profile
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#7a6b61] hover:text-[#221a14] hover:bg-[#eee9de] rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Toast */}
        {feedbackBanner && (
          <div className="bg-[#351016] text-[#faf6ee] px-5 py-2.5 text-xs font-sans flex items-center justify-between border-b border-[#522917] animate-in fade-in duration-200">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#f4d19b] shrink-0" />
              <span>{feedbackBanner}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewOrder();
              }}
              className="inline-flex items-center gap-1.5 bg-[#c9833a] hover:bg-[#df9e59] text-[#1b0d09] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all shadow-xs cursor-pointer ml-3 shrink-0"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>View Tray</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Customer Profile & Authentication Card */}
          {customer ? (
            <div className="bg-[#f4eee1] border border-[#ded5c3] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#351016] text-[#f4d19b] flex items-center justify-center font-serif font-bold text-base shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif font-bold text-base sm:text-lg text-[#221a14]">
                        {customer.name}
                      </h4>
                      <span className="font-mono text-[10px] font-bold bg-white border border-[#ded7c8] px-2 py-0.5 rounded text-[#351016]">
                        {customer.customerId || customer.id}
                      </span>
                      <span className="font-mono text-[10px] font-bold bg-[#c9833a]/20 text-[#8a531e] border border-[#c9833a]/30 px-2 py-0.5 rounded-full">
                        {customer.currentStampCount}/7 Stamps
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#614f44] mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-[#c9833a]" />
                        {customer.phone}
                      </span>
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#c9833a]" />
                          {customer.email}
                        </span>
                      )}
                      {customer.favouriteDrink && (
                        <span className="flex items-center gap-1">
                          <Coffee className="w-3 h-3 text-[#c9833a]" />
                          Fav: {customer.favouriteDrink}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-[#ded7c8] hover:bg-[#faf6ef] text-[#351016] rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-[#ded7c8] hover:bg-red-50 text-[#7a6b61] hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>

              {/* Section 19: Customer Account Quick-Access Bar (My Orders | My Loyalty Card | My Rewards | My Profile) */}
              <div className="pt-2.5 border-t border-[#ded5c3] flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    !isEditingProfile
                      ? 'bg-[#351016] text-[#faf6ef]'
                      : 'bg-white text-[#351016] border border-[#ded7c8] hover:bg-[#faf6ef]'
                  }`}
                >
                  My Orders ({orders.length})
                </button>

                {onOpenLoyalty && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLoyalty();
                      }}
                      className="px-3 py-1.5 rounded-lg font-medium bg-white text-[#351016] border border-[#ded7c8] hover:bg-[#faf6ef] transition-colors cursor-pointer"
                    >
                      My Loyalty Card ({customer.currentStampCount}/7)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLoyalty();
                      }}
                      className="px-3 py-1.5 rounded-lg font-medium bg-white text-[#8a531e] border border-[#c9833a]/40 hover:bg-[#faf6ef] transition-colors cursor-pointer"
                    >
                      My Rewards ({customer.availableRewards?.length || 0})
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    isEditingProfile
                      ? 'bg-[#351016] text-[#faf6ef]'
                      : 'bg-white text-[#351016] border border-[#ded7c8] hover:bg-[#faf6ef]'
                  }`}
                >
                  My Profile
                </button>
              </div>

              {/* Profile Editor Form */}
              {isEditingProfile && (
                <form
                  onSubmit={handleSaveProfile}
                  className="pt-3 border-t border-[#ded5c3] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
                >
                  <div>
                    <label className="block font-medium text-[#59493f] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#ded7c8] rounded-lg focus:outline-none focus:border-[#351016]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#59493f] mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#ded7c8] rounded-lg focus:outline-none focus:border-[#351016]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#59493f] mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 bg-white border border-[#ded7c8] rounded-lg focus:outline-none focus:border-[#351016]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#59493f] mb-1">Favourite Drink</label>
                    <input
                      type="text"
                      value={profileForm.favouriteDrink}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, favouriteDrink: e.target.value })
                      }
                      placeholder="e.g. Iced Specialty Latte"
                      className="w-full px-3 py-2 bg-white border border-[#ded7c8] rounded-lg focus:outline-none focus:border-[#351016]"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#8a7b70] font-mono">
                      Member since {formatAlgiersDate(customer.createdAt)}
                    </span>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 bg-[#351016] hover:bg-[#c9833a] text-[#faf6ee] px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Profile</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Customer Login / Registration Flow when logged out */
            <div className="bg-[#f4eee1] border border-[#ded5c3] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#ded5c3] pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#c9833a]" />
                  <h4 className="font-serif font-bold text-base text-[#221a14]">
                    {authMode === 'login' ? 'Customer Sign In' : 'Create Customer Account (+2 Free Stamps)'}
                  </h4>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#ded7c8] text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                    }}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-[#351016] text-[#faf6ef]'
                        : 'text-[#59493f] hover:bg-[#faf6ef]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                    }}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-[#351016] text-[#faf6ef]'
                        : 'text-[#59493f] hover:bg-[#faf6ef]'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  {loginStep === 'form' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-sans text-xs font-semibold text-[#221a14] mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          autoComplete="tel"
                          placeholder="e.g. 0550123456"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#ded7c8] rounded-xl text-sm font-mono focus:outline-none focus:border-[#351016]"
                        />
                      </div>
                      <div>
                        <label className="block font-sans text-xs font-semibold text-[#221a14] mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="name@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#ded7c8] rounded-xl text-sm focus:outline-none focus:border-[#351016]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 bg-white border border-[#ded7c8] rounded-xl text-xs text-[#59493f] flex items-center justify-between">
                        <span>Code sent to <strong>{loginPhone}</strong></span>
                        <button
                          type="button"
                          onClick={() => setLoginStep('form')}
                          className="text-[11px] text-[#c9833a] hover:underline font-semibold cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                      <div>
                        <label className="block font-sans text-xs font-semibold text-[#221a14] mb-1">
                          6-Digit Verification Code *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          required
                          placeholder="123456"
                          value={loginCode}
                          onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#ded7c8] rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:border-[#351016]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isAuthBusy}
                      className="bg-[#351016] hover:bg-[#c9833a] disabled:opacity-60 text-[#faf6ee] px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {isAuthBusy
                        ? 'Verifying...'
                        : loginStep === 'form'
                        ? 'Send Verification Code →'
                        : 'Verify & Sign In'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-3">
                  {signupStep === 'form' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-medium text-[#59493f] text-xs mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Amine Benali"
                          value={signupForm.name}
                          onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-[#ded7c8] rounded-lg text-sm focus:outline-none focus:border-[#351016]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-medium text-[#59493f] mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. 0550123456"
                            value={signupForm.phone}
                            onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-[#ded7c8] rounded-lg font-mono text-sm focus:outline-none focus:border-[#351016]"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-[#59493f] mb-1">Email *</label>
                          <input
                            type="email"
                            required
                            placeholder="name@example.com"
                            value={signupForm.email}
                            onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-[#ded7c8] rounded-lg text-sm focus:outline-none focus:border-[#351016]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 bg-white border border-[#ded7c8] rounded-xl text-xs text-[#59493f] flex items-center justify-between">
                        <span>Code sent to <strong>{signupForm.phone}</strong></span>
                        <button
                          type="button"
                          onClick={() => setSignupStep('form')}
                          className="text-[11px] text-[#c9833a] hover:underline font-semibold cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                      <div>
                        <label className="block font-sans text-xs font-semibold text-[#221a14] mb-1">
                          6-Digit Verification Code *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          required
                          placeholder="123456"
                          value={signupCode}
                          onChange={(e) => setSignupCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#ded7c8] rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:border-[#351016]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-[#6b3a1f]">
                      Includes <strong>+2 Welcome Loyalty Stamps</strong> added to your account upon registration.
                    </span>
                    <button
                      type="submit"
                      disabled={isAuthBusy}
                      className="bg-[#351016] hover:bg-[#c9833a] disabled:opacity-60 text-[#faf6ee] px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {isAuthBusy
                        ? 'Verifying...'
                        : signupStep === 'form'
                        ? 'Sign Up (+2 Free Stamps)'
                        : 'Confirm & Collect +2 Stamps'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* My Orders Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#ded7c8] pb-2">
              <div>
                <h4 className="font-serif font-bold text-lg text-[#2d1217]">
                  My Orders
                </h4>
                <p className="font-sans text-[11px] text-[#8a7a6f]">
                  All timestamps displayed in Algeria business time (Africa/Algiers)
                </p>
              </div>
              {customer && (
                <span className="text-xs font-mono font-semibold text-[#614f44]">
                  {isLoading ? 'Syncing...' : `${orders.length} ${orders.length === 1 ? 'Order' : 'Orders'}`}
                </span>
              )}
            </div>

            {!customer ? (
              <div className="py-10 text-center space-y-3 bg-[#f7f2e8] border border-[#ded5c3] rounded-2xl p-6">
                <ShoppingBag className="w-8 h-8 text-[#8a7b70] mx-auto" />
                <p className="font-serif font-bold text-base text-[#2d1217]">
                  Log in or sign up above to view your personal order history
                </p>
                <p className="font-sans text-xs text-[#614f44] max-w-sm mx-auto">
                  Every order placed under your account is linked to your profile and tracks your loyalty stamps automatically.
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center space-y-4 bg-[#f7f2e8] border border-[#ded5c3] rounded-2xl p-6">
                <div className="w-12 h-12 bg-[#351016]/10 text-[#351016] flex items-center justify-center mx-auto rounded-full">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg text-[#2d1217]">
                    No Orders Yet for {customer.name}
                  </h4>
                  <p className="font-sans text-xs text-[#614f44] mt-1 max-w-sm mx-auto">
                    When you place an order for specialty coffee, drinks, or sweets, your order receipt and loyalty stamps will appear here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewOrder();
                  }}
                  className="bg-[#351016] hover:bg-[#c9833a] text-[#faf6ee] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  Browse Menu & Order Now →
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const statusUpper = getCanonicalStatus(order.status);
                  const earnedStamp = didOrderEarnStamp(order);
                  const algiersDateStr = order.algiersDate || formatAlgiersDate(order.createdAt);
                  const algiersTimeStr = order.algiersTime || formatAlgiersTime(order.createdAt);
                  const algiersFullStr =
                    order.algiersDateTime ||
                    (algiersTimeStr ? `${algiersDateStr} · ${algiersTimeStr}` : algiersDateStr);

                  return (
                    <div
                      key={order.id}
                      className="bg-[#f7f2e8] border border-[#ded5c3] rounded-xl overflow-hidden transition-all duration-200 shadow-2xs"
                    >
                      {/* Order Card Main Summary (Matches Section 7 specification) */}
                      <div
                        onClick={() => toggleExpand(order.id)}
                        className="p-4 sm:p-5 cursor-pointer hover:bg-[#eee8db]/70 transition-colors space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-sm sm:text-base text-[#2d1217] tracking-tight">
                                ORDER #{order.orderId || order.id}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                                  statusUpper === 'COMPLETED' || statusUpper === 'READY'
                                    ? 'bg-[#2e7d32]/15 text-[#2e7d32] border-[#2e7d32]/30'
                                    : statusUpper === 'CONFIRMED' || statusUpper === 'PREPARING'
                                    ? 'bg-[#351016]/10 text-[#351016] border-[#351016]/25'
                                    : statusUpper === 'CANCELLED'
                                    ? 'bg-red-100 text-red-700 border-red-300'
                                    : 'bg-[#c9833a]/15 text-[#8a531e] border-[#c9833a]/30'
                                }`}
                              >
                                Status: {statusUpper}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-[#614f44] mt-1">
                              <Calendar className="w-3.5 h-3.5 text-[#c9833a]" />
                              <span className="font-medium">{algiersFullStr}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-base sm:text-lg text-[#351016]">
                              {order.totalAmount} DA
                            </span>
                            <div className="text-[#614f44]">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Items summary & Loyalty Stamp indicator */}
                        <div className="pt-2.5 border-t border-[#ded5c3]/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="space-y-1.5 text-[#2d1217] flex-1 min-w-0">
                            {(order.items || []).map((item, idx) => {
                              const itemKey = `${order.orderId || order.id}-${item.id}-${idx}`;
                              const isReordered = !!reorderedItemsMap[itemKey];

                              return (
                                <div
                                  key={itemKey}
                                  className="flex items-center justify-between gap-2 py-0.5"
                                >
                                  <div className="font-sans min-w-0 truncate">
                                    <span className="font-medium text-[#2d1217]">{item.name}</span>
                                    <span className="text-[#8a7b70] text-[11px] font-mono">
                                      {' '}
                                      × {item.quantity}
                                    </span>
                                    {item.notes && (
                                      <span className="ml-1 text-[10px] text-[#8a531e] bg-[#c9833a]/15 px-1.5 py-0.2 rounded font-medium">
                                        {item.notes}
                                      </span>
                                    )}
                                    <span className="text-[#7a6b61] font-mono text-[11px] ml-1.5">
                                      ({item.price * item.quantity} DA)
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickReorderSingleItem(
                                        item,
                                        order.orderId || order.id,
                                        idx,
                                      );
                                    }}
                                    className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer ${
                                      isReordered
                                        ? 'bg-[#276749] text-white ring-1 ring-[#48bb78]'
                                        : 'bg-white hover:bg-[#351016] text-[#351016] hover:text-white border border-[#ded5c3] shadow-2xs'
                                    }`}
                                    title={`Quick reorder ${item.name} with previous customizations`}
                                  >
                                    {isReordered ? (
                                      <>
                                        <Check className="w-3 h-3 text-[#9ae6b4]" />
                                        <span>Added</span>
                                      </>
                                    ) : (
                                      <>
                                        <RotateCcw className="w-2.5 h-2.5 text-[#c9833a]" />
                                        <span>Quick Reorder</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {earnedStamp && (
                              <span className="inline-flex items-center gap-1 bg-[#c9833a]/20 text-[#8a531e] border border-[#c9833a]/40 px-2.5 py-1 rounded-full text-[11px] font-bold">
                                <Sparkles className="w-3 h-3 text-[#c9833a]" />
                                +{order.loyaltyStampsDelta || 1} Loyalty Stamp
                              </span>
                            )}
                            {order.loyaltyReversed && (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                                Stamp Reversed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details & Live Tracker */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 border-t border-[#ded5c3] bg-[#faf6ef]/80 space-y-4">
                          <OrderStatusTracker
                            status={order.status}
                            pickupTime={order.pickupTime}
                            orderId={order.orderId || order.id}
                          />

                          {/* Item Breakdown with Individual Quick Reorder */}
                          <div className="bg-[#eee8dc] p-4 rounded-xl space-y-2.5 text-xs">
                            <div className="flex justify-between font-sans font-bold text-[#351016] pb-2 border-b border-[#ded5c3]">
                              <span>ORDERED ITEMS ({(order.items || []).length})</span>
                              <span>PRICE & QUICK REORDER</span>
                            </div>

                            <div className="space-y-2">
                              {(order.items || []).map((item, idx) => {
                                const itemKey = `${order.orderId || order.id}-${item.id}-${idx}`;
                                const isReordered = !!reorderedItemsMap[itemKey];

                                return (
                                  <div
                                    key={itemKey}
                                    className="p-3 rounded-xl bg-white/70 border border-[#ded5c3]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-sans hover:border-[#c9833a]/50 transition-all"
                                  >
                                    <div className="space-y-1 min-w-0">
                                      <div className="font-semibold text-[#2d1217] flex items-center gap-1.5 flex-wrap">
                                        <span className="text-sm font-medium">{item.name}</span>
                                        <span className="text-[#8a7b70] font-mono text-xs">
                                          × {item.quantity}
                                        </span>
                                      </div>

                                      {/* Previous Customizations Tags */}
                                      {(item.notes || item.milk || item.grind) && (
                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                          {item.notes && (
                                            <span className="text-[10.5px] font-sans bg-[#c9833a]/15 text-[#8a531e] border border-[#c9833a]/30 px-2 py-0.5 rounded-md font-semibold">
                                              {item.notes}
                                            </span>
                                          )}
                                          {item.milk && (
                                            <span className="text-[10px] font-sans bg-white text-[#614f44] border border-[#ded5c3] px-2 py-0.5 rounded-md font-medium">
                                              Milk: {item.milk}
                                            </span>
                                          )}
                                          {item.grind && (
                                            <span className="text-[10px] font-sans bg-white text-[#614f44] border border-[#ded5c3] px-2 py-0.5 rounded-md font-medium">
                                              Grind: {item.grind}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      <div className="text-[11px] text-[#7a6b61]">
                                        Unit Price:{' '}
                                        <span className="font-mono text-[#351016] font-semibold">
                                          {item.price} DA
                                        </span>
                                        {item.quantity > 1 && (
                                          <span>
                                            {' '}
                                            · Total:{' '}
                                            <span className="font-mono font-semibold">
                                              {item.price * item.quantity} DA
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Quick Reorder Button with previous customizations */}
                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickReorderSingleItem(
                                            item,
                                            order.orderId || order.id,
                                            idx,
                                          )
                                        }
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-2xs cursor-pointer ${
                                          isReordered
                                            ? 'bg-[#276749] text-white ring-2 ring-[#48bb78]/50'
                                            : 'bg-[#351016] hover:bg-[#c9833a] text-[#faf6ee]'
                                        }`}
                                        title={`Quick reorder ${item.name} with previous customizations`}
                                      >
                                        {isReordered ? (
                                          <>
                                            <Check className="w-3.5 h-3.5 stroke-[3] text-[#9ae6b4]" />
                                            <span>Added to Tray!</span>
                                          </>
                                        ) : (
                                          <>
                                            <RotateCcw className="w-3.5 h-3.5 text-[#f4d19b]" />
                                            <span>Quick Reorder</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-between font-bold pt-2 border-t border-[#ded5c3] text-sm text-[#351016]">
                              <span>TOTAL</span>
                              <span className="font-mono">{order.totalAmount} DA</span>
                            </div>
                          </div>

                          {/* Timestamps & Reorder */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#7a6b61]">
                            <div className="font-mono space-x-3">
                              <span>Created: {algiersFullStr}</span>
                              {order.completedAt && (
                                <span>· Completed: {formatAlgiersTime(order.completedAt)}</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleReorderClick(order)}
                              className="inline-flex items-center gap-1.5 bg-[#351016] hover:bg-[#c9833a] text-[#faf6ee] px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reorder Items</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#ded7c8] bg-[#faf6ef] flex items-center justify-between text-xs text-[#736055]">
          <span>Collect at Venty (Soufay, RN14, Khemis Miliana)</span>
          <div className="flex items-center gap-4">
            {onOpenLoyalty && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLoyalty();
                }}
                className="font-semibold text-[#c9833a] hover:underline cursor-pointer"
              >
                Open Stamp Card →
              </button>
            )}
            <button
              onClick={onClose}
              className="font-medium text-[#351016] hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
