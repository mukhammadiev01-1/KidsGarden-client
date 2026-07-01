import en from '../../public/locales/en/common.json';
import ko from '../../public/locales/ko/common.json';
import kr from '../../public/locales/kr/common.json';
import ru from '../../public/locales/ru/common.json';
import uz from '../../public/locales/uz/common.json';

type CommonDictionary = Record<string, any>;

const dictionaries: Record<string, CommonDictionary> = { en, ko, kr, ru, uz };

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
