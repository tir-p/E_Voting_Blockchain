import { createHash } from "crypto";

export function normalizeNic(nic) {
  return String(nic || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function hashNic(nic) {
  const normalized = normalizeNic(nic);

  if (!normalized) {
    throw new Error("NIC number is required.");
  }

  return createHash("sha256").update(normalized).digest("hex");
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
