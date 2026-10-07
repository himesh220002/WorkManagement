import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required to connect to the database"),
  CRON_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  MASTER_DEV_KEY: z.string().optional(),
});

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,
  CRON_SECRET: process.env.CRON_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  MASTER_DEV_KEY: process.env.MASTER_DEV_KEY,
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  // In server runtime, throw immediately if critical vars are missing
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Invalid environment variables");
  }
}

export const env = parsed.success ? parsed.data : (processEnv as unknown as z.infer<typeof envSchema>);
