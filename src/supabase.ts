import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://yjgisbdaqfvqywfjkafq.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_rI5TeHtJwWYWdWoEBJlVYg_UbUkXFNi';

export const SUPABASE_BUCKET = 'files-ip';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export interface SupabaseUploadCallbacks {
  onProgress: (percent: number, transferredBytes: number, totalBytes: number) => void;
  onSuccess: (publicUrl: string) => void;
  onError: (errorMessage: string) => void;
}

/**
 * Ensures any Supabase Storage public URL includes the `?download=` query parameter
 * so mobile and desktop browsers immediately download the APK/EXE file with the
 * proper Content-Disposition header.
 */
export function buildDirectDownloadUrl(rawUrl: string | undefined, fileName: string): string {
  const cleanName = (fileName || 'CubeTV.apk').trim();
  const trimmedUrl = (rawUrl || '').trim();

  if (trimmedUrl) {
    if (
      trimmedUrl.includes('/storage/v1/object/public/') &&
      !trimmedUrl.includes('download=')
    ) {
      const separator = trimmedUrl.includes('?') ? '&' : '?';
      return `${trimmedUrl}${separator}download=${encodeURIComponent(cleanName)}`;
    }
    return trimmedUrl;
  }

  // Fallback direct public URL in the `files-ip` bucket if a file was uploaded directly to the bucket root
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(cleanName);
  return `${data.publicUrl}?download=${encodeURIComponent(cleanName)}`;
}

/**
 * Uploads a file (APK, EXE, etc.) directly to Supabase Storage bucket `files-ip`
 * with real-time byte progress (%) via XMLHttpRequest and returns an abort function.
 */
export function uploadFileToSupabaseStorage(
  objectPath: string,
  file: File,
  callbacks: SupabaseUploadCallbacks
): () => void {
  const xhr = new XMLHttpRequest();
  const encodedPath = objectPath
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
      const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectPath);
      callbacks.onProgress(100, file.size, file.size);
      callbacks.onSuccess(data.publicUrl);
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
