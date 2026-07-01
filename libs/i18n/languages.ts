export type AppLocale = 'en' | 'ko' | 'ru' | 'uz';
export type SupportedLocale = AppLocale | 'kr';

export interface LanguageMeta {
	code: AppLocale;
	label: string;
	shortLabel: string;
	flagSrc?: string;
}

export const DEFAULT_LOCALE: AppLocale = 'en';
export const LEGACY_KOREAN_LOCALE = 'kr';

export const LANGUAGES: LanguageMeta[] = [
	{
		code: 'en',
		label: 'English',
		shortLabel: 'EN',
		flagSrc: '/img/flag/langen.png',
	},
	{
		code: 'ko',
		label: '한국어',
		shortLabel: 'KO',
		flagSrc: '/img/flag/langkr.png',
	},
	{
		code: 'ru',
		label: 'Русский',
		shortLabel: 'RU',
		flagSrc: '/img/flag/langru.png',
	},
	{
		code: 'uz',
		label: 'O‘zbekcha',
		shortLabel: 'UZ',
	},
];

export const APP_LOCALES = LANGUAGES.map((language) => language.code);
export const NEXT_I18N_LOCALES: SupportedLocale[] = [...APP_LOCALES, LEGACY_KOREAN_LOCALE];
export const LOCALE_PATH_PATTERN = /^\/(en|ko|kr|ru|uz)(\/|$)/;

export const normalizeLocale = (locale?: string | null): AppLocale => {
	if (!locale) return DEFAULT_LOCALE;
	if (locale === LEGACY_KOREAN_LOCALE) return 'ko';
	if (APP_LOCALES.includes(locale as AppLocale)) return locale as AppLocale;
	return DEFAULT_LOCALE;
};

export const isSupportedLocale = (locale?: string | null): locale is AppLocale => {
	if (!locale) return false;
	return APP_LOCALES.includes(normalizeLocale(locale));
};

export const getLanguageMeta = (locale?: string | null): LanguageMeta => {
	const normalizedLocale = normalizeLocale(locale);
	return LANGUAGES.find((language) => language.code === normalizedLocale) || LANGUAGES[0];
};

export const hasLocalePathPrefix = (pathname?: string | null): boolean => {
	if (!pathname) return false;
	return LOCALE_PATH_PATTERN.test(pathname);
};
