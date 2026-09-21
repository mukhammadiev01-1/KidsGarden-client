const PROBE_ORIGIN = 'http://kidsgarden.invalid';

/**
 * Returns `target` only when it is a same-origin relative path, otherwise `fallback`.
 *
 * Post-login redirects read `?referrer=` straight from the URL, and Next's router
 * navigates to absolute URLs, so an unchecked value turns a crafted login link
 * into a redirect to any site right after the user authenticates -- a ready-made
 * phishing step. Anything that could leave the origin is rejected:
 *
 *   https://evil.example   absolute URL
 *   //evil.example         protocol-relative
 *   /\evil.example         browsers normalise the backslash to //
 *   javascript:alert(1)    non-http scheme
 */
export const safeRedirectPath = (target: unknown, fallback = '/'): string => {
	if (typeof target !== 'string') return fallback;

	const value = target.trim();
	if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;

	// Resolve against a throwaway origin and confirm the result never left it. This
	// catches encodings and control characters the prefix checks above do not.
	try {
		const url = new URL(value, PROBE_ORIGIN);
		if (url.origin !== PROBE_ORIGIN) return fallback;

		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return fallback;
	}
};
