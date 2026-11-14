export type DeviceCategoryId =
  | 'all'
  | 'android-tv'
  | 'android-mobile'
  | 'iphone-ios'
  | 'samsung-lg'
  | 'windows-pc';

export interface CubeTvAppItem {
  id: string;
  categoryId: Exclude<DeviceCategoryId, 'all'>;
  categoryLabel: string;
  title: string;
  subtitle: string;
  version: string;
  size: string;
  osRequirement: string;
  downloaderCode: string;
  serverHostUrl: string;
  storeAppName: string;
  directFileName: string;
  fileDownloadUrl: string;
  resolutionSupport: string;
  fullTutorialText: string;
  highlights: string[];
  setupSteps: string[];
  isPublic: boolean;
}

export interface CubeSubscriptionPlan {
  id: string;
  name: string;
  duration: string;
  price: number;
  currency: string;
  channelsCount: string;
  vodCount: string;
  quality: string;
  devicesAllowed: string;
  featured: boolean;
  isPublic: boolean;
}

export interface SatellitePlan {
  id: string;
  name: string;
  tier: string;
  downloadSpeed: string;
  uploadSpeed: string;
  latency: string;
  dataQuota: string;
  monthlyPrice: number;
  hardwareNote: string;
  idealFor: string;
  installationGuide: string;
  recommendedMinDevices: number;
  recommendedMaxDevices: number;
  isPublic: boolean;
}

export type GameBrandId = 'jawaker' | 'pubg' | 'freefire' | 'playstation';

export interface GameTopupPackage {
  id: string;
  gameId: GameBrandId;
  gameName: string;
  amountLabel: string;
  bonusLabel: string;
  deliveryType: string;
  topupInstructions: string;
  price: number;
  popular: boolean;
  isPublic: boolean;
}

export const DEVICE_CATEGORIES: { id: DeviceCategoryId; label: string }[] = [
  { id: 'all', label: 'جميع الأجهزة' },
  { id: 'android-tv', label: 'شاشات أندرويد' },
  { id: 'android-mobile', label: 'موبايلات أندرويد' },
  { id: 'iphone-ios', label: 'موبايلات آيفون' },
  { id: 'samsung-lg', label: 'شاشات سامسونج وإل جي' },
  { id: 'windows-pc', label: 'تطبيق الويندوز' },
];

export const CUBE_TV_APPS: CubeTvAppItem[] = [
  {
    id: 'cube-android-tv-pro',
    categoryId: 'android-tv',
    categoryLabel: 'شاشات أندرويد و TV Box',
    title: 'Cube TV Pro — نسخة الشاشات الذكية',
    subtitle: 'واجهة مصممة خصيصاً للريموت كنترول مع دعم البث الفائق 4K UHD وتنقل فوري بين القنوات',
    version: 'v4.8.2',
    size: '38.4 MB',
    osRequirement: 'Android TV 7.0+ / Google TV / Fire TV Stick',
    downloaderCode: '6495278',
    serverHostUrl: 'http://tv.fire-cube.net:8080',
    storeAppName: 'Downloader by AFTVnews',
    directFileName: 'CubeTV.apk',
    fileDownloadUrl:
      'https://yjgisbdaqfvqywfjkafq.supabase.co/storage/v1/object/public/files-ip/cube-android-tv-pro/1794521797986_CubeTV.apk',
    resolutionSupport: '4K UHD · HEVC H.265',
    fullTutorialText:
      'شرح التثبيت الكامل على شاشات أندرويد و Google TV:\n1. قم بفتح متجر Google Play على الشاشة وابحث عن تطبيق Downloader البرتقالي وثبته.\n2. من إعدادات الشاشة -> الأمان والقيود -> فعّل خيار السماح بتثبيت التطبيقات غير المعروفة لتطبيق Downloader.\n3. افتح تطبيق Downloader وأدخل الكود 6495278 ثم اضغط Go ليبدأ تحميل ملف CubeTV.apk تلقائياً.\n4. بعد فتح التطبيق، أدخل اسم المستخدم وكلمة المرور المستلمة من صالة فاير لفتح الباقات فوراً.',
    highlights: [
      'دعم كامل للتحكم عبر ريموت الشاشة والبحث الصوتي',
      'تقنية Anti-Freeze لمنع التقطيع وقت المباريات المباشرة',
      'تقسيم ذكي للباقات الرياضية ومكتبة الأفلام والمسلسلات المحدثة يومياً',
    ],
    setupSteps: [
      'افتح متجر Google Play على شاشتك وحمّل تطبيق Downloader by AFTVnews.',
      'أدخل كود التحميل السريع 6495278 في خانة الرقم واضغط Go للتحميل المباشر.',
      'بعد التثبيت، افتح تطبيق Cube TV Pro وأدخل اسم المستخدم وكلمة المرور المستلمة من صالة فاير.',
    ],
    isPublic: true,
  },
  {
    id: 'cube-android-tv-lite',
    categoryId: 'android-tv',
    categoryLabel: 'شاشات أندرويد والرسيفرات',
    title: 'Cube TV Lite — للشاشات والرسيفرات الاقتصادية',
    subtitle: 'نسخة خفيفة وسريعة الاستجابة مخصصة لأجهزة TV Box ذات الذاكرة المحدودة والإنترنت المتوسط',
    version: 'v3.9.5',
    size: '21.0 MB',
    osRequirement: 'Android 5.1+ / Xiaomi Mi Box / Chromecast',
    downloaderCode: '551904',
    serverHostUrl: 'http://tv.fire-cube.net:8080',
    storeAppName: 'Downloader',
    directFileName: 'CubeTV_Lite_TV_v3.9.5.apk',
    fileDownloadUrl: '',
    resolutionSupport: 'FHD 1080p · H.264',
    fullTutorialText:
      'تم تطوير نسخة Cube TV Lite خصيصاً لأجهزة TV Box الاقتصادية والشاشات ذات الذاكرة العشوائية 1GB أو 2GB.\nيمكنك تحميلها مباشرة عبر فلاشة USB أو عبر تطبيق Downloader بإدخال الرقم 551904، ثم إدخال كود التفعيل الخاص بصالة فاير.',
    highlights: [
      'استهلاك منخفض للرام والمعالج على الشاشات القديمة',
      'إقلاع فوري للقنوات خلال أقل من ثانية واحدة',
      'تبديل تلقائي للجودة حسب سرعة الإنترنت المتوفرة',
    ],
    setupSteps: [
      'افتح تطبيق Downloader على الشاشة أو الرسيفر وأدخل الكود 551904.',
      'وافق على تثبيت الحزمة وافتح التطبيق من القائمة الرئيسية.',
      'أدخل كود التفعيل المكون من 10 أرقام أو بيانات حسابك في صالة فاير.',
    ],
    isPublic: true,
  },
  {
    id: 'cube-android-mobile-max',
    categoryId: 'android-mobile',
    categoryLabel: 'موبايلات أندرويد والأجهزة اللوحية',
    title: 'Cube TV Mobile — نسخة الهواتف والتابلت',
    subtitle: 'تطبيق أندرويد رسمي بواجهة لمس عصرية، دعم نافذة الصورة داخل صورة (PiP) وتحميل المحتوى',
    version: 'v4.8.0',
    size: '34.2 MB',
    osRequirement: 'Android 8.0+ (Samsung, Xiaomi, Honor, Pixel)',
    downloaderCode: '883120',
    serverHostUrl: 'http://tv.fire-cube.net:8080',
    storeAppName: 'Direct APK Installer',
    directFileName: 'CubeTV_Mobile_v4.8.0.apk',
    fileDownloadUrl: '',
    resolutionSupport: '4K / FHD · 60fps Sports',
    fullTutorialText:
      'للتثبيت على هواتف سامسونج وشاومي وهونر:\n1. اضغط على زر تحميل ملف APK المباشر في البطاقة.\n2. عند ظهور رسالة الحماية في المتصفح اختر "التنزيل على أي حال".\n3. افتح الملف واضغط تثبيت، ثم أدخل بيانات اشتراكك في صالة فاير.',
    highlights: [
      'وضع صورة داخل صورة (PiP) لمتابعة المباريات أثناء تصفح الهاتف',
      'مشغل داخلي متطور يدعم اختيار المسار الصوتي والمعلق الرياضي',
      'إشعارات فورية قبل انطلاق المباريات الكبرى وإضافات الأفلام الجديدة',
    ],
    setupSteps: [
      'اضغط على زر "تحميل ملف APK المباشر" أدناه لتنزيل التطبيق على هاتفك.',
      'افتح الملف من الإشعارات وفعّل خيار التثبيت من المتصفح إذا طُلب منك.',
      'سجّل الدخول ببيانات اشتراكك في صالة فاير واستمتع بالمشاهدة الفورية.',
    ],
    isPublic: true,
  },
  {
    id: 'cube-android-xc-player',
    categoryId: 'android-mobile',
    categoryLabel: 'موبايلات أندرويد',
    title: 'Cube XC Player — المشغل الرياضي السريع',
    subtitle: 'مشغل بديل مخصص لعشاق القنوات الرياضية المباشرة مع تعدد الشاشات حتى 4 مباريات معاً',
    version: 'v2.4.1',
    size: '27.8 MB',
    osRequirement: 'Android 7.0+ Smartphones & Tablets',
    downloaderCode: '619402',
    serverHostUrl: 'http://tv.fire-cube.net:8080',
    storeAppName: 'Cube XC APK',
    directFileName: 'CubeXC_Player_v2.4.1.apk',
    fileDownloadUrl: '',
    resolutionSupport: 'FHD 60fps · Multi-View',
    fullTutorialText:
      'يتيح لك مشغل Cube XC تقسيم شاشة الهاتف أو التابلت لمشاهدة 4 قنوات رياضية في وقت واحد مع إمكانية اختيار الصوت من أي شاشة فرعية بلمسة واحدة.',
    highlights: [
      'خاصية تقسيم الشاشة لمشاهدة أكثر من قناة رياضية في وقت واحد',
      'دعم البث اللاسلكي المباشر Cast إلى الشاشات المنزلية',
      'واجهة ليلية مريحة للعين مع جدول مباريات اليوم المدمج',
    ],
    setupSteps: [
      'حمّل ملف APK مباشرة إلى هاتفك الأندرويد وثبته.',
      'اختر تسجيل الدخول عبر Xtream Codes أو كود التفعيل السريع.',
      'أدخل بيانات اشتراك صالة فاير لفتح الباقات فوراً.',
    ],
    isPublic: true,
  },
  {
    id: 'cube-iphone-ios',
    categoryId: 'iphone-ios',
    categoryLabel: 'موبايلات آيفون وآيباد (iOS)',
    title: 'Cube TV iOS — عبر متجر App Store الرسمي',
    subtitle: 'توافق كامل مع أجهزة iPhone و iPad و Apple TV عبر المشغلات المعتمدة وربط مباشر بسيرفر فاير',
    version: 'iOS 15.0+',
    size: '42.5 MB',
    osRequirement: 'iPhone · iPad · Apple TV (tvOS)',
    downloaderCode: '',
    storeAppName: 'Smarters Player Lite / IBO Player Pro',
    serverHostUrl: 'http://ios.fire-cube.net:8080',
    directFileName: 'CubeTV_iOS_Setup_Profile.mobileconfig',
    fileDownloadUrl: '',
    resolutionSupport: '4K HDR · AirPlay 2',
    fullTutorialText:
      'طريقة تشغيل اشتراك Cube TV على الآيفون والآيباد:\n1. ادخل إلى متجر App Store الرسمي وابحث عن تطبيق Smarters Player Lite أو IBO Player Pro.\n2. بعد فتح التطبيق اختر Login with Xtream Codes API.\n3. في الخانة الأولى اكتب Fire Lounge، وفي خانة الـ Server URL انسخ الرابط: http://ios.fire-cube.net:8080 ثم أدخل اسم المستخدم وكلمة المرور.',
    highlights: [
      'تحميل آمن ومباشر من متجر Apple App Store الرسمي بدون جلبريك',
      'دعم كامل لخاصية AirPlay لبث المحتوى من الآيفون إلى الشاشة',
      'مزامنة المفضلة واستكمال المشاهدة بين الآيفون والآيباد',
    ],
    setupSteps: [
      'افتح متجر App Store على الآيفون وابحث عن تطبيق Smarters Player Lite أو IBO Player.',
      'اختر Login with Xtream Codes API عند فتح التطبيق.',
      'انسخ رابط السيرفر http://ios.fire-cube.net:8080 من البطاقة أدناه وأدخل اسم المستخدم وكلمة المرور.',
    ],
    isPublic: true,
  },
  {
    id: 'cube-samsung-tizen',
    categoryId: 'samsung-lg',
    categoryLabel: 'شاشات سامسونج الذكية (Tizen OS)',
    title: 'Cube TV — نسخة شاشات Samsung Smart TV',
    subtitle: 'تشغيل مباشر عبر متجر تطبيقات سامسونج الرسمي بدون الحاجة لأي جهاز خارجي أو رسيفر',
    version: 'Tizen 4.0+',
    size: '18.6 MB',
    osRequirement: 'Samsung Smart TV (موديلات 2018 حتى 2026)',
    downloaderCode: '',
    storeAppName: 'IBO Player / Bob Player / Cube Smart',
    serverHostUrl: 'http://tv.fire-cube.net:8080',
    directFileName: 'CubeTV_Samsung_Tizen_Guide.pdf',
    fileDownloadUrl: '',
    resolutionSupport: '4K Crystal UHD & QLED',
    fullTutorialText:
      'شرح التشغيل على شاشات سامسونج سمارت:\n1. اضغط على زر المنزل (Home) في ريموت الشاشة وانتقل إلى قسم Apps.\n2. اضغط على أيقونة البحث في الأعلى واكتب IBO Player أو Bob Player أو IPTV Smarters Pro.\n3. بعد تثبيت التطبيق وفتحه، سيظهر لك على الشاشة عنوان MAC Address و Device Key، قم بتصوير الشاشة وإرسالها لصالة فاير ليتم رفع وتفعيل الباقة فوراً عن بُعد.',
    highlights: [
      'يعمل مباشرة من نظام الشاشة الأصلي بسرعة استجابة فائقة',
      'تفعيل فوري عن بُعد من خلال إرسال عنوان MAC Address لصالة فاير',
      'ترجمة عربية احترافية مدمجة للأفلام والمسلسلات بجودة Blu-Ray',
    ],
    setupSteps: [
      'اضغط زر Home في ريموت شاشة سامسونج وانتقل إلى متجر Apps.',
      'ابحث عن تطبيق IBO Player أو Smarters Pro وقم بتثبيته مجاناً.',
      'صوّر الشاشة التي يظهر فيها Device ID و Device Key وأرسلها لنا ليتم تفعيل اشتراكك فوراً.',
    ],
    isPublic: true,
  },
  {
    id: 'cube-lg-webos',
    categoryId: 'samsung-lg',
    categoryLabel: 'شاشات إل جي الذكية (LG webOS)',
    title: 'Cube TV — نسخة شاشات LG Content Store',
    subtitle: 'مصمم للتكامل مع الماجيك ريموت (Magic Remote) على شاشات LG OLED و NanoCell الذكية',
    version: 'webOS 4.5+',
    size: '19.2 MB',
    osRequirement: 'LG Smart TV (OLED / QNED / UHD)',
    downloaderCode: '',
    storeAppName: 'IPTV Smarters Pro / IBO Player',
    serverHostUrl: 'http://tv.fire-cube.net:8080',
    directFileName: 'CubeTV_LG_webOS_Guide.pdf',
    fileDownloadUrl: '',
    resolutionSupport: '4K Dolby Vision · 60fps',
    fullTutorialText:
      'شرح التثبيت على شاشات LG الذكية:\n1. افتح متجر تطبيقات LG Content Store أو Apps من الواجهة الرئيسية.\n2. ابحث عن تطبيق IPTV Smarters Pro أو IBO Player وثبته.\n3. في حال استخدام Smarters أدخل رابط السيرفر http://tv.fire-cube.net:8080 مع بيانات حسابك، وفي حال استخدام IBO Player أرسل لنا الـ MAC Address الظاهر على الشاشة لتفعيله فوراً.',
    highlights: [
      'دعم كامل لمؤشر الماجيك ريموت للتنقل السلس بين القنوات والأفلام',
      'تشغيل مستقر للبث المباشر بجودة 4K الحقيقية بدون تقطيع',
      'تحديث تلقائي لقوائم القنوات والباقات الرياضية فور تشغيل الشاشة',
    ],
    setupSteps: [
      'افتح متجر LG Content Store من القائمة الرئيسية للشاشة.',
      'ابحث عن تطبيق IBO Player أو IPTV Smarters Pro وثبته على الشاشة.',
      'أدخل بيانات السيرفر http://tv.fire-cube.net:8080 أو أرسل عنوان الـ MAC لصالة فاير للتفعيل الفوري.',
    ],
    isPublic: true,
  },
  {
    id: 'cube-windows-desktop',
    categoryId: 'windows-pc',
    categoryLabel: 'أجهزة الكمبيوتر واللابتوب (Windows)',
    title: 'Cube TV Desktop — نسخة ويندوز 10 و 11',
    subtitle: 'برنامج سطح مكتب متكامل للكمبيوتر واللابتوب مع مشغل فيديو مدمج فائق الأداء ودعم الشاشات المتعددة',
    version: 'v4.6.0 (x64)',
    size: '64.5 MB',
    osRequirement: 'Windows 10 / Windows 11 (64-bit)',
    downloaderCode: 'WIN-460',
    storeAppName: 'Windows Desktop Installer (.exe)',
    serverHostUrl: 'http://pc.fire-cube.net:8080',
    directFileName: 'CubeTV_Windows_Setup_v4.6.0.exe',
    fileDownloadUrl: '',
    resolutionSupport: '4K 60fps · Hardware Acceleration',
    fullTutorialText:
      'شرح تثبيت برنامج Cube TV للكمبيوتر واللابتوب:\n1. اضغط على زر تحميل نسخة ويندوز لتنزيل ملف التثبيت المباشر (.exe).\n2. شغّل الملف واضغط Next ثم Install لإنشاء اختصار البرنامج على سطح المكتب.\n3. افتح البرنامج وأدخل رابط السيرفر http://pc.fire-cube.net:8080 مع اسم المستخدم وكلمة المرور الخاصة بك.',
    highlights: [
      'تسريع عتادي عبر كرت الشاشة (GPU Hardware Decoding) لصورة فائقة النقاء',
      'إمكانية تثبيت نافذة المشاهدة فوق جميع البرامج أثناء العمل أو اللعب',
      'اختصارات لوحة مفاتيح سريعة لتغيير القنوات والتحكم بالصوت والترجمة',
    ],
    setupSteps: [
      'اضغط على "تحميل نسخة ويندوز (.exe)" لتنزيل مثبت البرنامج الرسمي.',
      'شغّل ملف التثبيت CubeTV_Windows_Setup_v4.6.0.exe واتبع خطوات التثبيت السريعة.',
      'افتح البرنامج من سطح المكتب وسجّل دخولك بكود صالة فاير أو بيانات Xtream.',
    ],
    isPublic: true,
  },
];

export const CUBE_SUBSCRIPTION_PLANS: CubeSubscriptionPlan[] = [
  {
    id: 'sub-1m',
    name: 'اشتراك Cube TV — شهر واحد',
    duration: '30 يوماً',
    price: 10,
    currency: 'د.أ',
    channelsCount: '+11,500 قناة مباشرة',
    vodCount: '+35,000 فيلم ومسلسل',
    quality: '4K UHD · FHD · HD',
    devicesAllowed: 'جهاز واحد (جميع الأنظمة)',
    featured: false,
    isPublic: true,
  },
  {
    id: 'sub-3m',
    name: 'اشتراك Cube TV — 3 أشهر',
    duration: '90 يوماً',
    price: 22,
    currency: 'د.أ',
    channelsCount: '+11,500 قناة مباشرة',
    vodCount: '+35,000 فيلم ومسلسل',
    quality: '4K UHD · FHD · HD',
    devicesAllowed: 'جهاز واحد + نقل مجاني',
    featured: false,
    isPublic: true,
  },
  {
    id: 'sub-6m',
    name: 'اشتراك Cube TV — 6 أشهر + شهر هدية',
    duration: '210 أيام',
    price: 35,
    currency: 'د.أ',
    channelsCount: '+11,500 قناة مباشرة',
    vodCount: '+35,000 فيلم ومسلسل',
    quality: '4K UHD · Anti-Freeze VIP',
    devicesAllowed: 'جهازين في نفس الوقت',
    featured: true,
    isPublic: true,
  },
  {
    id: 'sub-12m',
    name: 'اشتراك Cube TV الملكي — سنة كاملة VIP',
    duration: '365 يوماً',
    price: 55,
    currency: 'د.أ',
    channelsCount: '+11,500 قناة شاملة الدوريات',
    vodCount: '+40,000 فيلم ومسلسل محدث',
    quality: '4K Raw · أولوية السيرفر الرياضي',
    devicesAllowed: 'جهازين + دعم فني VIP طوال العام',
    featured: false,
    isPublic: true,
  },
];

export const SATELLITE_INTERNET_PLANS: SatellitePlan[] = [
  {
    id: 'sat-home-plus',
    name: 'باقة فاير سبيس — المنزلي الفائق',
    tier: 'استخدام منزلي وعائلي',
    downloadSpeed: '150 Mbps',
    uploadSpeed: '30 Mbps',
    latency: '28 ms',
    dataQuota: 'غير محدود (بدون سياسة استخدام عادل)',
    monthlyPrice: 45,
    hardwareNote: 'طبق استقبال ذكي ذاتي التوجيه + راوتر Wi-Fi 6 مزدوج الحزمة',
    idealFor: 'البث المباشر 4K، تطبيقات Cube TV، وتصفح العائلة حتى 8 أجهزة',
    installationGuide:
      'يتم تثبيت الطبق الفضائي الذكي على السطح في مكان مكشوف للسماء، ويقوم الطبق بتوجيه نفسه تلقائياً نحو القمر الصناعي خلال 3 دقائق من توصيل الكهرباء.',
    recommendedMinDevices: 1,
    recommendedMaxDevices: 8,
    isPublic: true,
  },
  {
    id: 'sat-gaming-pro',
    name: 'باقة فاير أوربت — الألعاب والصالات',
    tier: 'أولوية قصوى للألعاب والبث',
    downloadSpeed: '280 Mbps',
    uploadSpeed: '50 Mbps',
    latency: '22 ms',
    dataQuota: 'غير محدود · خط أولوية للألعاب',
    monthlyPrice: 75,
    hardwareNote: 'طبق استقبال Pro عالي الكسب + منفذ Ethernet جيجابت مباشر',
    idealFor: 'الألعاب التنافسية (ببجي، كود، فيفا)، الستريمرز، والشركات الصغيرة',
    installationGuide:
      'تشمل الباقة محول الشبكة السلكية (Ethernet Adapter) لتوصيل أجهزة الكونسول والكمبيوتر والسيرفرات مباشرة للحصول على أقل بنق ممكن.',
    recommendedMinDevices: 6,
    recommendedMaxDevices: 18,
    isPublic: true,
  },
  {
    id: 'sat-remote-max',
    name: 'باقة فاير إكستريم — المزارع والمناطق البعيدة',
    tier: 'تغطية فضائية شاملة في كل مكان',
    downloadSpeed: '400 Mbps',
    uploadSpeed: '65 Mbps',
    latency: '20 ms',
    dataQuota: 'غير محدود · ثبات عالي في كافة الظروف الجوية',
    monthlyPrice: 110,
    hardwareNote: 'منظومة استقبال خارجية مقاومة للحرارة والغبار IP67 + نقاط Mesh Wi-Fi',
    idealFor: 'المزارع، الاستراحات، المخيمات، والمنشآت التي لا تصلها الألياف الضوئية',
    installationGuide:
      'يقوم فريق صالة فاير بتركيب القاعدة المعدنية المقاومة للرياح وتمديد الكوابل المدرعة وتوزيع نقاط الـ Mesh لتغطية كامل مساحة المزرعة أو الاستراحة.',
    recommendedMinDevices: 15,
    recommendedMaxDevices: 50,
    isPublic: true,
  },
];

export const GAME_BRANDS: {
  id: GameBrandId;
  name: string;
  arabicTitle: string;
  idLabel: string;
  idPlaceholder: string;
  deliveryTime: string;
  description: string;
}[] = [
  {
    id: 'jawaker',
    name: 'Jawaker',
    arabicTitle: 'شحن توكنز جواكر الرسمي',
    idLabel: 'رقم معرف اللاعب في جواكر (Player ID)',
    idPlaceholder: 'مثال: 482910384',
    deliveryTime: 'شحن فوري خلال 30 ثانية عبر الرقم المعرف',
    description: 'توكنز جواكر أصلية ومسرعات واشتراكات الباشا تصل مباشرة إلى حسابك بمجرد إدخال رقم الـ ID.',
  },
  {
    id: 'pubg',
    name: 'PUBG Mobile',
    arabicTitle: 'شحن شدات ببجي موبايل (UC)',
    idLabel: 'رقم الـ ID في ببجي موبايل (Character ID)',
    idPlaceholder: 'مثال: 5192837465',
    deliveryTime: 'شحن رسمي فوري للحسابات العالمية والعربية',
    description: 'شدات ببجي موبايل رسمية لتفعيل الرويال باس السيزون الجديد وصناديق الأسلحة المميزة.',
  },
  {
    id: 'freefire',
    name: 'Free Fire',
    arabicTitle: 'شحن جواهر فري فاير (Diamonds)',
    idLabel: 'رقم معرف اللاعب (Player ID)',
    idPlaceholder: 'مثال: 1928374650',
    deliveryTime: 'شحن مباشر عبر الـ ID في أقل من دقيقة',
    description: 'جواهر فري فاير أصلية مع مكافآت شحن إضافية لجميع السيرفرات العربية.',
  },
  {
    id: 'playstation',
    name: 'PlayStation & Steam',
    arabicTitle: 'بطاقات بلايستيشن وستيم الرقمية',
    idLabel: 'رقم الواتساب أو البريد لاستلام الكود الفوري',
    idPlaceholder: 'مثال: 0790000000',
    deliveryTime: 'تسليم فوري لكود البطاقة الرقمي',
    description: 'بطاقات PlayStation Store (الأمريكي، الإماراتي، السعودي) وبطاقات Steam لشراء الألعاب والإضافات.',
  },
];

export const GAME_TOPUP_PACKAGES: GameTopupPackage[] = [
  {
    id: 'jwk-15k',
    gameId: 'jawaker',
    gameName: 'جواكر (Jawaker)',
    amountLabel: '15,000 توكنز جواكر',
    bonusLabel: '+ 1,500 توكن إضافي',
    deliveryType: 'شحن مباشر عبر الـ ID',
    topupInstructions: 'افتح تطبيق جواكر -> الملف الشخصي -> انسخ رقم المعرف (ID) وأدخله في خانة الشحن.',
    price: 2.5,
    popular: false,
    isPublic: true,
  },
  {
    id: 'jwk-60k',
    gameId: 'jawaker',
    gameName: 'جواكر (Jawaker)',
    amountLabel: '60,000 توكنز جواكر',
    bonusLabel: '+ 7,500 توكن إضافي',
    deliveryType: 'شحن مباشر عبر الـ ID',
    topupInstructions: 'افتح تطبيق جواكر -> الملف الشخصي -> انسخ رقم المعرف (ID) وأدخله في خانة الشحن.',
    price: 8.5,
    popular: true,
    isPublic: true,
  },
  {
    id: 'jwk-130k',
    gameId: 'jawaker',
    gameName: 'جواكر (Jawaker)',
    amountLabel: '130,000 توكنز جواكر',
    bonusLabel: '+ 20,000 توكن إضافي',
    deliveryType: 'شحن مباشر عبر الـ ID',
    topupInstructions: 'افتح تطبيق جواكر -> الملف الشخصي -> انسخ رقم المعرف (ID) وأدخله في خانة الشحن.',
    price: 16.0,
    popular: false,
    isPublic: true,
  },
  {
    id: 'jwk-400k',
    gameId: 'jawaker',
    gameName: 'جواكر (Jawaker)',
    amountLabel: '400,000 توكنز جواكر VIP',
    bonusLabel: '+ 75,000 توكن + شارة الباشا',
    deliveryType: 'شحن مباشر عبر الـ ID',
    topupInstructions: 'افتح تطبيق جواكر -> الملف الشخصي -> انسخ رقم المعرف (ID) وأدخله في خانة الشحن.',
    price: 44.0,
    popular: true,
    isPublic: true,
  },
  {
    id: 'jwk-red-acc',
    gameId: 'jawaker',
    gameName: 'جواكر (Jawaker)',
    amountLabel: 'المسرع الأحمر الفائق (شهر كامل)',
    bonusLabel: 'مضاعفة نقاط الخبرة والجوائز',
    deliveryType: 'تفعيل فوري على الـ ID',
    topupInstructions: 'يتفعل المسرع الأحمر مباشرة على حسابك في جواكر لمدة 30 يوماً.',
    price: 12.0,
    popular: false,
    isPublic: true,
  },
  {
    id: 'jwk-club',
    gameId: 'jawaker',
    gameName: 'جواكر (Jawaker)',
    amountLabel: 'تأسيس / شحن رصيد نادي جواكر',
    bonusLabel: '250,000 توكن لدعم النادي',
    deliveryType: 'شحن مباشر عبر الـ ID',
    topupInstructions: 'أدخل رقم معرف النادي أو معرف قائد النادي ليتم تحويل الرصيد فوراً.',
    price: 28.0,
    popular: false,
    isPublic: true,
  },
  {
    id: 'pubg-60',
    gameId: 'pubg',
    gameName: 'ببجي موبايل (PUBG)',
    amountLabel: '60 شدة (UC)',
    bonusLabel: 'شحن رسمي مضمون',
    deliveryType: 'عبر Player ID',
    topupInstructions: 'انسخ الـ ID من داخل اللعبة (يبدأ غالباً بالرقم 5) وأدخله ليصلك الشحن فوراً.',
    price: 1.0,
    popular: false,
    isPublic: true,
  },
  {
    id: 'pubg-325',
    gameId: 'pubg',
    gameName: 'ببجي موبايل (PUBG)',
    amountLabel: '325 شدة (UC)',
    bonusLabel: 'شامل 25 شدة هدية',
    deliveryType: 'عبر Player ID',
    topupInstructions: 'انسخ الـ ID من داخل اللعبة وأدخله ليصلك الشحن فوراً.',
    price: 4.25,
    popular: false,
    isPublic: true,
  },
  {
    id: 'pubg-660',
    gameId: 'pubg',
    gameName: 'ببجي موبايل (PUBG)',
    amountLabel: '660 شدة (UC) — الرويال باس',
    bonusLabel: 'الباقة الأنسب لتفعيل Royale Pass',
    deliveryType: 'عبر Player ID',
    topupInstructions: 'تكفي هذه الباقة لتفعيل السيزون Royale Pass بالكامل.',
    price: 8.5,
    popular: true,
    isPublic: true,
  },
  {
    id: 'pubg-1800',
    gameId: 'pubg',
    gameName: 'ببجي موبايل (PUBG)',
    amountLabel: '1,800 شدة (UC)',
    bonusLabel: 'شامل 300 شدة إضافية',
    deliveryType: 'عبر Player ID',
    topupInstructions: 'شحن فوري ومباشر لحسابك العالمي أو العربي عبر الـ ID.',
    price: 21.0,
    popular: false,
    isPublic: true,
  },
  {
    id: 'pubg-3850',
    gameId: 'pubg',
    gameName: 'ببجي موبايل (PUBG)',
    amountLabel: '3,850 شدة (UC)',
    bonusLabel: 'شامل 850 شدة إضافية',
    deliveryType: 'عبر Player ID',
    topupInstructions: 'شحن فوري ومباشر لحسابك العالمي أو العربي عبر الـ ID.',
    price: 41.0,
    popular: true,
    isPublic: true,
  },
  {
    id: 'pubg-8100',
    gameId: 'pubg',
    gameName: 'ببجي موبايل (PUBG)',
    amountLabel: '8,100 شدة (UC) — الباقة الملكية',
    bonusLabel: 'شامل 2,100 شدة إضافية',
    deliveryType: 'عبر Player ID',
    topupInstructions: 'شحن فوري ومباشر لحسابك العالمي أو العربي عبر الـ ID.',
    price: 80.0,
    popular: false,
    isPublic: true,
  },
  {
    id: 'ff-310',
    gameId: 'freefire',
    gameName: 'فري فاير (Free Fire)',
    amountLabel: '310 جوهرة + 31 هدية',
    bonusLabel: 'الإجمالي 341 جوهرة',
    deliveryType: 'عبر Player ID',
    topupInstructions: 'أدخل معرف اللاعب في فري فاير ليتم تحويل الجواهر فوراً.',
    price: 3.0,
    popular: false,
    isPublic: true,
  },
  {
    id: 'ff-1060',
    gameId: 'freefire',
    gameName: 'فري فاير (Free Fire)',
    amountLabel: '1,060 جوهرة + 106 هدية',
    bonusLabel: 'الإجمالي 1,166 جوهرة',
    deliveryType: 'عبر Player ID',
    topupInstructions: 'أدخل معرف اللاعب في فري فاير ليتم تحويل الجواهر فوراً.',
    price: 9.5,
    popular: true,
    isPublic: true,
  },
  {
    id: 'ff-2180',
    gameId: 'freefire',
    gameName: 'فري فاير (Free Fire)',
    amountLabel: '2,180 جوهرة + 218 هدية',
    bonusLabel: 'الإجمالي 2,398 جوهرة',
    deliveryType: 'عبر Player ID',
    topupInstructions: 'أدخل معرف اللاعب في فري فاير ليتم تحويل الجواهر فوراً.',
    price: 18.5,
    popular: false,
    isPublic: true,
  },
  {
    id: 'psn-10',
    gameId: 'playstation',
    gameName: 'PlayStation Store',
    amountLabel: 'بطاقة ستور 10 دولار (أمريكي / إماراتي)',
    bonusLabel: 'كود رقمي فوري',
    deliveryType: 'تسليم الكود فوراً',
    topupInstructions: 'أدخل الكود المكون من 12 خانة في Redeem Codes داخل متجر بلايستيشن.',
    price: 7.5,
    popular: false,
    isPublic: true,
  },
  {
    id: 'psn-25',
    gameId: 'playstation',
    gameName: 'PlayStation Store',
    amountLabel: 'بطاقة ستور 25 دولار (أمريكي / إماراتي)',
    bonusLabel: 'كود رقمي فوري',
    deliveryType: 'تسليم الكود فوراً',
    topupInstructions: 'أدخل الكود المكون من 12 خانة في Redeem Codes داخل متجر بلايستيشن.',
    price: 18.0,
    popular: true,
    isPublic: true,
  },
  {
    id: 'psn-50',
    gameId: 'playstation',
    gameName: 'PlayStation Store',
    amountLabel: 'بطاقة ستور 50 دولار (أمريكي / إماراتي)',
    bonusLabel: 'كود رقمي فوري',
    deliveryType: 'تسليم الكود فوراً',
    topupInstructions: 'أدخل الكود المكون من 12 خانة في Redeem Codes داخل متجر بلايستيشن.',
    price: 35.5,
    popular: false,
    isPublic: true,
  },
];
