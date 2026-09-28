export const LOCALE_COOKIE = 'NEXT_LOCALE';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Remember the chosen locale in a cookie as well as localStorage. localStorage
 * is client-only, so every non-English visitor got an English first paint and a
 * second route transition on each cold load; middleware.ts reads this cookie
 * and redirects to the right locale before the page renders.
 */
export const persistLocale = (locale: string): void => {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem('locale', locale);
	} catch {
		// storage can be blocked; the cookie still works
	}
	document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
};
