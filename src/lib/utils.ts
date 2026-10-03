import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Safely convert any value to a lower‑case string.
 * Returns an empty string for undefined/null/non‑string values.
 */
export const safeLower = (value: any): string => {
  return typeof value === "string" ? value.toLowerCase() : "";
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns YYYY-MM-DD in Pakistan Standard Time (PKT, UTC+5).
 * Ensures sales/inventory reporting is strictly aligned with the Pakistan business day.
 */
export const getPKDateString = (dateInput?: string | Date | number): string => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
};

