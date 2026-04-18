import { NextRequest, NextResponse } from "next/server";

const BACKEND = "http://76.13.155.82:4000";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND}/${path.join("/")}${req.nextUrl.search}`;
  const res = await fetch(url);
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND}/${path.join("/")}`;
  const contentType = req.headers.get("Content-Type") || "";
  const body = contentType.includes("multipart") ? await req.formData() : await req.text();
  const res = await fetch(url, {
    method: "POST",
    headers: contentType.includes("multipart") ? {} : { "Content-Type": contentType },
    body: body as BodyInit,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND}/${path.join("/")}`;
  const contentType = req.headers.get("Content-Type") || "";
  const body = contentType.includes("multipart") ? await req.formData() : await req.text();
  const res = await fetch(url, {
    method: "PUT",
    headers: contentType.includes("multipart") ? {} : { "Content-Type": contentType },
    body: body as BodyInit,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND}/${path.join("/")}`;
  const res = await fetch(url, { method: "DELETE" });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}
