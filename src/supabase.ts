import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import {
  CUBE_TV_APPS,
  CUBE_SUBSCRIPTION_PLANS,
  SATELLITE_INTERNET_PLANS,
  GAME_TOPUP_PACKAGES,
  type CubeTvAppItem,
  type CubeSubscriptionPlan,
  type SatellitePlan,
  type GameTopupPackage,
} from './data/storeData';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://yjgisbdaqfvqywfjkafq.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_rI5TeHtJwWYWdWoEBJlVYg_UbUkXFNi';

export const SUPABASE_BUCKET = 'files-ip';
export const STORE_CONFIG_TABLE = 'store_config';
export const STORE_CONFIG_ROW_ID = 'main';

export const CUBE_PRO_DEFAULT_DOWNLOADER_CODE = '6495278';
export const CUBE_PRO_DEFAULT_DOWNLOAD_URL =
  'https://yjgisbdaqfvqywfjkafq.supabase.co/storage/v1/object/public/files-ip/cube-android-tv-pro/1794521797986_CubeTV.apk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export interface StoreConfigData {
  cubeApps: CubeTvAppItem[];
  cubePlans: CubeSubscriptionPlan[];
  satellitePlans: SatellitePlan[];
  gamePackages: GameTopupPackage[];
  updatedAt?: string;
}

export interface SupabaseUploadCallbacks {
  onProgress: (percent: number, transferredBytes: number, totalBytes: number) => void;
  onSuccess: (publicUrl: string) => void;
  onError: (errorMessage: string) => void;
}

let activeRealtimeChannel: RealtimeChannel | null = null;

/**
 * Normalizes raw data stored in `store_config.data` and ensures each app's
 * `fileDownloadUrl` is preserved accurately.
 */
export function normalizeStoreConfigData(
  rawData: unknown
): { normalized: StoreConfigData; needsAutoSync: boolean } {
  const defaultData: StoreConfigData = {
    cubeApps: CUBE_TV_APPS,
    cubePlans: CUBE_SUBSCRIPTION_PLANS,
    satellitePlans: SATELLITE_INTERNET_PLANS,
    gamePackages: GAME_TOPUP_PACKAGES,
  };

  if (!rawData || typeof rawData !== 'object') {
    return { normalized: defaultData, needsAutoSync: true };
  }

  const obj = rawData as Record<string, unknown>;
  let needsAutoSync = false;

  const rawApps = Array.isArray(obj.cubeApps) ? obj.cubeApps : CUBE_TV_APPS;
  const cubeApps: CubeTvAppItem[] = rawApps.map((item: any) => {
    const resolvedUrl =
      (typeof item?.fileDownloadUrl === 'string' && item.fileDownloadUrl.trim()) ||
      (typeof item?.downloadUrl === 'string' && item.downloadUrl.trim()) ||
      (typeof item?.fileUrl === 'string' && item.fileUrl.trim()) ||
      '';

    if (item?.id === 'cube-android-tv-pro') {
      const currentCode =
        typeof item?.downloaderCode === 'string' ? item.downloaderCode.trim() : '';
      const fixedCode =
        !currentCode || currentCode === '749281'
          ? CUBE_PRO_DEFAULT_DOWNLOADER_CODE
          : currentCode;
      const fixedUrl =
        !resolvedUrl ||
        !resolvedUrl.includes('/storage/v1/object/public/files-ip/cube-android-tv-pro/')
          ? CUBE_PRO_DEFAULT_DOWNLOAD_URL
          : resolvedUrl;

      if (fixedCode !== currentCode || fixedUrl !== resolvedUrl) {
        needsAutoSync = true;
      }

      return {
        ...item,
        downloaderCode: fixedCode,
        directFileName: item?.directFileName || 'CubeTV.apk',
        fileDownloadUrl: fixedUrl,
      } as CubeTvAppItem;
    }

    return {
      ...item,
      fileDownloadUrl: resolvedUrl,
    } as CubeTvAppItem;
  });

  const cubePlans: CubeSubscriptionPlan[] =
    Array.isArray(obj.cubePlans) && obj.cubePlans.length > 0
      ? (obj.cubePlans as CubeSubscriptionPlan[])
      : CUBE_SUBSCRIPTION_PLANS;

  const satellitePlans: SatellitePlan[] =
    Array.isArray(obj.satellitePlans) && obj.satellitePlans.length > 0
      ? (obj.satellitePlans as SatellitePlan[])
      : SATELLITE_INTERNET_PLANS;

  const gamePackages: GameTopupPackage[] =
    Array.isArray(obj.gamePackages) && obj.gamePackages.length > 0
      ? (obj.gamePackages as GameTopupPackage[])
      : GAME_TOPUP_PACKAGES;

  return {
    normalized: {
      cubeApps,
      cubePlans,
      satellitePlans,
      gamePackages,
      updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    },
    needsAutoSync,
  };
}

/**
 * Fetches `{ id: 'main', data }` from the `store_config` table in Supabase on app load.
 * If the row does not exist yet or needs initial Cube TV Pro defaults synced, upserts it.
 */
export async function fetchStoreConfigFromSupabase(): Promise<{
  data: StoreConfigData;
  error?: string;
}> {
  try {
    const { data: row, error } = await supabase
      .from(STORE_CONFIG_TABLE)
      .select('*')
      .eq('id', STORE_CONFIG_ROW_ID)
      .maybeSingle();

    if (error) {
      return {
        data: {
          cubeApps: CUBE_TV_APPS,
          cubePlans: CUBE_SUBSCRIPTION_PLANS,
          satellitePlans: SATELLITE_INTERNET_PLANS,
          gamePackages: GAME_TOPUP_PACKAGES,
        },
        error: `${error.message}${error.details ? ` (${error.details})` : ''}`,
      };
    }

    if (!row || !row.data) {
      const initialData: StoreConfigData = {
        cubeApps: CUBE_TV_APPS,
        cubePlans: CUBE_SUBSCRIPTION_PLANS,
        satellitePlans: SATELLITE_INTERNET_PLANS,
        gamePackages: GAME_TOPUP_PACKAGES,
        updatedAt: new Date().toISOString(),
      };
      // Seed initial row `{ id: 'main', data: initialData }` into Supabase
      await supabase
        .from(STORE_CONFIG_TABLE)
        .upsert({ id: STORE_CONFIG_ROW_ID, data: initialData }, { onConflict: 'id' });
      return { data: initialData };
    }

    const { normalized, needsAutoSync } = normalizeStoreConfigData(row.data);
    if (needsAutoSync) {
      await supabase
        .from(STORE_CONFIG_TABLE)
        .upsert(
          {
            id: STORE_CONFIG_ROW_ID,
            data: { ...normalized, updatedAt: new Date().toISOString() },
          },
          { onConflict: 'id' }
        );
    }

    return { data: normalized };
  } catch (err: any) {
    return {
      data: {
        cubeApps: CUBE_TV_APPS,
        cubePlans: CUBE_SUBSCRIPTION_PLANS,
        satellitePlans: SATELLITE_INTERNET_PLANS,
        gamePackages: GAME_TOPUP_PACKAGES,
      },
      error: err?.message || 'Unknown error fetching store_config from Supabase',
    };
  }
}

/**
 * Performs an actual upsert in the `store_config` table in Supabase:
 * `{ id: 'main', data: allStoreData }`
 */
export async function upsertStoreConfigToSupabase(
  allStoreData: StoreConfigData
): Promise<{ ok: boolean; data?: StoreConfigData; errorMessage?: string }> {
  const payloadToSave: StoreConfigData = {
    cubeApps: allStoreData.cubeApps,
    cubePlans: allStoreData.cubePlans,
    satellitePlans: allStoreData.satellitePlans,
    gamePackages: allStoreData.gamePackages,
    updatedAt: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from(STORE_CONFIG_TABLE)
      .upsert({ id: STORE_CONFIG_ROW_ID, data: payloadToSave }, { onConflict: 'id' });

    if (error) {
      const detailedError = [error.message, error.details, error.hint]
        .filter(Boolean)
        .join(' — ');
      return {
        ok: false,
        errorMessage: `فشل الحفظ في جدول store_config على Supabase: ${detailedError}`,
      };
    }

    // Broadcast update on the active realtime channel as an immediate push in addition to postgres_changes
    if (activeRealtimeChannel) {
      activeRealtimeChannel
        .send({
          type: 'broadcast',
          event: 'store_config_updated',
          payload: payloadToSave,
        })
        .catch(() => {
          // ignore broadcast notice
        });
    }

    return { ok: true, data: payloadToSave };
  } catch (err: any) {
    return {
      ok: false,
      errorMessage: `حدث خطأ أثناء الاتصال بـ Supabase لحفظ البيانات: ${
        err?.message || String(err)
      }`,
    };
  }
}

/**
 * Subscribes to real-time changes on `store_config` (where `id = 'main'`) in Supabase
 * so all visitors see Admin Panel edits immediately in real time.
 */
export function subscribeToStoreConfigRealtime(
  onUpdate: (newData: StoreConfigData) => void
): () => void {
  const channel = supabase
    .channel('store_config_main_realtime', {
      config: { broadcast: { self: true } },
    })
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: STORE_CONFIG_TABLE,
        filter: `id=eq.${STORE_CONFIG_ROW_ID}`,
      },
      (payload) => {
        const nextRow = payload.new as { id?: string; data?: unknown } | undefined;
        if (nextRow && nextRow.data) {
          const { normalized } = normalizeStoreConfigData(nextRow.data);
          onUpdate(normalized);
        }
      }
    )
    .on('broadcast', { event: 'store_config_updated' }, (payload) => {
      if (payload?.payload) {
        const { normalized } = normalizeStoreConfigData(payload.payload);
        onUpdate(normalized);
      }
    })
    .subscribe();

  activeRealtimeChannel = channel;

  return () => {
    if (activeRealtimeChannel === channel) {
      activeRealtimeChannel = null;
    }
    supabase.removeChannel(channel);
  };
}

/**
 * Uploads a file (APK, EXE, etc.) directly to Supabase Storage bucket `files-ip`
 * with real-time byte progress (%) via XMLHttpRequest and returns the exact
 * `supabase.storage.from('files-ip').getPublicUrl(fullPath).data.publicUrl` on completion.
 */
export function uploadFileToSupabaseStorage(
  fullPath: string,
  file: File,
  callbacks: SupabaseUploadCallbacks
): () => void {
  const xhr = new XMLHttpRequest();
  const cleanFullPath = fullPath.replace(/^\/+/, '');
  const encodedPath = cleanFullPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const endpoint = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${encodedPath}`;

  xhr.open('POST', endpoint, true);
  xhr.setRequestHeader('apikey', SUPABASE_PUBLISHABLE_KEY);
  xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_PUBLISHABLE_KEY}`);
  xhr.setRequestHeader('x-upsert', 'true');
  xhr.setRequestHeader('cache-control', '3600');
  xhr.setRequestHeader(
    'Content-Type',
    file.type || 'application/vnd.android.package-archive'
  );

  xhr.upload.onprogress = (event: ProgressEvent) => {
    if (event.lengthComputable && event.total > 0) {
      const percent = Math.round((event.loaded / event.total) * 100);
      callbacks.onProgress(percent, event.loaded, event.total);
    }
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const publicUrl = supabase.storage
        .from('files-ip')
        .getPublicUrl(cleanFullPath).data.publicUrl;
      callbacks.onProgress(100, file.size, file.size);
      callbacks.onSuccess(publicUrl);
    } else {
      let serverMsg = xhr.statusText || `HTTP ${xhr.status}`;
      try {
        const parsed = JSON.parse(xhr.responseText);
        serverMsg = parsed.message || parsed.error || serverMsg;
      } catch {
        // ignore JSON parse error
      }
      callbacks.onError(
        `تعذر رفع الملف إلى Supabase Storage في المجلد (${SUPABASE_BUCKET}): ${serverMsg}. تأكد من إنشاء Bucket باسم "${SUPABASE_BUCKET}" وتفعيله كـ Public مع إضافة Policy تسمح بالرفع (INSERT / SELECT / UPDATE).`
      );
    }
  };

  xhr.onerror = () => {
    callbacks.onError(
      `حدث خطأ في الاتصال أثناء رفع الملف إلى Supabase Storage (${SUPABASE_BUCKET}). يرجى التحقق من اتصال الإنترنت وإعدادات الـ Bucket.`
    );
  };

  xhr.send(file);

  return () => {
    xhr.abort();
  };
}
