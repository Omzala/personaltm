import { createApp } from '../server/src/app.js';
import { connectDb } from '../server/src/config/db.js';

const app = createApp();
let dbPromise;

export default async function handler(req, res) {
  dbPromise ||= connectDb();
  await dbPromise;
  return app(req, res);
}
