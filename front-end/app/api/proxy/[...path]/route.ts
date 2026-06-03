import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const FETCH_TIMEOUT_MS = 15000;

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
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest("GET", request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest("POST", request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest("PUT", request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest("DELETE", request, params);
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

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (!["host", "connection"].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    const options: RequestInit = {
      method,
      headers,
    };

    if (method !== "GET" && method !== "DELETE") {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) {
        options.body = body;
      }
    }

    const response = await fetchWithTimeout(targetUrl, options);
    const responseBody = await response.text();
    const responseHeaders = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) responseHeaders.set("Content-Type", contentType);

    return new NextResponse(responseBody, {
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
