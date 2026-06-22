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
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';

const roleCards = [
	{
		label: 'Parents',
		copy: 'Stay informed, connected, and involved in every milestone.',
		icon: FamilyRestroomRoundedIcon,
		image: '/img/kidsgarden/articles/article-child-confidence-support.png',
		tone: 'parents',
	},
	{
		label: 'Teachers',
		copy: 'Simplify your day and spend more time teaching.',
		icon: SchoolRoundedIcon,
		image: '/img/kidsgarden/articles/article-play-based-learning.png',
		tone: 'teachers',
	},
	{
		label: 'Kindergartens',
		copy: 'Run your center efficiently and grow with confidence.',
		icon: BusinessRoundedIcon,
		image: '/img/kidsgarden/kindergartens/kg-01-exterior.png',
		tone: 'kindergartens',
	},
];

const platformFeatures = [
	{
		title: 'Online Applications',
		copy: 'Easily apply and manage admissions online.',
		icon: AssignmentTurnedInRoundedIcon,
		tone: 'green',
	},
	{
		title: 'Child Profiles',
		copy: 'All important details in one safe place.',
		icon: ChildCareRoundedIcon,
		tone: 'lime',
	},
	{
		title: 'Groups',
		copy: 'Organize classes and activities with ease.',
		icon: GroupsRoundedIcon,
		tone: 'blue',
	},
	{
		title: 'Attendance',
		copy: 'Track attendance in real-time and stay updated.',
		icon: EventAvailableRoundedIcon,
		tone: 'green',
	},
	{
		title: 'Staff Management',
		copy: 'Manage your team and permissions.',
		icon: ManageAccountsRoundedIcon,
		tone: 'mint',
	},
	{
		title: 'Parent Community',
		copy: 'Connect, share, and support each other.',
		icon: ForumRoundedIcon,
		tone: 'pink',
	},
];

const privacyItems = [
	{
		title: 'No public phone exposure',
		copy: 'Contact details stay protected from public browsing.',
		icon: LockRoundedIcon,
		tone: 'green',
	},
	{
		title: 'Role-based private dashboards',
		copy: 'Everyone sees only what is meant for their role.',
		icon: ChatBubbleRoundedIcon,
		tone: 'honey',
	},
	{
		title: 'Moderated community',
		copy: 'Parent Board and News stay safer through moderation.',
		icon: VerifiedUserRoundedIcon,
		tone: 'blue',
	},
];

const PlatformShowcase = () => {
	return (
		<Stack className={'platform-showcase'}>
			<Stack className={'platform-container'}>
				<Stack component={'section'} className={'platform-roles-section'}>
					<Stack className={'platform-section-heading'}>
						<h2>
							Built for every role <span className={'sprout-accent'} aria-hidden />
						</h2>
						<p>Powerful features tailored to meet the needs of everyone in your child&apos;s journey.</p>
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
							Everything opens after you join KidsGarden <span className={'sprout-accent'} aria-hidden />
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
					<Box component={'div'} className={'privacy-illustration'} aria-hidden>
						<ShieldRoundedIcon className={'shield'} />
						<LockRoundedIcon className={'lock'} />
					</Box>
					<Box component={'div'} className={'privacy-copy'}>
						<h2>
							Your child&apos;s safety & privacy are our top priority <span className={'sprout-accent'} aria-hidden />
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
