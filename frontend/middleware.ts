import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    // Check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.next();
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const { 
      data: { user }, 
    } = await supabase.auth.getUser();

    let userRole: string | null = null;
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles') // <--- HERE!
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile in middleware:', error);
      } else if (profile) {
        userRole = profile.role;
      }
    }

    const protectedPaths = ['/dashboard', '/profile', '/approvals', '/documents', '/team'];
    const adminProtectedPaths = ['/dashboard/admin/documents'];

    const isProtectedRoute = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
    const isAdminProtectedRoute = adminProtectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

    // if user is not signed in and the current path is protected, redirect the user to /login
    if (!user && isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // if user is signed in and the current path is /login or /register, redirect the user to /dashboard
    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If accessing an admin-protected path without admin/hr role, redirect to dashboard
    if (isAdminProtectedRoute && (!user || (userRole !== 'admin' && userRole !== 'hr'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue with the request even if middleware fails
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
