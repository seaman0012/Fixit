'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'

const statusOptions = [
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'completed', label: 'เสร็จสิ้น' },
  { value: 'cancelled', label: 'ยกเลิก' },
]

interface StatusUpdateFormProps {
  ticket: {
    id: string
    status: string
  }
}

export default function StatusUpdateForm({ ticket }: StatusUpdateFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState(ticket.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleUpdate = async () => {
    if (status === ticket.status) {
      setError('สถานะไม่มีการเปลี่ยนแปลง')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const supabase = createClient()

      const updateData: any = {
        status,
      }

      // ถ้าเปลี่ยนเป็น completed ให้เพิ่ม completed_at
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase.from('tickets').update(updateData).eq('id', ticket.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>อัปเดตสถานะ</CardTitle>
        <CardDescription>เปลี่ยนสถานะของรายการแจ้งซ่อมตามความคืบหน้า</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
        )}
        {success && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
            อัปเดตสถานะสำเร็จ!
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="status">สถานะ</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleUpdate}
          disabled={loading || status === ticket.status}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังอัปเดต...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              บันทึกการเปลี่ยนแปลง
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
