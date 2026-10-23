import { Suspense } from "react";
import { cookies } from "next/headers";

/**
 * Any "use cache" entry on the page makes Next persist the Resume Data Cache (RDC) into
 * the postponed state at build time — together with the encrypted bound args of inline
 * Server Functions. Without an entry the RDC is serialized as `null` and the bug does
 * not trigger (every request then re-encrypts the bound args, which ends the read).
 */
async function getGreeting() {
	"use cache";
	return "Hello";
}

async function Greeting() {
	return <h1>{await getGreeting()}</h1>;
}

/**
 * A Server Component with an inline Server Function that closes over a variable.
 * The compiler turns `onSubmit` into
 * `$$RSC_SERVER_ACTION_0.bind(null, encryptActionBoundArgs(id, locale))`.
 * At request time `encryptActionBoundArgs` finds the encrypted value in the RDC and
 * returns early — without ending the cache-signal read it started.
 */
function SearchForm({ locale }) {
	async function onSubmit(formData) {
		"use server";
		console.log(locale, formData.get("q"));
	}

	return (
		<form action={onSubmit}>
			<input name="q" placeholder="Search" />
			<button type="submit">Go</button>
		</form>
	);
}

/** Request-time data inside Suspense: the page gets a static shell and is resumed per request. */
async function CookieGate() {
	await cookies();
	return <p>Dynamic content</p>;
}

export default function Page() {
	return (
		<main>
			<Greeting />
			<SearchForm locale="en" />
			<Suspense fallback={<p>Loading…</p>}>
				<CookieGate />
			</Suspense>
		</main>
	);
}
