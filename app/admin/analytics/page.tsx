import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AnalyticsCharts from '@/components/admin/analytics-charts'
import { categoryConfig } from '@/lib/constants'
import { ChartColumnIncreasing, Clock3, FileText, Wrench } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()

  // ดึงข้อมูล tickets ทั้งหมด
  const { data: tickets } = (await supabase
    .from('tickets')
    .select(
      `
      *,
      rooms:room_id (
        room_number
      )
    `
    )
    .order('created_at', { ascending: false })) as { data: any[] }

  if (!tickets) {
    return <div>Loading...</div>
  }

  // วิเคราะห์ข้อมูล
  const categoryStats = Object.entries(categoryConfig).map(([key, label]) => {
    const count = tickets.filter((t: any) => t.category === key).length
    return { category: label, count }
  })

  const statusStats = [
    { status: 'รอดำเนินการ', count: tickets.filter((t: any) => t.status === 'pending').length },
    {
      status: 'กำลังดำเนินการ',
      count: tickets.filter((t: any) => t.status === 'in_progress').length,
    },
    { status: 'เสร็จสิ้น', count: tickets.filter((t: any) => t.status === 'completed').length },
    { status: 'ยกเลิก', count: tickets.filter((t: any) => t.status === 'cancelled').length },
  ]

  // หาห้องที่แจ้งบ่อยที่สุด
  const roomCounts = tickets.reduce((acc: Record<string, number>, ticket: any) => {
    const roomNumber = ticket.rooms?.room_number || 'ไม่ระบุ'
    acc[roomNumber] = (acc[roomNumber] || 0) + 1
    return acc
  }, {})

  const topRooms = Object.entries(roomCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([room, count]) => ({ room, count }))

  // หาประเภทที่เสียบ่อยที่สุด
  const topCategories = categoryStats.sort((a, b) => b.count - a.count).slice(0, 5)

  // คำนวณเวลาเฉลี่ยในการดำเนินการ
  const completedTickets = tickets.filter((t: any) => t.completed_at)
  const avgCompletionTime =
    completedTickets.length > 0
      ? completedTickets.reduce((acc, ticket: any) => {
          const start = new Date(ticket.created_at).getTime()
          const end = new Date(ticket.completed_at!).getTime()
          return acc + (end - start)
        }, 0) / completedTickets.length
      : 0

  const avgDays = Math.floor(avgCompletionTime / (1000 * 60 * 60 * 24))
  const avgHours = Math.floor((avgCompletionTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const completionRate =
    tickets.length > 0 ? ((completedTickets.length / tickets.length) * 100).toFixed(1) : '0.0'

  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">วิเคราะห์ข้อมูล</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          ข้อมูลสถิติและแนวโน้มเพื่อช่วยวางแผนการดูแลหอพัก
        </p>
      </div>

      <div className="*:from-primary/5 *:to-card grid grid-cols-1 gap-4 *:bg-linear-to-t *:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>รายการทั้งหมด</CardDescription>
            <CardTitle className="text-3xl font-semibold">{tickets.length}</CardTitle>
            <CardAction>
              <FileText className="text-muted-foreground size-4" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">รายการแจ้งซ่อมสะสมทั้งหมด</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>ซ่อมเสร็จแล้ว</CardDescription>
            <CardTitle className="text-3xl font-semibold">{completedTickets.length}</CardTitle>
            <CardAction>
              <ChartColumnIncreasing className="size-4 text-green-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">คิดเป็น {completionRate}% ของทั้งหมด</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>เวลาเฉลี่ยในการซ่อม</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {avgDays > 0 ? `${avgDays} วัน` : `${avgHours} ชม.`}
            </CardTitle>
            <CardAction>
              <Clock3 className="size-4 text-blue-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">นับตั้งแต่สร้างงานถึงปิดงาน</p>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>ประเภทที่เสียบ่อยที่สุด</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {topCategories[0]?.category || 'N/A'}
            </CardTitle>
            <CardAction>
              <Wrench className="size-4 text-amber-600" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-muted-foreground text-xs">{topCategories[0]?.count || 0} รายการ</p>
          </CardFooter>
        </Card>
      </div>

      <AnalyticsCharts categoryStats={categoryStats} statusStats={statusStats} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>ประเภทที่พบบ่อยที่สุด</CardTitle>
            <CardDescription>สถิติอุปกรณ์ที่เสียบ่อย</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {topCategories.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 justify-center rounded-md">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">{item.count} รายการ</span>
                    <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full"
                        style={{
                          width: `${(item.count / tickets.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>ห้องที่แจ้งบ่อยที่สุด</CardTitle>
            <CardDescription>ห้องที่มีปัญหาบ่อย</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {topRooms.slice(0, 5).map((item, index) => (
                <div key={item.room} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 justify-center rounded-md">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">ห้อง {item.room}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">{item.count} ครั้ง</span>
                    <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full"
                        style={{
                          width: `${(item.count / tickets.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
