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

