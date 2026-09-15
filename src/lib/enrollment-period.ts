/** "6 Months" -> 6. Durations without a month count (e.g. "Flexible") never expire. */
export function parseDurationMonths(duration: string): number | null {
  const match = duration.match(/(\d+)\s*Months?/i);
  if (match) return parseInt(match[1], 10);
  return null;
}

export function enrollmentExpiry(paidAt: string, durationMonths: number): Date {
  const expiry = new Date(paidAt);
  expiry.setMonth(expiry.getMonth() + durationMonths);
  return expiry;
}

export function isExpired(paidAt: string, durationMonths: number): boolean {
  return new Date() > enrollmentExpiry(paidAt, durationMonths);
}
