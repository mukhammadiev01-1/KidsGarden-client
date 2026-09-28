import { useEffect, useState } from 'react';
import en from '../../public/locales/en/common.json';

type CommonDictionary = Record<string, any>;

// Only English ships in the bundle. The other dictionaries used to be static
// imports too -- a 224 KB chunk with every language on all 16 admin routes --
// and are now loaded on demand (webpack splits each import() into its own
// chunk) by useStaticCommonLocale() in the admin layout.
const dictionaries: Record<string, CommonDictionary> = { en };

const loaders: Record<string, () => Promise<{ default: CommonDictionary }>> = {
	ko: () => import('../../public/locales/ko/common.json'),
	kr: () => import('../../public/locales/kr/common.json'),
	ru: () => import('../../public/locales/ru/common.json'),
	uz: () => import('../../public/locales/uz/common.json'),
};

const pending = new Map<string, Promise<void>>();

export const loadStaticCommonLocale = (locale?: string | null): Promise<void> => {
	const key = locale || '';
	if (!key || dictionaries[key] || !loaders[key]) return Promise.resolve();
	let promise = pending.get(key);
	if (!promise) {
		promise = loaders[key]()
			.then((module) => {
				dictionaries[key] = module.default;
			})
			.finally(() => pending.delete(key));
		pending.set(key, promise);
	}
	return promise;
};

/**
 * Loads the dictionary for `locale` and re-renders once it is in. Components
 * below the caller keep using the synchronous getStaticCommonTranslator; until
 * the chunk arrives they render English (the previous behaviour was English
 * for nothing, but 224 KB heavier).
 */
export const useStaticCommonLocale = (locale?: string | null): boolean => {
	const [ready, setReady] = useState(() => !locale || Boolean(dictionaries[locale]));
	useEffect(() => {
		let cancelled = false;
		if (!locale || dictionaries[locale]) {
			setReady(true);
			return;
		}
		setReady(false);
		loadStaticCommonLocale(locale).then(() => {
			if (!cancelled) setReady(true);
		});
		return () => {
			cancelled = true;
		};
	}, [locale]);
	return ready;
};

const getNestedValue = (dictionary: CommonDictionary, key: string) =>
	key.split('.').reduce<any>((value, segment) => {
		if (!value || typeof value !== 'object') return undefined;
		return value[segment];
	}, dictionary);

export const getStaticCommonTranslator = (locale?: string | null) => {
	const dictionary = dictionaries[locale || ''] || dictionaries.en;

	return (key: string, fallbackOrParams?: string | Record<string, string | number>) => {
		const value = getNestedValue(dictionary, key) ?? getNestedValue(dictionaries.en, key);
		const fallback = typeof fallbackOrParams === 'string' ? fallbackOrParams : undefined;
		const params = typeof fallbackOrParams === 'object' ? fallbackOrParams : undefined;
		const text = typeof value === 'string' ? value : fallback ?? key;
		if (!params) return text;
		return Object.entries(params).reduce(
			(result, [paramKey, paramValue]) => result.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramValue)),
			text,
		);
	};
};
