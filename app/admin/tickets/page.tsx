import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Clock, Loader, AlertCircle, CheckCircle2 } from 'lucide-react'
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
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>ตารางงานซ่อม</CardTitle>
          <CardDescription>หัวข้อรายการเพื่อเข้าไปอัปเดตสถานะและติดตามคอมเมนต์</CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-muted-foreground">
              <Clock className="text-muted-foreground size-4" />
              รอดำเนินการ {pendingCount}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              <Loader className="size-4 text-blue-500 dark:text-blue-400" />
              กำลังดำเนินการ {inProgressCount}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              <CheckCircle2 className="dark:text-background size-4 fill-green-500 text-white dark:fill-green-400" />
              เสร็จสิ้น {completedCount}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              <AlertCircle className="dark:text-background size-4 fill-red-500 text-white dark:fill-red-400" />
              ยกเลิก {cancelledCount}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            tickets={tableTickets}
            detailBasePath="/admin/tickets"
            pageSize={10}
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
