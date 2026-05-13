import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// الإعدادات مطابقة تماماً لملف الـ .env الخاص بك
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'tawassol/groups';

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 });
    }

    // تحويل الملف لـ Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // الرفع لـ Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // إرجاع الرابط
    return NextResponse.json({ url: result.secure_url });

  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "فشل الرفع: " + error.message }, { status: 500 });
  }
}