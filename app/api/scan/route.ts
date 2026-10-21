import { NextResponse } from "next/server";

import { analyzeUpload, maxUploadBytes } from "../../../src/core/upload/analyze-upload.ts";

const rejectionStatus: Record<string, number> = {
  unsupported: 415,
  empty: 400,
  oversized: 413,
  binary: 400,
  "invalid-utf8": 400
};

const rejectionMessage: Record<string, string> = {
  unsupported: "Choose a CSV or TXT file.",
  empty: "The selected file is empty.",
  oversized: "The file exceeds the 1 MiB limit.",
  binary: "Binary files are not supported.",
  "invalid-utf8": "The file must use valid UTF-8 text."
};

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "A file upload is required." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file upload is required." }, { status: 400 });
  }

  if (file.size > maxUploadBytes) {
    return NextResponse.json({ error: rejectionMessage.oversized }, { status: 413 });
  }

  const analysis = analyzeUpload(file.name, new Uint8Array(await file.arrayBuffer()));
  if (!analysis.ok) {
    return NextResponse.json(
      { error: rejectionMessage[analysis.reason] },
      { status: rejectionStatus[analysis.reason] }
    );
  }

  return NextResponse.json({ fileName: file.name, ...analysis.result });
}