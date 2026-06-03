import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:4000";
const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params)?.path;
  if (!Array.isArray(path) || path.length === 0) {
    return new NextResponse("Invalid file path", { status: 400 });
  }

  const encodedPath = path.map(encodeURIComponent).join("/");
  const url = `${BACKEND}/files/${encodedPath}`;

  try {
    const res = await fetchWithTimeout(url, { cache: "no-store" });
    if (!res.ok) {
      return new NextResponse("File not found", { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    const filename = path[path.length - 1];
    const contentType = res.headers.get("Content-Type") || "application/octet-stream";
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
    };
    const contentLength = res.headers.get("content-length");
    if (contentLength) headers["Content-Length"] = contentLength;

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "File request timed out"
      : "Error fetching file";
    return new NextResponse(message, { status: 500 });
  }
}
