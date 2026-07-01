import React from 'react';
import { Stack, Box } from '@mui/material';
import FamilyRestroomRoundedIcon from '@mui/icons-material/FamilyRestroomRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import ChildCareRoundedIcon from '@mui/icons-material/ChildCareRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import { useTranslation } from 'next-i18next';

const PlatformShowcase = () => {
	const { t } = useTranslation('common');
	const roleCards = [
		{
			label: t('home.roles.parentsTitle'),
			copy: t('home.roles.parentsCopy'),
			icon: FamilyRestroomRoundedIcon,
			image: '/img/kidsgarden/articles/article-child-confidence-support.png',
			tone: 'parents',
		},
		{
			label: t('home.roles.teachersTitle'),
			copy: t('home.roles.teachersCopy'),
			icon: SchoolRoundedIcon,
			image: '/img/kidsgarden/articles/article-play-based-learning.png',
			tone: 'teachers',
		},
		{
			label: t('home.roles.kindergartensTitle'),
			copy: t('home.roles.kindergartensCopy'),
			icon: BusinessRoundedIcon,
			image: '/img/kidsgarden/kindergartens/kg-01-exterior.png',
			tone: 'kindergartens',
		},
	];
	const platformFeatures = [
		{ title: t('home.features.applicationsTitle'), copy: t('home.features.applicationsCopy'), icon: AssignmentTurnedInRoundedIcon, tone: 'green' },
		{ title: t('home.features.childProfilesTitle'), copy: t('home.features.childProfilesCopy'), icon: ChildCareRoundedIcon, tone: 'lime' },
		{ title: t('home.features.groupsTitle'), copy: t('home.features.groupsCopy'), icon: GroupsRoundedIcon, tone: 'blue' },
		{ title: t('home.features.attendanceTitle'), copy: t('home.features.attendanceCopy'), icon: EventAvailableRoundedIcon, tone: 'green' },
		{ title: t('home.features.staffTitle'), copy: t('home.features.staffCopy'), icon: ManageAccountsRoundedIcon, tone: 'mint' },
		{ title: t('home.features.communityTitle'), copy: t('home.features.communityCopy'), icon: ForumRoundedIcon, tone: 'pink' },
	];
	const privacyItems = [
		{ title: t('home.privacy.phoneTitle'), copy: t('home.privacy.phoneCopy'), icon: LockRoundedIcon, tone: 'green' },
		{ title: t('home.privacy.dashboardsTitle'), copy: t('home.privacy.dashboardsCopy'), icon: ChatBubbleRoundedIcon, tone: 'honey' },
		{ title: t('home.privacy.moderatedTitle'), copy: t('home.privacy.moderatedCopy'), icon: VerifiedUserRoundedIcon, tone: 'blue' },
	];

	return (
		<Stack className={'platform-showcase'}>
			<Stack className={'platform-container'}>
				<Stack component={'section'} className={'platform-roles-section'}>
					<Stack className={'platform-section-heading'}>
						<h2>
							{t('home.rolesTitle')} <span className={'sprout-accent'} aria-hidden />
						</h2>
						<p>{t('home.rolesSubtitle')}</p>
					</Stack>

					<Box component={'div'} className={'platform-role-grid'}>
						{roleCards.map((card) => {
							const Icon = card.icon;

							return (
								<Box component={'article'} className={`platform-role-card ${card.tone}`} key={card.label}>
									<Box component={'div'} className={'role-card-top'}>
										<span className={'role-icon'}>
											<Icon />
										</span>
										<Box component={'div'}>
											<h3>{card.label}</h3>
											<p>{card.copy}</p>
										</Box>
									</Box>
									<Box
										component={'div'}
										className={'role-image'}
										sx={{ backgroundImage: `url("${card.image}")` }}
										aria-hidden
									/>
								</Box>
							);
						})}
					</Box>
				</Stack>

				<Stack component={'section'} className={'platform-feature-grid'}>
					<Stack className={'platform-section-heading compact'}>
						<h2>
							{t('home.featuresTitle')} <span className={'sprout-accent'} aria-hidden />
						</h2>
					</Stack>
					<Box component={'div'} className={'feature-grid-list'}>
						{platformFeatures.map((feature) => {
							const Icon = feature.icon;

							return (
								<Box component={'article'} className={`feature-card ${feature.tone}`} key={feature.title}>
									<span className={'feature-icon'}>
										<Icon />
									</span>
									<Box component={'div'}>
										<h3>{feature.title}</h3>
										<p>{feature.copy}</p>
									</Box>
								</Box>
							);
						})}
					</Box>
				</Stack>

				<Stack component={'section'} className={'platform-privacy-section'}>
					<Box
						component={'img'}
						className={'privacy-illustration'}
						src={'/img/about/about-safety-shield.png'}
						alt={t('home.privacyTitle')}
					/>
					<Box component={'div'} className={'privacy-copy'}>
						<h2>
							{t('home.privacyTitle')} <span className={'sprout-accent'} aria-hidden />
						</h2>
						<Box component={'div'} className={'privacy-list'}>
							{privacyItems.map((item) => {
								const Icon = item.icon;

								return (
									<Box component={'article'} className={`privacy-card ${item.tone}`} key={item.title}>
										<span>
											<Icon />
										</span>
										<h3>{item.title}</h3>
										<p>{item.copy}</p>
									</Box>
								);
							})}
						</Box>
					</Box>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default PlatformShowcase;
