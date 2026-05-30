import mongoose from 'mongoose';

let connectionPromise;

export async function connectDb() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);
  connectionPromise ||= mongoose.connect(uri);
  await connectionPromise;
  return mongoose.connection;
}
