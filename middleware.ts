import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'ko', 'kr', 'ru', 'uz'];
const DEFAULT_LOCALE = 'en';

/**
 * localeDetection is off (no Accept-Language guessing), so honour the locale
 * the visitor chose earlier (NEXT_LOCALE cookie, written by persistLocale) on
 * requests that carry no locale prefix. This gives the correct language on the
 * first server render instead of an English paint followed by a client-side
 * redirect.
 */
export function middleware(request: NextRequest) {
	const chosen = request.cookies.get('NEXT_LOCALE')?.value;
	if (!chosen || chosen === DEFAULT_LOCALE || !LOCALES.includes(chosen)) return NextResponse.next();
	if (request.nextUrl.locale !== DEFAULT_LOCALE) return NextResponse.next();

	// An explicit /en/ prefix is a deliberate choice; leave it alone.
	const rawPath = new URL(request.url).pathname;
	if (rawPath === '/en' || rawPath.startsWith('/en/')) return NextResponse.next();

	const url = request.nextUrl.clone();
	url.locale = chosen;
	return NextResponse.redirect(url);
}

export const config = {
	// Pages only: skip Next internals, API routes and static files.
	matcher: ['/((?!api|_next|img|fonts|favicon\\.ico|.*\\..*).*)'],
};
