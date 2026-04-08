import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Allow API routes to pass through without auth-route redirects.
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next({ request })
  }

  // Disable register route
  if (request.nextUrl.pathname === '/auth/register') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/auth')
  const isAuthErrorRoute = pathname === '/auth/error'

  // If unauthenticated and not on auth routes, send to login.
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If authenticated user opens auth routes, redirect by role.
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    const isUpdatePasswordRoute = pathname === '/auth/update-password'

    if (isUpdatePasswordRoute) {
      return supabaseResponse
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active, status')
      .eq('id', user.id)
      .single()

    if (profile && !profile.is_active) {
      // Allow suspended users to open the dedicated error page without redirect loops.
      if (isAuthErrorRoute) {
        return supabaseResponse
      }

      url.pathname = '/auth/error'
      url.search = ''
      url.searchParams.set('error', 'account_suspended')
    } else if (profile?.role === 'admin') {
      url.pathname = '/admin'
      url.search = ''
    } else if (!profile) {
      // If profile cannot be read yet (RLS/race), don't force a dashboard redirect from auth pages.
      return supabaseResponse
    } else {
      url.pathname = '/resident'
      url.search = ''
    }

    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
