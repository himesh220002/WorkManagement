import { describe, it, expect } from "vitest";
import {
  calculateElasticStorage,
  calculateNextMonthlyBill,
  BASE_STORAGE_GB,
  ELASTIC_BUCKET_SIZE_GB,
  COST_PER_BUCKET_USD,
  BASE_PRICE_PER_USER_USD,
  ESTIMATED_RAW_S3_COST_PER_GB_USD,
} from "@/lib/elasticStorage";

describe("TaskPMS Elastic Cloud Storage & S3 Economics", () => {
  const ONE_GB_BYTES = 1024 * 1024 * 1024;

  describe("calculateElasticStorage", () => {
    it("handles zero or empty storage gracefully within complimentary 2 GB tier", () => {
      const res = calculateElasticStorage(0);
      expect(res.usedBytes).toBe(0);
      expect(res.usedGB).toBe(0);
      expect(res.baseQuotaGB).toBe(2);
      expect(res.totalQuotaGB).toBe(2);
      expect(res.extraBuckets).toBe(0);
      expect(res.storageAddonCostUSD).toBe(0);
      expect(res.isOverBaseQuota).toBe(false);
      expect(res.percentUsed).toBe(0);
    });

    it("handles usage within the 2 GB free limit without overage charges", () => {
      // 1.5 GB used
      const res = calculateElasticStorage(1.5 * ONE_GB_BYTES);
      expect(res.usedGB).toBe(1.5);
      expect(res.totalQuotaGB).toBe(2);
      expect(res.extraBuckets).toBe(0);
      expect(res.storageAddonCostUSD).toBe(0);
      expect(res.isOverBaseQuota).toBe(false);
      expect(res.percentUsed).toBe(75);
    });

    it("retains free tier at exact 2 GB boundary", () => {
      const res = calculateElasticStorage(2.0 * ONE_GB_BYTES);
      expect(res.usedGB).toBe(2.0);
      expect(res.totalQuotaGB).toBe(2);
      expect(res.extraBuckets).toBe(0);
      expect(res.storageAddonCostUSD).toBe(0);
      expect(res.isOverBaseQuota).toBe(false);
      expect(res.percentUsed).toBe(100);
    });

    it("automatically expands by +5 GB (total 7 GB) for +$3 USD when exceeding 2 GB", () => {
      // 2.1 GB used
      const res = calculateElasticStorage(2.1 * ONE_GB_BYTES);
      expect(res.usedGB).toBe(2.1);
      expect(res.totalQuotaGB).toBe(7); // 2 GB base + 5 GB elastic
      expect(res.extraBuckets).toBe(1);
      expect(res.storageAddonCostUSD).toBe(3);
      expect(res.isOverBaseQuota).toBe(true);
      expect(res.percentUsed).toBeCloseTo(30.0, 1);
    });

    it("maintains 7 GB quota at exact 7 GB boundary with single $3 addon", () => {
      const res = calculateElasticStorage(7.0 * ONE_GB_BYTES);
      expect(res.usedGB).toBe(7.0);
      expect(res.totalQuotaGB).toBe(7);
      expect(res.extraBuckets).toBe(1);
      expect(res.storageAddonCostUSD).toBe(3);
    });

    it("automatically expands by another +5 GB (total 12 GB) for another +$3 USD (total $6 USD) when exceeding 7 GB", () => {
      // 7.2 GB used
      const res = calculateElasticStorage(7.2 * ONE_GB_BYTES);
      expect(res.usedGB).toBe(7.2);
      expect(res.totalQuotaGB).toBe(12); // 2 GB base + 10 GB elastic
      expect(res.extraBuckets).toBe(2);
      expect(res.storageAddonCostUSD).toBe(6);
      expect(res.isOverBaseQuota).toBe(true);
    });

    it("scales elastically for higher tiers (e.g. 17.5 GB -> 4 blocks -> 22 GB, $12 USD)", () => {
      const res = calculateElasticStorage(17.5 * ONE_GB_BYTES);
      // Extra needed: 15.5 GB -> Math.ceil(15.5 / 5) = 4 blocks -> 22 GB
      expect(res.extraBuckets).toBe(4);
      expect(res.totalQuotaGB).toBe(22);
      expect(res.storageAddonCostUSD).toBe(12);
    });
  });

  describe("AWS S3 Cost Reality Validation", () => {
    it("confirms raw AWS S3 storage cost for 7 GB is less than $0.20/month", () => {
      const rawCost7GB = 7 * ESTIMATED_RAW_S3_COST_PER_GB_USD;
      expect(rawCost7GB).toBeCloseTo(0.161, 3);
      expect(rawCost7GB).toBeLessThan(0.20);
      // Operator charges $3.00 for the extra 5 GB, making gross profit margin over 95%
      const res = calculateElasticStorage(7.0 * ONE_GB_BYTES);
      expect(res.operatorGrossMarginPercent).toBeGreaterThan(95);
    });
  });

  describe("calculateNextMonthlyBill", () => {
    it("computes monthly invoice for 1 user within free 2 GB storage", () => {
      const bill = calculateNextMonthlyBill({
        userCount: 1,
        usedBytes: 1.0 * ONE_GB_BYTES,
      });
      expect(bill.userCount).toBe(1);
      expect(bill.pricePerUser).toBe(5);
      expect(bill.baseUsersCostUSD).toBe(5);
      expect(bill.storageAddonCostUSD).toBe(0);
      expect(bill.totalNextBillUSD).toBe(5);
    });

    it("computes monthly invoice for 5 users with 2.5 GB storage (+1 elastic bucket = +$3)", () => {
      const bill = calculateNextMonthlyBill({
        userCount: 5,
        usedBytes: 2.5 * ONE_GB_BYTES,
      });
      expect(bill.userCount).toBe(5);
      expect(bill.baseUsersCostUSD).toBe(25); // 5 * $5
      expect(bill.storageAddonCostUSD).toBe(3); // 2.5 GB exceeds 2 GB -> 1st 5GB bucket
      expect(bill.totalNextBillUSD).toBe(28); // $25 + $3
    });

    it("computes monthly invoice for 10 users with 8.0 GB storage (+2 elastic buckets = +$6)", () => {
      const bill = calculateNextMonthlyBill({
        userCount: 10,
        usedBytes: 8.0 * ONE_GB_BYTES,
      });
      expect(bill.userCount).toBe(10);
      expect(bill.baseUsersCostUSD).toBe(50); // 10 * $5
      expect(bill.storageAddonCostUSD).toBe(6); // 8 GB exceeds 7 GB -> 2 buckets
      expect(bill.totalNextBillUSD).toBe(56); // $50 + $6
    });
  });
});
