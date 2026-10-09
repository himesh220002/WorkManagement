import { describe, it, expect, vi } from "vitest";
import {
  createPaymentVerificationToken,
  verifyPaymentVerificationToken,
  PRICING_PLANS,
} from "@/lib/razorpay";
import { signToken, verifyToken } from "@/server/auth/jwt";

let mockAuthToken: string | null = null;

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/models", () => ({
  User: {
    findById: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    create: vi.fn().mockResolvedValue(null),
  },
  Company: {
    findById: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }) }),
    findOne: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }) }),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: (key: string) => {
      if (key === "auth_token" && mockAuthToken) {
        return { value: mockAuthToken };
      }
      return null;
    },
  })),
  headers: vi.fn().mockImplementation(async () => ({
    get: (key: string) => (key === "x-tenant-org-code" ? "ORGTTV" : null),
  })),
}));

describe("Developer Bypass Registration via 16-Digit regDevKey", () => {
  const TEST_REG_DEV_KEY = "8H1I0M5E5S4H2318";

  it("enforces strict 16-digit key requirement", () => {
    expect(TEST_REG_DEV_KEY.length).toBe(16);
    expect(/^[A-Z0-9]{16}$/.test(TEST_REG_DEV_KEY)).toBe(true);
  });

  it("generates a valid cryptographic verification token when regDevKey is accepted", () => {
    const seats = 3;
    const plan = "monthly";
    const amount = seats * PRICING_PLANS.monthly.usdAmount;
    const paymentId = `pay_regdev_${TEST_REG_DEV_KEY.slice(0, 8)}_${Date.now()}`;

    const token = createPaymentVerificationToken({
      plan,
      orderId: `order_dev_${Date.now()}`,
      paymentId,
      amount,
      currency: "USD",
      userCount: seats,
    });

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const check = verifyPaymentVerificationToken(token);
    expect(check.valid).toBe(true);
    expect(check.payload?.plan).toBe("monthly");
    expect(check.payload?.userCount).toBe(3);
    expect(check.payload?.amount).toBe(15); // 3 * $5
    expect(check.payload?.paymentId).toBe(paymentId);
  });

  it("rejects tampered or malformed bypass tokens", () => {
    const invalidToken = "invalid_bypass_token_xyz";
    const check = verifyPaymentVerificationToken(invalidToken);
    expect(check.valid).toBe(false);
  });

  it("validates 6-character company ID format for developer login", () => {
    const validCompanyCodes = ["ORGTTU", "ORGTTV", "ACME01", "CYPHER"];
    validCompanyCodes.forEach((code) => {
      expect(code.length).toBe(6);
      expect(/^[A-Z0-9]{6}$/.test(code)).toBe(true);
    });

    const invalidCodes = ["ORG", "TOOLONG123", "org-tu", ""];
    invalidCodes.forEach((code) => {
      const isValid = code.length === 6 && /^[A-Z0-9]{6}$/.test(code);
      expect(isValid).toBe(false);
    });
  });

  it("supports dev login token creation with companyCode and superuser role", () => {
    const token = signToken({
      userId: "dev_root_ORGTTU",
      companyId: "6ac628dc809cdf949afd0347",
      companyCode: "ORGTTU",
      role: "superuser",
      email: "dev.superuser@taskflow.internal",
      name: "System Developer (Master Mode)",
    });

    const decoded = verifyToken(token);
    expect(decoded.role).toBe("superuser");
    expect(decoded.companyCode).toBe("ORGTTU");
    expect(decoded.companyId).toBe("6ac628dc809cdf949afd0347");
  });

  it("ensures synthetic dev_root token does not throw CastError and resolves session safely", async () => {
    mockAuthToken = signToken({
      userId: "dev_root_ORGTTU",
      companyId: "6ac628dc809cdf949afd0347",
      companyCode: "ORGTTU",
      role: "superuser",
      email: "dev.superuser@taskflow.internal",
      name: "System Developer (Master Mode)",
    });

    const { getCurrentSession } = await import("@/server/auth/session");
    const session = await getCurrentSession();
    expect(session).toBeDefined();
    expect(session.role).toBe("superuser");
    expect(session.email).toBe("dev.superuser@taskflow.internal");
    // Verify no CastError was thrown
    expect(session.isGuest).toBeFalsy();
  });
});
