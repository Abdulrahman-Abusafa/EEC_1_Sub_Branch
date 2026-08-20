import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ url: process.env.BACKEND_URL || "http://localhost:4000" });
}
