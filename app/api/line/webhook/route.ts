import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.text();

    console.log("[LINE webhook] received", {
      hasSignature: Boolean(request.headers.get("x-line-signature")),
      bodyLength: body.length,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[LINE webhook] error", error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "LINE webhook endpoint is alive" }, { status: 200 });
}
