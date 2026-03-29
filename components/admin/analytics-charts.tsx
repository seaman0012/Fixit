'use client'

import type { ComponentProps } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, PieChart, Pie, Cell, Rectangle, XAxis, CartesianGrid } from 'recharts'

interface AnalyticsChartsProps {
  categoryStats: { key: string; category: string; count: number }[]
  statusStats: { key: string; status: string; count: number }[]
}

type BarShapeProps = ComponentProps<typeof Rectangle> & {
  index?: number
}

const categoryChartConfig = {
  count: {
    label: 'จำนวนครั้ง',
  },
  electrical: {
    label: 'ไฟฟ้า',
    color: 'var(--chart-1)',
  },
  plumbing: {
    label: 'ประปา',
    color: 'var(--chart-2)',
  },
  air_conditioning: {
    label: 'เครื่องปรับอากาศ',
    color: 'var(--chart-3)',
  },
  furniture: {
    label: 'เฟอร์นิเจอร์',
    color: 'var(--chart-4)',
  },
  other: {
    label: 'อื่นๆ',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig

const statusChartConfig = {
  pending: {
    label: 'รอดำเนินการ',
    color: 'var(--chart-1)',
  },
  in_progress: {
    label: 'กำลังดำเนินการ',
    color: 'var(--chart-2)',
  },
  completed: {
    label: 'เสร็จสิ้น',
    color: 'var(--chart-3)',
  },
  cancelled: {
    label: 'ยกเลิก',
    color: 'var(--muted-foreground)',
  },
} satisfies ChartConfig

export default function AnalyticsCharts({ categoryStats, statusStats }: AnalyticsChartsProps) {
  const maxCount = Math.max(...categoryStats.map((item) => item.count), Number.NEGATIVE_INFINITY)
  const ACTIVE_INDEX = Math.max(
    categoryStats.findIndex((item) => item.count === maxCount),
    0
  )

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>สถิติตามประเภทอุปกรณ์</CardTitle>
          <CardDescription>จำนวนการแจ้งซ่อมแบ่งตามประเภท</CardDescription>
        </CardHeader>
        <CardContent className="h-75">
          <ChartContainer config={categoryChartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={categoryStats}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="category" tickLine={false} tickMargin={10} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="count"
                strokeWidth={2}
                radius={8}
                shape={({ index, ...props }: BarShapeProps) =>
                  index === ACTIVE_INDEX ? (
                    <Rectangle
                      {...props}
                      fillOpacity={0.8}
                      stroke={typeof props.fill === 'string' ? props.fill : 'var(--foreground)'}
                      strokeWidth={2}
                      strokeDasharray={4}
                      strokeDashoffset={4}
                    />
                  ) : (
                    <Rectangle {...props} />
                  )
                }
              >
                {categoryStats.map((entry) => (
                  <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>สถิติตามสถานะ</CardTitle>
          <CardDescription>สัดส่วนของรายการตามสถานะปัจจุบัน</CardDescription>
        </CardHeader>
        <CardContent className="h-75">
          <ChartContainer config={statusChartConfig} className="h-full w-full">
            <PieChart>
              <Pie
                data={statusStats}
                cx="50%"
                cy="50%"
                nameKey="status"
                labelLine={false}
                outerRadius={80}
                dataKey="count"
                strokeWidth={4}
              >
                {statusStats.map((entry) => (
                  <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <ChartLegend
                content={<ChartLegendContent nameKey="status" className="flex-wrap gap-2" />}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
