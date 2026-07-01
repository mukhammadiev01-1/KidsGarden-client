import React from 'react';
import Link from 'next/link';
import { withRouter } from 'next/router';
import { List, ListItemButton, ListItemIcon, ListItemText, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ChildCareRoundedIcon from '@mui/icons-material/ChildCareRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import CommentRoundedIcon from '@mui/icons-material/CommentRounded';
import HelpCenterRoundedIcon from '@mui/icons-material/HelpCenterRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import ContactSupportRoundedIcon from '@mui/icons-material/ContactSupportRounded';
import { getStaticCommonTranslator } from '../../i18n/staticCommon';

interface AdminMenuItem {
	key: string;
	titleKey: string;
	descriptionKey?: string;
	url?: string;
	disabled?: boolean;
	icon: React.ReactNode;
}

const menuSections: { key: string; titleKey: string; items: AdminMenuItem[] }[] = [
	{
		key: 'platform',
		titleKey: 'admin.sections.platform',
		items: [
			{
				key: 'overview',
				titleKey: 'admin.menu.overview',
				descriptionKey: 'admin.descriptions.overview',
				url: '/_admin',
				icon: <DashboardRoundedIcon />,
			},
			{
				key: 'members',
				titleKey: 'admin.menu.members',
				descriptionKey: 'admin.descriptions.members',
				url: '/_admin/users',
				icon: <PeopleAltRoundedIcon />,
			},
			{
				key: 'kindergartens',
				titleKey: 'admin.menu.kindergartens',
				descriptionKey: 'admin.descriptions.kindergartens',
				url: '/_admin/kindergartens',
				icon: <ApartmentRoundedIcon />,
			},
		],
	},
	{
		key: 'applications',
		titleKey: 'admin.sections.applications',
		items: [
			{
				key: 'parent-applications',
				titleKey: 'admin.menu.kindergartenApplications',
				descriptionKey: 'admin.descriptions.kindergartenApplications',
				url: '/_admin/applications',
				icon: <AssignmentTurnedInRoundedIcon />,
			},
			{
				key: 'kindergarten-admin-applications',
				titleKey: 'admin.menu.kindergartenAdminApplications',
				descriptionKey: 'admin.descriptions.kindergartenAdminApplications',
				url: '/_admin/users/kindergarten-admin-applications',
				icon: <AssignmentTurnedInRoundedIcon />,
			},
			{
				key: 'staff-applications',
				titleKey: 'admin.menu.teacherApplications',
				descriptionKey: 'admin.descriptions.teacherApplications',
				url: '/_admin/users/staff-applications',
				icon: <WorkRoundedIcon />,
			},
		],
	},
	{
		key: 'operations',
		titleKey: 'admin.sections.operations',
		items: [
			{
				key: 'staff',
				titleKey: 'admin.menu.staff',
				descriptionKey: 'admin.descriptions.staff',
				url: '/_admin/operations/staff',
				icon: <GroupsRoundedIcon />,
			},
			{
				key: 'groups',
				titleKey: 'admin.menu.groups',
				descriptionKey: 'admin.descriptions.groups',
				url: '/_admin/operations/groups',
				icon: <GroupsRoundedIcon />,
			},
			{
				key: 'children',
				titleKey: 'admin.menu.children',
				descriptionKey: 'admin.descriptions.children',
				url: '/_admin/operations/children',
				icon: <ChildCareRoundedIcon />,
			},
			{
				key: 'attendance',
				titleKey: 'admin.menu.attendance',
				descriptionKey: 'admin.descriptions.attendance',
				url: '/_admin/operations/attendance',
				icon: <EventAvailableRoundedIcon />,
			},
		],
	},
	{
		key: 'community',
		titleKey: 'admin.sections.community',
		items: [
			{
				key: 'articles',
				titleKey: 'admin.menu.articles',
				descriptionKey: 'admin.descriptions.articles',
				url: '/_admin/community',
				icon: <ArticleRoundedIcon />,
			},
			{
				key: 'comments',
				titleKey: 'admin.menu.comments',
				descriptionKey: 'admin.descriptions.comments',
				url: '/_admin/community/comments',
				icon: <CommentRoundedIcon />,
			},
		],
	},
	{
		key: 'helpLater',
		titleKey: 'admin.sections.helpLater',
		items: [
			{
				key: 'faq',
				titleKey: 'admin.menu.faq',
				descriptionKey: 'admin.descriptions.faq',
				disabled: true,
				icon: <HelpCenterRoundedIcon />,
			},
			{
				key: 'notices',
				titleKey: 'admin.menu.notices',
				descriptionKey: 'admin.descriptions.notices',
				disabled: true,
				icon: <CampaignRoundedIcon />,
			},
			{
				key: 'inquiries',
				titleKey: 'admin.menu.inquiries',
				descriptionKey: 'admin.descriptions.inquiries',
				disabled: true,
				icon: <ContactSupportRoundedIcon />,
			},
		],
	},
];

const AdminMenuList = (props: any) => {
	const t = getStaticCommonTranslator(props.router?.locale);
	const pathname = props.router?.pathname || '';

	const isActive = (url?: string) => {
		if (!url) return false;
		return pathname === url;
	};

	const renderItem = (item: AdminMenuItem) => {
		const active = isActive(item.url);
		const linkProps =
			item.disabled || !item.url
				? { component: 'li' as const }
				: { component: Link as any, href: item.url, shallow: true, replace: true };

		return (
			<ListItemButton
				{...linkProps}
				disabled={item.disabled}
				className={`admin-menu-item${active ? ' is-active' : ''}${item.disabled ? ' is-disabled' : ''}`}
			>
				<ListItemIcon className="admin-menu-icon">{item.icon}</ListItemIcon>
				<ListItemText
					primary={<Typography className="admin-menu-item-title">{t(item.titleKey)}</Typography>}
					secondary={
						item.descriptionKey ? (
							<Typography className="admin-menu-item-description">{t(item.descriptionKey)}</Typography>
						) : null
					}
				/>
				{item.disabled && <Typography className="admin-menu-status">{t('dashboardCommon.later')}</Typography>}
			</ListItemButton>
		);
	};

	return (
		<Stack className="admin-menu">
			{menuSections.map((section) => (
				<Stack className="admin-menu-section" key={section.key}>
					<Typography className="admin-menu-section-title">{t(section.titleKey)}</Typography>
					<List className="admin-menu-list" disablePadding>
						{section.items.map((item) => (
							<React.Fragment key={item.key}>{renderItem(item)}</React.Fragment>
						))}
					</List>
				</Stack>
			))}
		</Stack>
	);
};

export default withRouter(AdminMenuList);
