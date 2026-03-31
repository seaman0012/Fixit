import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import type { DataTableTicket } from '@/components/ui/data-table'
import { Clock, AlertCircle, CheckCircle2, FileText, Loader } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: tickets } = (await supabase
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
      ),
      categories:category_id (
        name
      )
    `
    )
    .order('created_at', { ascending: false })) as { data: any[] }

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
      categories: ticket.categories,
      rooms: ticket.rooms,
      profiles: ticket.profiles,
    }))

  const totalTickets = tickets?.length || 0
  const pendingCount = tickets?.filter((ticket: any) => ticket.status === 'pending').length || 0
  const inProgressCount =
    tickets?.filter((ticket: any) => ticket.status === 'in_progress').length || 0
  const completedCount = tickets?.filter((ticket: any) => ticket.status === 'completed').length || 0

  return (
    <div className="@container/main flex flex-col gap-6">
      <h1 className="text-3xl font-bold">หน้าหลัก</h1>
      <div className="*:from-primary/5 *:to-card grid grid-cols-1 gap-4 *:bg-linear-to-t *:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>รายการทั้งหมด</CardDescription>
            <CardTitle className="text-3xl font-semibold">{totalTickets}</CardTitle>
            <CardAction>
              <FileText className="text-muted-foreground size-4" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">รายการที่อยู่ในระบบทั้งหมด</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>รอดำเนินการ</CardDescription>
            <CardTitle className="text-3xl font-semibold">{pendingCount}</CardTitle>
            <CardAction>
              <Clock className="size-4 text-yellow-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">รายการรอเข้าคิวซ่อม</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>กำลังดำเนินการ</CardDescription>
            <CardTitle className="text-3xl font-semibold">{inProgressCount}</CardTitle>
            <CardAction>
              <Loader className="size-4 text-blue-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">งานที่กำลังถูกดำเนินการ</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>เสร็จสิ้น</CardDescription>
            <CardTitle className="text-3xl font-semibold">{completedCount}</CardTitle>
            <CardAction>
              <CheckCircle2 className="size-4 text-green-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">รายการที่ปิดงานเรียบร้อยแล้ว</p>
          </CardFooter>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">รายการแจ้งซ่อมล่าสุด</CardTitle>
          <CardDescription>แสดง 5 รายการล่าสุด</CardDescription>
          <CardAction>
            <Link href="/admin/tickets">
              <Button variant="outline">ดูทั้งหมด</Button>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            tickets={tableTickets}
            detailBasePath="/admin/tickets"
            pageSize={5}
            showReporter
            showSearch={false}
            showPagination={false}
            showStatusFilter={false}
            showViewAllButton={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
