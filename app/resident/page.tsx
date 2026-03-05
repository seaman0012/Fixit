import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { statusConfig, categoryConfig } from "@/lib/constants";

export default async function ResidentPage() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // ดึงข้อมูล tickets ของ user
  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // นับจำนวนตามสถานะ
  const pendingCount = tickets?.filter((t: any) => t.status === "pending").length || 0;
  const inProgressCount = tickets?.filter((t: any) => t.status === "in_progress").length || 0;
  const completedCount = tickets?.filter((t: any) => t.status === "completed").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">หน้าหลัก</h1>
          <p className="text-muted-foreground">
            ยินดีต้อนรับสู่ระบบแจ้งซ่อม Fixit
          </p>
        </div>
        <Link href="/resident/tickets/new">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            แจ้งซ่อม
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">รายการที่รอการตรวจสอบ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำลังดำเนินการ</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">รายการที่กำลังซ่อม</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เสร็จสิ้น</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">รายการที่ซ่อมเสร็จแล้ว</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายการแจ้งซ่อมล่าสุด</CardTitle>
              <CardDescription>รายการแจ้งซ่อม 5 รายการล่าสุดของคุณ</CardDescription>
            </div>
            <Link href="/resident/tickets">
              <Button variant="outline" size="sm">
                ดูทั้งหมด
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {tickets && tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map((ticket: any) => {
                const status = statusConfig[ticket.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                
                return (
                  <Link
                    key={ticket.id}
                    href={`/resident/tickets/${ticket.id}`}
                    className="block"
                  >
                    <div className="flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{ticket.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {categoryConfig[ticket.category as keyof typeof categoryConfig]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(ticket.created_at), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={status.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ห้อง {ticket.room_number}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">ยังไม่มีรายการแจ้งซ่อม</p>
              <Link href="/resident/tickets/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  แจ้งซ่อมรายการแรก
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
