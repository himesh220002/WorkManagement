/**
 * TaskPMS Elastic Cloud Storage & S3 Economic Evaluation Engine
 *
 * Pricing Model:
 * - Base Workspace Subscription: $5 USD / month / user
 * - Base Included Storage: 2 GB Free included in every organization workspace
 * - Elastic Auto-Expansion:
 *     - If storage exceeds 2 GB -> auto-allocates +5 GB (total 7 GB) for +$3 USD on the next month's bill
 *     - If storage exceeds 7 GB -> auto-allocates +5 GB (total 12 GB) for another +$3 USD (total +$6 USD)
 *     - Every incremental 5 GB tier costs +$3 USD elastically
 *
 * AWS S3 Cost Realities:
 * - AWS S3 Standard Storage: ~$0.023 per GB / month
 * - 2 GB raw S3 storage cost: ~$0.046 / month
 * - 7 GB raw S3 storage cost: ~$0.161 / month
 * - 12 GB raw S3 storage cost: ~$0.276 / month
 * - 5 GB additional S3 storage cost: ~$0.115 / month
 * - Elastic overage charge: $3.00 USD per 5 GB block -> ~96.2% gross profit margin.
 *   This massive margin covers operational costs: presigned URL generation, S3 PUT/GET API requests,
 *   data transfer out bandwidth, KMS key operations, MongoDB metadata, and server compute.
 */

export const BASE_STORAGE_GB = 2;
export const ELASTIC_BUCKET_SIZE_GB = 5;
export const COST_PER_BUCKET_USD = 3;
export const BASE_PRICE_PER_USER_USD = 5;
export const ESTIMATED_RAW_S3_COST_PER_GB_USD = 0.023;

export interface StorageMetrics {
  usedBytes: number;
  usedMB: number;
  usedGB: number;
  baseQuotaGB: number;           // 2 GB
  elasticBucketSizeGB: number;   // 5 GB
  costPerBucketUSD: number;      // $3 USD
  extraBuckets: number;          // 0, 1, 2, ...
  totalQuotaGB: number;          // 2, 7, 12, 17, ...
  storageAddonCostUSD: number;   // $0, $3, $6, $9, ...
  percentUsed: number;
  nextTierThresholdGB: number;
  isOverBaseQuota: boolean;
  estimatedRawS3CostUSD: number; // What AWS actually charges for this footprint
  operatorGrossMarginUSD: number;// Storage profit margin for TaskPMS
  operatorGrossMarginPercent: number;
}

/**
 * Calculates the elastic storage quota, tier, and incremental $3/month overage fees
 */
export function calculateElasticStorage(usedBytes: number = 0): StorageMetrics {
  const safeBytes = Math.max(0, Number(usedBytes) || 0);
  const usedMB = safeBytes / (1024 * 1024);
  const usedGB = safeBytes / (1024 * 1024 * 1024);

  const rawS3Cost = Number((usedGB * ESTIMATED_RAW_S3_COST_PER_GB_USD).toFixed(4));

  if (usedGB <= BASE_STORAGE_GB) {
    return {
      usedBytes: safeBytes,
      usedMB: Number(usedMB.toFixed(2)),
      usedGB: Number(usedGB.toFixed(3)),
      baseQuotaGB: BASE_STORAGE_GB,
      elasticBucketSizeGB: ELASTIC_BUCKET_SIZE_GB,
      costPerBucketUSD: COST_PER_BUCKET_USD,
      extraBuckets: 0,
      totalQuotaGB: BASE_STORAGE_GB,
      storageAddonCostUSD: 0,
      percentUsed: Math.min(100, Number(((usedGB / BASE_STORAGE_GB) * 100).toFixed(1))),
      nextTierThresholdGB: BASE_STORAGE_GB,
      isOverBaseQuota: false,
      estimatedRawS3CostUSD: rawS3Cost,
      operatorGrossMarginUSD: 0,
      operatorGrossMarginPercent: 100,
    };
  }

  const extraNeededGB = usedGB - BASE_STORAGE_GB;
  const extraBuckets = Math.ceil(extraNeededGB / ELASTIC_BUCKET_SIZE_GB);
  const totalQuotaGB = BASE_STORAGE_GB + (extraBuckets * ELASTIC_BUCKET_SIZE_GB);
  const storageAddonCostUSD = extraBuckets * COST_PER_BUCKET_USD;

  const rawExtraS3Cost = extraBuckets * ELASTIC_BUCKET_SIZE_GB * ESTIMATED_RAW_S3_COST_PER_GB_USD;
  const operatorGrossMarginUSD = Number((storageAddonCostUSD - rawExtraS3Cost).toFixed(2));
  const operatorGrossMarginPercent = Number((((storageAddonCostUSD - rawExtraS3Cost) / storageAddonCostUSD) * 100).toFixed(1));

  return {
    usedBytes: safeBytes,
    usedMB: Number(usedMB.toFixed(2)),
    usedGB: Number(usedGB.toFixed(3)),
    baseQuotaGB: BASE_STORAGE_GB,
    elasticBucketSizeGB: ELASTIC_BUCKET_SIZE_GB,
    costPerBucketUSD: COST_PER_BUCKET_USD,
    extraBuckets,
    totalQuotaGB,
    storageAddonCostUSD,
    percentUsed: Math.min(100, Number(((usedGB / totalQuotaGB) * 100).toFixed(1))),
    nextTierThresholdGB: totalQuotaGB,
    isOverBaseQuota: true,
    estimatedRawS3CostUSD: rawS3Cost,
    operatorGrossMarginUSD,
    operatorGrossMarginPercent,
  };
}

/**
 * Calculates next monthly billing invoice:
 * Total Bill = (userCount * pricePerUser) + storageAddonCostUSD
 */
export function calculateNextMonthlyBill(params: {
  userCount: number;
  usedBytes?: number;
  planBillingCycle?: "month" | "quarter" | "year";
  customPricePerUser?: number;
}): {
  userCount: number;
  pricePerUser: number;
  baseUsersCostUSD: number;
  storageMetrics: StorageMetrics;
  storageAddonCostUSD: number;
  totalNextBillUSD: number;
} {
  const userCount = Math.max(1, Number(params.userCount) || 1);
  const pricePerUser = params.customPricePerUser ?? BASE_PRICE_PER_USER_USD;
  const baseUsersCostUSD = userCount * pricePerUser;

  const storageMetrics = calculateElasticStorage(params.usedBytes || 0);
  const storageAddonCostUSD = storageMetrics.storageAddonCostUSD;
  const totalNextBillUSD = baseUsersCostUSD + storageAddonCostUSD;

  return {
    userCount,
    pricePerUser,
    baseUsersCostUSD,
    storageMetrics,
    storageAddonCostUSD,
    totalNextBillUSD,
  };
}
