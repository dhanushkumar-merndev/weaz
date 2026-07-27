import crypto from "crypto";

export const PAYMENT_CURRENCY = "INR";

const HEX_SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const RAZORPAY_ORDER_ID_PATTERN = /^order_[A-Za-z0-9]+$/;
const RAZORPAY_PAYMENT_ID_PATTERN = /^pay_[A-Za-z0-9]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function verifyHmacSha256(
  content: string,
  suppliedSignature: string,
  secret: string
) {
  if (!HEX_SHA256_PATTERN.test(suppliedSignature)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(content)
    .digest();
  const suppliedBuffer = Buffer.from(suppliedSignature, "hex");

  return (
    suppliedBuffer.length === expectedSignature.length &&
    crypto.timingSafeEqual(suppliedBuffer, expectedSignature)
  );
}

export function asPositiveInteger(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function isEnrollmentId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isRazorpayOrderId(value: unknown): value is string {
  return (
    typeof value === "string" && RAZORPAY_ORDER_ID_PATTERN.test(value)
  );
}

export function isRazorpayPaymentId(value: unknown): value is string {
  return (
    typeof value === "string" && RAZORPAY_PAYMENT_ID_PATTERN.test(value)
  );
}

export function isSha256Signature(value: unknown): value is string {
  return typeof value === "string" && HEX_SHA256_PATTERN.test(value);
}

export function isTrustedBrowserRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return false;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
