type MetaPixelEventParameters = Record<
  string,
  string | number | string[] | undefined
>;

type MetaPixel = (
  command: "track",
  eventName: string,
  parameters?: MetaPixelEventParameters,
  options?: { eventID?: string }
) => void;

declare global {
  interface Window {
    fbq?: MetaPixel;
  }
}

interface MetaPurchase {
  amountPaise: number;
  currency: string;
  contentId: string;
  contentName: string;
  eventId: string;
}

interface MetaWebinarView {
  amountPaise: number;
  currency?: string;
  contentId: string;
  contentName: string;
}

type MetaWebinarCheckout = MetaWebinarView;

export function trackMetaWebinarView({
  amountPaise,
  currency = "INR",
  contentId,
  contentName,
}: MetaWebinarView) {
  if (typeof window === "undefined" || !window.fbq) return;

  window.fbq("track", "ViewContent", {
    value: amountPaise / 100,
    currency: currency.toUpperCase(),
    content_ids: [contentId],
    content_name: contentName,
    content_type: "product",
    content_category: "webinar",
  });
}

export function trackMetaWebinarCheckout({
  amountPaise,
  currency = "INR",
  contentId,
  contentName,
}: MetaWebinarCheckout) {
  if (typeof window === "undefined" || !window.fbq) return;

  window.fbq("track", "InitiateCheckout", {
    value: amountPaise / 100,
    currency: currency.toUpperCase(),
    content_ids: [contentId],
    content_name: contentName,
    content_type: "product",
    content_category: "webinar",
    num_items: 1,
  });
}

export function trackMetaPurchase({
  amountPaise,
  currency,
  contentId,
  contentName,
  eventId,
}: MetaPurchase) {
  if (typeof window === "undefined" || !window.fbq) return;

  const storageKey = `weaz-meta-purchase:${eventId}`;
  try {
    if (window.sessionStorage.getItem(storageKey)) return;
  } catch {
    // Tracking should still work if storage is unavailable.
  }

  window.fbq(
    "track",
    "Purchase",
    {
      value: amountPaise / 100,
      currency: currency.toUpperCase(),
      content_ids: [contentId],
      content_name: contentName,
      content_type: "product",
      content_category: "webinar",
    },
    { eventID: eventId }
  );

  try {
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // The event was sent even if storage is unavailable.
  }
}
