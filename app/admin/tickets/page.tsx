import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import type { DataTableTicket } from '@/components/ui/data-table'

export default async function AdminTicketsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: tickets } = await supabase
    .from('tickets')
    .select(
      `
      *,
      rooms:room_id (
        room_number
      ),
      profiles:user_id (
        full_name,
        phone
      )
    `
    )
    .order('created_at', { ascending: false })

  const tableTickets: DataTableTicket[] = (tickets ?? [])
    .filter(
      (ticket): ticket is typeof ticket & { created_at: string } => ticket.created_at !== null
    )
    .map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      status: ticket.status,
      created_at: ticket.created_at,
      rooms: ticket.rooms,
      profiles: ticket.profiles,
    }))

  const pendingCount = tickets?.filter((ticket: any) => ticket.status === 'pending').length || 0
  const inProgressCount =
    tickets?.filter((ticket: any) => ticket.status === 'in_progress').length || 0
  const completedCount = tickets?.filter((ticket: any) => ticket.status === 'completed').length || 0
  const cancelledCount = tickets?.filter((ticket: any) => ticket.status === 'cancelled').length || 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">รายการแจ้งซ่อมทั้งหมด</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          ค้นหาและจัดการสถานะงานซ่อมของทุกห้องในระบบ
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>ตารางงานซ่อม</CardTitle>
          <CardDescription>
            คลิกที่หัวข้อรายการเพื่อเข้าไปอัปเดตสถานะและติดตามคอมเมนต์
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Badge variant="outline">รอดำเนินการ {pendingCount}</Badge>
            <Badge variant="outline">กำลังดำเนินการ {inProgressCount}</Badge>
            <Badge variant="outline">เสร็จสิ้น {completedCount}</Badge>
            <Badge variant="outline">ยกเลิก {cancelledCount}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            tickets={tableTickets}
            detailBasePath="/admin/tickets"
            pageSize={12}
            showReporter
            showSearch
            showPagination
            showStatusFilter
            showViewAllButton={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
