import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DocumentCategory } from "@/models/types";

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET_NAME || "company-pm-bucket";
const kmsKeyId = process.env.AWS_KMS_KEY_ID;

/**
 * Returns true if AWS S3 credentials and bucket name are configured in environment
 */
export function isAwsConfigured(): boolean {
  return Boolean(accessKeyId && secretAccessKey && bucketName);
}

/**
 * S3 Client instance configured with IAM credentials
 */
export const s3Client = new S3Client({
  region,
  credentials:
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined,
});

/**
 * Generates an isolated, structured S3 object key matching enterprise workflow
 * Format:
 *  - EMPLOYEE: {companyId}/employees/{employeeId}/{timestamp}_{fileName}
 *  - PROJECT:  {companyId}/projects/{projectId}/{timestamp}_{fileName}
 *  - SALES:    {companyId}/sales/{clientIdOrPipelineId}/{timestamp}_{fileName}
 *  - SALARY_FINANCE: {companyId}/finance/{year}/{timestamp}_{fileName}
 */
export function buildS3Key(
  companyId: string,
  category: DocumentCategory,
  entityId: string | null | undefined,
  fileName: string
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const filePart = `${timestamp}_${safeName}`;
  const compIdStr = String(companyId);

  switch (category) {
    case "EMPLOYEE":
      return `${compIdStr}/employees/${entityId || "general"}/${filePart}`;
    case "PROJECT":
      return `${compIdStr}/projects/${entityId || "general"}/${filePart}`;
    case "SALES":
      return `${compIdStr}/sales/${entityId || "general"}/${filePart}`;
    case "SALARY_FINANCE": {
      const year = new Date().getFullYear().toString();
      return `${compIdStr}/finance/${year}/${filePart}`;
    }
  }
}

/**
 * Generates a short-lived presigned upload URL for direct browser-to-S3 upload
 */
export async function generatePresignedUploadUrl(
  s3Key: string,
  mimeType: string,
  expiresInSeconds = 300
): Promise<{ uploadUrl: string; s3Key: string; isMock: boolean }> {
  if (!isAwsConfigured()) {
    // Graceful offline mock URL for development until user provides AWS credentials
    return {
      uploadUrl: `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}?mock_upload=true`,
      s3Key,
      isMock: true,
    };
  }

  const putParams: any = {
    Bucket: bucketName,
    Key: s3Key,
    ContentType: mimeType,
  };

  // If KMS encryption is requested
  if (kmsKeyId) {
    putParams.ServerSideEncryption = "aws:kms";
    putParams.SSEKMSKeyId = kmsKeyId;
  }

  const command = new PutObjectCommand(putParams);
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, s3Key, isMock: false };
}

/**
 * Generates a secure, 60-second read-only presigned download or preview URL
 */
export async function generatePresignedDownloadUrl(
  s3Key: string,
  originalName?: string,
  expiresInSeconds = 60
): Promise<{ viewUrl: string; isMock: boolean }> {
  if (!isAwsConfigured()) {
    return {
      viewUrl: `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}?mock_view=true`,
      isMock: true,
    };
  }

  const getParams: any = {
    Bucket: bucketName,
    Key: s3Key,
  };

  if (originalName) {
    getParams.ResponseContentDisposition = `inline; filename="${encodeURIComponent(originalName)}"`;
  }

  const command = new GetObjectCommand(getParams);
  const viewUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });

  return { viewUrl, isMock: false };
}

/**
 * Deletes an object from S3
 */
export async function deleteS3Object(s3Key: string): Promise<boolean> {
  if (!isAwsConfigured()) return true;

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });
    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error("Failed to delete S3 object:", err);
    return false;
  }
}
