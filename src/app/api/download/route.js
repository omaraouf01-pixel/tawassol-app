// src/app/api/download/route.js
// Proxy آمن لتسليم ملفات Cloudinary عبر نفس الـ origin.
// يحلّ خطأ "Unsafe attempt to load URL ... from frame with URL chrome-error://chromewebdata/"
// الناتج عن رفض Cloudinary لتسليم PDF/ZIP مباشرة (401) عند تعطيل
// إعداد "Allow delivery of PDF and ZIP files" في لوحة التحكم.

import { NextResponse } from 'next/server';

const ALLOWED_HOST = 'res.cloudinary.com';

function inferContentType(url, fallback) {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.zip')) return 'application/zip';
  return fallback || 'application/octet-stream';
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');
  const fileName = searchParams.get('name') || 'document';
  // disposition=inline => عرض داخل المتصفح (مفيد لعارض PDF)
  // disposition=attachment (الافتراضي) => تحميل
  const disposition = searchParams.get('disposition') === 'inline' ? 'inline' : 'attachment';

  if (!fileUrl) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  let target;
  try {
    target = new URL(fileUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // قيد أمني: لا نسمح بـ proxy لأي host آخر غير Cloudinary لتفادي
  // استخدام الـ endpoint كـ open-proxy عام.
  if (target.hostname !== ALLOWED_HOST) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  try {
    // تمرير Range header لدعم streaming لملفات PDF الكبيرة
    const range = request.headers.get('range');
    const upstream = await fetch(target.toString(), {
      headers: range ? { Range: range } : {},
      cache: 'no-store',
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Cloudinary responded with ${upstream.status}` },
        { status: upstream.status === 401 ? 502 : upstream.status }
      );
    }

    const contentType = inferContentType(target.pathname, upstream.headers.get('Content-Type'));
    const safeName = fileName.replace(/[\r\n"]/g, '_');

    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `${disposition}; filename="${encodeURIComponent(safeName)}"`,
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    });

    const passThrough = ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
    for (const h of passThrough) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
