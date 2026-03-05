import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, AlertCircle, CheckCircle2, MapPin, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Image from "next/image";
import CommentSection from "@/components/resident/comment-section";
import { statusConfig, categoryConfig, priorityConfig } from "@/lib/constants";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // ดึงข้อมูล ticket
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .eq("id", id)
    .single() as { data: any; error: any };

  if (error || !ticket) {
    notFound();
  }

  // ตรวจสอบว่าเป็นเจ้าของ ticket หรือไม่
  if ((ticket as any).user_id !== user.id) {
    redirect("/resident");
  }

  // ดึงข้อมูล comments
  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      profiles (
        full_name,
        role
      )
    `)
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  const status = statusConfig[(ticket as any).status as keyof typeof statusConfig];
  const StatusIcon = status.icon;
  const priority = priorityConfig[(ticket as any).priority as keyof typeof priorityConfig];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{(ticket as any).title}</h1>
        <p className="text-muted-foreground">รายละเอียดการแจ้งซ่อม</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>รายละเอียด</CardTitle>
                  <CardDescription>
                    สร้างเมื่อ {format(new Date((ticket as any).created_at), "d MMMM yyyy, HH:mm น.", { locale: th })}
                  </CardDescription>
                </div>
                <Badge className={status.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">คำอธิบาย</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {(ticket as any).description}
                </p>
              </div>

              {(ticket as any).image_urls && (ticket as any).image_urls.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium">รูปภาพประกอบ</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {(ticket as any).image_urls.map((url: string, index: number) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square overflow-hidden rounded-lg border"
                      >
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <CommentSection ticketId={id} initialComments={comments || []} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ข้อมูลเพิ่มเติม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">หมายเลขห้อง</p>
                  <p className="text-sm text-muted-foreground">{(ticket as any).room_number}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">ประเภท</p>
                  <p className="text-sm text-muted-foreground">
                    {categoryConfig[(ticket as any).category as keyof typeof categoryConfig]}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">ความเร่งด่วน</p>
                  <Badge className={`mt-1 ${priority.color}`}>{priority.label}</Badge>
                </div>
              </div>

              {ticket.completed_at && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">เสร็จสิ้นเมื่อ</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(ticket.completed_at), "d MMMM yyyy, HH:mm น.", { locale: th })}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ไทม์ไลน์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Calendar className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">สร้างรายการ</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(ticket.created_at), "d MMM yyyy, HH:mm", { locale: th })}
                  </p>
                </div>
              </div>

              {ticket.status !== "pending" && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    {ticket.status !== "in_progress" && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className={ticket.status === "in_progress" ? "" : "pb-4"}>
                    <p className="text-sm font-medium">เริ่มดำเนินการ</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.updated_at), "d MMM yyyy, HH:mm", { locale: th })}
                    </p>
                  </div>
                </div>
              )}

              {ticket.completed_at && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">เสร็จสิ้น</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.completed_at), "d MMM yyyy, HH:mm", { locale: th })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
