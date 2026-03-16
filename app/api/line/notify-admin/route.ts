import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendLineToAdmins } from "@/lib/line/notify-admin";
import { categoryConfig, priorityConfig } from "@/lib/constants";

type NotifyAdminRequest = {
  ticketId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NotifyAdminRequest;
    if (!body.ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: ticket, error: ticketError } = (await supabase
      .from("tickets")
      .select("id,title,category,priority,room_number,created_at")
      .eq("id", body.ticketId)
      .eq("user_id", user.id)
      .single()) as {
      data: {
        id: string;
        title: string;
        category: keyof typeof categoryConfig;
        priority: keyof typeof priorityConfig;
        room_number: string;
        created_at: string;
      } | null;
      error: { message?: string } | null;
    };

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { data: profile } = (await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()) as {
      data: { full_name: string } | null;
      error: { message?: string } | null;
    };

    const createdAt = new Date(ticket.created_at).toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const message = [
      "แจ้งเตือน: มีรายการแจ้งซ่อมใหม่",
      `หัวข้อ: ${ticket.title}`,
      `ห้อง: ${ticket.room_number}`,
      `ประเภท: ${categoryConfig[ticket.category] ?? ticket.category}`,
      `ความเร่งด่วน: ${priorityConfig[ticket.priority]?.label ?? ticket.priority}`,
      `ผู้แจ้ง: ${profile?.full_name ?? "ผู้ใช้งาน"}`,
      `เวลา: ${createdAt}`,
    ].join("\n");

    const lineResult = await sendLineToAdmins(message);

    if (!lineResult.ok) {
      console.error("[LINE notify-admin] partial/failed", lineResult);
    }

    return NextResponse.json({ ok: true, lineResult });
  } catch (error) {
    console.error("[LINE notify-admin] unexpected error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
