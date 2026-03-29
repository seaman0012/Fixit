'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LayoutDashboard, FileText, BarChart3, LogOut } from 'lucide-react'
import Image from 'next/image'

interface AdminNavProps {
  profile: {
    full_name: string
    email: string
  }
}

export default function AdminNav({ profile }: AdminNavProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="bg-background shadow-2sm border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-4">
            <div className="relative h-8 w-8 overflow-hidden rounded">
              <Image
                src="/fixit-icon-circle-light.svg"
                alt="Fixit logo"
                fill
                sizes="32px"
                priority
                className="object-contain dark:hidden"
              />
              <Image
                src="/fixit-icon-circle-dark.svg"
                alt="Fixit logo"
                fill
                sizes="32px"
                priority
                className="hidden object-contain dark:block"
              />
            </div>
            <span className="hidden text-xl font-bold sm:flex">Fixit Admin</span>
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                หน้าหลัก
              </Button>
            </Link>
            <Link href="/admin/tickets">
              <Button variant="ghost" size="sm">
                จัดการงาน
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm">
                วิเคราะห์ข้อมูล
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start text-left text-sm md:flex">
                  <span className="font-medium">{profile.full_name}</span>
                  <span className="text-muted-foreground text-xs">ผู้ดูแลหอพัก</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{profile.full_name}</p>
                  <p className="text-muted-foreground text-xs">{profile.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/admin">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  หน้าหลัก
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/admin/tickets">
                  <FileText className="mr-2 h-4 w-4" />
                  รายการทั้งหมด
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/admin/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  วิเคราะห์ข้อมูล
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
