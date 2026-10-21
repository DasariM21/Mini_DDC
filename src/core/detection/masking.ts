export function maskEmail(value: string): string {
  const [localPart, domain] = value.split("@");
  if (!localPart || !domain) {
    return "***";
  }

  const first = localPart[0] ?? "*";
  return `${first}***@${domain.toLowerCase()}`;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 5) {
    return "*".repeat(digits.length);
  }

  const first = digits.slice(0, 2);
  const last = digits.slice(-3);
  return `${first}${"*".repeat(Math.max(digits.length - 5, 0))}${last}`;
}

export function maskNino(value: string): string {
  const compact = value.replace(/\s/g, "").toUpperCase();
  const prefix = compact.slice(0, 2);
  const suffix = compact.length === 9 ? compact.slice(-1) : "";
  return `${prefix}******${suffix}`;
}

export function maskCard(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) {
    return "*".repeat(digits.length);
  }

  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}
