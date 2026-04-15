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
