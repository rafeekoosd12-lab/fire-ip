/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  Tv,
  Smartphone,
  Monitor,
  Satellite,
  Gamepad2,
  Download,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Zap,
  Sparkles,
  ChevronLeft,
  ArrowUpLeft,
  Wifi,
  CheckCircle2,
  X,
  Send,
  Flame,
  Settings,
  BookOpen,
  Layers,
  FileCheck2,
  ExternalLink,
  Info,
  Phone,
  MapPin,
  MessageCircle,
} from 'lucide-react';

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
  type GameBrandId,
  type GameTopupPackage,
} from './data/storeData';

import { db } from './firebase';
import { buildDirectDownloadUrl } from './supabase';
import AdminDashboard from './components/AdminDashboard';

import fireLogoImg from './assets/images/fire_store_logo_1794511805615.jpg';
import heroTvImg from './assets/images/hero_smart_tv_setup_1794511806522.jpg';
import satelliteDishImg from './assets/images/satellite_internet_dish_1794511807944.jpg';
import gamingCardsImg from './assets/images/gaming_topup_cards_1794511808129.jpg';

type MainSection = 'all' | 'iptv' | 'satellite' | 'gaming' | 'admin';

interface OrderModalState {
  isOpen: boolean;
  type: 'iptv_plan' | 'satellite' | 'game';
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  metaLabel?: string;
  requiresPlayerId?: boolean;
  playerIdLabel?: string;
  playerIdPlaceholder?: string;
  initialPlayerId?: string;
}

interface DownloadNotification {
  appName: string;
  fileName: string;
  code?: string;
  isDirectFile: boolean;
}

const ADMIN_SESSION_KEY = 'fire_lounge_admin_logged_in';

export default function App() {
  const [activeNav, setActiveNav] = useState<MainSection>('all');

  // Admin Direct Login Session State (rafeek / 22108877dd)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } catch {
      // ignore storage errors
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // ignore storage errors
    }
  };

  // Real-time Firestore State from standalone project (fire-ip-store)
  const [cloudApps, setCloudApps] = useState<CubeTvAppItem[]>([]);
  const [cloudPlans, setCloudPlans] = useState<CubeSubscriptionPlan[]>([]);
  const [cloudSatellite, setCloudSatellite] = useState<SatellitePlan[]>([]);
  const [cloudGames, setCloudGames] = useState<GameTopupPackage[]>([]);

  useEffect(() => {
    const unsubApps = onSnapshot(
      collection(db, 'cubeApps'),
      (snap) => {
        const list: CubeTvAppItem[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data() as Record<string, unknown>;
          const data = raw as unknown as Omit<CubeTvAppItem, 'id'>;
          const resolvedUrl =
            (typeof raw.fileDownloadUrl === 'string' && raw.fileDownloadUrl.trim()) ||
            (typeof raw.downloadUrl === 'string' && raw.downloadUrl.trim()) ||
            (typeof raw.fileUrl === 'string' && raw.fileUrl.trim()) ||
            '';
          list.push({
            ...data,
            id: docSnap.id,
            fileDownloadUrl: resolvedUrl,
          });
        });
        setCloudApps(list);
      },
      (err) => {
        console.warn('Firestore cubeApps listener notice:', err.message);
      }
    );

    const unsubPlans = onSnapshot(
      collection(db, 'cubePlans'),
      (snap) => {
        const list: CubeSubscriptionPlan[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Omit<CubeSubscriptionPlan, 'id'>;
          list.push({ ...data, id: docSnap.id });
        });
        setCloudPlans(list);
      },
      (err) => {
        console.warn('Firestore cubePlans listener notice:', err.message);
      }
    );

    const unsubSat = onSnapshot(
      collection(db, 'satellitePlans'),
      (snap) => {
        const list: SatellitePlan[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Omit<SatellitePlan, 'id'>;
          list.push({ ...data, id: docSnap.id });
        });
        setCloudSatellite(list);
      },
      (err) => {
        console.warn('Firestore satellitePlans listener notice:', err.message);
      }
    );

    const unsubGames = onSnapshot(
      collection(db, 'gamePackages'),
      (snap) => {
        const list: GameTopupPackage[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Omit<GameTopupPackage, 'id'>;
          list.push({ ...data, id: docSnap.id });
        });
        setCloudGames(list);
      },
      (err) => {
        console.warn('Firestore gamePackages listener notice:', err.message);
      }
    );

    return () => {
      unsubApps();
      unsubPlans();
      unsubSat();
      unsubGames();
    };
  }, []);

  // Merge cloud documents with default catalog by ID so uploading a single APK immediately updates
  // that card with the real Firebase Storage download link while keeping the rest of the catalog intact.
  const allAppsList = useMemo(() => {
    if (cloudApps.length === 0) return CUBE_TV_APPS;
    const cloudMap = new Map(cloudApps.map((item) => [item.id, item]));
    const merged = CUBE_TV_APPS.map((defItem) => cloudMap.get(defItem.id) || defItem);
    const customAdded = cloudApps.filter(
      (item) => !CUBE_TV_APPS.some((defItem) => defItem.id === item.id)
    );
    return [...merged, ...customAdded];
  }, [cloudApps]);

  const allPlansList = useMemo(() => {
    if (cloudPlans.length === 0) return CUBE_SUBSCRIPTION_PLANS;
    const cloudMap = new Map(cloudPlans.map((item) => [item.id, item]));
    const merged = CUBE_SUBSCRIPTION_PLANS.map(
      (defItem) => cloudMap.get(defItem.id) || defItem
    );
    const customAdded = cloudPlans.filter(
      (item) => !CUBE_SUBSCRIPTION_PLANS.some((defItem) => defItem.id === item.id)
    );
    return [...merged, ...customAdded];
  }, [cloudPlans]);

  const allSatelliteList = useMemo(() => {
    if (cloudSatellite.length === 0) return SATELLITE_INTERNET_PLANS;
    const cloudMap = new Map(cloudSatellite.map((item) => [item.id, item]));
    const merged = SATELLITE_INTERNET_PLANS.map(
      (defItem) => cloudMap.get(defItem.id) || defItem
    );
    const customAdded = cloudSatellite.filter(
      (item) => !SATELLITE_INTERNET_PLANS.some((defItem) => defItem.id === item.id)
    );
    return [...merged, ...customAdded];
  }, [cloudSatellite]);

  const allGamePackagesList = useMemo(() => {
    if (cloudGames.length === 0) return GAME_TOPUP_PACKAGES;
    const cloudMap = new Map(cloudGames.map((item) => [item.id, item]));
    const merged = GAME_TOPUP_PACKAGES.map(
      (defItem) => cloudMap.get(defItem.id) || defItem
    );
    const customAdded = cloudGames.filter(
      (item) => !GAME_TOPUP_PACKAGES.some((defItem) => defItem.id === item.id)
    );
    return [...merged, ...customAdded];
  }, [cloudGames]);

  // Publicly visible lists for storefront
  const publicApps = useMemo(
    () => allAppsList.filter((a) => a.isPublic !== false),
    [allAppsList]
  );
  const publicPlans = useMemo(
    () => allPlansList.filter((p) => p.isPublic !== false),
    [allPlansList]
  );
  const publicSatellite = useMemo(
    () => allSatelliteList.filter((s) => s.isPublic !== false),
    [allSatelliteList]
  );
  const publicGamePackages = useMemo(
    () => allGamePackagesList.filter((g) => g.isPublic !== false),
    [allGamePackagesList]
  );

  // IPTV Device Category Filter
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategoryId>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAppGuide, setSelectedAppGuide] = useState<CubeTvAppItem | null>(null);
  const [downloadToast, setDownloadToast] = useState<DownloadNotification | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Satellite Advisor Device Count Slider
  const [householdDevices, setHouseholdDevices] = useState<number>(6);

  // Gaming Top-Up State
  const [selectedGameBrand, setSelectedGameBrand] = useState<GameBrandId>('jawaker');
  const [selectedPkgId, setSelectedPkgId] = useState<string>('jwk-60k');
  const [playerIdInput, setPlayerIdInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cliq' | 'zaincash' | 'orange' | 'usdt'>(
    'cliq'
  );

  // Unified Order Modal State
  const [orderModal, setOrderModal] = useState<OrderModalState | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [modalPlayerId, setModalPlayerId] = useState('');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // Filtered Cube TV Apps
  const filteredCubeApps = useMemo(() => {
    if (selectedCategory === 'all') return publicApps;
    return publicApps.filter((app) => app.categoryId === selectedCategory);
  }, [publicApps, selectedCategory]);

  // Active Game Brand & Filtered Packages
  const activeBrandMeta = useMemo(() => {
    return GAME_BRANDS.find((b) => b.id === selectedGameBrand) || GAME_BRANDS[0];
  }, [selectedGameBrand]);

  const packagesForSelectedGame = useMemo(() => {
    return publicGamePackages.filter((pkg) => pkg.gameId === selectedGameBrand);
  }, [publicGamePackages, selectedGameBrand]);

  const activeGamePackage = useMemo(() => {
    return (
      packagesForSelectedGame.find((p) => p.id === selectedPkgId) ||
      packagesForSelectedGame[0]
    );
  }, [packagesForSelectedGame, selectedPkgId]);

  const handleSelectGameBrand = (brandId: GameBrandId) => {
    setSelectedGameBrand(brandId);
    const firstPkg = publicGamePackages.find((p) => p.gameId === brandId);
    if (firstPkg) {
      setSelectedPkgId(firstPkg.id);
    }
  };

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2200);
  };

  // Direct APK / File Download Handler (Downloads directly from Supabase Storage URL — never opens the guide modal)
  const handleDownloadApp = (app: CubeTvAppItem) => {
    const directUrl = buildDirectDownloadUrl(app.fileDownloadUrl, app.directFileName);

    setDownloadToast({
      appName: app.title,
      fileName: app.directFileName || 'CubeTV.apk',
      code: app.downloaderCode || undefined,
      isDirectFile: true,
    });

    const link = document.createElement('a');
    link.href = directUrl;
    link.setAttribute('download', app.directFileName || 'CubeTV.apk');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadToast((prev) => (prev?.appName === app.title ? null : prev));
    }, 5000);
  };

  const openOrderModal = (state: OrderModalState) => {
    setOrderModal(state);
    setModalPlayerId(state.initialPlayerId || '');
    setOrderSubmitted(false);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderModal) return;
    setOrderSubmitted(true);
  };

  const getCategoryIcon = (
    catId: Exclude<DeviceCategoryId, 'all'> | 'all',
    className = 'w-5 h-5'
  ) => {
    switch (catId) {
      case 'android-tv':
        return <Tv className={className} />;
      case 'android-mobile':
        return <Smartphone className={className} />;
      case 'iphone-ios':
        return <Smartphone className={className} />;
      case 'samsung-lg':
        return <Layers className={className} />;
      case 'windows-pc':
        return <Monitor className={className} />;
      default:
        return <Tv className={className} />;
    }
  };

  const scrollToSection = (sectionId: string, navTab: MainSection) => {
    setActiveNav(navTab);
    if (navTab === 'admin') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // If Admin View is active, render full-screen Admin Dashboard
  if (activeNav === 'admin') {
    return (
      <AdminDashboard
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onAdminLogout={handleAdminLogout}
        cubeApps={allAppsList}
        cubePlans={allPlansList}
        satellitePlans={allSatelliteList}
        gamePackages={allGamePackagesList}
        onCloseAdmin={() => setActiveNav('all')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F4F6F8] selection:bg-amber-500 selection:text-slate-950">
      {/* Ambient Subtle Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-48 right-1/4 w-[620px] h-[620px] rounded-full opacity-15 blur-[130px]"
          style={{
            background:
              'radial-gradient(circle, #F59E0B 0%, #EA580C 45%, transparent 75%)',
          }}
        />
        <div
          className="absolute top-[45%] -left-40 w-[520px] h-[520px] rounded-full opacity-10 blur-[140px]"
          style={{
            background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)',
          }}
        />
      </div>

      {/* TOP BAR CONTRACT: Strictly 3 Distinct Component Groups, optimized for Android mobile & desktop */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0B0C0E]/90 backdrop-blur-xl">
        <div className="max-w-[1380px] mx-auto px-3 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-8">
          {/* Group 1: Official Fire Lounge Brand Identity */}
          <button
            onClick={() => {
              setActiveNav('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 sm:gap-3.5 text-right group focus:outline-none min-w-0 shrink-0 cursor-pointer"
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-amber-500/40 shadow-lg shadow-amber-500/10 bg-[#14171D] shrink-0">
              <img
                src={fireLogoImg}
                alt="شعار صالة فاير"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-tight">
                <span className="font-display font-extrabold text-base sm:text-xl tracking-tight text-white whitespace-nowrap">
                  صالة فاير
                </span>
                <span className="text-[10px] sm:text-xs font-mono-code uppercase tracking-wider text-amber-400 font-semibold whitespace-nowrap">
                  FIRE PS
                </span>
              </div>
              <p className="text-xs text-[#9BA3B0] hidden sm:block truncate">
                Cube TV • الإنترنت الفضائي • شحن الألعاب الفوري
              </p>
            </div>
          </button>

          {/* Group 2: Section Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#14171D] p-1.5 rounded-xl border border-white/[0.07]">
            <button
              onClick={() => scrollToSection('hero-section', 'all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeNav === 'all'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-[#9BA3B0] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => scrollToSection('iptv-section', 'iptv')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeNav === 'iptv'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-[#9BA3B0] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>تطبيقات Cube TV</span>
            </button>
            <button
              onClick={() => scrollToSection('satellite-section', 'satellite')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeNav === 'satellite'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-[#9BA3B0] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Satellite className="w-4 h-4" />
              <span>الإنترنت الفضائي</span>
            </button>
            <button
              onClick={() => scrollToSection('gaming-section', 'gaming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeNav === 'gaming'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-[#9BA3B0] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>شحن الألعاب</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAboutModalOpen(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                isAboutModalOpen
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-[#9BA3B0] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Info className="w-4 h-4 text-amber-400" />
              <span>حول</span>
            </button>
          </nav>

          {/* Group 3: Admin Switch & Trial Request CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setActiveNav('admin')}
              className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl font-display font-bold text-xs sm:text-sm bg-[#14171D] hover:bg-[#1C2029] text-amber-400 border border-amber-500/30 transition-all flex items-center gap-2 cursor-pointer"
              title="لوحة الإدارة الشاملة ورفع ملفات APK والشروحات"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">لوحة الإدارة</span>
            </button>

            <button
              onClick={() =>
                openOrderModal({
                  isOpen: true,
                  type: 'iptv_plan',
                  title: 'تجربة اشتراك Cube TV مجانية (24 ساعة)',
                  subtitle: 'تفعيل فوري لكافة القنوات الرياضية ومكتبة الأفلام 4K',
                  price: 0,
                  currency: 'د.أ',
                  metaLabel: 'تجربة مجانية قبل الاشتراك',
                })
              }
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-display font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-slate-950 shrink-0" />
              <span className="hidden sm:inline">طلب كود تجريبي</span>
              <span className="sm:hidden">كود تجريبي</span>
            </button>
          </div>
        </div>

        {/* Mobile Quick Navigation Bar (Responsive & Non-Wrapping on Android Screens) */}
        <div className="flex md:hidden items-center justify-between gap-1 overflow-x-auto border-t border-white/[0.06] bg-[#14171D]/95 px-2 py-2">
          <button
            onClick={() => scrollToSection('iptv-section', 'iptv')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 ${
              activeNav === 'iptv' ? 'bg-amber-500 text-slate-950' : 'text-[#9BA3B0]'
            }`}
          >
            <Tv className="w-3.5 h-3.5 shrink-0" />
            <span>Cube TV</span>
          </button>
          <button
            onClick={() => scrollToSection('satellite-section', 'satellite')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 ${
              activeNav === 'satellite'
                ? 'bg-amber-500 text-slate-950'
                : 'text-[#9BA3B0]'
            }`}
          >
            <Satellite className="w-3.5 h-3.5 shrink-0" />
            <span>الفضائي</span>
          </button>
          <button
            onClick={() => scrollToSection('gaming-section', 'gaming')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 ${
              activeNav === 'gaming' ? 'bg-amber-500 text-slate-950' : 'text-[#9BA3B0]'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
            <span>الألعاب</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAboutModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#9BA3B0] hover:text-amber-400 whitespace-nowrap shrink-0"
          >
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>حول</span>
          </button>
          <button
            onClick={() => setActiveNav('admin')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-amber-400 whitespace-nowrap shrink-0"
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span>الإدارة</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-8 pb-24 space-y-28">
        {/* =====================================================================
            1. HERO SHOWCASE & BRAND EMBLEM
           ===================================================================== */}
        <section id="hero-section" className="pt-8 sm:pt-12">
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#14171D] shadow-2xl">
            <div className="absolute inset-0">
              <img
                src={heroTvImg}
                alt="صالة فاير للترفيه الرقمي"
                className="w-full h-full object-cover object-center opacity-35"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(11,12,14,0.88) 0%, rgba(11,12,14,0.96) 55%, rgba(11,12,14,0.98) 100%)',
                }}
              />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-12 items-center">
              <div className="lg:col-span-7 space-y-6 text-right">
                <div className="inline-flex items-center gap-2.5 text-amber-400 text-xs sm:text-sm font-semibold tracking-wide">
                  <Sparkles className="w-4 h-4" />
                  <span>المنصة الرسمية لخدمات صالة فاير الرقمية • FIRE LOUNGE</span>
                </div>

                <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-[50px] text-white leading-[1.16] tracking-tight">
                  مركز تحميل تطبيقات{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 via-orange-400 to-red-500">
                    IPTV Cube TV
                  </span>{' '}
                  والإنترنت الفضائي وشحن الألعاب
                </h1>

                <p className="text-[#9BA3B0] text-base sm:text-lg leading-relaxed max-w-[64ch]">
                  حمّل ملفات الـ APK والبرامج الأصلية لتطبيق{' '}
                  <strong className="text-white">Cube TV</strong> المخصصة لشاشات أندرويد،
                  موبايلات أندرويد، الآيفون، شاشات سامسونج وإل جي، والويندوز، مع قسم
                  الإنترنت الفضائي وشحن فوري لتوكنز جواكر وشدات ببجي.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => scrollToSection('iptv-section', 'iptv')}
                    className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm sm:text-base transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>تحميل تطبيقات Cube TV</span>
                  </button>

                  <button
                    onClick={() => scrollToSection('gaming-section', 'gaming')}
                    className="px-5 py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] font-display font-semibold text-sm sm:text-base transition-all flex items-center gap-2.5 cursor-pointer"
                  >
                    <Gamepad2 className="w-5 h-5 text-amber-400" />
                    <span>شحن جواكر وببجي</span>
                  </button>

                  <button
                    onClick={() => scrollToSection('satellite-section', 'satellite')}
                    className="px-5 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#9BA3B0] hover:text-white border border-white/[0.07] font-display font-medium text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Satellite className="w-4 h-4 text-sky-400" />
                    <span>الإنترنت الفضائي</span>
                  </button>
                </div>

                <div className="pt-6 border-t border-white/[0.08] grid grid-cols-3 gap-4 sm:gap-8 max-w-xl">
                  <div>
                    <div className="font-mono-code font-bold text-xl sm:text-2xl text-white tabular-nums">
                      +11,500
                    </div>
                    <div className="text-xs text-[#9BA3B0] mt-0.5">قناة ومحتوى 4K UHD</div>
                  </div>
                  <div>
                    <div className="font-mono-code font-bold text-xl sm:text-2xl text-amber-400 tabular-nums">
                      5 أقسام
                    </div>
                    <div className="text-xs text-[#9BA3B0] mt-0.5">
                      شاشات وموبايلات وويندوز
                    </div>
                  </div>
                  <div>
                    <div className="font-mono-code font-bold text-xl sm:text-2xl text-emerald-400 tabular-nums">
                      30 ثانية
                    </div>
                    <div className="text-xs text-[#9BA3B0] mt-0.5">شحن فوري عبر الـ ID</div>
                  </div>
                </div>
              </div>

              {/* Left Column: Fire Lounge Emblem & Quick Downloader Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-[#0B0C0E]/90 border border-white/[0.1] p-6 space-y-5 shadow-xl">
                  <div className="flex items-center gap-4 border-b border-white/[0.08] pb-4">
                    <img
                      src={fireLogoImg}
                      alt="شعار محل فاير"
                      className="w-16 h-16 rounded-2xl object-cover border border-amber-500/40 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-mono-code uppercase tracking-wider text-amber-400 block">
                        FIRE LOUNGE OFFICIAL HUB
                      </span>
                      <h2 className="font-display font-bold text-xl text-white mt-0.5">
                        أكواد Downloader السريعة
                      </h2>
                      <p className="text-xs text-[#9BA3B0] mt-1">
                        أدخل الكود في تطبيق Downloader أو حمّل ملف الـ APK مباشرة
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {publicApps.slice(0, 2).map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[#14171D] border border-white/[0.06]"
                      >
                        <div>
                          <div className="text-xs text-[#9BA3B0]">{app.categoryLabel}</div>
                          <div className="font-mono-code font-bold text-lg text-amber-400 tabular-nums mt-0.5">
                            {app.downloaderCode || 'APK مباشر'}
                          </div>
                        </div>
                        {app.downloaderCode && (
                          <button
                            onClick={() =>
                              handleCopyText(app.downloaderCode, `hero-${app.id}`)
                            }
                            className="px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedId === `hero-${app.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ الكود</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ))}

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#14171D] border border-white/[0.06]">
                      <div>
                        <div className="text-xs text-[#9BA3B0]">
                          عنوان سيرفر صالة فاير (Xtream Host URL)
                        </div>
                        <div
                          dir="ltr"
                          className="font-mono-code font-semibold text-sm text-sky-400 text-left mt-0.5"
                        >
                          http://tv.fire-cube.net:8080
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleCopyText('http://tv.fire-cube.net:8080', 'hero-host')
                        }
                        className="px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedId === 'hero-host' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الرابط</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            2. IPTV CUBE TV MULTI-PLATFORM DOWNLOAD HUB (5 DEVICE CATEGORIES)
           ===================================================================== */}
        <section id="iptv-section" className="scroll-mt-28 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-wider font-semibold">
                <Tv className="w-4 h-4" />
                <span>IPTV CUBE TV APPLICATION HUB</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
                قسم تطبيقات IPTV Cube TV لجميع الأجهزة
              </h2>
              <p className="text-[#9BA3B0] text-sm sm:text-base max-w-[64ch]">
                اختر قسم جهازك (شاشات أندرويد، موبايلات أندرويد، موبايلات آيفون، شاشات
                سامسونج وإل جي، أو الويندوز) لتنزيل الملف الأصلي المرفوع مع الشرح الكامل.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#9BA3B0] bg-[#14171D] px-4 py-2.5 rounded-xl border border-white/[0.07]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تحميل مباشر من سحابة صالة فاير (fire-ip-store)</span>
            </div>
          </div>

          {/* Device Category Filter Tabs */}
          <div
            role="tablist"
            aria-label="أقسام أجهزة Cube TV"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
          >
            {DEVICE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500/20 to-[#14171D] border-amber-500 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-[#14171D] hover:bg-[#1C2029] border-white/[0.07] text-[#9BA3B0] hover:text-white'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-white/[0.05] text-[#9BA3B0]'
                    }`}
                  >
                    {getCategoryIcon(cat.id, 'w-5 h-5')}
                  </div>
                  <div className="font-display font-bold text-sm sm:text-base text-white">
                    {cat.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Apps Grid (Strict Card Density: 4 clear groups per card) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCubeApps.map((app) => {
              const hasRealApkUrl = Boolean(
                app.fileDownloadUrl && app.fileDownloadUrl.trim() !== ''
              );

              return (
                <div
                  key={app.id}
                  className="rounded-2xl bg-[#14171D] border border-white/[0.08] hover:border-amber-500/40 transition-all p-6 flex flex-col justify-between gap-6 shadow-xl"
                >
                  {/* Group 1: Header & Metadata */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono-code tabular-nums">
                          <span className="text-amber-400 font-semibold">
                            {app.categoryLabel}
                          </span>
                          <span className="text-white/20">·</span>
                          <span className="text-[#9BA3B0]">{app.version}</span>
                          <span className="text-white/20">·</span>
                          <span className="text-[#9BA3B0]">{app.size}</span>
                          {hasRealApkUrl && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-semibold">
                                <FileCheck2 className="w-3.5 h-3.5" />
                                <span>ملف مرفوع جاهز</span>
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="font-display font-bold text-xl text-white mt-1.5">
                          {app.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#9BA3B0] mt-1 leading-relaxed">
                          {app.subtitle}
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400 shrink-0">
                        {getCategoryIcon(app.categoryId, 'w-6 h-6')}
                      </div>
                    </div>

                    {/* Highlights */}
                    <ul className="space-y-1.5 pt-1">
                      {app.highlights.slice(0, 3).map((hl, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-[#9BA3B0]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Group 2: Technical Downloader Code & Server Box */}
                  <div className="rounded-xl bg-[#0B0C0E] border border-white/[0.07] p-4 space-y-3">
                    {app.downloaderCode && (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <div className="text-xs text-[#9BA3B0]">
                              كود تطبيق Downloader المباشر
                            </div>
                            <div className="font-mono-code font-bold text-lg text-amber-400 tabular-nums">
                              {app.downloaderCode}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleCopyText(app.downloaderCode, `code-${app.id}`)
                          }
                          className="px-3.5 py-2 rounded-lg bg-[#14171D] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedId === `code-${app.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ الكود</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {app.serverHostUrl && (
                      <div
                        className={`flex items-center justify-between gap-4 ${
                          app.downloaderCode ? 'pt-2.5 border-t border-white/[0.06]' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs text-[#9BA3B0]">
                            رابط السيرفر (Server Host URL)
                          </div>
                          <div
                            dir="ltr"
                            className="font-mono-code text-xs sm:text-sm text-sky-400 truncate text-left mt-0.5"
                          >
                            {app.serverHostUrl}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleCopyText(app.serverHostUrl, `host-${app.id}`)
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#14171D] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                        >
                          {copiedId === `host-${app.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ السيرفر</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-[#646D7A] pt-1">
                      <span>النظام: {app.osRequirement}</span>
                      <span className="font-mono-code">{app.resolutionSupport}</span>
                    </div>
                  </div>

                  {/* Group 3: Primary Download Action + Full Setup Guide Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <a
                      href={buildDirectDownloadUrl(
                        app.fileDownloadUrl,
                        app.directFileName
                      )}
                      download={app.directFileName || 'CubeTV.apk'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setDownloadToast({
                          appName: app.title,
                          fileName: app.directFileName || 'CubeTV.apk',
                          code: app.downloaderCode || undefined,
                          isDirectFile: true,
                        });
                        setTimeout(() => {
                          setDownloadToast((prev) =>
                            prev?.appName === app.title ? null : prev
                          );
                        }, 5000);
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 cursor-pointer text-center min-w-0"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        تحميل ({app.directFileName})
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedAppGuide(app)}
                      className="py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08] font-display font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>الشرح الكامل والتثبيت</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cube TV Subscription Plans */}
          <div className="pt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
                  باقات اشتراك سيرفر Cube TV الرسمي
                </h3>
                <p className="text-xs sm:text-sm text-[#9BA3B0] mt-1">
                  حساب واحد يعمل على كافة الشاشات والهواتف والكمبيوتر مع ضمان ثبات البث وقت
                  المباريات
                </p>
              </div>
              <span className="text-xs font-mono-code text-amber-400">
                تفعيل فوري من صالة فاير
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {publicPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between gap-6 border transition-all ${
                    plan.featured
                      ? 'bg-gradient-to-b from-[#1C2029] to-[#14171D] border-amber-500/60 shadow-xl shadow-amber-500/5'
                      : 'bg-[#14171D] border-white/[0.08]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono-code uppercase tracking-wider text-amber-400 font-semibold">
                        {plan.duration}
                      </span>
                      {plan.featured && (
                        <span className="text-xs font-display font-bold text-emerald-400">
                          الأكثر طلباً
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-display font-bold text-lg text-white">
                        {plan.name}
                      </h4>
                      <div className="flex items-baseline gap-1.5 mt-3">
                        <span className="font-mono-code font-extrabold text-3xl text-white tabular-nums">
                          {plan.price}
                        </span>
                        <span className="text-xs text-[#9BA3B0]">{plan.currency}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-white/[0.07] text-xs text-[#9BA3B0]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{plan.channelsCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{plan.vodCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>الجودة: {plan.quality}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{plan.devicesAllowed}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      openOrderModal({
                        isOpen: true,
                        type: 'iptv_plan',
                        title: plan.name,
                        subtitle: `${plan.duration} • ${plan.devicesAllowed}`,
                        price: plan.price,
                        currency: plan.currency,
                        metaLabel: plan.quality,
                      })
                    }
                    className={`w-full py-3 px-4 rounded-xl font-display font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      plan.featured
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.08]'
                    }`}
                  >
                    <span>طلب الاشتراك الآن</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            3. SATELLITE INTERNET DIVISION (قسم الإنترنت الفضائي)
           ===================================================================== */}
        <section id="satellite-section" className="scroll-mt-28 space-y-10">
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#14171D]">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-mono-code uppercase tracking-wider font-semibold">
                  <Satellite className="w-4 h-4" />
                  <span>FIRE SATELLITE BROADBAND DIVISION</span>
                </div>

                <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                  قسم الإنترنت الفضائي فائق السرعة
                </h2>

                <p className="text-[#9BA3B0] text-sm sm:text-base leading-relaxed max-w-[60ch]">
                  منظومات اتصال فضائي مستقلة تماماً عن الشبكات الأرضية بسرعات تصل إلى 400
                  ميجابت/ثانية وبنق منخفض للألعاب والبث المباشر 4K، مع تركيب ومعايرة
                  احترافية من فريق صالة فاير.
                </p>

                {/* Interactive Device Count Advisor */}
                <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.07] space-y-3 max-w-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9BA3B0]">
                      حدد عدد الأجهزة المتصلة في منزلك أو استراحتك لترشيح الباقة:
                    </span>
                    <span className="font-mono-code font-bold text-sm text-sky-400 tabular-nums">
                      {householdDevices} أجهزة
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={35}
                    value={householdDevices}
                    onChange={(e) => setHouseholdDevices(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 h-64 lg:h-full relative overflow-hidden">
                <img
                  src={satelliteDishImg}
                  alt="طبق الإنترنت الفضائي"
                  className="w-full h-full object-cover object-center"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(270deg, rgba(20,23,29,0.95) 0%, rgba(20,23,29,0.25) 60%, rgba(20,23,29,0.7) 100%)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {publicSatellite.map((sat) => {
              const isRecommended =
                householdDevices >= sat.recommendedMinDevices &&
                householdDevices <= sat.recommendedMaxDevices;

              return (
                <div
                  key={sat.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between gap-6 border transition-all ${
                    isRecommended
                      ? 'bg-gradient-to-b from-[#19202B] to-[#14171D] border-sky-400/60 shadow-xl shadow-sky-500/5'
                      : 'bg-[#14171D] border-white/[0.08]'
                  }`}
                >
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-mono-code text-sky-400 font-semibold">
                          {sat.tier}
                        </span>
                        <h3 className="font-display font-bold text-xl text-white mt-1">
                          {sat.name}
                        </h3>
                      </div>
                      {isRecommended && (
                        <span className="text-xs font-semibold text-sky-300 bg-sky-500/15 border border-sky-400/30 px-2.5 py-1 rounded-lg shrink-0">
                          الأنسب لـ {householdDevices} أجهزة
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 bg-[#0B0C0E] p-3.5 rounded-xl border border-white/[0.06]">
                      <div>
                        <div className="text-[11px] text-[#646D7A]">سرعة التنزيل</div>
                        <div className="font-mono-code font-bold text-base text-white tabular-nums mt-0.5">
                          {sat.downloadSpeed}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#646D7A]">سرعة الرفع</div>
                        <div className="font-mono-code font-bold text-base text-white tabular-nums mt-0.5">
                          {sat.uploadSpeed}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#646D7A]">زمن الاستجابة (Ping)</div>
                        <div className="font-mono-code font-semibold text-xs text-emerald-400 tabular-nums mt-0.5">
                          {sat.latency}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#646D7A]">سعة البيانات</div>
                        <div className="font-semibold text-xs text-amber-400 mt-0.5 truncate">
                          {sat.dataQuota}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-white/[0.07]">
                      <div>
                        <div className="text-xs text-[#9BA3B0]">الاشتراك الشهري</div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="font-mono-code font-extrabold text-2xl text-white tabular-nums">
                            {sat.monthlyPrice}
                          </span>
                          <span className="text-xs text-[#9BA3B0]">د.أ / شهرياً</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-[#9BA3B0]">
                      <div className="flex items-start gap-2">
                        <Wifi className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span>{sat.hardwareNote}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span>مثالي لـ: {sat.idealFor}</span>
                      </div>
                      {sat.installationGuide && (
                        <p className="text-[11px] text-[#646D7A] leading-relaxed pt-1 border-t border-white/[0.05]">
                          {sat.installationGuide}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      openOrderModal({
                        isOpen: true,
                        type: 'satellite',
                        title: `حجز منظومة ${sat.name}`,
                        subtitle: `السرعة: ${sat.downloadSpeed} • البنق: ${sat.latency}`,
                        price: sat.monthlyPrice,
                        currency: 'د.أ',
                        metaLabel: sat.hardwareNote,
                      })
                    }
                    className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>طلب معاينة وتركيب الباقة</span>
                    <ArrowUpLeft className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            4. GAMING TOP-UP CONSOLE (قسم شحن الألعاب: جواكر وببجي وفري فاير)
           ===================================================================== */}
        <section id="gaming-section" className="scroll-mt-28 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-wider font-semibold">
                <Gamepad2 className="w-4 h-4" />
                <span>INSTANT GAMING TOP-UP CENTER</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
                قسم شحن الألعاب الفوري (جواكر • ببجي • فري فاير)
              </h2>
              <p className="text-[#9BA3B0] text-sm sm:text-base max-w-[64ch]">
                اختر لعبتك، حدد باقة التوكنز أو الشدات، وأدخل رقم المعرف (Player ID) ليصلك
                الشحن المباشر خلال ثوانٍ من صالة فاير.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-emerald-400 bg-emerald-500/10 px-4 py-2.5 rounded-xl border border-emerald-500/20">
              <Zap className="w-4 h-4 shrink-0" />
              <span>شحن رسمي ومضمون 100% عبر الـ ID فقط بدون كلمة مرور</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Right Column: Game Brand Selector & Packages Grid */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2.5">
                <label className="text-xs font-mono-code uppercase tracking-wider text-[#9BA3B0] block">
                  الخطوة 1: اختر اللعبة أو المتجر
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GAME_BRANDS.map((brand) => {
                    const isSelected = selectedGameBrand === brand.id;
                    return (
                      <button
                        key={brand.id}
                        onClick={() => handleSelectGameBrand(brand.id)}
                        className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#1C2029] border-amber-500 text-white shadow-lg shadow-amber-500/10'
                            : 'bg-[#14171D] hover:bg-[#1C2029] border-white/[0.07] text-[#9BA3B0]'
                        }`}
                      >
                        <div className="font-display font-bold text-sm text-white">
                          {brand.name}
                        </div>
                        <div className="text-[11px] text-[#9BA3B0] line-clamp-1">
                          {brand.arabicTitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono-code uppercase tracking-wider text-[#9BA3B0]">
                    الخطوة 2: اختر حزمة الشحن ({activeBrandMeta.arabicTitle})
                  </label>
                  <span className="text-xs text-amber-400 font-semibold">
                    {activeBrandMeta.deliveryTime}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {packagesForSelectedGame.map((pkg) => {
                    const isPkgSelected = activeGamePackage?.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isPkgSelected
                            ? 'bg-gradient-to-l from-amber-500/15 to-[#1C2029] border-amber-500 text-white shadow-md'
                            : 'bg-[#14171D] hover:bg-[#1C2029] border-white/[0.07] text-[#9BA3B0]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-display font-bold text-base text-white">
                              {pkg.amountLabel}
                            </div>
                            {pkg.bonusLabel && (
                              <div className="text-xs text-emerald-400 font-medium mt-0.5">
                                {pkg.bonusLabel}
                              </div>
                            )}
                          </div>
                          {pkg.popular && (
                            <span className="text-[11px] font-mono-code font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                              شائع
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline justify-between pt-2 border-t border-white/[0.06] w-full">
                          <div className="font-mono-code font-bold text-lg text-white tabular-nums">
                            {pkg.price.toFixed(2)}{' '}
                            <span className="text-xs font-normal text-[#9BA3B0]">د.أ</span>
                          </div>
                          <div className="text-[11px] text-amber-400">
                            {pkg.deliveryType}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Left Column: Player ID Input & Instant Summary Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-[#14171D] border border-white/[0.1] overflow-hidden shadow-2xl">
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={gamingCardsImg}
                    alt="شحن الألعاب في صالة فاير"
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(20,23,29,0.2) 0%, rgba(20,23,29,0.98) 100%)',
                    }}
                  />
                  <div className="absolute bottom-4 right-5 left-5">
                    <span className="text-xs font-mono-code text-amber-400 uppercase">
                      DIRECT ID TOP-UP
                    </span>
                    <h3 className="font-display font-bold text-xl text-white">
                      بوابة الشحن الفوري • {activeBrandMeta.name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="player-id-input"
                      className="text-xs font-semibold text-white flex items-center justify-between"
                    >
                      <span>الخطوة 3: {activeBrandMeta.idLabel}</span>
                      <span className="text-[11px] text-[#9BA3B0] font-normal">
                        مطلوب للشحن
                      </span>
                    </label>
                    <input
                      id="player-id-input"
                      type="text"
                      value={playerIdInput}
                      onChange={(e) => setPlayerIdInput(e.target.value)}
                      placeholder={activeBrandMeta.idPlaceholder}
                      className="w-full px-4 py-3 rounded-xl bg-[#0B0C0E] border border-white/[0.1] focus:border-amber-500 focus:outline-none text-white font-mono-code text-sm placeholder:text-[#646D7A]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white block">
                      الخطوة 4: وسيلة الدفع المفضلة
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'cliq', label: 'كليك (CliQ) البنكي' },
                        { id: 'zaincash', label: 'زين كاش (Zain Cash)' },
                        { id: 'orange', label: 'أورانج موني (Orange Money)' },
                        { id: 'usdt', label: 'USDT / نقداً في صالة فاير' },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id as any)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-right transition-all cursor-pointer ${
                            paymentMethod === pm.id
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                              : 'bg-[#0B0C0E] border-white/[0.07] text-[#9BA3B0] hover:text-white'
                          }`}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeGamePackage && (
                    <div className="rounded-xl bg-[#0B0C0E] border border-white/[0.07] p-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-[#9BA3B0]">
                        <span>اللعبة المختارة:</span>
                        <span className="font-semibold text-white">
                          {activeGamePackage.gameName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#9BA3B0]">
                        <span>الحزمة:</span>
                        <span className="font-semibold text-amber-400">
                          {activeGamePackage.amountLabel}
                        </span>
                      </div>
                      {activeGamePackage.topupInstructions && (
                        <div className="text-[11px] text-[#646D7A] pt-1 border-t border-white/[0.05]">
                          {activeGamePackage.topupInstructions}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[#9BA3B0] pt-2 border-t border-white/[0.06]">
                        <span>الإجمالي المطلوب:</span>
                        <div className="font-mono-code font-bold text-base text-white tabular-nums">
                          {activeGamePackage.price.toFixed(2)} د.أ
                        </div>
                      </div>
                    </div>
                  )}

                  {activeGamePackage && (
                    <button
                      onClick={() =>
                        openOrderModal({
                          isOpen: true,
                          type: 'game',
                          title: `شحن ${activeGamePackage.gameName} — ${activeGamePackage.amountLabel}`,
                          subtitle:
                            activeGamePackage.bonusLabel || activeGamePackage.deliveryType,
                          price: activeGamePackage.price,
                          currency: 'د.أ',
                          requiresPlayerId: true,
                          playerIdLabel: activeBrandMeta.idLabel,
                          playerIdPlaceholder: activeBrandMeta.idPlaceholder,
                          initialPlayerId: playerIdInput,
                        })
                      }
                      className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-display font-bold text-sm sm:text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-5 h-5 fill-slate-950" />
                      <span>إتمام طلب الشحن الفوري</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          FOOTER: FIRE LOUNGE IDENTITY & SUPPORT
         ===================================================================== */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#090A0C]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/[0.06]">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={fireLogoImg}
                  alt="شعار صالة فاير"
                  className="w-12 h-12 rounded-xl object-cover border border-amber-500/40"
                />
                <div>
                  <span className="font-display font-extrabold text-xl text-white block">
                    صالة فاير الرقمية • FIRE LOUNGE
                  </span>
                  <span className="text-xs text-amber-400 font-mono-code">
                    دعم فني وتفعيل فوري 24/7
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#9BA3B0] leading-relaxed max-w-md">
                المركز المعتمد لتحميل وتفعيل تطبيقات Cube TV لكافة الشاشات والهواتف وأجهزة
                الكمبيوتر، وتجهيز منظومات الإنترنت الفضائي وشحن الألعاب الفوري.
              </p>
            </div>

            <div className="md:col-span-4 space-y-2.5">
              <h4 className="font-display font-bold text-sm text-white">
                أقسام تطبيقات Cube TV
              </h4>
              <ul className="grid grid-cols-2 gap-2 text-xs text-[#9BA3B0]">
                {DEVICE_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(c.id);
                        scrollToSection('iptv-section', 'iptv');
                      }}
                      className="hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      • {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3 space-y-2.5">
              <h4 className="font-display font-bold text-sm text-white">
                إدارة المتجر والسيرفر
              </h4>
              <p className="text-xs text-[#9BA3B0]">
                قاعدة البيانات: Firebase Firestore • رفع وتنزيل ملفات APK المباشرة عبر مخزن Supabase Storage (files-ip).
              </p>
              <div className="pt-1">
                <button
                  onClick={() => setActiveNav('admin')}
                  className="px-3.5 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-amber-400 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>فتح لوحة الإدارة الشاملة</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#646D7A]">
            <div>© {new Date().getFullYear()} صالة فاير (Fire Lounge). جميع الحقوق محفوظة.</div>
            <div className="flex items-center gap-4">
              <span>Cube TV Official Portal</span>
              <span>•</span>
              <span className="font-mono-code">fire-ip-store</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          MODAL 1: STEP-BY-STEP INSTALLATION GUIDE & DOWNLOADER CODE
         ===================================================================== */}
      {selectedAppGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setSelectedAppGuide(null)}
        >
          <div
            className="w-[calc(100vw-1.5rem)] sm:w-full max-w-xl mx-auto my-auto rounded-2xl bg-[#14171D] border border-white/[0.12] p-4 sm:p-6 space-y-5 shadow-2xl max-h-[88dvh] overflow-y-auto overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3.5">
              <div className="min-w-0">
                <span className="text-[11px] font-mono-code text-amber-400 uppercase block">
                  INSTALLATION & SETUP GUIDE
                </span>
                <h3 className="font-display font-bold text-base sm:text-xl text-white mt-0.5 break-words">
                  شرح تثبيت وتفعيل: {selectedAppGuide.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppGuide(null)}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#9BA3B0] hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedAppGuide.setupSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-[#0B0C0E] border border-white/[0.06]"
                >
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-mono-code font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                    {index + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-[#F4F6F8] leading-relaxed break-words min-w-0">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            {selectedAppGuide.fullTutorialText && (
              <div className="rounded-xl bg-[#0B0C0E] border border-amber-500/25 p-3.5 sm:p-4 space-y-2">
                <div className="text-xs font-display font-bold text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>الشرح التفصيلي الكامل من إدارة صالة فاير:</span>
                </div>
                <p className="text-xs sm:text-sm text-[#9BA3B0] leading-relaxed whitespace-pre-line break-words">
                  {selectedAppGuide.fullTutorialText}
                </p>
              </div>
            )}

            {selectedAppGuide.downloaderCode && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-amber-300">كود Downloader المباشر</div>
                  <div className="font-mono-code font-bold text-base sm:text-lg text-white tabular-nums break-all">
                    {selectedAppGuide.downloaderCode}
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleCopyText(selectedAppGuide.downloaderCode, 'modal-guide-code')
                  }
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs shrink-0 cursor-pointer"
                >
                  {copiedId === 'modal-guide-code' ? 'تم النسخ!' : 'نسخ الكود'}
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <a
                href={buildDirectDownloadUrl(
                  selectedAppGuide.fileDownloadUrl,
                  selectedAppGuide.directFileName
                )}
                download={selectedAppGuide.directFileName || 'CubeTV.apk'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSelectedAppGuide(null)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 text-center min-w-0"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  تنزيل الملف ({selectedAppGuide.directFileName})
                </span>
              </a>

              <button
                onClick={() => setSelectedAppGuide(null)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-white text-xs sm:text-sm font-semibold cursor-pointer text-center"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: UNIFIED ORDER & ACTIVATION CHECKOUT MODAL
         ===================================================================== */}
      {orderModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setOrderModal(null)}
        >
          <div
            className="w-[calc(100vw-1.5rem)] sm:w-full max-w-lg mx-auto my-auto rounded-2xl bg-[#14171D] border border-white/[0.12] p-4 sm:p-6 space-y-5 shadow-2xl max-h-[88dvh] overflow-y-auto overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3.5">
              <div className="min-w-0">
                <span className="text-[11px] font-mono-code text-amber-400 uppercase block">
                  FIRE LOUNGE INSTANT ORDER
                </span>
                <h3 className="font-display font-bold text-base sm:text-xl text-white mt-0.5 break-words">
                  {orderModal.title}
                </h3>
                <p className="text-xs text-[#9BA3B0] mt-1 break-words">{orderModal.subtitle}</p>
              </div>
              <button
                onClick={() => setOrderModal(null)}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#9BA3B0] hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!orderSubmitted ? (
              <form onSubmit={handleConfirmOrder} className="space-y-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B0C0E] border border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#9BA3B0]">التكلفة الإجمالية:</span>
                  <div className="font-mono-code font-bold text-base sm:text-lg text-amber-400 tabular-nums">
                    {orderModal.price === 0
                      ? 'مجاناً (تجريبي 24 ساعة)'
                      : `${orderModal.price} ${orderModal.currency}`}
                  </div>
                </div>

                {orderModal.requiresPlayerId && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white block">
                      {orderModal.playerIdLabel || 'معرف اللاعب (Player ID)'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={modalPlayerId}
                      onChange={(e) => setModalPlayerId(e.target.value)}
                      placeholder={orderModal.playerIdPlaceholder || 'أدخل الـ ID بدقة'}
                      className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-[#0B0C0E] border border-white/[0.12] focus:border-amber-500 focus:outline-none text-white font-mono-code text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    الاسم الكريم *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: رفيق"
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-[#0B0C0E] border border-white/[0.12] focus:border-amber-500 focus:outline-none text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    رقم الهاتف أو واتساب لاستلام التفعيل *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="09XXXXXXXX"
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-[#0B0C0E] border border-white/[0.12] focus:border-amber-500 focus:outline-none text-white font-mono-code text-sm"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="submit"
                    className="flex-1 py-3 sm:py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <span>تأكيد وإصدار رقم الطلب</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderModal(null)}
                    className="py-3 sm:py-3.5 px-4 rounded-xl bg-white/[0.06] text-white text-sm font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display font-bold text-lg sm:text-xl text-white">
                    تم تسجيل طلبك بنجاح لدى صالة فاير!
                  </h4>
                  <p className="text-xs sm:text-sm text-[#9BA3B0]">
                    رقم الطلب المرجعي:{' '}
                    <span className="font-mono-code text-amber-400 font-bold">
                      #FL-{Math.floor(100000 + Math.random() * 900000)}
                    </span>
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B0C0E] border border-white/[0.08] text-right text-xs space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-[#9BA3B0] shrink-0">الخدمة:</span>
                    <span className="text-white font-semibold break-words">{orderModal.title}</span>
                  </div>
                  {modalPlayerId && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[#9BA3B0] shrink-0">معرف اللاعب (ID):</span>
                      <span className="font-mono-code text-amber-400 font-bold break-all">
                        {modalPlayerId}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <span className="text-[#9BA3B0] shrink-0">العميل:</span>
                    <span className="text-white break-words">{customerName}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#9BA3B0] shrink-0">رقم التواصل:</span>
                    <span className="font-mono-code text-white break-all">{customerPhone}</span>
                  </div>
                </div>

                <button
                  onClick={() => setOrderModal(null)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm cursor-pointer"
                >
                  تم، العودة للمتجر
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: ABOUT FIRE PS MODAL (حول صالة FIRE PS)
         ===================================================================== */}
      {isAboutModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsAboutModalOpen(false)}
        >
          <div
            className="w-[calc(100vw-1.5rem)] sm:w-full max-w-md mx-auto my-auto rounded-2xl sm:rounded-3xl bg-[#14171D] border border-amber-500/35 p-4 sm:p-7 space-y-5 shadow-2xl relative overflow-x-hidden overflow-y-auto max-h-[88dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle Top Ambient Orange Glow */}
            <div
              className="absolute -top-24 -right-24 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle, #F59E0B 0%, #EA580C 60%, transparent 100%)',
              }}
            />

            {/* Modal Header */}
            <div className="relative z-10 flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={fireLogoImg}
                  alt="شعار صالة FIRE PS"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-amber-500/50 shadow-lg shadow-amber-500/15 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[11px] font-mono-code uppercase tracking-wider text-amber-400 font-semibold block">
                    ABOUT FIRE PS LOUNGE
                  </span>
                  <h3 className="font-display font-extrabold text-base sm:text-xl text-white mt-0.5 break-words">
                    بطاقة تعريف صالة FIRE PS
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#9BA3B0] hover:text-white transition-colors shrink-0 cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Identity Details Card */}
            <div className="relative z-10 rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 sm:p-5 space-y-3.5">
              <div className="flex items-start gap-3 pb-3 border-b border-white/[0.06]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-[#9BA3B0]">اسم المكان</div>
                  <div className="font-display font-bold text-base sm:text-lg text-white mt-0.5 break-words">
                    صالة FIRE PS
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pb-3 border-b border-white/[0.06]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-[#9BA3B0]">العنوان</div>
                  <div className="font-display font-semibold text-sm sm:text-base text-white mt-0.5 leading-relaxed break-words">
                    حلب - العزيزية - مقابل حلويات أليا
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-[#9BA3B0]">رقم التواصل</div>
                  <div
                    dir="ltr"
                    className="font-mono-code font-bold text-base sm:text-lg text-amber-400 tabular-nums mt-0.5 text-right"
                  >
                    0935200103
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Contact Buttons */}
            <div className="relative z-10 space-y-2.5 pt-1">
              <a
                href="tel:+963935200103"
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-display font-bold text-xs sm:text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 fill-slate-950 shrink-0" />
                <span>اتصال مباشر:</span>
                <span dir="ltr" className="font-mono-code font-extrabold tabular-nums">
                  0935200103
                </span>
              </a>

              <a
                href="https://wa.me/963935200103"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-display font-bold text-xs sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>التواصل المباشر عبر واتساب</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FLOATING DOWNLOAD TOAST NOTIFICATION
         ===================================================================== */}
      {downloadToast && (
        <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-5 z-50 sm:max-w-sm rounded-2xl bg-[#14171D] border border-amber-500/50 p-3.5 sm:p-4 shadow-2xl flex items-start gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-xs space-y-1 min-w-0">
            <div className="font-display font-bold text-white text-xs sm:text-sm break-words">
              {downloadToast.isDirectFile
                ? `جاري تنزيل الملف الرسمي المباشر: ${downloadToast.appName}`
                : `${downloadToast.appName}`}
            </div>
            <div className="font-mono-code text-amber-400 break-all">
              {downloadToast.fileName}
            </div>
            {downloadToast.code && (
              <div className="text-[#9BA3B0]">
                كود Downloader السريع:{' '}
                <strong className="font-mono-code text-white">
                  {downloadToast.code}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
