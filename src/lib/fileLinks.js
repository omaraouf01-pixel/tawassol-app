// src/lib/fileLinks.js
// Helpers موحّدة لبناء روابط الملفات المخزّنة على Cloudinary
// عبر proxy داخلي يتجاوز حظر تسليم PDF/ZIP الافتراضي في Cloudinary.

const PDF_LIKE_EXT = ['pdf'];
const VIEWABLE_EXT = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'txt'];

function getExt(url, name) {
  const source = (name || url || '').toLowerCase();
  const match = source.match(/\.([a-z0-9]+)(?:\?|$)/);
  return match ? match[1] : '';
}

/**
 * رابط فتح/معاينة الملف داخل المتصفح (PDF inline).
 * يمرّ عبر /api/download مع disposition=inline.
 */
export function buildViewUrl(fileUrl, fileName) {
  if (!fileUrl) return '';
  if (!fileUrl.includes('res.cloudinary.com')) return fileUrl;
  const params = new URLSearchParams({
    url: fileUrl,
    name: fileName || 'document',
    disposition: 'inline',
  });
  return `/api/download?${params.toString()}`;
}

/**
 * رابط تنزيل الملف (Content-Disposition: attachment).
 */
export function buildDownloadUrl(fileUrl, fileName) {
  if (!fileUrl) return '';
  if (!fileUrl.includes('res.cloudinary.com')) return fileUrl;
  const params = new URLSearchParams({
    url: fileUrl,
    name: fileName || 'document',
    disposition: 'attachment',
  });
  return `/api/download?${params.toString()}`;
}

/**
 * هل هذا النوع يمكن عرضه inline في المتصفح؟
 */
export function isViewableInBrowser(fileUrl, fileName) {
  const ext = getExt(fileUrl, fileName);
  return VIEWABLE_EXT.includes(ext);
}

export function isPdf(fileUrl, fileName) {
  return PDF_LIKE_EXT.includes(getExt(fileUrl, fileName));
}
