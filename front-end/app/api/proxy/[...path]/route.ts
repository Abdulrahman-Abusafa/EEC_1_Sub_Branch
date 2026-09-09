import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
// Most requests are quick, but file uploads/downloads can take a while on
// slow connections — give them room instead of a blanket 15s cutoff.
const FETCH_TIMEOUT_MS = 20 * 60 * 1000; // 20 min

export const runtime = "nodejs";
// Route handlers stream by default on the Node runtime, but this app was
// relying on request.arrayBuffer()/response.text() (see below), which
// buffers the whole body in memory — fine for small JSON payloads, fatal
// for large file uploads. We now stream bodies through instead.

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest("GET", request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest("POST", request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest("PUT", request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest("PATCH", request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest("DELETE", request, await params);
}

async function handleProxyRequest(
  method: string,
  request: NextRequest,
  { path }: { path: string[] }
) {
  try {
    const pathStr = path.join("/");
    const queryString = request.nextUrl.search;
    const targetUrl = `${BACKEND_URL}/${pathStr}${queryString}`;

    // "content-length"/"transfer-encoding" are dropped because undici
    // recomputes framing itself when the body is a live stream. "expect" is
    // dropped because browsers/curl send "Expect: 100-continue" for large
    // multipart bodies, and undici's fetch throws
    // `TypeError: fetch failed` (cause: UND_ERR_NOT_SUPPORTED) if that header
    // is forwarded alongside a streamed body.
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (!["host", "connection", "content-length", "transfer-encoding", "expect"].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    // `duplex: "half"` is required by Node's fetch (undici) whenever the
    // request body is a stream. We stream the incoming body straight through
    // instead of buffering it with arrayBuffer(), so multi-GB uploads don't
    // get loaded into memory here.
    const options: RequestInit & { duplex?: "half" } = {
      method,
      headers,
    };

    if (method !== "GET" && method !== "DELETE" && request.body) {
      options.body = request.body;
      options.duplex = "half";
    }

    const response = await fetchWithTimeout(targetUrl, options);

    const responseHeaders = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    const contentDisposition = response.headers.get("content-disposition");
    if (contentDisposition) responseHeaders.set("Content-Disposition", contentDisposition);
    const contentLength = response.headers.get("content-length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    // Stream the response body straight back rather than buffering it with
    // .text(), so large file downloads don't get loaded into memory here either.
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    const message = error instanceof Error && error.name === "AbortError"
      ? "Backend request timed out"
      : "Backend request failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
