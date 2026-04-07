'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const bootstrapSessionFromInviteLink = async () => {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
        }
      }

      setIsBootstrapping(false)
    }

    void bootstrapSessionFromInviteLink()
  }, [])

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Validate
    if (!password || password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      setIsLoading(false)
      return
    }

    try {
      const {
        data: { user: existingUser },
      } = await supabase.auth.getUser()

      if (!existingUser) {
        throw new Error('ไม่พบเซสชันคำเชิญ กรุณากดลิงก์จากอีเมลใหม่อีกครั้ง')
      }

      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      // Get current user and activate profile
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            is_active: true,
            status: 'active',
          })
          .eq('id', user.id)

        if (updateError) throw updateError
      }

      router.push('/resident')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">รีเซ็ตรหัสผ่านใหม่</CardTitle>
          <CardDescription>กรุณากรอกรหัสผ่านใหม่ของคุณด้านล่าง</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-4">
                <Label htmlFor="password">รหัสผ่านใหม่</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="รหัสผ่านใหม่"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-4">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="ยืนยันรหัสผ่าน"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading || isBootstrapping}>
                {isBootstrapping
                  ? 'กำลังเตรียมลิงก์คำเชิญ...'
                  : isLoading
                    ? 'กำลังบันทึก...'
                    : 'บันทึกรหัสผ่านใหม่'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
