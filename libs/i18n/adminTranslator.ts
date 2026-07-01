import { useRouter } from 'next/router';
import { getStaticCommonTranslator } from './staticCommon';

export const useAdminTranslation = () => {
	const router = useRouter();
	const t = getStaticCommonTranslator(router.locale);

	const statusLabel = (status?: string) => {
		if (!status) return '-';
		return t(`statuses.${status}`, status === 'SOLD' ? t('statuses.CLOSED') : status);
	};

	const roleLabel = (role?: string) => {
		if (!role) return '-';
		return t(`roles.${role}`, role);
	};

	const categoryLabel = (category?: string) => {
		if (!category) return '-';
		return t(`adminPages.categories.${category}`, category);
	};

	const typeLabel = (type?: string) => {
		if (!type) return '-';
		return t(`adminPages.types.${type}`, type);
	};

	return { t, statusLabel, roleLabel, categoryLabel, typeLabel };
};
