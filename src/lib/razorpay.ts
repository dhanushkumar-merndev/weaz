import Razorpay from "razorpay";

let _razorpay: Razorpay | null = null;

function requireRazorpayEnv(
  name: "RAZORPAY_KEY_ID" | "RAZORPAY_KEY_SECRET"
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getRazorpay() {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: requireRazorpayEnv("RAZORPAY_KEY_ID"),
      key_secret: requireRazorpayEnv("RAZORPAY_KEY_SECRET"),
    });
  }
  return _razorpay;
}

export function getRazorpayKeyId() {
  return requireRazorpayEnv("RAZORPAY_KEY_ID");
}

export function getRazorpayKeySecret() {
  return requireRazorpayEnv("RAZORPAY_KEY_SECRET");
}
