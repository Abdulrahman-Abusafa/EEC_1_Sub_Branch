import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NODE_ENV === "production"
    ? "http://76.13.155.82:4000"
    : "http://localhost:4000";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    if (!token) {
        return new NextResponse("Missing token", { status: 400 });
    }

    try {
        const res = await fetch(`${BACKEND}/image?token=${encodeURIComponent(token)}`, { cache: "no-store" });

        if (!res.ok) {
            return new NextResponse("Failed to fetch image", {
                status: res.status,
                headers: { "Cache-Control": "no-store" },
            });
        }

        const contentType = res.headers.get("content-type") ?? "image/jpeg";
        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, immutable",
            },
        });
    } catch {
        return new NextResponse("Error fetching image", { status: 500 });
    }
}
