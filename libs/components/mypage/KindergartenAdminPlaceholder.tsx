import React from 'react';
import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

interface KindergartenAdminPlaceholderProps {
	title: string;
	description: string;
}

const KindergartenAdminPlaceholder = ({ title, description }: KindergartenAdminPlaceholderProps) => {
	const { t } = useTranslation('common');

	return (
		<Stack spacing={2} sx={{ width: '100%', padding: '34px', borderRadius: '16px', background: '#fff' }}>
			<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>{title}</Typography>
			<Typography sx={{ maxWidth: '640px', color: '#6b7280', lineHeight: 1.7 }}>{description}</Typography>
			<Typography sx={{ color: '#9ca3af' }}>{t('mypageText.KindergartenAdminPlaceholder.reservedNotice')}</Typography>
		</Stack>
	);
};

export default KindergartenAdminPlaceholder;
