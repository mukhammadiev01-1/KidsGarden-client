import React from 'react';
import Link from 'next/link';
import { Stack, Box } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import { useTranslation } from 'next-i18next';

const FinalCta = () => {
	const { t } = useTranslation('common');

	return (
		<Stack component={'section'} className={'final-cta-section'}>
			<Box component={'div'} className={'final-cta-copy'}>
				<h2>{t('home.finalTitle')}</h2>
				<p>{t('home.finalCopy')}</p>
			</Box>
			<Box component={'div'} className={'final-cta-visual'} aria-hidden />
			<Box component={'div'} className={'final-cta-actions'}>
				<Link href={'/kindergartens'}>
					<span>
						<SearchRoundedIcon /> {t('home.exploreKindergartens')}
					</span>
				</Link>
				<Link href={'/account/join'}>
					<span>
						<PersonAddAltRoundedIcon /> {t('home.joinAsParent')}
					</span>
				</Link>
				<Link href={'/cs'}>
					<span>
						<BusinessRoundedIcon /> {t('home.forCenters')}
					</span>
				</Link>
			</Box>
		</Stack>
	);
};

export default FinalCta;
