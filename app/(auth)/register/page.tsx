'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Wrench } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    roomNumber: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // สมัครสมาชิก
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'resident',
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        let roomId: string | null = null

        const normalizedRoomNumber = formData.roomNumber.trim()
        if (normalizedRoomNumber) {
          const { data: existingRoom, error: existingRoomError } = await supabase
            .from('rooms')
            .select('id')
            .eq('room_number', normalizedRoomNumber)
            .maybeSingle()

          if (existingRoomError) throw existingRoomError

          if (existingRoom) {
            roomId = existingRoom.id
          } else {
            const { data: createdRoom, error: createRoomError } = await supabase
              .from('rooms')
              .insert({
                room_number: normalizedRoomNumber,
                floor: 'unknown',
                status: 'occupied',
              })
              .select('id')
              .single()

            if (createRoomError) {
              const { data: retryRoom, error: retryRoomError } = await supabase
                .from('rooms')
                .select('id')
                .eq('room_number', normalizedRoomNumber)
                .single()

              if (retryRoomError) throw createRoomError
              roomId = retryRoom.id
            } else {
              roomId = createdRoom.id
            }
          }
        }

        // อัปเดตข้อมูล profile เพิ่มเติม
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            room_id: roomId,
            phone: formData.phone,
          })
          .eq('id', data.user.id)

        if (updateError) throw updateError

        router.push('/resident')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || 'สมัครสมาชิกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="from-primary/15 to-primary/5 flex min-h-screen items-center justify-center bg-linear-to-r">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="bg-primary mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <Wrench className="text-primary-foreground h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">สมัครสมาชิก</CardTitle>
          <CardDescription>สร้างบัญชีใหม่เพื่อเริ่มใช้งาน Fixit</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="ชื่อ นามสกุล"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">หมายเลขห้อง</Label>
              <Input
                id="roomNumber"
                type="text"
                placeholder="เช่น A101"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0812345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter className="mt-4 flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              มีบัญชีอยู่แล้ว?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
