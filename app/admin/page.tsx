import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { statusConfig, categoryConfig } from '@/lib/constants'

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()

  // ดึงข้อมูลสถิติ
  const { data: allTickets } = (await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })) as { data: any[] }

  const { data: recentTickets } = (await supabase
    .from('tickets')
    .select(
      `
      *,
      rooms:room_id (
        room_number
      ),
      profiles:user_id (
        full_name
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(10)) as { data: any[] }

  const totalTickets = allTickets?.length || 0
  const pendingCount = allTickets?.filter((t: any) => t.status === 'pending').length || 0
  const inProgressCount = allTickets?.filter((t: any) => t.status === 'in_progress').length || 0
  const completedCount = allTickets?.filter((t: any) => t.status === 'completed').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">ภาพรวมการแจ้งซ่อมทั้งหมดในระบบ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายการทั้งหมด</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
            <p className="text-muted-foreground text-xs">รายการแจ้งซ่อมทั้งหมด</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-muted-foreground text-xs">ต้องตรวจสอบ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำลังดำเนินการ</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-muted-foreground text-xs">กำลังซ่อม</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เสร็จสิ้น</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-muted-foreground text-xs">ซ่อมเสร็จแล้ว</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายการแจ้งซ่อมล่าสุด</CardTitle>
              <CardDescription>รายการ 10 รายการล่าสุดที่แจ้งเข้ามา</CardDescription>
            </div>
            <Link href="/resident/tickets">
              <Button variant="outline" size="sm">
                ดูทั้งหมด
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTickets && recentTickets.length > 0 ? (
            <div className="space-y-4">
              {recentTickets.map((ticket) => {
                const status = statusConfig[ticket.status as keyof typeof statusConfig]
                const StatusIcon = status.icon

                return (
                  <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className="block">
                    <div className="hover:bg-muted/50 flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{ticket.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {categoryConfig[ticket.category as keyof typeof categoryConfig]}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-1 text-sm">
                          {ticket.description}
                        </p>
                        <div className="text-muted-foreground flex items-center gap-4 text-xs">
                          <span>{ticket.profiles?.full_name || 'Unknown'}</span>
                          <span>ห้อง {ticket.rooms?.room_number || '-'}</span>
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
                )
              })}
            </div>
          ) : (
            <div className="text-muted-foreground py-12 text-center">ยังไม่มีรายการแจ้งซ่อม</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
