import { createHash } from "node:crypto";

export function normalizeNic(nic) {
  return String(nic || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function hashNic(nic) {
  const normalizedNic = normalizeNic(nic);

  if (!normalizedNic) {
    throw new Error("NIC number is required.");
  }

  return createHash("sha256").update(normalizedNic).digest("hex");
}

export function normalizeWalletAddress(address) {
  return String(address || "").trim().toLowerCase();
}

export function maskValue(value, visibleStart = 6, visibleEnd = 4) {
  if (!value) {
    return "";
  }

  if (value.length <= visibleStart + visibleEnd) {
    return value;
  }

  return `${value.slice(0, visibleStart)}...${value.slice(-visibleEnd)}`;
}

// Keep the older name for any legacy imports that still use it.
export const hashNIC = hashNic;
