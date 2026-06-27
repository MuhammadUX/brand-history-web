import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-config";

/**
 * Refreshes the Supabase auth session cookie on each request so Server
 * Components always see a valid session.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Touch the user to trigger a token refresh when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // SEC-5: belt-and-suspenders gate for the admin area. Pages/actions already
  // guard server-side; this avoids flashing the admin shell to non-operators
  // and short-circuits unauthenticated traffic at the edge. Fail-safe: on any
  // error we fall through to the page-level guard rather than locking the site.
  const adminMatch = request.nextUrl.pathname.match(/^\/([^/]+)\/admin(\/|$)/);
  if (adminMatch) {
    const locale = adminMatch[1];
    try {
      let isOperator = false;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        const role = profile?.role;
        isOperator = role === "editor" || role === "admin";
      }
      if (!isOperator) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = `/${locale}/login`;
        loginUrl.search = `?next=${encodeURIComponent(
          request.nextUrl.pathname
        )}`;
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      // Fall through to the existing page-level guard on any failure.
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all paths except API routes, static assets and Next internals.
    // Excluding /api/ keeps the Moyasar webhook off the session-refresh path.
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
