/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { BrewMethodsStrip } from './components/BrewMethodsStrip';
import { OurCoffee } from './components/OurCoffee';
import { AboutSection } from './components/AboutSection';
import { GalleryStrip } from './components/GalleryStrip';
import { EventsSection } from './components/EventsSection';
import { FindUsSection } from './components/FindUsSection';
import { DailyQuizSection } from './components/DailyQuizSection';
import { QuizLeaderboardSection } from './components/QuizLeaderboardSection';
import { WeeklyCompetitionSection } from './components/WeeklyCompetitionSection';
import { Footer } from './components/Footer';
import { OrganicDivider } from './components/OrganicDivider';
import { FloatingCartIndicator } from './components/FloatingCartIndicator';
import { IntroLogoAnimation } from './components/IntroLogoAnimation';
import { LoyaltyNotificationCard } from './components/LoyaltyNotificationCard';

import { CartItem, MenuItem } from './types/coffee';
import { OfficialMenuItem } from './data/officialMenuData';

// Code-split modals and management portal to maximize initial load performance on mobile devices
const OrderAheadModal = React.lazy(() =>
  import('./components/modals/OrderAheadModal').then((m) => ({ default: m.OrderAheadModal })),
);
const FullMenuModal = React.lazy(() =>
  import('./components/modals/FullMenuModal').then((m) => ({ default: m.FullMenuModal })),
);
const ShopBeansModal = React.lazy(() =>
  import('./components/modals/ShopBeansModal').then((m) => ({ default: m.ShopBeansModal })),
);
const EventEnquiryModal = React.lazy(() =>
  import('./components/modals/EventEnquiryModal').then((m) => ({ default: m.EventEnquiryModal })),
);
const DirectionsModal = React.lazy(() =>
  import('./components/modals/DirectionsModal').then((m) => ({ default: m.DirectionsModal })),
);
const LoyaltyModal = React.lazy(() =>
  import('./components/modals/LoyaltyModal').then((m) => ({ default: m.LoyaltyModal })),
);
const OrderHistoryModal = React.lazy(() =>
  import('./components/modals/OrderHistoryModal').then((m) => ({ default: m.OrderHistoryModal })),
);
const MenuDigitalAccessModal = React.lazy(() =>
  import('./components/modals/MenuDigitalAccessModal').then((m) => ({ default: m.MenuDigitalAccessModal })),
);
const ManagementPortal = React.lazy(() =>
  import('./components/ManagementPortal').then((m) => ({ default: m.ManagementPortal })),
);

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );

  const navigateToPath = useCallback((nextPath: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setCurrentPath(nextPath);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isManagementRoute =
    currentPath === '/management' || currentPath.startsWith('/management/');

  const [cart, setCart] = useState<CartItem[]>([
    {
      id: 'iced-specialty-latte',
      name: 'Iced Specialty Latte',
      price: 500,
      quantity: 1,
      category: 'cold',
    },
  ]);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuSelectedCategory, setMenuSelectedCategory] = useState('all');
  const [shopBeansModalOpen, setShopBeansModalOpen] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [directionsModalOpen, setDirectionsModalOpen] = useState(false);
  const [loyaltyModalOpen, setLoyaltyModalOpen] = useState(false);
  const [loyaltyInitialTab, setLoyaltyInitialTab] = useState<'card' | 'signup'>('card');
  const [loyaltyInitialAuthMode, setLoyaltyInitialAuthMode] = useState<'signup' | 'login'>('signup');
  const [returnToContextOnAuth, setReturnToContextOnAuth] = useState<boolean>(false);
  const [orderHistoryModalOpen, setOrderHistoryModalOpen] = useState(false);
  const [scanMenuModalOpen, setScanMenuModalOpen] = useState(false);

  const openLoyaltyCardModal = () => {
    setLoyaltyInitialTab('card');
    setReturnToContextOnAuth(false);
    setLoyaltyModalOpen(true);
  };

  const handleOpenLoyaltyFromNotification = (mode: 'signup' | 'login' | 'card') => {
    if (mode === 'card') {
      setLoyaltyInitialTab('card');
      setReturnToContextOnAuth(false);
      setLoyaltyModalOpen(true);
      return;
    }
    const hadOverlayOpen =
      orderModalOpen || menuModalOpen || shopBeansModalOpen || orderHistoryModalOpen;
    setReturnToContextOnAuth(hadOverlayOpen);
    setLoyaltyInitialTab('signup');
    setLoyaltyInitialAuthMode(mode);
    setLoyaltyModalOpen(true);
  };

  const handleSelectMenuCategory = (category: string) => {
    setMenuSelectedCategory(category);
    setMenuModalOpen(true);
  };

  const handleReorder = (items: CartItem[]) => {
    setCart(items);
    setOrderModalOpen(true);
  };

  const handleQuickReorderItem = (item: CartItem) => {
    setCart((prev) => {
      const matchIndex = prev.findIndex(
        (i) =>
          i.id === item.id &&
          (i.notes || '') === (item.notes || '') &&
          (i.milk || '') === (item.milk || '') &&
          (i.grind || '') === (item.grind || ''),
      );
      if (matchIndex > -1) {
        return prev.map((i, idx) =>
          idx === matchIndex
            ? { ...i, quantity: i.quantity + (item.quantity > 0 ? item.quantity : 1) }
            : i,
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity > 0 ? item.quantity : 1,
          category: item.category,
          milk: item.milk,
          grind: item.grind,
          notes: item.notes,
        },
      ];
    });
  };

  const handleAddToCart = (
    item: MenuItem | CartItem | (OfficialMenuItem & { notes?: string; customPrice?: number }),
  ) => {
    const itemPrice =
      'customPrice' in item && item.customPrice !== undefined
        ? item.customPrice
        : 'priceNum' in item
        ? item.priceNum
        : item.price;

    setCart((prev) => {
      const existing = prev.find(
        (i) =>
          i.id === item.id &&
          ('notes' in item ? i.notes === item.notes : true),
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && ('notes' in item ? i.notes === item.notes : true)
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: itemPrice,
          quantity: 1,
          category: 'category' in item ? item.category : undefined,
          grind: 'grind' in item ? item.grind : undefined,
          notes: 'notes' in item ? item.notes : undefined,
        },
      ];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const scrollToFindUs = () => {
    const el = document.getElementById('find-us');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToMenu = () => {
    const el = document.getElementById('menu');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cartTotalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  if (isManagementRoute) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#14090b]" />}>
        <ManagementPortal
          isOpen={true}
          currentPath={currentPath}
          onNavigatePath={navigateToPath}
          onClose={() => navigateToPath('/')}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6ef] text-[#221a14] selection:bg-[#c9833a]/25 selection:text-[#6b3a1f]">
      {/* 1. Navbar */}
      <Navbar
        onOpenMenu={scrollToMenu}
        onOpenOrder={() => setOrderModalOpen(true)}
        onOpenLoyalty={openLoyaltyCardModal}
        onOpenCustomerAuth={handleOpenLoyaltyFromNotification}
        onOpenHistory={() => setOrderHistoryModalOpen(true)}
        onOpenScanMenu={() => setScanMenuModalOpen(true)}
        cartCount={cartTotalItems}
      />

      <main>
        {/* 2. Hero */}
        <Hero
          onOpenMenu={scrollToMenu}
          onScrollToFindUs={scrollToFindUs}
          onOpenLoyalty={openLoyaltyCardModal}
        />

        {/* Subtle Organic Wave between Hero & Menu */}
        <OrganicDivider variant="wave-left" fromBg="#faf6ef" toBg="#faf6ef" />

        {/* 3. New Digital Editorial Menu Section with Direct Ordering */}
        <MenuSection
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          onOpenOrderModal={() => setOrderModalOpen(true)}
          onOpenFullMenuModal={() => {
            setMenuSelectedCategory('all');
            setMenuModalOpen(true);
          }}
        />

        {/* Organic S-Curve between Menu & Brew Methods */}
        <OrganicDivider variant="s-curve" fromBg="#faf6ef" toBg="#faf6ef" />

        {/* 4. Feature / Benefits Strip */}
        <BrewMethodsStrip />

        {/* Organic Asymmetric Ridge between Brew Methods & Our Coffee */}
        <OrganicDivider variant="asymmetric-ridge" fromBg="#faf6ef" toBg="#faf6ef" />

        {/* 5. Our Coffee ("From Coffee to Cup") */}
        <OurCoffee onOpenShopBeans={() => setShopBeansModalOpen(true)} />

        {/* 6. The Venty Story ("Made for Good Moments") */}
        <AboutSection />

        {/* Organic Wave between Story & Gallery */}
        <OrganicDivider variant="wave-right" fromBg="#faf6ef" toBg="#faf6ef" />

        {/* 7. Gallery Strip */}
        <GalleryStrip />

        {/* 8. Space & Gatherings */}
        <EventsSection onOpenEnquiry={() => setEnquiryModalOpen(true)} />

        {/* 8B. Daily Palate Quiz */}
        <DailyQuizSection
          onOpenCustomerAuth={handleOpenLoyaltyFromNotification}
          onOpenLoyalty={openLoyaltyCardModal}
        />

        {/* 8B-2. Daily Quiz Leaderboard */}
        <QuizLeaderboardSection
          onOpenCustomerAuth={handleOpenLoyaltyFromNotification}
          onOpenLoyalty={openLoyaltyCardModal}
        />

        {/* 8C. Weekly Competition & Community Rewards */}
        <WeeklyCompetitionSection
          onOpenCustomerAuth={handleOpenLoyaltyFromNotification}
          onOpenLoyalty={openLoyaltyCardModal}
          onOpenOrderModal={() => setOrderModalOpen(true)}
        />

        {/* Organic Crest Divider */}
        <OrganicDivider variant="crest" fromBg="#faf6ef" toBg="#faf6ef" />

        {/* 9. Find Us in Miliana */}
        <FindUsSection onOpenDirections={() => setDirectionsModalOpen(true)} />
      </main>

      {/* Organic Curved Transition to Dark Footer */}
      <OrganicDivider variant="s-curve" fromBg="#faf6ef" toBg="#221a14" burgundyAccent={false} />

      {/* 11. Footer */}
      <Footer
        onOpenDirections={() => setDirectionsModalOpen(true)}
        onOpenLoyalty={openLoyaltyCardModal}
        onOpenHistory={() => setOrderHistoryModalOpen(true)}
        onOpenManagement={() => {
          navigateToPath('/management');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Interactive Modals & Drawers with Dynamic Code-Splitting */}
      <React.Suspense fallback={null}>
        {orderModalOpen && (
          <OrderAheadModal
            isOpen={orderModalOpen}
            onClose={() => setOrderModalOpen(false)}
            cart={cart}
            setCart={setCart}
            onOpenLoyalty={openLoyaltyCardModal}
            onOpenHistory={() => setOrderHistoryModalOpen(true)}
          />
        )}

        {menuModalOpen && (
          <FullMenuModal
            isOpen={menuModalOpen}
            onClose={() => setMenuModalOpen(false)}
            initialCategory={menuSelectedCategory}
            onAddToCart={handleAddToCart}
            onOpenOrder={() => {
              setMenuModalOpen(false);
              setOrderModalOpen(true);
            }}
          />
        )}

        {shopBeansModalOpen && (
          <ShopBeansModal
            isOpen={shopBeansModalOpen}
            onClose={() => setShopBeansModalOpen(false)}
            onAddToCart={handleAddToCart}
            onOpenOrder={() => {
              setShopBeansModalOpen(false);
              setOrderModalOpen(true);
            }}
          />
        )}

        {enquiryModalOpen && (
          <EventEnquiryModal
            isOpen={enquiryModalOpen}
            onClose={() => setEnquiryModalOpen(false)}
          />
        )}

        {directionsModalOpen && (
          <DirectionsModal
            isOpen={directionsModalOpen}
            onClose={() => setDirectionsModalOpen(false)}
          />
        )}

        {/* Digital Stamp Card Loyalty Modal */}
        {loyaltyModalOpen && (
          <LoyaltyModal
            isOpen={loyaltyModalOpen}
            onClose={() => {
              setLoyaltyModalOpen(false);
              setReturnToContextOnAuth(false);
            }}
            onOpenOrderAhead={() => setOrderModalOpen(true)}
            initialTab={loyaltyInitialTab}
            initialAuthMode={loyaltyInitialAuthMode}
            onAuthSuccess={() => {
              if (returnToContextOnAuth) {
                setLoyaltyModalOpen(false);
                setReturnToContextOnAuth(false);
              }
            }}
          />
        )}

        {/* Order History & Live Tracking Modal */}
        {orderHistoryModalOpen && (
          <OrderHistoryModal
            isOpen={orderHistoryModalOpen}
            onClose={() => setOrderHistoryModalOpen(false)}
            onReorder={handleReorder}
            onQuickReorderItem={handleQuickReorderItem}
            onOpenNewOrder={() => setOrderModalOpen(true)}
            onOpenLoyalty={openLoyaltyCardModal}
            cart={cart}
          />
        )}

        {/* In-Shop Table / Counter Digital Menu QR Access Modal */}
        {scanMenuModalOpen && (
          <MenuDigitalAccessModal
            isOpen={scanMenuModalOpen}
            onClose={() => setScanMenuModalOpen(false)}
          />
        )}
      </React.Suspense>

      {/* Opening Intro Logo Animation */}
      <IntroLogoAnimation />

      {/* Non-blocking Floating Loyalty Notification Card (Guest Welcome, Post-Order, & Member Status) */}
      <LoyaltyNotificationCard
        hasCartItems={cartTotalItems > 0}
        isLoyaltyModalOpen={loyaltyModalOpen}
        onOpenLoyaltyAuth={handleOpenLoyaltyFromNotification}
      />

      {/* Floating Bottom-Right Cart Notification Indicator & Checkout Shortcut */}
      <FloatingCartIndicator
        cart={cart}
        onOpenCheckout={() => setOrderModalOpen(true)}
      />
    </div>
  );
}
