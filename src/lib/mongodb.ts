import mongoose from "mongoose";
import { ensureSuperAdmin } from "@/lib/ensure-super-admin";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (process.env.NODE_ENV !== "production") {
  global.mongooseCache = cache;
}

let superAdminEnsured = false;

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI tanımlı değil");
  }
  if (cache.conn) {
    if (!superAdminEnsured) {
      superAdminEnsured = true;
      await ensureSuperAdmin().catch(() => {});
    }
    return cache.conn;
  }
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  cache.conn = await cache.promise;
  if (!superAdminEnsured) {
    superAdminEnsured = true;
    await ensureSuperAdmin().catch(() => {});
  }
  return cache.conn;
}
