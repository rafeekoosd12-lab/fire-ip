/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  Tv,
  Smartphone,
  Monitor,
  Satellite,
  Gamepad2,
  Download,
  Copy,
  Check,
  ShoppingBag,
  Search,
  X,
  SlidersHorizontal,
  ShieldCheck,
  HelpCircle,
  Plus,
  Minus,
  Trash2,
  FileText,
  Settings,
} from 'lucide-react';
import {
  db,
  OperationType,
  handleFirestoreError,
} from './firebase';
import AdminDashboard from './components/AdminDashboard';
import {
  DEVICE_CATEGORIES,
  CUBE_TV_APPS,
  CUBE_SUBSCRIPTION_PLANS,
  SATELLITE_INTERNET_PLANS,
  GAME_BRANDS,
  GAME_TOPUP_PACKAGES,
  type DeviceCategoryId,
  type CubeTvAppItem,
  type CubeSubscriptionPlan,
  type SatellitePlan,
  type GameTopupPackage,
  type GameBrandId,
} from './data/storeData';

const LOGO_IMAGE_URL = '/src/assets/images/fire_store_logo_1794511805615.jpg';
const HERO_TV_IMAGE_URL = '/src/assets/images/hero_smart_tv_setup_1794511806522.jpg';
const SATELLITE_IMAGE_URL = '/src/assets/images/satellite_internet_dish_1794511807944.jpg';
const GAMING_IMAGE_URL = '/src/assets/images/gaming_topup_cards_1794511808129.jpg';

interface CartItem {
  id: string;
  title: string;
  category: string;
  price: number;
  quantity: number;
  metaNote?: string;
}

interface DownloadNotification {
  appTitle: string;
  fileName: string;
  code?: string;
}

export default function App() {
  // Direct Admin Session state (rafeek / 22108877dd)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fire_admin_session') === 'rafeek';
    } catch {
      return false;
    }
  });
  const [isAdminViewOpen, setIsAdminViewOpen] = useState<boolean>(false);

  // Live Firestore Catalog State (with default fallback)
  const [cloudApps, setCloudApps] = useState<CubeTvAppItem[] | null>(null);
  const [cloudPlans, setCloudPlans] = useState<CubeSubscriptionPlan[] | null>(null);
  const [cloudSatellite, setCloudSatellite] = useState<SatellitePlan[] | null>(null);
  const [cloudGames, setCloudGames] = useState<GameTopupPackage[] | null>(null);

  // Cube TV filter & search state
  const [selectedDeviceCategory, setSelectedDeviceCategory] =
    useState<DeviceCategoryId>('all');
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [activeSetupApp, setActiveSetupApp] = useState<CubeTvAppItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<DownloadNotification | null>(null);

  // Satellite Internet advisor state
  const [deviceCountSlider, setDeviceCountSlider] = useState<number>(10);
  const [satelliteUsageType, setSatelliteUsageType] = useState<
    'home' | 'gaming' | 'remote'
  >('gaming');

  // Game Top-Up state
  const [selectedGameBrand, setSelectedGameBrand] = useState<GameBrandId>('jawaker');
  const [playerIdInput, setPlayerIdInput] = useState<string>('');
  const [playerVerifiedName, setPlayerVerifiedName] = useState<string | null>(null);
  const [playerIdError, setPlayerIdError] = useState<string | null>(null);

  // Cart & Modals state
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: 'sub-6m',
      title: 'اشتراك Cube TV — 6 أشهر + شهر هدية',
      category: 'اشتراك IPTV',
      price: 35,
      quantity: 1,
      metaNote: 'جهازين في نفس الوقت · 4K VIP',
    },
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Checkout state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  // Image fallback trackers
  const [logoImgFailed, setLogoImgFailed] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [satImgFailed, setSatImgFailed] = useState(false);
  const [gameImgFailed, setGameImgFailed] = useState(false);

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    try {
      localStorage.setItem('fire_admin_session', 'rafeek');
    } catch {
      // ignore storage errors
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('fire_admin_session');
    } catch {
      // ignore storage errors
    }
  };

  // Listen to Public Storefront Collections in Firestore
  useEffect(() => {
    const qApps = query(collection(db, 'cubeApps'), where('isPublic', '==', true));
    const unsubApps = onSnapshot(
      qApps,
      (snap) => {
        if (!snap.empty) {
          const items: CubeTvAppItem[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              categoryId: data.categoryId,
              categoryLabel: data.categoryLabel,
              title: data.title,
              subtitle: data.subtitle,
              version: data.version,
              size: data.size,
              osRequirement: data.osRequirement,
              downloaderCode: data.downloaderCode || '',
              serverHostUrl: data.serverHostUrl || '',
              storeAppName: data.storeAppName || '',
              directFileName: data.directFileName,
              fileDownloadUrl: data.fileDownloadUrl || '',
              resolutionSupport: data.resolutionSupport,
              fullTutorialText: data.fullTutorialText || '',
              highlights: Array.isArray(data.highlights) ? data.highlights : [],
              setupSteps: Array.isArray(data.setupSteps) ? data.setupSteps : [],
              isPublic: Boolean(data.isPublic),
            };
          });
          setCloudApps(items);
        } else {
          setCloudApps(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'cubeApps')
    );

    const qPlans = query(collection(db, 'cubePlans'), where('isPublic', '==', true));
    const unsubPlans = onSnapshot(
      qPlans,
      (snap) => {
        if (!snap.empty) {
          const items: CubeSubscriptionPlan[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              duration: data.duration,
              price: Number(data.price),
              currency: data.currency,
              channelsCount: data.channelsCount,
              vodCount: data.vodCount,
              quality: data.quality,
              devicesAllowed: data.devicesAllowed,
              featured: Boolean(data.featured),
              isPublic: Boolean(data.isPublic),
            };
          });
          setCloudPlans(items);
        } else {
          setCloudPlans(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'cubePlans')
    );

    const qSat = query(
      collection(db, 'satellitePlans'),
      where('isPublic', '==', true)
    );
    const unsubSat = onSnapshot(
      qSat,
      (snap) => {
        if (!snap.empty) {
          const items: SatellitePlan[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              tier: data.tier,
              downloadSpeed: data.downloadSpeed,
              uploadSpeed: data.uploadSpeed,
              latency: data.latency,
              dataQuota: data.dataQuota,
              monthlyPrice: Number(data.monthlyPrice),
              hardwareNote: data.hardwareNote,
              idealFor: data.idealFor,
              installationGuide: data.installationGuide || '',
              recommendedMinDevices: Number(data.recommendedMinDevices),
              recommendedMaxDevices: Number(data.recommendedMaxDevices),
              isPublic: Boolean(data.isPublic),
            };
          });
          setCloudSatellite(items);
        } else {
          setCloudSatellite(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'satellitePlans')
    );

    const qGames = query(
      collection(db, 'gamePackages'),
      where('isPublic', '==', true)
    );
    const unsubGames = onSnapshot(
      qGames,
      (snap) => {
        if (!snap.empty) {
          const items: GameTopupPackage[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              gameId: data.gameId,
              gameName: data.gameName,
              amountLabel: data.amountLabel,
              bonusLabel: data.bonusLabel,
              deliveryType: data.deliveryType,
              topupInstructions: data.topupInstructions || '',
              price: Number(data.price),
              popular: Boolean(data.popular),
              isPublic: Boolean(data.isPublic),
            };
          });
          setCloudGames(items);
        } else {
          setCloudGames(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'gamePackages')
    );

    return () => {
      unsubApps();
      unsubPlans();
      unsubSat();
      unsubGames();
    };
  }, []);

  // Effective Catalog Data (Cloud data if populated, otherwise default data)
  const activeCubeApps = cloudApps && cloudApps.length > 0 ? cloudApps : CUBE_TV_APPS;
  const activeCubePlans =
    cloudPlans && cloudPlans.length > 0 ? cloudPlans : CUBE_SUBSCRIPTION_PLANS;
  const activeSatellitePlans =
    cloudSatellite && cloudSatellite.length > 0
      ? cloudSatellite
      : SATELLITE_INTERNET_PLANS;
  const activeGamePackages =
    cloudGames && cloudGames.length > 0 ? cloudGames : GAME_TOPUP_PACKAGES;

  // Filtered Cube TV Apps
  const filteredCubeApps = useMemo(() => {
    return activeCubeApps.filter((app) => {
      const matchesCat =
        selectedDeviceCategory === 'all' || app.categoryId === selectedDeviceCategory;
      const queryStr = appSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !queryStr ||
        app.title.toLowerCase().includes(queryStr) ||
        app.categoryLabel.toLowerCase().includes(queryStr) ||
        app.osRequirement.toLowerCase().includes(queryStr) ||
        (app.downloaderCode && app.downloaderCode.toLowerCase().includes(queryStr));
      return matchesCat && matchesSearch;
    });
  }, [activeCubeApps, selectedDeviceCategory, appSearchQuery]);

  // Dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<DeviceCategoryId, number> = {
      all: activeCubeApps.length,
      'android-tv': 0,
      'android-mobile': 0,
      'iphone-ios': 0,
      'samsung-lg': 0,
      'windows-pc': 0,
    };
    for (const app of activeCubeApps) {
      counts[app.categoryId] = (counts[app.categoryId] || 0) + 1;
    }
    return counts;
  }, [activeCubeApps]);

  // Active Game Brand details & packages
  const currentGameBrand = useMemo(
    () => GAME_BRANDS.find((b) => b.id === selectedGameBrand) || GAME_BRANDS[0],
    [selectedGameBrand]
  );

  const filteredGamePackages = useMemo(
    () => activeGamePackages.filter((pkg) => pkg.gameId === selectedGameBrand),
    [activeGamePackages, selectedGameBrand]
  );

  // Recommended Satellite Plan ID based on interactive calculator
  const recommendedSatelliteId = useMemo(() => {
    if (satelliteUsageType === 'remote' || deviceCountSlider > 18)
      return activeSatellitePlans[activeSatellitePlans.length - 1]?.id || 'sat-remote-max';
    if (satelliteUsageType === 'gaming' || deviceCountSlider > 8)
      return activeSatellitePlans[1]?.id || 'sat-gaming-pro';
    return activeSatellitePlans[0]?.id || 'sat-home-plus';
  }, [deviceCountSlider, satelliteUsageType, activeSatellitePlans]);

  // Copy helper
  const handleCopyText = (text: string, keyId: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === keyId ? null : prev));
    }, 2000);
  };

  // Trigger Uploaded File Download or Setup Guide Download
  const handleDownloadApp = (app: CubeTvAppItem) => {
    // If admin uploaded a direct file or external URL, trigger download of that file
    if (app.fileDownloadUrl && app.fileDownloadUrl.trim() !== '') {
      const a = document.createElement('a');
      a.href = app.fileDownloadUrl;
      a.download = app.directFileName || `${app.id}-installer`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Otherwise generate and download the comprehensive setup & configuration file
      const guideText = [
        `==========================================`,
        `صالة فاير — دليل تثبيت وتفعيل ${app.title}`,
        `==========================================`,
        `النظام المتوافق: ${app.osRequirement}`,
        `الإصدار: ${app.version} (${app.size})`,
        `الملف المخصص: ${app.directFileName}`,
        app.downloaderCode ? `كود تطبيق Downloader السريع: ${app.downloaderCode}` : '',
        app.serverHostUrl ? `رابط السيرفر (Server URL): ${app.serverHostUrl}` : '',
        app.storeAppName ? `اسم التطبيق المعتمد في المتجر: ${app.storeAppName}` : '',
        ``,
        app.fullTutorialText ? `الشرح التفصيلي الكامل:\n${app.fullTutorialText}\n` : '',
        `خطوات التثبيت السريع:`,
        ...app.setupSteps.map((step, i) => `${i + 1}. ${step}`),
        ``,
        `للدعم الفني وتجديد الاشتراكات: تواصل مع صالة فاير`,
      ]
        .filter(Boolean)
        .join('\n');

      const blob = new Blob([guideText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${app.id}-fire-store-setup.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setDownloadToast({
      appTitle: app.title,
      fileName: app.directFileName,
      code: app.downloaderCode,
    });
    setTimeout(() => {
      setDownloadToast(null);
    }, 5000);
  };

  // Download SVG Brand Emblem for Fire Store
  const handleDownloadBrandSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="400" height="400" rx="48" fill="#0B0C0E"/>
      <path d="M200 44 L316 108 L316 232 C316 300 200 356 200 356 C200 356 84 300 84 232 L84 108 Z" fill="#161920" stroke="#EA580C" stroke-width="8"/>
      <path d="M200 88 C225 135 268 158 268 218 C268 258 238 292 200 292 C162 292 132 258 132 218 C132 182 154 156 172 138 C168 164 182 178 194 178 C184 146 188 112 200 88 Z" fill="#F59E0B"/>
      <path d="M200 168 C214 194 232 208 232 238 C232 258 218 274 200 274 C182 274 168 258 168 238 C168 216 184 196 200 168 Z" fill="#EA580C"/>
    </svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Fire_Lounge_Official_Logo.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cart Operations
  const addToCart = (item: Omit<CartItem, 'quantity'>, openDrawer = false) => {
    setConfirmedOrderId(null);
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.id === item.id && i.metaNote === item.metaNote
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const nextQty = updated[index].quantity + delta;
      if (nextQty <= 0) {
        return updated.filter((_, idx) => idx !== index);
      }
      updated[index].quantity = nextQty;
      return updated;
    });
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalCartItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const totalCartPrice = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  // Verify Player ID for Game Top-up
  const handleVerifyPlayerId = () => {
    const cleanId = playerIdInput.trim();
    if (cleanId.length < 5) {
      setPlayerIdError('يرجى إدخال رقم معرف صحيح مكون من 5 أرقام على الأقل');
      setPlayerVerifiedName(null);
      return;
    }
    setPlayerIdError(null);
    const suffix = cleanId.slice(-4);
    setPlayerVerifiedName(`حساب مؤكد · #${suffix}`);
  };

  // Add Game Package to Cart
  const handleSelectGamePackage = (pkg: GameTopupPackage, instantBuy: boolean) => {
    const cleanId = playerIdInput.trim();
    if (!cleanId) {
      setPlayerIdError(`يرجى إدخال ${currentGameBrand.idLabel} أولاً لإتمام الشحن`);
      const inputEl = document.getElementById('player-id-field');
      inputEl?.focus();
      return;
    }
    setPlayerIdError(null);
    addToCart(
      {
        id: pkg.id,
        title: `${pkg.gameName} — ${pkg.amountLabel}`,
        category: 'شحن ألعاب فوري',
        price: pkg.price,
        metaNote: `معرف اللاعب ID: ${cleanId}`,
      },
      instantBuy
    );
  };

  // Submit Order
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setConfirmedOrderId(`FIRE-${randomNum}`);
  };

  // Render platform icon
  const renderPlatformIcon = (categoryId: Exclude<DeviceCategoryId, 'all'>) => {
    switch (categoryId) {
      case 'android-tv':
      case 'samsung-lg':
        return <Tv className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'android-mobile':
      case 'iphone-ios':
        return <Smartphone className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'windows-pc':
        return <Monitor className="w-5 h-5 text-amber-500 shrink-0" />;
    }
  };

  // If Admin View is open, render the full Admin Dashboard
  if (isAdminViewOpen) {
    return (
      <AdminDashboard
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onAdminLogout={handleAdminLogout}
        cubeApps={activeCubeApps}
        cubePlans={activeCubePlans}
        satellitePlans={activeSatellitePlans}
        gamePackages={activeGamePackages}
        onCloseAdmin={() => setIsAdminViewOpen(false)}
      />
    );
  }

  return (
    <div id="top" className="min-h-screen bg-[#0B0C0E] text-[#F3F4F6] flex flex-col">
      {/* =====================================================================
          TOP BAR CONTRACT: Strictly 1 row, 3 zones separated by gap-8
      ====================================================================== */}
      <header className="sticky top-0 z-40 bg-[#0B0C0E]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="text-xl font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 font-display"
          >
            صالة فاير
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400">
            <a
              href="#cube-tv"
              className="hover:text-white hover:underline underline-offset-8 decoration-amber-500 transition-colors whitespace-nowrap shrink-0"
            >
              تطبيقات Cube TV
            </a>
            <a
              href="#cube-subscriptions"
              className="hover:text-white hover:underline underline-offset-8 decoration-amber-500 transition-colors whitespace-nowrap shrink-0"
            >
              باقات الاشتراك
            </a>
            <a
              href="#satellite-internet"
              className="hover:text-white hover:underline underline-offset-8 decoration-amber-500 transition-colors whitespace-nowrap shrink-0"
            >
              الإنترنت الفضائي
            </a>
            <a
              href="#game-topup"
              className="hover:text-white hover:underline underline-offset-8 decoration-amber-500 transition-colors whitespace-nowrap shrink-0"
            >
              شحن الألعاب
            </a>
            <button
              type="button"
              onClick={() => setIsAdminViewOpen(true)}
              className="text-amber-400 hover:text-amber-300 hover:underline underline-offset-8 decoration-amber-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              لوحة الإدارة
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="tabular-nums">سلة الطلبات ({totalCartItems})</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION: Fire Lounge Identity + Cube TV & Digital Services Showcase
      ====================================================================== */}
      <section className="relative border-b border-white/[0.08] py-12 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Right Column (RTL Primary): Brand Emblem + Headline + Primary Actions */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                {/* Official Fire Store Emblem Lockup Card */}
                <div className="inline-flex flex-wrap items-center gap-4 p-3 pr-3 pl-5 rounded-xl bg-[#14171D] border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsLogoModalOpen(true)}
                    className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#0B0C0E] border border-amber-500/30 shrink-0 group cursor-pointer"
                    title="عرض وتحميل شعار صالة فاير الرسمي"
                  >
                    {!logoImgFailed ? (
                      <img
                        src={LOGO_IMAGE_URL}
                        alt="شعار صالة فاير الرسمي"
                        referrerPolicy="no-referrer"
                        onError={() => setLogoImgFailed(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-700/30 text-amber-400 font-bold text-lg">
                        F
                      </div>
                    )}
                  </button>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="text-amber-400 font-semibold">
                        صالة فاير للخدمات الرقمية
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>المركز الرسمي المعتمد</span>
                    </div>
                    <p className="text-xs text-zinc-300">
                      بث Cube TV 4K · منظومات الإنترنت الفضائي · شحن فوري للألعاب
                    </p>
                  </div>
                  <div className="mr-auto flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsLogoModalOpen(true)}
                      className="text-xs font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      شعار الصالة
                    </button>
                    <span aria-hidden="true" className="text-zinc-600">
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAdminViewOpen(true)}
                      className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-amber-400" />
                      <span>إدارة الملفات والشروحات</span>
                    </button>
                  </div>
                </div>

                {/* Display Headline */}
                <h1
                  className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight text-white leading-[1.2] font-display"
                  style={{ textWrap: 'balance' }}
                >
                  تطبيقات صالة فاير الرسمية لمنظومة Cube TV والإنترنت الفضائي وشحن الألعاب
                </h1>

                {/* Lead Prose */}
                <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
                  حمّل النسخة المخصصة لجهازك من تطبيقات{' '}
                  <strong className="text-white font-semibold">Cube TV</strong> للشاشات الذكية والهواتف والكمبيوتر مع الشروحات الكاملة وأكواد التحميل المباشر، أو اطلب باقات الإنترنت الفضائي فائق السرعة وشحن جواكر وببجي الفوري عبر الـ ID.
                </p>
              </div>

              {/* Action Row & Platform Quick Jump */}
              <div className="space-y-6 pt-2">
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="#cube-tv"
                    className="px-6 py-3.5 text-sm font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل تطبيقات Cube TV</span>
                  </a>
                  <a
                    href="#game-topup"
                    className="px-5 py-3.5 text-sm font-medium text-white bg-[#161920] hover:bg-[#1E222B] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
                  >
                    <Gamepad2 className="w-4 h-4 text-amber-500" />
                    <span>شحن جواكر وببجي</span>
                  </a>
                  <a
                    href="#satellite-internet"
                    className="px-5 py-3.5 text-sm font-medium text-zinc-300 hover:text-white bg-transparent hover:bg-white/[0.04] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
                  >
                    <Satellite className="w-4 h-4 text-amber-500" />
                    <span>باقات الإنترنت الفضائي</span>
                  </a>
                </div>

                {/* Clean unboxed technical proof metadata */}
                <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400 tabular-nums">
                  <span>أندرويد تي في · موبايل · آيفون · سامسونج و LG · ويندوز</span>
                  <span aria-hidden="true">·</span>
                  <span>كود Downloader الرئيسي: 749281</span>
                  <span aria-hidden="true">·</span>
                  <span>دعم البث 4K UHD بدون تقطيع</span>
                </div>
              </div>
            </div>

            {/* Left Column (RTL Visual): Luxury Smart TV Lounge Showcase */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative flex-1 min-h-[320px] lg:h-full rounded-xl overflow-hidden bg-[#14171D] border border-white/[0.08] flex flex-col justify-end">
                {!heroImgFailed ? (
                  <img
                    src={HERO_TV_IMAGE_URL}
                    alt="واجهة تطبيق Cube TV على شاشة ذكية في صالة فاير"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1A1D24] via-[#12151B] to-[#0B0C0E] flex items-center justify-center">
                    <Tv className="w-20 h-20 text-amber-500/30" />
                  </div>
                )}

                {/* Measured contrast scrim */}
                <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pt-16 space-y-3">
                  <div className="flex items-center justify-between gap-4 text-xs text-amber-400 font-medium">
                    <span>Cube TV 4K Engine</span>
                    <span className="font-mono-code">Downloader: 749281</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    أكثر من 11,500 قناة مباشرة ومكتبة تضم 40,000 فيلم ومسلسل بجودة 4K UHD
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs text-zinc-300">
                    <span>متوافق مع جميع الشاشات والهواتف</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText('749281', 'hero-code')}
                      className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedKey === 'hero-code' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تم نسخ الكود</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ كود الشاشات</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width 4-Column Service Highlights Bar below Hero Split */}
          <div className="mt-10 pt-8 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <div className="text-xs text-zinc-400">01. تطبيقات الشاشات والهواتف</div>
              <div className="text-base font-semibold text-white">
                5 أنظمة تشغيل مدعومة بالكامل
              </div>
              <p className="text-xs text-zinc-400">
                أندرويد تي في · جوال أندرويد · آيفون · سامسونج و LG · ويندوز
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-400">02. ثبات البث المباشر</div>
              <div className="text-base font-semibold text-white tabular-nums">
                99.9% استقرار وقت المباريات
              </div>
              <p className="text-xs text-zinc-400">
                سيرفرات خاصة لصالة فاير بدعم 4K HEVC H.265
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-400">03. الإنترنت الفضائي</div>
              <div className="text-base font-semibold text-white tabular-nums">
                سرعات تصل إلى 400 Mbps
              </div>
              <p className="text-xs text-zinc-400">
                تغطية شاملة للمنازل والصالات والمزارع ببنق منخفض
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-400">04. شحن الألعاب الفوري</div>
              <div className="text-base font-semibold text-white">
                جواكر · ببجي موبايل · فري فاير
              </div>
              <p className="text-xs text-zinc-400">
                شحن رسمي مباشر عبر رقم الـ ID خلال أقل من دقيقة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 01: CUBE TV IPTV DOWNLOADS BY PLATFORM
      ====================================================================== */}
      <section id="cube-tv" className="py-16 lg:py-24 border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-10">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="text-xs font-medium text-amber-400">
                01. مركز تحميل تطبيقات البث التلفزيوني والشروحات
              </div>
              <h2
                className="text-2xl sm:text-3xl font-bold text-white font-display"
                style={{ textWrap: 'balance' }}
              >
                قسم تطبيقات IPTV Cube TV لجميع الأجهزة
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                اختر نوع جهازك بالأسفل لتحميل الملف المخصص له مباشرة أو عرض الشرح الكامل وخطوات التثبيت وأكواد Downloader الخاصة بصالة فاير.
              </p>
            </div>

            {/* Search Input + Admin Quick Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="w-full sm:w-72 relative">
                <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الجهاز أو كود التحميل..."
                  className="w-full pr-10 pl-4 py-2.5 text-sm bg-[#14171D] border border-white/[0.08] rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {appSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAppSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                    aria-label="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsAdminViewOpen(true)}
                className="px-4 py-2.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-[#14171D] hover:bg-[#1B1F27] border border-amber-500/30 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>رفع ملفات وإضافة شروحات</span>
              </button>
            </div>
          </div>

          {/* Interactive Device Platform Filter Bar (5 Categories + All) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#14171D] border border-white/[0.08] rounded-xl overflow-x-auto">
            {DEVICE_CATEGORIES.map((cat) => {
              const isActive = selectedDeviceCategory === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedDeviceCategory(cat.id)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-xs tabular-nums ${
                      isActive ? 'text-zinc-900' : 'text-zinc-500'
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Platform Applications Grid */}
          {filteredCubeApps.length === 0 ? (
            <div className="p-12 text-center bg-[#14171D] border border-white/[0.08] rounded-xl space-y-3">
              <p className="text-base font-medium text-white">
                لم يتم العثور على تطبيق مطابق لبحثك
              </p>
              <p className="text-xs text-zinc-400">
                جرّب اختيار قسم آخر أو مسح كلمة البحث لعرض جميع نسخ Cube TV المتوفرة.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedDeviceCategory('all');
                  setAppSearchQuery('');
                }}
                className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
              >
                عرض جميع الأجهزة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCubeApps.map((app) => (
                <div
                  key={app.id}
                  className="p-6 rounded-xl bg-[#14171D] border border-white/[0.08] hover:border-white/[0.18] transition-colors flex flex-col justify-between gap-6"
                >
                  <div className="space-y-4">
                    {/* Unboxed Metadata Line */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-400 tabular-nums">
                        {renderPlatformIcon(app.categoryId)}
                        <span className="text-amber-400 font-medium">
                          {app.categoryLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{app.version}</span>
                        <span aria-hidden="true">·</span>
                        <span>{app.size}</span>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono-code hidden sm:inline">
                        {app.resolutionSupport}
                      </span>
                    </div>

                    {/* App Title & Description */}
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-white font-display">
                        {app.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                        {app.subtitle}
                      </p>
                    </div>

                    {/* OS Requirement, Store Info & Separate File Name */}
                    <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                      <span>التوافق: {app.osRequirement}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-code text-zinc-300">
                        الملف: {app.directFileName}
                      </span>
                      {app.storeAppName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-zinc-200">
                            التطبيق المعتمد: {app.storeAppName}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Highlights List */}
                    <ul className="space-y-1.5 text-xs text-zinc-300 pt-1">
                      {app.highlights.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 select-none">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technical Code / Server URL Box + Download / Setup Actions */}
                  <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                    {/* Copyable Downloader Code or Server Host */}
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-[#0B0C0E] border border-white/[0.06]">
                      {app.downloaderCode ? (
                        <div className="flex items-center gap-2 text-xs overflow-hidden">
                          <span className="text-zinc-400 shrink-0">كود Downloader:</span>
                          <span className="font-mono-code font-semibold text-amber-400 text-sm tracking-wider">
                            {app.downloaderCode}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs overflow-hidden">
                          <span className="text-zinc-400 shrink-0">سيرفر Xtream:</span>
                          <span
                            dir="ltr"
                            className="font-mono-code text-zinc-200 truncate"
                          >
                            {app.serverHostUrl}
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            app.downloaderCode || app.serverHostUrl || '',
                            app.id
                          )
                        }
                        className="px-2.5 py-1 text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] rounded transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedKey === app.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>
                              {app.downloaderCode ? 'نسخ الكود' : 'نسخ السيرفر'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDownloadApp(app)}
                        className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>
                          {app.fileDownloadUrl
                            ? `تحميل (${app.directFileName})`
                            : app.categoryId === 'windows-pc'
                            ? 'تحميل نسخة ويندوز (.exe)'
                            : app.categoryId === 'iphone-ios' ||
                              app.categoryId === 'samsung-lg'
                            ? 'تنزيل ملف الإعدادات والدليل'
                            : 'تحميل ملف APK المباشر'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSetupApp(app)}
                        className="py-2.5 px-4 text-xs sm:text-sm font-medium text-zinc-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span>الشرح الكامل والتثبيت</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cube TV Subscriptions Sub-Section */}
          <div
            id="cube-subscriptions"
            className="pt-12 border-t border-white/[0.08] space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-amber-400">
                  أكواد التفعيل الرسمية
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                  باقات اشتراك سيرفر Cube TV 4K
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                تعمل جميع الاشتراكات على الشاشات الذكية والهواتف والكمبيوتر مع استلام فوري لكود التفعيل
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeCubePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-6 rounded-xl bg-[#14171D] border flex flex-col justify-between gap-6 transition-colors ${
                    plan.featured
                      ? 'border-amber-500/60'
                      : 'border-white/[0.08] hover:border-white/[0.16]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                      <span>{plan.duration}</span>
                      {plan.featured && (
                        <span className="text-amber-400 font-semibold">الأكثر طلباً</span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white font-display">
                      {plan.name}
                    </h4>

                    <div className="flex items-baseline gap-1.5 tabular-nums pt-1">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-xs text-zinc-400">{plan.currency}</span>
                    </div>

                    <div className="pt-4 border-t border-white/[0.06] space-y-2 text-xs text-zinc-300">
                      <div>{plan.channelsCount}</div>
                      <div>{plan.vodCount}</div>
                      <div className="text-zinc-400">{plan.quality}</div>
                      <div className="text-amber-400/90">{plan.devicesAllowed}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      addToCart(
                        {
                          id: plan.id,
                          title: plan.name,
                          category: 'اشتراك Cube TV',
                          price: plan.price,
                          metaNote: `${plan.duration} · ${plan.devicesAllowed}`,
                        },
                        true
                      )
                    }
                    className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      plan.featured
                        ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                        : 'bg-white/[0.06] text-white hover:bg-white/[0.12]'
                    }`}
                  >
                    طلب كود الاشتراك
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 02: SATELLITE INTERNET (قسم الإنترنت الفضائي)
      ====================================================================== */}
      <section
        id="satellite-internet"
        className="py-16 lg:py-24 border-b border-white/[0.08]"
      >
        <div className="max-w-[1280px] mx-auto px-6 space-y-12">
          {/* Top Split: Satellite Showcase + Interactive Plan Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Right Column: Narrative & Interactive Bandwidth Advisor */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              <div className="space-y-3">
                <div className="text-xs font-medium text-amber-400">
                  02. خدمات الاتصال الفضائي عالي السرعة
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-bold text-white font-display"
                  style={{ textWrap: 'balance' }}
                >
                  قسم الإنترنت الفضائي في صالة فاير
                </h2>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  نوفر منظومات الإنترنت الفضائي الحديثة للمنازل، صالات الألعاب، الاستراحات، والمناطق البعيدة عن شبكات الفايبر مع سرعات تصل إلى{' '}
                  <span className="tabular-nums text-white font-semibold">400 Mbps</span>{' '}
                  وبنق منخفض مثالي للألعاب التنافسية والبث المباشر 4K.
                </p>
              </div>

              {/* Interactive Satellite Plan Advisor */}
              <div className="p-6 rounded-xl bg-[#14171D] border border-white/[0.08] space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                    <span>مستشار اختيار باقة الإنترنت الفضائي</span>
                  </div>
                  <span className="text-xs text-amber-400 tabular-nums font-medium">
                    عدد الأجهزة المتصلة: {deviceCountSlider} جهاز
                  </span>
                </div>

                {/* Slider for number of connected devices */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min={1}
                    max={35}
                    value={deviceCountSlider}
                    onChange={(e) => setDeviceCountSlider(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 tabular-nums">
                    <span>1 جهاز</span>
                    <span>10 أجهزة</span>
                    <span>20 جهازاً</span>
                    <span>35+ جهاز</span>
                  </div>
                </div>

                {/* Usage Type Selector */}
                <div className="space-y-2">
                  <label className="block text-xs text-zinc-400">
                    طبيعة الاستخدام الأساسية:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'home', label: 'منزلي ومشاهدة 4K' },
                      { id: 'gaming', label: 'ألعاب أونلاين وصالات' },
                      { id: 'remote', label: 'مزارع واستراحات' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() =>
                          setSatelliteUsageType(
                            mode.id as 'home' | 'gaming' | 'remote'
                          )
                        }
                        className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          satelliteUsageType === mode.id
                            ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                            : 'bg-[#0B0C0E] border-white/[0.06] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Left Column: Satellite Terminal Visual */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative flex-1 min-h-[280px] lg:h-full rounded-xl overflow-hidden bg-[#14171D] border border-white/[0.08] flex flex-col justify-end">
                {!satImgFailed ? (
                  <img
                    src={SATELLITE_IMAGE_URL}
                    alt="طبق استقبال الإنترنت الفضائي الحديث من صالة فاير"
                    referrerPolicy="no-referrer"
                    onError={() => setSatImgFailed(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#141821] to-[#0B0C0E] flex items-center justify-center">
                    <Satellite className="w-16 h-16 text-amber-500/30" />
                  </div>
                )}
                <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-14 space-y-2">
                  <div className="text-xs text-amber-400 font-medium">
                    تجهيز وتركيب وتجديد فوري
                  </div>
                  <p className="text-sm font-semibold text-white">
                    أطباق استقبال الجيل الحديث ذاتية التوجيه مع راوتر Wi-Fi 6 وتغطية شاملة
                  </p>
                  <p className="text-xs text-zinc-300 tabular-nums">
                    زمن استجابة منخفض يبدأ من 20ms · بدون سياسة استخدام عادل
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Satellite Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeSatellitePlans.map((plan) => {
              const isRecommended = plan.id === recommendedSatelliteId;
              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-xl bg-[#14171D] border flex flex-col justify-between gap-6 transition-colors ${
                    isRecommended
                      ? 'border-amber-500'
                      : 'border-white/[0.08] hover:border-white/[0.16]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-zinc-400">{plan.tier}</span>
                      {isRecommended && (
                        <span className="text-amber-400 font-semibold">
                          موصى به لاستخدامك
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white font-display">
                      {plan.name}
                    </h3>

                    <div className="flex items-baseline gap-1.5 tabular-nums">
                      <span className="text-3xl font-bold text-white">
                        {plan.monthlyPrice}
                      </span>
                      <span className="text-xs text-zinc-400">د.أ / شهرياً</span>
                    </div>

                    {/* Technical Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.08] text-center tabular-nums">
                      <div>
                        <div className="text-xs text-zinc-400">التحميل</div>
                        <div className="text-sm font-semibold text-white font-mono-code">
                          {plan.downloadSpeed}
                        </div>
                      </div>
                      <div className="border-x border-white/[0.06]">
                        <div className="text-xs text-zinc-400">الرفع</div>
                        <div className="text-sm font-semibold text-white font-mono-code">
                          {plan.uploadSpeed}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400">البنق Ping</div>
                        <div className="text-sm font-semibold text-amber-400 font-mono-code">
                          {plan.latency}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                      <div>
                        <span className="text-zinc-400">سعة البيانات: </span>
                        <span>{plan.dataQuota}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">الأجهزة: </span>
                        <span>{plan.hardwareNote}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">مناسب لـ: </span>
                        <span>{plan.idealFor}</span>
                      </div>
                      {plan.installationGuide && (
                        <div className="pt-2 border-t border-white/[0.06] text-zinc-400">
                          <span className="text-amber-400 font-medium">
                            شرح التركيب:{' '}
                          </span>
                          <span>{plan.installationGuide}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        addToCart(
                          {
                            id: plan.id,
                            title: plan.name,
                            category: 'الإنترنت الفضائي',
                            price: plan.monthlyPrice,
                            metaNote: `سرعة ${plan.downloadSpeed} · اشتراك شهري`,
                          },
                          true
                        )
                      }
                      className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isRecommended
                          ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                          : 'bg-white/[0.06] text-white hover:bg-white/[0.12]'
                      }`}
                    >
                      طلب الباقة أو التجديد
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 03: GAME TOP-UP CENTER (قسم شحن الألعاب: جواكر وببجي)
      ====================================================================== */}
      <section id="game-topup" className="py-16 lg:py-24 border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-10">
          {/* Header & Game Brand Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="text-xs font-medium text-amber-400">
                03. مركز الشحن الفوري للألعاب
              </div>
              <h2
                className="text-2xl sm:text-3xl font-bold text-white font-display"
                style={{ textWrap: 'balance' }}
              >
                شحن جواكر وببجي موبايل والألعاب الرقمية
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                اشحن توكنز جواكر وشدات ببجي موبايل وجواهر فري فاير بشكل فوري وآمن 100% من خلال رقم المعرف (Player ID) فقط دون الحاجة لكلمة المرور.
              </p>
            </div>

            {/* Segmented Game Brand Selector */}
            <div className="flex items-center gap-1.5 p-1.5 bg-[#14171D] border border-white/[0.08] rounded-xl overflow-x-auto">
              {GAME_BRANDS.map((brand) => {
                const active = selectedGameBrand === brand.id;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => {
                      setSelectedGameBrand(brand.id);
                      setPlayerIdError(null);
                    }}
                    className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-zinc-950 font-semibold'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {brand.name === 'Jawaker'
                      ? 'جواكر (Jawaker)'
                      : brand.name === 'PUBG Mobile'
                      ? 'ببجي موبايل (PUBG)'
                      : brand.name === 'Free Fire'
                      ? 'فري فاير (Free Fire)'
                      : 'PlayStation & Steam'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player ID Verification Bar + Showcase Image */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8 p-6 rounded-xl bg-[#14171D] border border-white/[0.08] flex flex-col justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-xs text-zinc-400">
                  <span className="text-amber-400 font-medium">
                    الخطوة 1: إدخال معرف اللاعب
                  </span>
                  <span>{currentGameBrand.deliveryTime}</span>
                </div>
                <h3 className="text-lg font-bold text-white font-display">
                  {currentGameBrand.arabicTitle}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300">
                  {currentGameBrand.description}
                </p>
              </div>

              <div className="space-y-3">
                <label
                  htmlFor="player-id-field"
                  className="block text-xs font-medium text-zinc-300"
                >
                  {currentGameBrand.idLabel}
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    id="player-id-field"
                    type="text"
                    dir="ltr"
                    value={playerIdInput}
                    onChange={(e) => {
                      setPlayerIdInput(e.target.value);
                      setPlayerIdError(null);
                      setPlayerVerifiedName(null);
                    }}
                    placeholder={currentGameBrand.idPlaceholder}
                    className="flex-1 px-4 py-3 text-sm font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPlayerId}
                    className="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    تحقق من المعرف (ID)
                  </button>
                </div>

                {playerIdError && (
                  <p className="text-xs text-rose-400 font-medium">{playerIdError}</p>
                )}

                {playerVerifiedName && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      تم التحقق من الرقم ({playerIdInput}) — {playerVerifiedName} جاهز لاستلام الشحن الفوري
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 rounded-xl overflow-hidden bg-[#14171D] border border-white/[0.08] relative min-h-[210px] flex flex-col justify-end">
              {!gameImgFailed ? (
                <img
                  src={GAMING_IMAGE_URL}
                  alt="بطاقات شحن جواكر وببجي في صالة فاير"
                  referrerPolicy="no-referrer"
                  onError={() => setGameImgFailed(true)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1C1815] to-[#0B0C0E] flex items-center justify-center">
                  <Gamepad2 className="w-16 h-16 text-amber-500/30" />
                </div>
              )}
              <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-12 space-y-1">
                <div className="text-xs text-amber-400 font-medium">
                  الوكيل المعتمد للشحن السريع
                </div>
                <p className="text-sm font-semibold text-white">
                  أسعار خاصة للكميات والأندية في جواكر والرويال باس في ببجي
                </p>
              </div>
            </div>
          </div>

          {/* Game Top-up Packages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGamePackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-6 rounded-xl bg-[#14171D] border flex flex-col justify-between gap-5 transition-colors ${
                  pkg.popular
                    ? 'border-amber-500/50'
                    : 'border-white/[0.08] hover:border-white/[0.18]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                    <span>{pkg.gameName}</span>
                    {pkg.popular && (
                      <span className="text-amber-400 font-semibold">الأكثر مبيعاً</span>
                    )}
                  </div>

                  <h4 className="text-lg font-bold text-white font-display">
                    {pkg.amountLabel}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400">{pkg.bonusLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-zinc-400">{pkg.deliveryType}</span>
                  </div>

                  {pkg.topupInstructions && (
                    <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                      {pkg.topupInstructions}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-4">
                  <div className="flex items-baseline gap-1 tabular-nums">
                    <span className="text-2xl font-bold text-white">
                      {pkg.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400">د.أ</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectGamePackage(pkg, false)}
                      className="px-3 py-2 text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + للسلة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectGamePackage(pkg, true)}
                      className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      شحن فوري
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER: Brand Summary & Quick Links
      ====================================================================== */}
      <footer className="mt-auto py-12 bg-[#08090B] border-t border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              className="w-11 h-11 rounded-lg overflow-hidden bg-[#14171D] border border-amber-500/30 shrink-0 cursor-pointer"
            >
              {!logoImgFailed ? (
                <img
                  src={LOGO_IMAGE_URL}
                  alt="شعار صالة فاير"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-amber-400 font-bold">
                  F
                </span>
              )}
            </button>
            <div className="space-y-0.5">
              <div className="text-base font-bold text-white font-display">
                صالة فاير للخدمات الرقمية والترفيه
              </div>
              <p className="text-xs text-zinc-400">
                تطبيقات Cube TV · الإنترنت الفضائي · شحن جواكر وببجي الفوري
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400">
            <a href="#cube-tv" className="hover:text-white transition-colors">
              تطبيقات Cube TV
            </a>
            <a href="#satellite-internet" className="hover:text-white transition-colors">
              الإنترنت الفضائي
            </a>
            <a href="#game-topup" className="hover:text-white transition-colors">
              شحن الألعاب
            </a>
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              تحميل شعار صالة فاير
            </button>
            <button
              type="button"
              onClick={() => setIsAdminViewOpen(true)}
              className="text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>لوحة الإدارة الشاملة</span>
            </button>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          FLOATING DOWNLOAD FEEDBACK BANNER
      ====================================================================== */}
      {downloadToast && (
        <div className="fixed bottom-5 left-5 z-50 max-w-md p-4 rounded-xl bg-[#161920] border border-amber-500/50 shadow-2xl flex items-start gap-3">
          <Download className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-white">
              بدأ تنزيل حزمة ودليل: {downloadToast.appTitle}
            </div>
            <div className="text-zinc-300 font-mono-code">
              الملف: {downloadToast.fileName}
            </div>
            {downloadToast.code && (
              <div className="text-amber-400">
                كود Downloader السريع للشاشة: {downloadToast.code}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDownloadToast(null)}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: COMPREHENSIVE TUTORIAL & STEP-BY-STEP GUIDE FOR CUBE TV
      ====================================================================== */}
      {activeSetupApp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#14171D] border border-white/[0.12] p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-amber-400 font-medium">
                  {activeSetupApp.categoryLabel}
                </div>
                <h3 className="text-lg font-bold text-white font-display">
                  الشرح الكامل وخطوات تثبيت {activeSetupApp.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSetupApp(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/[0.05] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0C0E] border border-white/[0.08] space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>النظام المتوافق:</span>
                <span className="text-white">{activeSetupApp.osRequirement}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>الملف المخصص:</span>
                <span className="text-zinc-200 font-mono-code">
                  {activeSetupApp.directFileName} ({activeSetupApp.size})
                </span>
              </div>
              {activeSetupApp.downloaderCode && (
                <div className="flex justify-between text-zinc-400">
                  <span>كود تطبيق Downloader:</span>
                  <span className="text-amber-400 font-mono-code font-semibold">
                    {activeSetupApp.downloaderCode}
                  </span>
                </div>
              )}
              {activeSetupApp.serverHostUrl && (
                <div className="flex justify-between text-zinc-400">
                  <span>عنوان السيرفر (Host URL):</span>
                  <span dir="ltr" className="text-zinc-200 font-mono-code">
                    {activeSetupApp.serverHostUrl}
                  </span>
                </div>
              )}
            </div>

            {/* Full Detailed Tutorial Text added from Admin Panel */}
            {activeSetupApp.fullTutorialText && (
              <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/25 space-y-2">
                <div className="text-xs font-semibold text-amber-400">
                  الشرح التفصيلي من إدارة صالة فاير:
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
                  {activeSetupApp.fullTutorialText}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-300">
                خطوات التثبيت السريع بالترتيب:
              </div>
              <ol className="space-y-2.5 text-xs sm:text-sm text-zinc-200">
                {activeSetupApp.setupSteps.map((step, i) => (
                  <li
                    key={i}
                    className="p-3.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveSetupApp(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.05] rounded-lg cursor-pointer"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadApp(activeSetupApp);
                  setActiveSetupApp(null);
                }}
                className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل الملف والدليل الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: FIRE LOUNGE OFFICIAL LOGO & BRAND IDENTITY
      ====================================================================== */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#14171D] border border-white/[0.12] p-6 space-y-6 text-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-400">
                الهوية البصرية الرسمية
              </span>
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/[0.05] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden bg-[#0B0C0E] border border-amber-500/40 shadow-xl">
              {!logoImgFailed ? (
                <img
                  src={LOGO_IMAGE_URL}
                  alt="شعار صالة فاير الرسمي"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-amber-400">
                  FIRE
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white font-display">
                شعار صالة فاير (Fire Lounge)
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                تصميم درع الشعلة الذهبي والقرمزي الخاص بصالة فاير لتطبيقات Cube TV وخدمات الإنترنت الفضائي وشحن الألعاب.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadBrandSvg}
                className="w-full py-2.5 px-4 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تحميل الشعار بدقة فيكتور (SVG)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="w-full sm:w-auto py-2.5 px-4 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.06] rounded-lg cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DRAWER: CART & INSTANT ORDER CHECKOUT
      ====================================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#12141A] border-r border-white/[0.1] h-full flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-white font-display">
                    سلة طلبات صالة فاير
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/[0.05] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart Items or Empty State */}
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <p className="text-sm font-medium text-zinc-300">
                    سلة الطلبات فارغة حالياً
                  </p>
                  <p className="text-xs text-zinc-500">
                    يمكنك إضافة اشتراكات Cube TV أو باقات الإنترنت الفضائي أو شحن جواكر وببجي.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="p-4 rounded-xl bg-[#181B22] border border-white/[0.08] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-amber-400">{item.category}</div>
                          <div className="text-sm font-semibold text-white">
                            {item.title}
                          </div>
                          {item.metaNote && (
                            <div className="text-xs text-zinc-400 font-mono-code">
                              {item.metaNote}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCartItem(idx)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(idx, -1)}
                            className="w-7 h-7 rounded bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-semibold w-6 text-center tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(idx, 1)}
                            className="w-7 h-7 rounded bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-sm font-bold text-white tabular-nums">
                          {(item.price * item.quantity).toFixed(2)} د.أ
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Checkout Form */}
              {cart.length > 0 && !confirmedOrderId && (
                <form
                  onSubmit={handleCheckoutSubmit}
                  className="space-y-4 pt-4 border-t border-white/[0.08]"
                >
                  <div className="text-xs font-semibold text-amber-400">
                    بيانات استلام التفعيل أو الشحن الفوري
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs text-zinc-300">الاسم الكامل</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="أدخل اسمك الكريم"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs text-zinc-300">
                      رقم الهاتف / الواتساب (لاستلام الكود وإشعار الشحن)
                    </label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="079xxxxxxx"
                      className="w-full px-3.5 py-2.5 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs text-zinc-300">
                      العنوان أو الملاحظات (اختياري — لطلبات الإنترنت الفضائي)
                    </label>
                    <input
                      type="text"
                      value={customerLocation}
                      onChange={(e) => setCustomerLocation(e.target.value)}
                      placeholder="المدينة / المنطقة أو نوع الشاشة"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#0B0C0E] border border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-zinc-400">الإجمالي المطلوب:</span>
                    <span className="text-lg font-bold text-amber-400 tabular-nums">
                      {totalCartPrice.toFixed(2)} د.أ
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 text-xs sm:text-sm font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
                  >
                    تأكيد الطلب وإصدار التذكرة الفورية
                  </button>
                </form>
              )}

              {/* Confirmed Order State */}
              {confirmedOrderId && (
                <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">
                      تم تسجيل طلبك في صالة فاير
                    </span>
                    <span className="text-xs font-mono-code font-bold text-white">
                      #{confirmedOrderId}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    شكراً لك <strong className="text-white">{customerName}</strong>. تم تجهيز تفاصيل طلبك وسيتم التواصل معك فوراً على الرقم{' '}
                    <span className="font-mono-code text-white">{customerPhone}</span>{' '}
                    لإتمام التفعيل أو الشحن.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const summary = `طلب صالة فاير رقم #${confirmedOrderId}\nالاسم: ${customerName}\nالهاتف: ${customerPhone}\nالطلبات:\n${cart
                        .map((c) => `- ${c.title} (${c.quantity}x) ${c.metaNote || ''}`)
                        .join('\n')}\nالإجمالي: ${totalCartPrice.toFixed(2)} د.أ`;
                      handleCopyText(summary, 'order-receipt');
                    }}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-white/[0.1] hover:bg-white/[0.16] rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>
                      {copiedKey === 'order-receipt'
                        ? 'تم نسخ إيصال الطلب'
                        : 'نسخ إيصال الطلب للمتابعة السريعة'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/[0.08] text-center text-xs text-zinc-500">
              صالة فاير — خدمة معتمدة على مدار الساعة
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
