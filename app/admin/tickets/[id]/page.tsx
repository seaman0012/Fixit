import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, AlertCircle, CheckCircle2, MapPin, Calendar, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Image from "next/image";
import CommentSection from "@/components/resident/comment-section";
import StatusUpdateForm from "@/components/admin/status-update-form";
import { statusConfig, categoryConfig, priorityConfig } from "@/lib/constants";

export default async function AdminTicketDetailPage({
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
        email,
        room_number,
        phone
      )
    `)
    .eq("id", id)
    .single() as { data: any; error: any };

  if (error || !ticket) {
    notFound();
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

  const status = statusConfig[ticket.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;
  const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{ticket.title}</h1>
        <p className="text-muted-foreground">จัดการและอัปเดตสถานะรายการแจ้งซ่อม</p>
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
                    สร้างเมื่อ {format(new Date(ticket.created_at), "d MMMM yyyy, HH:mm น.", { locale: th })}
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
                  {ticket.description}
                </p>
              </div>

              {ticket.image_urls && ticket.image_urls.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium">รูปภาพประกอบ</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {ticket.image_urls.map((url: string, index: number) => (
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

          {/* Status Update Form */}
          <StatusUpdateForm ticket={ticket} />

          {/* Comments */}
          <CommentSection ticketId={id} initialComments={comments || []} userRole="admin" />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resident Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ผู้แจ้ง</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">ชื่อ</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.profiles?.full_name || "Unknown"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">หมายเลขห้อง</p>
                  <p className="text-sm text-muted-foreground">{ticket.room_number}</p>
                </div>
              </div>

              {ticket.profiles?.phone && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">เบอร์โทรศัพท์</p>
                      <p className="text-sm text-muted-foreground">{ticket.profiles.phone}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ข้อมูลเพิ่มเติม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">ประเภท</p>
                  <p className="text-sm text-muted-foreground">
                    {categoryConfig[ticket.category as keyof typeof categoryConfig]}
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
        </div>
      </div>
    </div>
  );
}
