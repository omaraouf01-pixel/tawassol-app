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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ملفات PDF/المستندات تُرفع كـ raw لتجاوز قيود Cloudinary الأمنية
    // على resource_type=image (الذي يُصنَّف فيه PDF افتراضياً عند auto)
    const isImage = file.type?.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType,
    });

  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "فشل الرفع: " + error.message }, { status: 500 });
  }
}