import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AnalyticsCharts from '@/components/admin/analytics-charts'
import { categoryConfig } from '@/lib/constants'

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ดึงข้อมูล tickets ทั้งหมด
  const { data: tickets } = (await supabase
    .from('tickets')
    .select('*')
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
    acc[ticket.room_number] = (acc[ticket.room_number] || 0) + 1
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">วิเคราะห์ข้อมูล</h1>
        <p className="text-muted-foreground">ข้อมูลสถิติและการวิเคราะห์เพื่อการจัดการเชิงรุก</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายการทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-muted-foreground text-xs">รายการแจ้งซ่อมทั้งหมด</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ซ่อมเสร็จแล้ว</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTickets.length}</div>
            <p className="text-muted-foreground text-xs">
              {tickets.length > 0
                ? `${((completedTickets.length / tickets.length) * 100).toFixed(1)}% ของทั้งหมด`
                : 'ไม่มีข้อมูล'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เวลาเฉลี่ยในการซ่อม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgDays > 0 ? `${avgDays} วัน` : `${avgHours} ชม.`}
            </div>
            <p className="text-muted-foreground text-xs">จากสร้างถึงเสร็จสิ้น</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ประเภทที่เสียบ่อยที่สุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topCategories[0]?.category || 'N/A'}</div>
            <p className="text-muted-foreground text-xs">{topCategories[0]?.count || 0} รายการ</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <AnalyticsCharts categoryStats={categoryStats} statusStats={statusStats} />

      {/* Top Lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>ประเภทที่พบบ่อยที่สุด</CardTitle>
            <CardDescription>สถิติอุปกรณ์ที่เสียบ่อย เพื่อวางแผนการซ่อมบำรุง</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 justify-center">
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

        {/* Top Rooms */}
        <Card>
          <CardHeader>
            <CardTitle>ห้องที่แจ้งบ่อยที่สุด</CardTitle>
            <CardDescription>ห้องที่มีปัญหาบ่อย อาจต้องตรวจสอบเชิงรุก</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRooms.slice(0, 5).map((item, index) => (
                <div key={item.room} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 justify-center">
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
