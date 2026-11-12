import React, { useState } from 'react';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Tv,
  Satellite,
  Gamepad2,
  CreditCard,
  Plus,
  Trash2,
  Edit3,
  Upload,
  X,
  LogOut,
  ShieldCheck,
  Database,
  FileText,
  ArrowUp,
  ArrowDown,
  Save,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import {
  db,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import {
  DEVICE_CATEGORIES,
  CUBE_TV_APPS,
  CUBE_SUBSCRIPTION_PLANS,
  SATELLITE_INTERNET_PLANS,
  GAME_TOPUP_PACKAGES,
  type CubeTvAppItem,
  type CubeSubscriptionPlan,
  type SatellitePlan,
  type GameTopupPackage,
  type DeviceCategoryId,
  type GameBrandId,
} from '../data/storeData';

interface AdminDashboardProps {
  isAdminLoggedIn: boolean;
  onAdminLoginSuccess: () => void;
  onAdminLogout: () => void;
  cubeApps: CubeTvAppItem[];
  cubePlans: CubeSubscriptionPlan[];
  satellitePlans: SatellitePlan[];
  gamePackages: GameTopupPackage[];
  onCloseAdmin: () => void;
}

type AdminSectionTab = 'apps' | 'plans' | 'satellite' | 'games';

const ADMIN_USERNAME = 'rafeek';
const ADMIN_PASSWORD = '22108877dd';

function sanitizeId(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return cleaned || `item-${Date.now()}`;
}

export default function AdminDashboard({
  isAdminLoggedIn,
  onAdminLoginSuccess,
  onAdminLogout,
  cubeApps,
  cubePlans,
  satellitePlans,
  gamePackages,
  onCloseAdmin,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminSectionTab>('apps');
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Direct Username & Password Login State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Filter in Apps tab
  const [appFilterCat, setAppFilterCat] = useState<DeviceCategoryId>('all');

  // Editing states
  const [editingApp, setEditingApp] = useState<CubeTvAppItem | null>(null);
  const [isNewApp, setIsNewApp] = useState(false);
  const [uploadNote, setUploadNote] = useState<string>('');

  const [editingPlan, setEditingPlan] = useState<CubeSubscriptionPlan | null>(null);
  const [isNewPlan, setIsNewPlan] = useState(false);

  const [editingSat, setEditingSat] = useState<SatellitePlan | null>(null);
  const [isNewSat, setIsNewSat] = useState(false);

  const [editingGame, setEditingGame] = useState<GameTopupPackage | null>(null);
  const [isNewGame, setIsNewGame] = useState(false);

  const showMessage = (type: 'success' | 'error', message: string) => {
    setStatusBanner({ type, message });
    setTimeout(() => {
      setStatusBanner((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Direct Login Handler (rafeek / 22108877dd)
  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      usernameInput.trim().toLowerCase() === ADMIN_USERNAME &&
      passwordInput === ADMIN_PASSWORD
    ) {
      setLoginError(null);
      onAdminLoginSuccess();
      showMessage('success', 'تم تسجيل الدخول بنجاح — مرحباً بك يا رفيق في لوحة إدارة صالة فاير');
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  // Seed Default Store Catalog into Firestore
  const handleSeedDefaultCatalog = async () => {
    if (!isAdminLoggedIn) return;
    setIsBusy(true);
    try {
      for (const app of CUBE_TV_APPS) {
        const docId = sanitizeId(app.id);
        await setDoc(doc(db, 'cubeApps', docId), {
          categoryId: app.categoryId,
          categoryLabel: app.categoryLabel.slice(0, 120),
          title: app.title.slice(0, 160),
          subtitle: app.subtitle.slice(0, 400),
          version: app.version.slice(0, 40),
          size: app.size.slice(0, 40),
          osRequirement: app.osRequirement.slice(0, 160),
          downloaderCode: (app.downloaderCode || '').slice(0, 60),
          serverHostUrl: (app.serverHostUrl || '').slice(0, 250),
          storeAppName: (app.storeAppName || '').slice(0, 120),
          directFileName: app.directFileName.slice(0, 200),
          fileDownloadUrl: (app.fileDownloadUrl || '').slice(0, 750000),
          resolutionSupport: app.resolutionSupport.slice(0, 100),
          fullTutorialText: (app.fullTutorialText || '').slice(0, 5000),
          highlights: app.highlights.slice(0, 10).map((h) => h.slice(0, 300)),
          setupSteps: app.setupSteps.slice(0, 15).map((s) => s.slice(0, 500)),
          isPublic: true,
          authorUid: ADMIN_USERNAME,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const plan of CUBE_SUBSCRIPTION_PLANS) {
        const docId = sanitizeId(plan.id);
        await setDoc(doc(db, 'cubePlans', docId), {
          name: plan.name.slice(0, 160),
          duration: plan.duration.slice(0, 80),
          price: Number(plan.price),
          currency: plan.currency.slice(0, 20),
          channelsCount: plan.channelsCount.slice(0, 120),
          vodCount: plan.vodCount.slice(0, 120),
          quality: plan.quality.slice(0, 120),
          devicesAllowed: plan.devicesAllowed.slice(0, 120),
          featured: Boolean(plan.featured),
          isPublic: true,
          authorUid: ADMIN_USERNAME,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const sat of SATELLITE_INTERNET_PLANS) {
        const docId = sanitizeId(sat.id);
        await setDoc(doc(db, 'satellitePlans', docId), {
          name: sat.name.slice(0, 160),
          tier: sat.tier.slice(0, 120),
          downloadSpeed: sat.downloadSpeed.slice(0, 60),
          uploadSpeed: sat.uploadSpeed.slice(0, 60),
          latency: sat.latency.slice(0, 60),
          dataQuota: sat.dataQuota.slice(0, 160),
          monthlyPrice: Number(sat.monthlyPrice),
          hardwareNote: sat.hardwareNote.slice(0, 300),
          idealFor: sat.idealFor.slice(0, 300),
          installationGuide: (sat.installationGuide || '').slice(0, 3000),
          recommendedMinDevices: Number(sat.recommendedMinDevices),
          recommendedMaxDevices: Number(sat.recommendedMaxDevices),
          isPublic: true,
          authorUid: ADMIN_USERNAME,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const pkg of GAME_TOPUP_PACKAGES) {
        const docId = sanitizeId(pkg.id);
        await setDoc(doc(db, 'gamePackages', docId), {
          gameId: pkg.gameId,
          gameName: pkg.gameName.slice(0, 120),
          amountLabel: pkg.amountLabel.slice(0, 160),
          bonusLabel: pkg.bonusLabel.slice(0, 160),
          deliveryType: pkg.deliveryType.slice(0, 120),
          topupInstructions: (pkg.topupInstructions || '').slice(0, 2000),
          price: Number(pkg.price),
          popular: Boolean(pkg.popular),
          isPublic: true,
          authorUid: ADMIN_USERNAME,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      showMessage(
        'success',
        'تمت مزامنة وحفظ جميع التطبيقات والباقات والشروحات في قاعدة البيانات بنجاح!'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seedCatalog');
    } finally {
      setIsBusy(false);
    }
  };

  // Handle Separate File Upload for an App
  const handleAppFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingApp) return;

    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize =
      sizeInMB >= 1
        ? `${sizeInMB.toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    if (file.size <= 500 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        setEditingApp((prev) =>
          prev
            ? {
                ...prev,
                directFileName: file.name.slice(0, 200),
                size: formattedSize.slice(0, 40),
                fileDownloadUrl: result.slice(0, 750000),
              }
            : null
        );
        setUploadNote(
          `تم رفع الملف "${file.name}" (${formattedSize}) وتضمينه للتحميل المباشر بنجاح.`
        );
      };
      reader.readAsDataURL(file);
    } else {
      setEditingApp((prev) =>
        prev
          ? {
              ...prev,
              directFileName: file.name.slice(0, 200),
              size: formattedSize.slice(0, 40),
            }
          : null
      );
      setUploadNote(
        `تم ربط بيانات الملف "${file.name}" بحجم ${formattedSize}. يمكنك أيضاً وضع رابط التحميل المباشر (APK / EXE) في خانة الرابط بالأسفل.`
      );
    }
  };

  // Save Cube App (Create or Update)
  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminLoggedIn || !editingApp) return;

    setIsBusy(true);
    const docId = sanitizeId(editingApp.id);
    const cleanHighlights = editingApp.highlights
      .map((h) => h.trim().slice(0, 300))
      .filter(Boolean)
      .slice(0, 10);
    const cleanSteps = editingApp.setupSteps
      .map((s) => s.trim().slice(0, 500))
      .filter(Boolean)
      .slice(0, 15);

    const payloadBase = {
      categoryId: editingApp.categoryId,
      categoryLabel: (editingApp.categoryLabel.trim() || 'تطبيق Cube TV').slice(0, 120),
      title: editingApp.title.trim().slice(0, 160),
      subtitle: editingApp.subtitle.trim().slice(0, 400),
      version: (editingApp.version.trim() || 'v1.0').slice(0, 40),
      size: (editingApp.size.trim() || '25 MB').slice(0, 40),
      osRequirement: (editingApp.osRequirement.trim() || 'Android / Smart TV').slice(0, 160),
      downloaderCode: (editingApp.downloaderCode || '').trim().slice(0, 60),
      serverHostUrl: (editingApp.serverHostUrl || '').trim().slice(0, 250),
      storeAppName: (editingApp.storeAppName || '').trim().slice(0, 120),
      directFileName: (editingApp.directFileName.trim() || 'CubeTV_Installer.apk').slice(
        0,
        200
      ),
      fileDownloadUrl: (editingApp.fileDownloadUrl || '').trim().slice(0, 750000),
      resolutionSupport: (editingApp.resolutionSupport.trim() || '4K UHD').slice(0, 100),
      fullTutorialText: (editingApp.fullTutorialText || '').trim().slice(0, 5000),
      highlights:
        cleanHighlights.length > 0 ? cleanHighlights : ['بث مباشر بجودة 4K بدون تقطيع'],
      setupSteps:
        cleanSteps.length > 0
          ? cleanSteps
          : ['حمّل التطبيق وثبته على جهازك ثم أدخل كود التفعيل.'],
      isPublic: Boolean(editingApp.isPublic),
    };

    try {
      await setDoc(doc(db, 'cubeApps', docId), {
        ...payloadBase,
        authorUid: ADMIN_USERNAME,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showMessage('success', `تم حفظ تطبيق "${editingApp.title}" وملفه وشروحاته بنجاح!`);
      setEditingApp(null);
      setUploadNote('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `cubeApps/${docId}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteApp = async (appId: string, title: string) => {
    if (!isAdminLoggedIn) return;
    setIsBusy(true);
    try {
      await deleteDoc(doc(db, 'cubeApps', appId));
      showMessage('success', `تم حذف تطبيق "${title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cubeApps/${appId}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Save Cube Subscription Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminLoggedIn || !editingPlan) return;
    setIsBusy(true);
    const docId = sanitizeId(editingPlan.id);
    const payloadBase = {
      name: editingPlan.name.trim().slice(0, 160),
      duration: editingPlan.duration.trim().slice(0, 80),
      price: Math.max(0, Math.min(10000, Number(editingPlan.price) || 0)),
      currency: (editingPlan.currency.trim() || 'د.أ').slice(0, 20),
      channelsCount: editingPlan.channelsCount.trim().slice(0, 120),
      vodCount: editingPlan.vodCount.trim().slice(0, 120),
      quality: editingPlan.quality.trim().slice(0, 120),
      devicesAllowed: editingPlan.devicesAllowed.trim().slice(0, 120),
      featured: Boolean(editingPlan.featured),
      isPublic: Boolean(editingPlan.isPublic),
    };

    try {
      await setDoc(doc(db, 'cubePlans', docId), {
        ...payloadBase,
        authorUid: ADMIN_USERNAME,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showMessage('success', `تم حفظ باقة الاشتراك "${editingPlan.name}" بنجاح!`);
      setEditingPlan(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `cubePlans/${docId}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!isAdminLoggedIn) return;
    setIsBusy(true);
    try {
      await deleteDoc(doc(db, 'cubePlans', planId));
      showMessage('success', 'تم حذف باقة الاشتراك');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cubePlans/${planId}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Save Satellite Internet Plan
  const handleSaveSatellite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminLoggedIn || !editingSat) return;
    setIsBusy(true);
    const docId = sanitizeId(editingSat.id);
    const payloadBase = {
      name: editingSat.name.trim().slice(0, 160),
      tier: editingSat.tier.trim().slice(0, 120),
      downloadSpeed: editingSat.downloadSpeed.trim().slice(0, 60),
      uploadSpeed: editingSat.uploadSpeed.trim().slice(0, 60),
      latency: editingSat.latency.trim().slice(0, 60),
      dataQuota: editingSat.dataQuota.trim().slice(0, 160),
      monthlyPrice: Math.max(0, Math.min(50000, Number(editingSat.monthlyPrice) || 0)),
      hardwareNote: editingSat.hardwareNote.trim().slice(0, 300),
      idealFor: editingSat.idealFor.trim().slice(0, 300),
      installationGuide: (editingSat.installationGuide || '').trim().slice(0, 3000),
      recommendedMinDevices: Math.max(
        1,
        Math.min(500, Number(editingSat.recommendedMinDevices) || 1)
      ),
      recommendedMaxDevices: Math.max(
        1,
        Math.min(1000, Number(editingSat.recommendedMaxDevices) || 10)
      ),
      isPublic: Boolean(editingSat.isPublic),
    };

    try {
      await setDoc(doc(db, 'satellitePlans', docId), {
        ...payloadBase,
        authorUid: ADMIN_USERNAME,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showMessage('success', `تم حفظ باقة الإنترنت الفضائي "${editingSat.name}" بنجاح!`);
      setEditingSat(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `satellitePlans/${docId}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteSatellite = async (satId: string) => {
    if (!isAdminLoggedIn) return;
    setIsBusy(true);
    try {
      await deleteDoc(doc(db, 'satellitePlans', satId));
      showMessage('success', 'تم حذف باقة الإنترنت الفضائي');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `satellitePlans/${satId}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Save Game Top-up Package
  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminLoggedIn || !editingGame) return;
    setIsBusy(true);
    const docId = sanitizeId(editingGame.id);
    const payloadBase = {
      gameId: editingGame.gameId,
      gameName: editingGame.gameName.trim().slice(0, 120),
      amountLabel: editingGame.amountLabel.trim().slice(0, 160),
      bonusLabel: editingGame.bonusLabel.trim().slice(0, 160),
      deliveryType: editingGame.deliveryType.trim().slice(0, 120),
      topupInstructions: (editingGame.topupInstructions || '').trim().slice(0, 2000),
      price: Math.max(0, Math.min(10000, Number(editingGame.price) || 0)),
      popular: Boolean(editingGame.popular),
      isPublic: Boolean(editingGame.isPublic),
    };

    try {
      await setDoc(doc(db, 'gamePackages', docId), {
        ...payloadBase,
        authorUid: ADMIN_USERNAME,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showMessage('success', `تم حفظ باقة شحن "${editingGame.amountLabel}" بنجاح!`);
      setEditingGame(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `gamePackages/${docId}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteGame = async (pkgId: string) => {
    if (!isAdminLoggedIn) return;
    setIsBusy(true);
    try {
      await deleteDoc(doc(db, 'gamePackages', pkgId));
      showMessage('success', 'تم حذف باقة شحن اللعبة');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `gamePackages/${pkgId}`);
    } finally {
      setIsBusy(false);
    }
  };

  const filteredApps =
    appFilterCat === 'all'
      ? cubeApps
      : cubeApps.filter((a) => a.categoryId === appFilterCat);

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F3F4F6] flex flex-col">
      {/* Top Bar Contract for Admin Workspace */}
      <header className="sticky top-0 z-40 bg-[#0B0C0E]/95 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-[1380px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
          <div className="flex items-center gap-3 text-sm text-zinc-400 whitespace-nowrap shrink-0">
            <span className="font-bold text-white font-display text-base">
              صالة فاير
            </span>
            <span aria-hidden="true">/</span>
            <span className="text-amber-400 font-medium">
              لوحة الإدارة الشاملة ورفع الملفات والشروحات
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={handleSeedDefaultCatalog}
                disabled={isBusy}
                className="px-3.5 py-2 text-xs font-medium text-zinc-200 hover:text-white bg-[#161920] hover:bg-[#1E222B] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>مزامنة البيانات الافتراضية للسحابة</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCloseAdmin}
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              العودة لواجهة المتجر
            </button>
          </div>
        </div>
      </header>

      {/* Status Notification Banner */}
      {statusBanner && (
        <div className="max-w-[1380px] w-full mx-auto px-6 pt-4">
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
              statusBanner.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <span>{statusBanner.message}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Direct Username / Password Login Gate */}
      {!isAdminLoggedIn ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <form
            onSubmit={handleDirectLogin}
            className="w-full max-w-md p-8 rounded-2xl bg-[#14171D] border border-white/[0.08] space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white font-display">
                دخول مدير صالة فاير
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                أدخل اسم المستخدم وكلمة المرور الخاصة بك لإدارة التطبيقات، رفع الملفات، وإضافة الشروحات الكاملة.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  اسم المستخدم
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="rafeek"
                    className="w-full pr-10 pl-4 py-2.5 text-sm font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    dir="ltr"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="••••••••••"
                    className="w-full pr-10 pl-4 py-2.5 text-sm font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-xs text-rose-400 font-medium text-center">
                  {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 text-sm font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
            >
              دخول لوحة الإدارة
            </button>
          </form>
        </div>
      ) : (
        /* Main Admin Workspace Layout (Sidebar + Content Area) */
        <div className="max-w-[1380px] w-full mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation (3 Columns on Desktop) */}
          <aside className="lg:col-span-3 p-5 rounded-xl bg-[#14171D] border border-white/[0.08] space-y-6">
            <div className="space-y-1 pb-4 border-b border-white/[0.08]">
              <div className="text-xs text-amber-400 font-medium">حساب المدير النشط</div>
              <div className="text-sm font-mono-code font-bold text-white">
                {ADMIN_USERNAME}
              </div>
            </div>

            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('apps')}
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'apps'
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Tv className="w-4 h-4" />
                  <span>تطبيقات Cube TV والملفات</span>
                </span>
                <span className="tabular-nums">({cubeApps.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('plans')}
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'plans'
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4" />
                  <span>باقات اشتراك IPTV</span>
                </span>
                <span className="tabular-nums">({cubePlans.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('satellite')}
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'satellite'
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Satellite className="w-4 h-4" />
                  <span>باقات الإنترنت الفضائي</span>
                </span>
                <span className="tabular-nums">({satellitePlans.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('games')}
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'games'
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Gamepad2 className="w-4 h-4" />
                  <span>شحن الألعاب (جواكر وببجي)</span>
                </span>
                <span className="tabular-nums">({gamePackages.length})</span>
              </button>
            </nav>

            <div className="pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onAdminLogout}
                className="w-full px-3.5 py-2 text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </aside>

          {/* Main Content Viewport (9 Columns on Desktop) */}
          <main className="lg:col-span-9 space-y-6">
            {/* ===============================================================
                TAB 1: CUBE TV APPS + SEPARATE FILE UPLOAD + FULL TUTORIALS
            ================================================================ */}
            {activeTab === 'apps' && (
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-[#14171D] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white font-display">
                      إدارة تطبيقات Cube TV ورفع الملفات والشروحات
                    </h2>
                    <p className="text-xs text-zinc-400">
                      ارفع ملف كل جهاز بشكل منفصل (APK, EXE, PDF, Config) وأضف خطوات التثبيت والشرح المفصل لكل قسم.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewApp(true);
                      setUploadNote('');
                      setEditingApp({
                        id: `cube-app-${Date.now()}`,
                        categoryId: 'android-tv',
                        categoryLabel: 'شاشات أندرويد و TV Box',
                        title: '',
                        subtitle: '',
                        version: 'v4.8.2',
                        size: '35.0 MB',
                        osRequirement: 'Android TV 7.0+',
                        downloaderCode: '',
                        serverHostUrl: 'http://tv.fire-cube.net:8080',
                        storeAppName: '',
                        directFileName: '',
                        fileDownloadUrl: '',
                        resolutionSupport: '4K UHD · HEVC H.265',
                        fullTutorialText: '',
                        highlights: ['دعم البث الفائق 4K UHD بدون تقطيع'],
                        setupSteps: ['حمّل التطبيق وثبته على جهازك ثم أدخل كود التفعيل.'],
                        isPublic: true,
                      });
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة تطبيق وملف جديد</span>
                  </button>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1.5 bg-[#14171D] border border-white/[0.08] rounded-xl overflow-x-auto">
                  {DEVICE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAppFilterCat(cat.id)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        appFilterCat === cat.id
                          ? 'bg-amber-500 text-zinc-950 font-semibold'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Editor Form Modal / Card when editingApp is active */}
                {editingApp && (
                  <form
                    onSubmit={handleSaveApp}
                    className="p-6 rounded-xl bg-[#161922] border border-amber-500/50 space-y-6"
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                      <div className="space-y-0.5">
                        <div className="text-xs text-amber-400 font-medium">
                          {isNewApp ? 'إضافة تطبيق جديد' : 'تعديل التطبيق والملف والشروحات'}
                        </div>
                        <h3 className="text-lg font-bold text-white font-display">
                          {editingApp.title || 'تطبيق Cube TV جديد'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingApp(null)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/[0.05] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Row 1: Category, Title, Version, Size */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">قسم الجهاز</label>
                        <select
                          value={editingApp.categoryId}
                          onChange={(e) => {
                            const nextId = e.target.value as Exclude<
                              DeviceCategoryId,
                              'all'
                            >;
                            const foundLabel =
                              DEVICE_CATEGORIES.find((c) => c.id === nextId)?.label ||
                              editingApp.categoryLabel;
                            setEditingApp({
                              ...editingApp,
                              categoryId: nextId,
                              categoryLabel: foundLabel,
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        >
                          <option value="android-tv">شاشات أندرويد</option>
                          <option value="android-mobile">موبايلات أندرويد</option>
                          <option value="iphone-ios">موبايلات آيفون</option>
                          <option value="samsung-lg">شاشات سامسونج وإل جي</option>
                          <option value="windows-pc">تطبيق الويندوز</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">
                          وصف الفئة الظاهر في البطاقة
                        </label>
                        <input
                          type="text"
                          required
                          value={editingApp.categoryLabel}
                          onChange={(e) =>
                            setEditingApp({ ...editingApp, categoryLabel: e.target.value })
                          }
                          placeholder="مثال: شاشات أندرويد و TV Box"
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">رقم الإصدار</label>
                        <input
                          type="text"
                          required
                          value={editingApp.version}
                          onChange={(e) =>
                            setEditingApp({ ...editingApp, version: e.target.value })
                          }
                          placeholder="v4.8.2"
                          className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">حجم الملف</label>
                        <input
                          type="text"
                          required
                          value={editingApp.size}
                          onChange={(e) =>
                            setEditingApp({ ...editingApp, size: e.target.value })
                          }
                          placeholder="38.4 MB"
                          className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    {/* Row 2: Title & Subtitle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">
                          اسم التطبيق الرسمي
                        </label>
                        <input
                          type="text"
                          required
                          value={editingApp.title}
                          onChange={(e) =>
                            setEditingApp({ ...editingApp, title: e.target.value })
                          }
                          placeholder="مثال: Cube TV Pro — نسخة الشاشات الذكية"
                          className="w-full px-3.5 py-2.5 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">
                          نبذة مختصرة تحت العنوان
                        </label>
                        <input
                          type="text"
                          required
                          value={editingApp.subtitle}
                          onChange={(e) =>
                            setEditingApp({ ...editingApp, subtitle: e.target.value })
                          }
                          placeholder="وصف سريع لمميزات هذه النسخة"
                          className="w-full px-3.5 py-2.5 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    {/* Row 3: Downloader Code, Server Host URL, OS Requirement, Store App Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">
                          كود تطبيق Downloader
                        </label>
                        <input
                          type="text"
                          value={editingApp.downloaderCode}
                          onChange={(e) =>
                            setEditingApp({ ...editingApp, downloaderCode: e.target.value })
                          }
                          placeholder="مثال: 749281"
                          className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-amber-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">
                          رابط السيرفر (Xtream Host URL)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={editingApp.serverHostUrl}
                          onChange={(e) =>
                            setEditingApp({ ...editingApp, serverHostUrl: e.target.value })
                          }
                          placeholder="http://tv.fire-cube.net:8080"
                          className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">
                          الأجهزة والأنظمة المتوافقة
                        </label>
                        <input
                          type="text"
                          required
                          value={editingApp.osRequirement}
                          onChange={(e) =>
                            setEditingApp({ ...editingApp, osRequirement: e.target.value })
                          }
                          placeholder="Android TV 7.0+ / Fire Stick"
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">
                          اسم التطبيق في المتجر (اختياري)
                        </label>
                        <input
                          type="text"
                          value={editingApp.storeAppName}
                          onChange={(e) =>
                            setEditingApp({ ...editingApp, storeAppName: e.target.value })
                          }
                          placeholder="Smarters Player / IBO Player"
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    {/* SEPARATE FILE UPLOAD BOX */}
                    <div className="p-5 rounded-xl bg-[#0B0C0E] border border-white/[0.1] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            <span>رفع وتخصيص ملف هذا التطبيق بشكل منفصل</span>
                          </div>
                          <p className="text-xs text-zinc-400">
                            اختر ملف التطبيق أو الإعدادات من جهازك (APK, EXE, PDF, MobileConfig) أو ضع رابط التحميل المباشر الخاص به.
                          </p>
                        </div>

                        <label className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          <span>اختيار ملف من جهازك</span>
                          <input
                            type="file"
                            onChange={handleAppFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {uploadNote && (
                        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300">
                          {uploadNote}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs text-zinc-300">
                            اسم الملف المرفوع (يظهر للعميل عند التحميل)
                          </label>
                          <input
                            type="text"
                            required
                            dir="ltr"
                            value={editingApp.directFileName}
                            onChange={(e) =>
                              setEditingApp({
                                ...editingApp,
                                directFileName: e.target.value,
                              })
                            }
                            placeholder="CubeTV_AndroidTV_v4.8.2.apk"
                            className="w-full px-3 py-2 text-xs font-mono-code bg-[#14171D] border border-white/[0.1] rounded-lg text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs text-zinc-300">
                            رابط التحميل المباشر للملف (أو الملف المرفوع تلقائياً)
                          </label>
                          <input
                            type="text"
                            dir="ltr"
                            value={editingApp.fileDownloadUrl}
                            onChange={(e) =>
                              setEditingApp({
                                ...editingApp,
                                fileDownloadUrl: e.target.value,
                              })
                            }
                            placeholder="https://example.com/files/CubeTV.apk"
                            className="w-full px-3 py-2 text-xs font-mono-code bg-[#14171D] border border-white/[0.1] rounded-lg text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* FULL TUTORIAL & STEP-BY-STEP INSTRUCTIONS */}
                    <div className="p-5 rounded-xl bg-[#0B0C0E] border border-white/[0.1] space-y-5">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>الشرح الكامل وخطوات التثبيت والتفعيل</span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          أضف الشرح المفصل الذي يظهر للعميل عند الضغط على "طريقة التثبيت" وعند تنزيل دليل الإعداد.
                        </p>
                      </div>

                      {/* Full multi-line explanation */}
                      <div className="space-y-1.5">
                        <label className="block text-xs text-zinc-300">
                          الشرح المفصل وملاحظات التشغيل وحل المشاكل (نص كامل)
                        </label>
                        <textarea
                          rows={4}
                          value={editingApp.fullTutorialText}
                          onChange={(e) =>
                            setEditingApp({
                              ...editingApp,
                              fullTutorialText: e.target.value,
                            })
                          }
                          placeholder="اكتب هنا الشرح التفصيلي الكامل لطريقة التحميل والتفعيل على هذا الجهاز..."
                          className="w-full px-3.5 py-2.5 text-xs bg-[#14171D] border border-white/[0.1] rounded-lg text-white leading-relaxed"
                        />
                      </div>

                      {/* Interactive Step-by-Step Builder */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-zinc-300">
                            خطوات التثبيت المرقمة ({editingApp.setupSteps.length} خطوات)
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingApp({
                                ...editingApp,
                                setupSteps: [...editingApp.setupSteps, ''],
                              })
                            }
                            className="px-3 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-md cursor-pointer"
                          >
                            + إضافة خطوة جديدة
                          </button>
                        </div>

                        <div className="space-y-2">
                          {editingApp.setupSteps.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded bg-white/[0.06] text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={step}
                                onChange={(e) => {
                                  const next = [...editingApp.setupSteps];
                                  next[idx] = e.target.value;
                                  setEditingApp({ ...editingApp, setupSteps: next });
                                }}
                                placeholder={`اكتب الخطوة رقم ${idx + 1}...`}
                                className="flex-1 px-3 py-2 text-xs bg-[#14171D] border border-white/[0.1] rounded-lg text-white"
                              />
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  const next = [...editingApp.setupSteps];
                                  const temp = next[idx - 1];
                                  next[idx - 1] = next[idx];
                                  next[idx] = temp;
                                  setEditingApp({ ...editingApp, setupSteps: next });
                                }}
                                className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                title="تحريك لأعلى"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === editingApp.setupSteps.length - 1}
                                onClick={() => {
                                  const next = [...editingApp.setupSteps];
                                  const temp = next[idx + 1];
                                  next[idx + 1] = next[idx];
                                  next[idx] = temp;
                                  setEditingApp({ ...editingApp, setupSteps: next });
                                }}
                                className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                title="تحريك لأسفل"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = editingApp.setupSteps.filter(
                                    (_, i) => i !== idx
                                  );
                                  setEditingApp({
                                    ...editingApp,
                                    setupSteps: next.length ? next : [''],
                                  });
                                }}
                                className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                                title="حذف الخطوة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Highlights Builder */}
                      <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-zinc-300">
                            نقاط المميزات المختصرة في البطاقة
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingApp({
                                ...editingApp,
                                highlights: [...editingApp.highlights, ''],
                              })
                            }
                            className="px-3 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-md cursor-pointer"
                          >
                            + إضافة ميزة
                          </button>
                        </div>
                        <div className="space-y-2">
                          {editingApp.highlights.map((hl, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={hl}
                                onChange={(e) => {
                                  const next = [...editingApp.highlights];
                                  next[idx] = e.target.value;
                                  setEditingApp({ ...editingApp, highlights: next });
                                }}
                                placeholder="ميزة للتطبيق..."
                                className="flex-1 px-3 py-2 text-xs bg-[#14171D] border border-white/[0.1] rounded-lg text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = editingApp.highlights.filter(
                                    (_, i) => i !== idx
                                  );
                                  setEditingApp({
                                    ...editingApp,
                                    highlights: next.length ? next : [''],
                                  });
                                }}
                                className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Save / Cancel Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingApp.isPublic}
                          onChange={(e) =>
                            setEditingApp({ ...editingApp, isPublic: e.target.checked })
                          }
                          className="accent-amber-500"
                        />
                        <span>إظهار هذا التطبيق للعملاء في الصفحة الرئيسية</span>
                      </label>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingApp(null)}
                          className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.06] rounded-lg cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isBusy}
                          className="px-6 py-2.5 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>حفظ التطبيق والملف والشرح</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Existing Apps List */}
                <div className="space-y-3">
                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-5 rounded-xl bg-[#14171D] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-zinc-400 tabular-nums">
                          <span className="text-amber-400 font-medium">
                            {app.categoryLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{app.version}</span>
                          <span aria-hidden="true">·</span>
                          <span>{app.size}</span>
                          {app.downloaderCode && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-code text-zinc-200">
                                Downloader: {app.downloaderCode}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-base font-bold text-white font-display">
                          {app.title}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono-code">
                          الملف المخصص: {app.directFileName}{' '}
                          {app.fileDownloadUrl ? '· (مرفوع / مرتبط برابط مباشر)' : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewApp(false);
                            setUploadNote('');
                            setEditingApp({ ...app });
                          }}
                          className="px-3.5 py-2 text-xs font-medium text-white bg-white/[0.06] hover:bg-white/[0.12] rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>رفع ملف / تعديل الشرح</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteApp(app.id, app.title)}
                          className="p-2 text-zinc-400 hover:text-rose-400 bg-white/[0.04] rounded-lg cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 2: CUBE TV SUBSCRIPTION PLANS
            ================================================================ */}
            {activeTab === 'plans' && (
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-[#14171D] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white font-display">
                      إدارة باقات اشتراك Cube TV
                    </h2>
                    <p className="text-xs text-zinc-400">
                      تحكم بأسعار الاشتراكات، عدد القنوات والأفلام، وعدد الأجهزة المسموحة لكل باقة.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewPlan(true);
                      setEditingPlan({
                        id: `sub-${Date.now()}`,
                        name: '',
                        duration: '30 يوماً',
                        price: 10,
                        currency: 'د.أ',
                        channelsCount: '+11,500 قناة مباشرة',
                        vodCount: '+35,000 فيلم ومسلسل',
                        quality: '4K UHD · FHD',
                        devicesAllowed: 'جهاز واحد',
                        featured: false,
                        isPublic: true,
                      });
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة باقة اشتراك</span>
                  </button>
                </div>

                {editingPlan && (
                  <form
                    onSubmit={handleSavePlan}
                    className="p-6 rounded-xl bg-[#161922] border border-amber-500/50 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <h3 className="text-base font-bold text-white font-display">
                        {isNewPlan ? 'إضافة باقة اشتراك جديدة' : 'تعديل باقة الاشتراك'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingPlan(null)}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">اسم الباقة</label>
                        <input
                          type="text"
                          required
                          value={editingPlan.name}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, name: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">المدة</label>
                        <input
                          type="text"
                          required
                          value={editingPlan.duration}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, duration: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">السعر (د.أ)</label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          value={editingPlan.price}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              price: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">عدد القنوات</label>
                        <input
                          type="text"
                          required
                          value={editingPlan.channelsCount}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              channelsCount: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">مكتبة الأفلام والمسلسلات</label>
                        <input
                          type="text"
                          required
                          value={editingPlan.vodCount}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, vodCount: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">الجودة</label>
                        <input
                          type="text"
                          required
                          value={editingPlan.quality}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, quality: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">الأجهزة المسموحة</label>
                        <input
                          type="text"
                          required
                          value={editingPlan.devicesAllowed}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              devicesAllowed: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPlan.featured}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, featured: e.target.checked })
                          }
                          className="accent-amber-500"
                        />
                        <span>تمييز كباقة "الأكثر طلباً"</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingPlan(null)}
                          className="px-4 py-2 text-xs text-zinc-300 bg-white/[0.06] rounded-lg cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isBusy}
                          className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 rounded-lg cursor-pointer"
                        >
                          حفظ الباقة
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cubePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-5 rounded-xl bg-[#14171D] border border-white/[0.08] flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs text-amber-400">{plan.duration}</div>
                        <div className="text-base font-bold text-white">{plan.name}</div>
                        <div className="text-sm font-bold text-zinc-200 tabular-nums">
                          {plan.price} {plan.currency}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewPlan(false);
                            setEditingPlan({ ...plan });
                          }}
                          className="px-3 py-1.5 text-xs text-white bg-white/[0.06] hover:bg-white/[0.12] rounded-lg cursor-pointer"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 3: SATELLITE INTERNET PLANS & INSTALLATION GUIDES
            ================================================================ */}
            {activeTab === 'satellite' && (
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-[#14171D] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white font-display">
                      إدارة باقات الإنترنت الفضائي وشروحات التركيب
                    </h2>
                    <p className="text-xs text-zinc-400">
                      تحكم بالسرعات، البنق، الأسعار الشهرية، وشرح طريقة تركيب وتوجيه الطبق الفضائي لكل باقة.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewSat(true);
                      setEditingSat({
                        id: `sat-${Date.now()}`,
                        name: '',
                        tier: 'باقة إنترنت فضائي',
                        downloadSpeed: '200 Mbps',
                        uploadSpeed: '40 Mbps',
                        latency: '24 ms',
                        dataQuota: 'غير محدود',
                        monthlyPrice: 60,
                        hardwareNote: 'طبق استقبال ذكي + راوتر Wi-Fi 6',
                        idealFor: 'المنازل والاستراحات',
                        installationGuide: '',
                        recommendedMinDevices: 1,
                        recommendedMaxDevices: 15,
                        isPublic: true,
                      });
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة باقة فضائية</span>
                  </button>
                </div>

                {editingSat && (
                  <form
                    onSubmit={handleSaveSatellite}
                    className="p-6 rounded-xl bg-[#161922] border border-amber-500/50 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <h3 className="text-base font-bold text-white font-display">
                        {isNewSat ? 'إضافة باقة إنترنت فضائي' : 'تعديل باقة الإنترنت الفضائي'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingSat(null)}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">اسم الباقة</label>
                        <input
                          type="text"
                          required
                          value={editingSat.name}
                          onChange={(e) =>
                            setEditingSat({ ...editingSat, name: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">الفئة</label>
                        <input
                          type="text"
                          required
                          value={editingSat.tier}
                          onChange={(e) =>
                            setEditingSat({ ...editingSat, tier: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">الاشتراك الشهري (د.أ)</label>
                        <input
                          type="number"
                          required
                          value={editingSat.monthlyPrice}
                          onChange={(e) =>
                            setEditingSat({
                              ...editingSat,
                              monthlyPrice: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">سرعة التحميل</label>
                        <input
                          type="text"
                          required
                          value={editingSat.downloadSpeed}
                          onChange={(e) =>
                            setEditingSat({
                              ...editingSat,
                              downloadSpeed: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">سرعة الرفع</label>
                        <input
                          type="text"
                          required
                          value={editingSat.uploadSpeed}
                          onChange={(e) =>
                            setEditingSat({ ...editingSat, uploadSpeed: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">البنق (Latency)</label>
                        <input
                          type="text"
                          required
                          value={editingSat.latency}
                          onChange={(e) =>
                            setEditingSat({ ...editingSat, latency: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">المعدات المشمولة</label>
                        <input
                          type="text"
                          required
                          value={editingSat.hardwareNote}
                          onChange={(e) =>
                            setEditingSat({ ...editingSat, hardwareNote: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">الاستخدام المثالي</label>
                        <input
                          type="text"
                          required
                          value={editingSat.idealFor}
                          onChange={(e) =>
                            setEditingSat({ ...editingSat, idealFor: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-zinc-300">
                        شرح التركيب والتشغيل الكامل لهذه الباقة
                      </label>
                      <textarea
                        rows={3}
                        value={editingSat.installationGuide}
                        onChange={(e) =>
                          setEditingSat({
                            ...editingSat,
                            installationGuide: e.target.value,
                          })
                        }
                        placeholder="اشرح تفاصيل التركيب والتوجيه ومتطلبات التشغيل..."
                        className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingSat(null)}
                        className="px-4 py-2 text-xs text-zinc-300 bg-white/[0.06] rounded-lg cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 rounded-lg cursor-pointer"
                      >
                        حفظ الباقة والشرح
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {satellitePlans.map((sat) => (
                    <div
                      key={sat.id}
                      className="p-5 rounded-xl bg-[#14171D] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs text-amber-400">
                          {sat.tier} · {sat.downloadSpeed} · Ping {sat.latency}
                        </div>
                        <div className="text-base font-bold text-white">{sat.name}</div>
                        <div className="text-xs text-zinc-400">
                          {sat.installationGuide || sat.hardwareNote}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewSat(false);
                            setEditingSat({ ...sat });
                          }}
                          className="px-3.5 py-2 text-xs text-white bg-white/[0.06] hover:bg-white/[0.12] rounded-lg cursor-pointer"
                        >
                          تعديل الباقة والشرح
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSatellite(sat.id)}
                          className="p-2 text-zinc-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 4: GAME TOP-UP PACKAGES (JAWAKER, PUBG, FREE FIRE, PSN)
            ================================================================ */}
            {activeTab === 'games' && (
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-[#14171D] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white font-display">
                      إدارة باقات شحن الألعاب (جواكر وببجي وغيرها)
                    </h2>
                    <p className="text-xs text-zinc-400">
                      أضف أو عدّل كميات التوكنز والشدات والأسعار وتعليمات الشحن لكل لعبة.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewGame(true);
                      setEditingGame({
                        id: `game-${Date.now()}`,
                        gameId: 'jawaker',
                        gameName: 'جواكر (Jawaker)',
                        amountLabel: '',
                        bonusLabel: '',
                        deliveryType: 'شحن مباشر عبر الـ ID',
                        topupInstructions: '',
                        price: 5,
                        popular: false,
                        isPublic: true,
                      });
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة باقة شحن جديدة</span>
                  </button>
                </div>

                {editingGame && (
                  <form
                    onSubmit={handleSaveGame}
                    className="p-6 rounded-xl bg-[#161922] border border-amber-500/50 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <h3 className="text-base font-bold text-white font-display">
                        {isNewGame ? 'إضافة باقة شحن ألعاب' : 'تعديل باقة شحن الألعاب'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingGame(null)}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">اللعبة</label>
                        <select
                          value={editingGame.gameId}
                          onChange={(e) => {
                            const gId = e.target.value as GameBrandId;
                            const nameMap: Record<GameBrandId, string> = {
                              jawaker: 'جواكر (Jawaker)',
                              pubg: 'ببجي موبايل (PUBG)',
                              freefire: 'فري فاير (Free Fire)',
                              playstation: 'PlayStation Store',
                            };
                            setEditingGame({
                              ...editingGame,
                              gameId: gId,
                              gameName: nameMap[gId],
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        >
                          <option value="jawaker">جواكر (Jawaker)</option>
                          <option value="pubg">ببجي موبايل (PUBG)</option>
                          <option value="freefire">فري فاير (Free Fire)</option>
                          <option value="playstation">PlayStation & Steam</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">
                          الكمية / اسم الباقة (مثال: 60,000 توكنز)
                        </label>
                        <input
                          type="text"
                          required
                          value={editingGame.amountLabel}
                          onChange={(e) =>
                            setEditingGame({
                              ...editingGame,
                              amountLabel: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">السعر (د.أ)</label>
                        <input
                          type="number"
                          step="0.25"
                          required
                          value={editingGame.price}
                          onChange={(e) =>
                            setEditingGame({
                              ...editingGame,
                              price: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono-code bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">البونص / الإضافات</label>
                        <input
                          type="text"
                          required
                          value={editingGame.bonusLabel}
                          onChange={(e) =>
                            setEditingGame({ ...editingGame, bonusLabel: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300">طريقة التسليم</label>
                        <input
                          type="text"
                          required
                          value={editingGame.deliveryType}
                          onChange={(e) =>
                            setEditingGame({
                              ...editingGame,
                              deliveryType: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-zinc-300">
                        شرح وتعليمات الشحن لهذه الباقة
                      </label>
                      <textarea
                        rows={2}
                        value={editingGame.topupInstructions}
                        onChange={(e) =>
                          setEditingGame({
                            ...editingGame,
                            topupInstructions: e.target.value,
                          })
                        }
                        placeholder="مثال: افتح تطبيق جواكر وانسخ المعرف..."
                        className="w-full px-3 py-2 text-xs bg-[#0B0C0E] border border-white/[0.1] rounded-lg text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingGame.popular}
                          onChange={(e) =>
                            setEditingGame({ ...editingGame, popular: e.target.checked })
                          }
                          className="accent-amber-500"
                        />
                        <span>تمييز كباقة "الأكثر مبيعاً"</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingGame(null)}
                          className="px-4 py-2 text-xs text-zinc-300 bg-white/[0.06] rounded-lg cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isBusy}
                          className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 rounded-lg cursor-pointer"
                        >
                          حفظ باقة الشحن
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gamePackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-4 rounded-xl bg-[#14171D] border border-white/[0.08] flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs text-amber-400">{pkg.gameName}</div>
                        <div className="text-sm font-bold text-white">
                          {pkg.amountLabel}
                        </div>
                        <div className="text-xs text-zinc-400 tabular-nums">
                          {pkg.price.toFixed(2)} د.أ · {pkg.bonusLabel}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewGame(false);
                            setEditingGame({ ...pkg });
                          }}
                          className="px-3 py-1.5 text-xs text-white bg-white/[0.06] hover:bg-white/[0.12] rounded-lg cursor-pointer"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGame(pkg.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
