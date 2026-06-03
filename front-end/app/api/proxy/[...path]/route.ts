import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest("GET", request, { path });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest("POST", request, { path });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest("PUT", request, { path });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest("DELETE", request, { path });
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
      // Skip headers that shouldn't be forwarded
      if (!["host", "connection"].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    const options: RequestInit = {
      method,
      headers,
    };

    if (method !== "GET" && method !== "DELETE") {
      const body = await request.text();
      if (body) {
        options.body = body;
      }
    }

    const response = await fetch(targetUrl, options);
    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Backend request failed" },
      { status: 500 }
    );
  }
}
