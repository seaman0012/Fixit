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
import { LayoutDashboard, FileText, BarChart3, Building2, UsersRound, LogOut } from 'lucide-react'
import Image from 'next/image'

interface AdminNavProps {
  profile: {
    full_name: string
    email: string
    role?: string
  }
}

export default function AdminNav({ profile }: AdminNavProps) {
  const router = useRouter()

  const getRoleLabel = (role?: string) => {
    if (role === 'owner') return 'Owner'
    return 'Admin'
  }

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
      <div className="container mx-auto flex h-16 flex-row items-center justify-between px-4">
        <div className="flex items-center justify-between gap-8">
          <Link href="/admin" className="flex w-fit items-center gap-4">
            <div className="bg-foreground relative h-8 w-8 overflow-hidden rounded-md">
              <Image
                src="/fixit icon-dark.svg"
                alt="Fixit logo"
                fill
                sizes="32px"
                priority
                className="object-contain dark:block"
              />
              <Image
                src="/fixit icon-light.svg"
                alt="Fixit logo"
                fill
                sizes="32px"
                priority
                className="object-contain dark:hidden"
              />
            </div>
            <span className="text-md hidden font-bold italic sm:flex">Fixit</span>
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                หน้าหลัก
              </Button>
            </Link>
            <Link href="/admin/tickets">
              <Button variant="ghost" size="sm">
                รายการซ่อม
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm">
                วิเคราะห์
              </Button>
            </Link>

            <Link href="/admin/rooms">
              <Button variant="ghost" size="sm">
                ห้องพัก
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                ผู้ใช้
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
                  <span className="text-muted-foreground text-xs">
                    {getRoleLabel(profile.role)}
                  </span>
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
                  รายการซ่อม
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/admin/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  วิเคราะห์
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/admin/rooms">
                  <Building2 className="mr-2 h-4 w-4" />
                  ห้องพัก
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/admin/users">
                  <UsersRound className="mr-2 h-4 w-4" />
                  ผู้ใช้
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
