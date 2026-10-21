import { classifyContent } from "../detection/classifier.ts";
import type { ClassificationResult } from "../detection/types.ts";

export const maxUploadBytes = 1_048_576;

export type UploadAnalysis =
  | { ok: true; result: ClassificationResult }
  | { ok: false; reason: "unsupported" | "empty" | "oversized" | "binary" | "invalid-utf8" };

export function analyzeUpload(fileName: string, bytes: Uint8Array): UploadAnalysis {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  if (extension !== ".csv" && extension !== ".txt") {
    return { ok: false, reason: "unsupported" };
  }

  if (bytes.byteLength === 0) {
    return { ok: false, reason: "empty" };
  }

  if (bytes.byteLength > maxUploadBytes) {
    return { ok: false, reason: "oversized" };
  }

  if (bytes.includes(0)) {
    return { ok: false, reason: "binary" };
  }

  let content: string;
  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, reason: "invalid-utf8" };
  }

  return { ok: true, result: classifyContent(content) };
}