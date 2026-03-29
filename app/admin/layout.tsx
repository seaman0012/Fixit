import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = (await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()) as { data: any }

  if (!profile || profile.role !== 'admin') {
    redirect('/resident')
  }

  return (
    <div className="bg-background min-h-screen">
      <AdminNav profile={profile} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
