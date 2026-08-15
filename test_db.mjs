import mongoose from "mongoose";
import fs from "fs";
const envFile = fs.readFileSync('.env', 'utf-8');
const env = envFile.split('\n').reduce((acc, line) => {
  const parts = line.split('=');
  if(parts.length > 1) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
    acc[k] = v;
  }
  return acc;
}, {});
mongoose.connect(env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const pipelines = await db.collection('pipelines').find().toArray();
  console.log("RAW DB TODOS:");
  pipelines.forEach(p => {
    console.log(JSON.stringify(p.todos, null, 2));
  });
  process.exit(0);
});
