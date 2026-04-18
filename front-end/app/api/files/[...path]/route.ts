import { NextRequest, NextResponse } from "next/server";

const BACKEND = "http://76.13.155.82:4000";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND}/files/${path.join("/")}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return new NextResponse("File not found", { status: 404 });

    const buffer = await res.arrayBuffer();
    const filename = path[path.length - 1];

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return new NextResponse("Error fetching file", { status: 500 });
  }
}
