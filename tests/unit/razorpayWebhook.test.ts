import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  PRICING_PLANS,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay";

describe("Razorpay Webhook & Payment Methods Architecture", () => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "cyphertechrazorsecret";

  it("verifies authentic Razorpay webhook signatures accurately", () => {
    const rawPayload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_test_capture_999",
            order_id: "order_test_999",
            amount: 42500,
            currency: "INR",
            status: "captured",
            method: "upi",
            vpa: "user@okaxis",
            notes: {
              companyCode: "CYPHER",
              plan: "monthly",
              userCount: "1",
            },
          },
        },
      },
    });

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawPayload)
      .digest("hex");

    const isValid = verifyRazorpayWebhookSignature(rawPayload, expectedSignature, webhookSecret);
    expect(isValid).toBe(true);
  });

  it("rejects tampered or fraudulent webhook payloads and invalid signatures", () => {
    const rawPayload = JSON.stringify({ event: "payment.captured", id: "123" });
    const forgedSignature = "0000000000000000000000000000000000000000000000000000000000000000";

    const isValid = verifyRazorpayWebhookSignature(rawPayload, forgedSignature, webhookSecret);
    expect(isValid).toBe(false);

    // Tampered payload with original signature
    const validSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawPayload)
      .digest("hex");

    const tamperedPayload = JSON.stringify({ event: "payment.captured", id: "123_hacked" });
    const isTamperedValid = verifyRazorpayWebhookSignature(tamperedPayload, validSig, webhookSecret);
    expect(isTamperedValid).toBe(false);
  });

  it("supports dual currency architecture with full payment methods in INR", () => {
    // INR plans allow UPI (GPay/PhonePe), NetBanking, Wallets, EMI, and Cards
    expect(PRICING_PLANS.monthly.inrPerUser).toBe(425);
    expect(PRICING_PLANS.quarterly.inrPerUser).toBe(1190);
    expect(PRICING_PLANS.annual.inrPerUser).toBe(4250);

    // USD plans allow international card processing
    expect(PRICING_PLANS.monthly.usdPerUser).toBe(5);
    expect(PRICING_PLANS.quarterly.usdPerUser).toBe(14);
    expect(PRICING_PLANS.annual.usdPerUser).toBe(50);
  });
});
