/**
 * Shared formatting utilities
 */

export function formatCurrency(
  amount: number | string | { toNumber: () => number },
  currency = "KES"
): string {
  const num =
    typeof amount === "object" && "toNumber" in amount
      ? amount.toNumber()
      : Number(amount);

  if (num === 0) return "Free";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} · ${formatTime(date)}`;
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) {
    return `${formatDate(s)}, ${formatTime(s)} – ${formatTime(e)}`;
  }
  return `${formatDate(s)} – ${formatDate(e)}`;
}

export function ticketsRemaining(capacity: number, booked: number): number {
  return Math.max(0, capacity - booked);
}

export function nightsBetween(checkIn: Date | string, checkOut: Date | string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}
