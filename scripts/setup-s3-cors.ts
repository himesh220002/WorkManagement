import { S3Client, GetBucketCorsCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || "ap-south-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET_NAME || "taskflow-pm-storage-prod";

if (!accessKeyId || !secretAccessKey) {
  console.error("❌ AWS credentials not found in .env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)");
  process.exit(1);
}

const client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function configureCors() {
  console.log(`🔍 Checking CORS configuration for S3 bucket: "${bucketName}" (${region})...`);

  try {
    const existing = await client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
    console.log("Current CORS rules:", JSON.stringify(existing.CORSRules, null, 2));
  } catch (err: any) {
    console.log(`ℹ️ Current CORS status: ${err.name} - ${err.message}`);
  }

  const corsRules = [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "HEAD", "DELETE"],
      AllowedOrigins: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3000,
    },
  ];

  console.log(`🚀 Applying updated CORS configuration allowing all origins, methods, and headers...`);
  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: corsRules,
        },
      })
    );
    console.log("✅ Successfully configured CORS on bucket:", bucketName);
    console.log("CORS Configuration applied:");
    console.log(JSON.stringify(corsRules, null, 2));
  } catch (err: any) {
    console.error("❌ Failed to set bucket CORS:", err.name, err.message);
    process.exit(1);
  }
}

configureCors();
