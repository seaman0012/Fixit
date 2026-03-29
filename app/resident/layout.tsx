import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResidentNav from '@/components/resident/resident-nav'

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = (await supabase
    .from('profiles')
    .select(
      `
      *,
      rooms:room_id (
        room_number
      )
    `
    )
    .eq('id', user.id)
    .single()) as { data: any }

  if (!profile || profile.role !== 'resident') {
    redirect('/admin')
  }

  return (
    <div className="bg-background min-h-screen">
      <ResidentNav profile={profile} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
