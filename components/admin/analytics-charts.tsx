'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface AnalyticsChartsProps {
  categoryStats: { category: string; count: number }[]
  statusStats: { status: string; count: number }[]
}

const COLORS = {
  category: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  status: ['#eab308', '#3b82f6', '#10b981', '#6b7280'],
}

export default function AnalyticsCharts({ categoryStats, statusStats }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Category Chart */}
      <Card>
        <CardHeader>
          <CardTitle>สถิติตามประเภทอุปกรณ์</CardTitle>
          <CardDescription>จำนวนการแจ้งซ่อมแบ่งตามประเภท</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {categoryStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS.category[index % COLORS.category.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>สถิติตามสถานะ</CardTitle>
          <CardDescription>สัดส่วนของรายการตามสถานะปัจจุบัน</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ payload, percent }: any) =>
                  percent && percent > 0 ? `${payload.status}: ${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.status[index % COLORS.status.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
