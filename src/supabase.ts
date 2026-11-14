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
