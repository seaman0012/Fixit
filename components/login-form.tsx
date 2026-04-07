'use client'

import { useEffect, useState } from 'react'
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
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Field, FieldDescription, FieldGroup, FieldLabel } from './ui/field'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let isDisposed = false

    const bootstrapInviteSession = async () => {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const linkType = hashParams.get('type')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const status = session?.user?.user_metadata?.status as string | undefined
      const shouldGoSetPassword = linkType === 'invite' || status === 'pending'

      if (!isDisposed && shouldGoSetPassword) {
        router.replace('/auth/update-password')
        router.refresh()
      }
    }

    void bootstrapInviteSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const status = session?.user?.user_metadata?.status as string | undefined
      if (status === 'pending') {
        setTimeout(() => {
          router.replace('/auth/update-password')
          router.refresh()
        }, 0)
      }
    })

    return () => {
      isDisposed = true
      subscription.unsubscribe()
    }
  }, [router])

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const supabase = createClient()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', data.user.id)
          .single()

        if (profile && !profile.is_active) {
          await supabase.auth.signOut()
          setError('บัญชีนี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ')
          return
        }

        if (profile?.role === 'admin' || profile?.role === 'owner') {
          router.push('/admin')
        } else {
          router.push('/resident')
        }
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="space-x-1 text-center">
          <CardTitle className="text-2xl font-bold">เข้าสู่ระบบ</CardTitle>
          <CardDescription>กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ Fixit</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">รหัสผ่าน</FieldLabel>
                  <a
                    href="/auth/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </Button>
                <FieldDescription className="text-center">
                  ไม่มีบัญชี?{' '}
                  <Link
                    href="https://lin.ee/OHWca5o"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    ติดต่อแอดมิน
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
