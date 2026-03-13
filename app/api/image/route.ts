import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
        return new NextResponse("Missing token", { status: 400 });
    }

    const upstream = `https://table.inmakan.com/api/attachments/read/private/table/${token}`;

    try {
        const res = await fetch(upstream, { cache: "force-cache" });

        if (!res.ok) {
            return new NextResponse("Failed to fetch image", { status: res.status });
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
