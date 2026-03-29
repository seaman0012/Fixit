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
import { BarChart, Bar, PieChart, Pie, Rectangle, XAxis, CartesianGrid } from 'recharts'

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
    color: 'var(--chart-2)',
  },
  in_progress: {
    label: 'กำลังดำเนินการ',
    color: 'var(--chart-3)',
  },
  completed: {
    label: 'เสร็จสิ้น',
    color: 'var(--chart-4)',
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

  // Transform data with fill colors
  const categoryChartData = categoryStats.map((entry) => ({
    ...entry,
    fill: `var(--color-${entry.key})`,
  }))

  const statusChartData = statusStats.map((entry) => ({
    ...entry,
    fill: `var(--color-${entry.key})`,
  }))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>สถิติตามประเภทอุปกรณ์</CardTitle>
          <CardDescription>จำนวนการแจ้งซ่อมแบ่งตามประเภท</CardDescription>
        </CardHeader>
        <CardContent className="min-h-0">
          <ChartContainer config={categoryChartConfig} className="aspect-video min-h-0 w-full">
            <BarChart accessibilityLayer data={categoryChartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="category" tickLine={false} tickMargin={10} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="count"
                fill="var(--color-electrical)"
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
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>สถิติตามสถานะ</CardTitle>
          <CardDescription>สัดส่วนของรายการตามสถานะปัจจุบัน</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <ChartContainer config={statusChartConfig} className="flex-1">
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                nameKey="key"
                labelLine={false}
                outerRadius="70%"
                dataKey="count"
                stroke="none"
              />
              <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
              <ChartLegend
                content={<ChartLegendContent nameKey="key" className="flex-wrap gap-2 pt-4" />}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
