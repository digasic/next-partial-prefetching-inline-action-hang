/** @type {import('next').NextConfig} */
const config = {
	cacheComponents: true,
	// The bug needs the runtime-prefetch stream that Partial Prefetching embeds in
	// every dynamic RSC payload. Without this flag the page responds normally.
	partialPrefetching: true,
};

export default config;
