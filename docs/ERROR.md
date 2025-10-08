Uncaught Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <PathnameContextProviderAdapter router={{sdc:{},sbc:{}, ...}} isAutoExport={true}>
      <App pageProps={{}} Component={function AdminOverviewPage} err={undefined} router={{sdc:{},sbc:{}, ...}}>
        <QueryClientProvider client={{}}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
            <SkipLink>
            <SkipLink>
            <DashboardLayout>
              <div className="min-h-scre...">
                <SkipLink>
                <SkipLink>
                <div className="hidden lg:...">
                  <div className="flex h-ful...">
                    <div>
                    <nav>
                    <div className="border-t p-4">
+                     <div className={"flex items-center gap-3 "}>
-                     <a className={"flex items-center gap-3 group "} href="/dashboard/profile">
                ...
            ...
      ...
    React 8
    performWorkUntilDeadline webpack-internal:///(pages-dir-browser)/../node_modules/scheduler/cjs/scheduler.development.js:45
react-dom-client.development.js:5238:1
[Fast Refresh] done in 1759901304096ms report-hmr-latency.ts:26:11
XHRPOST
https://ofkcmmwibufljpemmdde.supabase.co/rest/v1/rpc/get_user_profile_with_email
[HTTP/3 404  395ms]

XHROPTIONS
https://ofkcmmwibufljpemmdde.supabase.co/rest/v1/rpc/get_user_profile_with_email
[HTTP/3 200  121ms]

XHRGET
http://localhost:3000/api/admin/reports

[Fast Refresh] rebuilding hot-reloader-pages.ts:273:17
XHRGET
http://localhost:3000/_next/static/webpack/63d2a438b4987b5e.webpack.hot-update.json
[HTTP/1.1 200 OK 190ms]

[Fast Refresh] rebuilding hot-reloader-pages.ts:273:17
GET
http://localhost:3000/_next/static/webpack/pages/_app.63d2a438b4987b5e.hot-update.js
[HTTP/1.1 200 OK 764ms]

GET
http://localhost:3000/_next/static/webpack/webpack.63d2a438b4987b5e.hot-update.js
[HTTP/1.1 200 OK 697ms]

Error in parsing value for ‘-webkit-text-size-adjust’.  Declaration dropped. globals.css:1:1
Unknown property ‘-moz-osx-font-smoothing’.  Declaration dropped. globals.css:1:1
Unknown property ‘-moz-osx-font-smoothing’.  Declaration dropped. globals.css:1:1
Ruleset ignored due to bad selector. globals.css:1:1
Found invalid value for media feature. globals.css:1:1
[Fast Refresh] done in 1183ms report-hmr-latency.ts:26:11

​