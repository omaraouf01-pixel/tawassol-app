import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined in .env.local. " +
    "Add your MongoDB Atlas connection string to .env.local."
  );
}

/**
 * Global cache so we reuse the same connection across hot-reloads
 * in Next.js dev mode (avoids opening a new connection on every request).
 */
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => {
        console.log("[MongoDB] Connected successfully");
        return m;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
