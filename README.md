# `partialPrefetching` + inline Server Function: production response never terminates

Minimal reproduction for a Next.js bug: with `cacheComponents` + `partialPrefetching`, a page
that (a) has at least one `"use cache"` entry, (b) renders an inline `"use server"` function
that closes over a variable, and (c) has a request-time hole (`cookies()` in Suspense) streams
all of its HTML in production but never closes the HTTP response.

```bash
pnpm install
pnpm build
pnpm start            # next start -p 3030
curl -s -m 10 -o /dev/null -w "%{http_code} %{time_total}s\n" http://localhost:3030/
# → 200 10.0s (curl times out; the body has no </body></html>)
```

`next dev` is not affected. Removing any one of the three ingredients makes the response close
normally.

Cause: `encryptActionBoundArgs` (`packages/next/src/server/app-render/encryption.ts`) starts a
`CacheSignal` read and, when the encrypted bound args are already in the Resume Data Cache
(always the case at request time once the RDC was persisted by the build-time prerender),
returns early without `endReadIfStarted()`. The request's `cacheReady()` never resolves, so the
runtime-prefetch stream that Partial Prefetching embeds in the RSC payload is never closed and
the response never ends.

`patches/next@16.4.1.patch` + `pnpm-workspace.patched.yaml` show the one-line fix: rename the
yaml to `pnpm-workspace.yaml`, `pnpm install`, rebuild — the response closes in ~0.1 s.
