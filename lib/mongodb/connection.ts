import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Helper: is MongoDB enabled?
export function isMongoEnabled() {
  return !!MONGODB_URI;
}

// TypeScript: add global type for mongoose cache
declare global {
  var mongoose: MongooseCache | undefined;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let connectDB: (() => Promise<typeof mongoose | void>);

if (!MONGODB_URI) {
  // MongoDB is disabled, provide a no-op connectDB
  connectDB = async () => {
    // Optionally log a warning
    // console.warn('MongoDB is disabled: MONGODB_URI not set');
    return;
  };
} else {
  const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

  if (!global.mongoose) {
    global.mongoose = cached;
  }

  connectDB = async () => {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };
      cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
        return mongoose;
      });
    }

    try {
      cached.conn = await cached.promise;
    } catch (e) {
      cached.promise = null;
      throw e;
    }

    return cached.conn;
  };
}

export default connectDB;
