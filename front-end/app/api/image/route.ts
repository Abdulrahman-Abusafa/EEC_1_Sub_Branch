import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
        return new NextResponse("Missing token", { status: 400 });
    }

    const upstream = `${BACKEND_URL}/image?token=${encodeURIComponent(token)}`;

    try {
        const res = await fetch(upstream, { cache: "no-store" });

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
