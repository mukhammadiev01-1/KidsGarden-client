import React from 'react';
import { Stack, Box } from '@mui/material';
import Link from 'next/link';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ToysRoundedIcon from '@mui/icons-material/ToysRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import LunchDiningRoundedIcon from '@mui/icons-material/LunchDiningRounded';
import CheckroomRoundedIcon from '@mui/icons-material/CheckroomRounded';
import BackpackRoundedIcon from '@mui/icons-material/BackpackRounded';
import { useTranslation } from 'next-i18next';

const Advertisement = () => {
	const { t } = useTranslation('common');
	const storeItems = [
		{ title: t('home.storeItems.booksTitle'), copy: t('home.storeItems.booksCopy'), icon: MenuBookRoundedIcon },
		{ title: t('home.storeItems.toysTitle'), copy: t('home.storeItems.toysCopy'), icon: ToysRoundedIcon },
		{ title: t('home.storeItems.suppliesTitle'), copy: t('home.storeItems.suppliesCopy'), icon: SchoolRoundedIcon },
		{ title: t('home.storeItems.lunchTitle'), copy: t('home.storeItems.lunchCopy'), icon: LunchDiningRoundedIcon, altIcon: CheckroomRoundedIcon },
	];

	return (
		<Stack component={'section'} className={'video-frame kg-store-section'}>
			<Stack className={'store-heading'}>
				<h2>
					{t('home.storeTitle')} <span className={'sprout-accent'} aria-hidden />
				</h2>
				<p>{t('home.storeSubtitle')}</p>
			</Stack>
			<Stack className={'store-container'}>
				<Box component={'article'} className={'store-feature-card'}>
					<Box component={'div'} className={'store-feature-copy'}>
						<h3>{t('home.storeFeatureTitle')}</h3>
						<p>{t('home.storeFeatureCopy')}</p>
						<Link
							href="/store"
							className="store-feature-link"
							aria-label={t('home.openStoreComingSoon')}
							style={{ display: 'inline-flex', width: 'fit-content', textDecoration: 'none' }}
						>
							<span>{t('home.exploreStore')}</span>
						</Link>
					</Box>
					<Box component={'div'} className={'store-feature-visual'} aria-hidden>
						<BackpackRoundedIcon />
					</Box>
				</Box>
				<Box component={'div'} className={'store-product-grid'}>
					{storeItems.map((item) => {
						const Icon = item.icon;
						const AltIcon = item.altIcon;

						return (
							<Box component={'article'} className={'store-product-card'} key={item.title}>
								<strong>{t('home.comingSoon')}</strong>
								<span className={'store-product-icon'}>
									<Icon />
									{AltIcon && <AltIcon />}
								</span>
								<h3>{item.title}</h3>
								<p>{item.copy}</p>
							</Box>
						);
					})}
				</Box>
			</Stack>
		</Stack>
	);
};

export default Advertisement;
