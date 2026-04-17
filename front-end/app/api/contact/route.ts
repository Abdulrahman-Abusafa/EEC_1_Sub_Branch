import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: `"EEC Contact Form" <${process.env.GMAIL_USER}>`,
        to: "eec.kfupm@gmail.com",
        replyTo: email,
        subject: subject ? `[EEC Contact] ${subject}` : `[EEC Contact] Message from ${name}`,
        html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto">
                <h2 style="color:#06b6d4">New message from EEC website</h2>
                <table style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:8px;font-weight:bold;color:#666">Name</td><td style="padding:8px">${name}</td></tr>
                    <tr><td style="padding:8px;font-weight:bold;color:#666">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
                    ${subject ? `<tr><td style="padding:8px;font-weight:bold;color:#666">Subject</td><td style="padding:8px">${subject}</td></tr>` : ""}
                </table>
                <hr style="border:1px solid #eee;margin:16px 0"/>
                <p style="white-space:pre-wrap;color:#333">${message}</p>
            </div>
        `,
    });

    return NextResponse.json({ success: true });
}
