import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Clock, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { statusConfig, categoryConfig } from "@/lib/constants";

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { status, search } = await searchParams;
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const statusFilter = status || "all";
  const searchQuery = search || "";

  // ดึงข้อมูล tickets
  let query = supabase
    .from("tickets")
    .select(`
      *,
      profiles:user_id (
        full_name,
        room_number,
        phone
      )
    `)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: tickets } = await query;

  // Filter by search query
  const filteredTickets = tickets?.filter((ticket: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      ticket.title.toLowerCase().includes(search) ||
      ticket.description.toLowerCase().includes(search) ||
      ticket.room_number.toLowerCase().includes(search) ||
      ticket.profiles?.full_name?.toLowerCase().includes(search)
    );
  });

  const renderTickets = (ticketList: typeof tickets | undefined) => {
    if (!ticketList || ticketList.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          ไม่พบรายการแจ้งซ่อม
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {ticketList.map((ticket: any) => {
          const status = statusConfig[ticket.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;
          
          return (
            <Link
              key={ticket.id}
              href={`/admin/tickets/${ticket.id}`}
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ticket.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {ticket.profiles?.full_name || "Unknown"}
                    </span>
                    <span>ห้อง {ticket.room_number}</span>
                    {ticket.profiles?.phone && (
                      <span>โทร: {ticket.profiles.phone}</span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </span>
                  </div>
                </div>
                <Badge className={status.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">จัดการงาน</h1>
        <p className="text-muted-foreground">จัดการและอัปเดตสถานะรายการแจ้งซ่อม</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>รายการแจ้งซ่อมทั้งหมด</CardTitle>
              <CardDescription>
                คลิกที่รายการเพื่ออัปเดตสถานะและให้ข้อมูลเพิ่มเติม
              </CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ค้นหา..."
                defaultValue={searchQuery}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={statusFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" asChild>
                <Link href="/admin/tickets?status=all">ทั้งหมด</Link>
              </TabsTrigger>
              <TabsTrigger value="pending" asChild>
                <Link href="/admin/tickets?status=pending">รอดำเนินการ</Link>
              </TabsTrigger>
              <TabsTrigger value="in_progress" asChild>
                <Link href="/admin/tickets?status=in_progress">กำลังดำเนินการ</Link>
              </TabsTrigger>
              <TabsTrigger value="completed" asChild>
                <Link href="/admin/tickets?status=completed">เสร็จสิ้น</Link>
              </TabsTrigger>
              <TabsTrigger value="cancelled" asChild>
                <Link href="/admin/tickets?status=cancelled">ยกเลิก</Link>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={statusFilter} className="mt-6">
              {renderTickets(filteredTickets)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
