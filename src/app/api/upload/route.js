import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const rateMap = new Map(); // ip -> [timestamps]
const RATE_LIMIT = 10; // 10 uploads
const RATE_WINDOW = 60 * 1000; // per minute

function checkRate(ip) {
  const now = Date.now();
  const arr = (rateMap.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
  if (arr.length >= RATE_LIMIT) return false;
  arr.push(now);
  rateMap.set(ip, arr);
  return true;
}

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRate(ip)) {
      return NextResponse.json({ error: "Trop de requêtes, réessayez plus tard." }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "tawassol";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 MB)" }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("[UPLOAD ERROR]", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
