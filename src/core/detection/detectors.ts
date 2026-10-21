import { isValidLuhn } from "./luhn.ts";
import type { Match } from "./types.ts";

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

const ukPhonePattern =
  /(?<!\d)(?:\+44\s?(?:\d\s?){9,10}|0(?:\d\s?){9,10})(?!\d)/g;

const ninoPattern = /\b([A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]?)\b/gi;

const cardPattern = /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g;

const invalidNinoPrefixes = new Set(["BG", "GB", "KN", "NK", "NT", "TN", "ZZ"]);
const detectorPriority: Record<Match["type"], number> = {
  email: 1,
  phone: 2,
  nino: 3,
  card: 4
};

function pushNonOverlapping(matches: Match[], candidate: Match): void {
  const overlaps = matches.some(
    (existing) => candidate.start < existing.end && existing.start < candidate.end
  );

  if (!overlaps) {
    matches.push(candidate);
  }
}

function isPlausibleEmail(email: string): boolean {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) {
    return false;
  }

  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return false;
  }

  if (email.includes("..")) {
    return false;
  }

  const labels = domain.split(".");
  if (labels.some((label) => label.length === 0 || label.startsWith("-") || label.endsWith("-"))) {
    return false;
  }

  return true;
}

function isValidNino(ninoRaw: string): boolean {
  const compact = ninoRaw.replace(/\s/g, "").toUpperCase();
  if (!/^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]?$/.test(compact)) {
    return false;
  }

  const prefix = compact.slice(0, 2);
  if (invalidNinoPrefixes.has(prefix)) {
    return false;
  }

  const [first, second] = prefix.split("");
  const invalidLetters = new Set(["D", "F", "I", "Q", "U", "V"]);
  if (!first || !second || invalidLetters.has(first) || invalidLetters.has(second)) {
    return false;
  }

  if (second === "O") {
    return false;
  }

  return true;
}

function collectMatches(content: string, pattern: RegExp, type: Match["type"], validator?: (raw: string) => boolean): Match[] {
  const results: Match[] = [];
  pattern.lastIndex = 0;

  for (const hit of content.matchAll(pattern)) {
    const raw = hit[0];
    const start = hit.index;

    if (start === undefined) {
      continue;
    }

    if (validator && !validator(raw)) {
      continue;
    }

    pushNonOverlapping(results, {
      type,
      raw,
      start,
      end: start + raw.length
    });
  }

  return results;
}

export function detectEmails(content: string): Match[] {
  return collectMatches(content, emailPattern, "email", isPlausibleEmail);
}

export function detectUkPhones(content: string): Match[] {
  return collectMatches(content, ukPhonePattern, "phone");
}

export function detectNinos(content: string): Match[] {
  return collectMatches(content, ninoPattern, "nino", isValidNino);
}

export function detectCards(content: string): Match[] {
  return collectMatches(content, cardPattern, "card", (raw) => {
    const digitsOnly = raw.replace(/\D/g, "");
    return isValidLuhn(digitsOnly);
  });
}

export function detectAll(content: string): Match[] {
  const candidates = [
    ...detectEmails(content),
    ...detectUkPhones(content),
    ...detectNinos(content),
    ...detectCards(content)
  ].sort((a, b) =>
    detectorPriority[b.type] - detectorPriority[a.type] ||
    a.start - b.start ||
    b.end - a.end
  );

  const matches: Match[] = [];

  for (const candidate of candidates) {
    const overlaps = matches.some(
      (match) => candidate.start < match.end && match.start < candidate.end
    );
    if (!overlaps) {
      matches.push(candidate);
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}
