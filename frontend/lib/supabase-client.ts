import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  // Only create client in browser environment
  if (typeof window === "undefined") {
    // Return a mock client during SSR/build
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }

  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error("Missing Supabase environment variables");
      return null as unknown as ReturnType<typeof createBrowserClient>;
    }

    browserClient = createBrowserClient(url, key, {
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    });
  }

  return browserClient;
}
