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

interface AdminMenuItem {
	key: string;
	title: string;
	description?: string;
	url?: string;
	disabled?: boolean;
	icon: React.ReactNode;
}

const menuSections: { title: string; items: AdminMenuItem[] }[] = [
	{
		title: 'Platform',
		items: [
			{
				key: 'overview',
				title: 'Overview',
				description: 'Dashboard summary',
				url: '/_admin',
				icon: <DashboardRoundedIcon />,
			},
			{
				key: 'members',
				title: 'Members',
				description: 'Member accounts',
				url: '/_admin/users',
				icon: <PeopleAltRoundedIcon />,
			},
			{
				key: 'kindergartens',
				title: 'Kindergartens',
				description: 'Center profiles',
				url: '/_admin/properties',
				icon: <ApartmentRoundedIcon />,
			},
		],
	},
	{
		title: 'Applications',
		items: [
			{
				key: 'kindergarten-admin-applications',
				title: 'Kindergarten Admin Applications',
				description: 'Approval requests',
				url: '/_admin/users/kindergarten-admin-applications',
				icon: <AssignmentTurnedInRoundedIcon />,
			},
			{
				key: 'staff-applications',
				title: 'Staff Applications',
				description: 'Teacher approval requests',
				url: '/_admin/users/staff-applications',
				icon: <WorkRoundedIcon />,
			},
		],
	},
	{
		title: 'Operations',
		items: [
			{
				key: 'staff',
				title: 'Staff',
				description: 'Staff oversight',
				url: '/_admin/operations/staff',
				icon: <GroupsRoundedIcon />,
			},
			{
				key: 'groups',
				title: 'Groups',
				description: 'Class groups',
				url: '/_admin/operations/groups',
				icon: <GroupsRoundedIcon />,
			},
			{
				key: 'children',
				title: 'Children',
				description: 'Child records',
				url: '/_admin/operations/children',
				icon: <ChildCareRoundedIcon />,
			},
			{
				key: 'attendance',
				title: 'Attendance',
				description: 'Attendance records',
				url: '/_admin/operations/attendance',
				icon: <EventAvailableRoundedIcon />,
			},
		],
	},
	{
		title: 'Community',
		items: [
			{
				key: 'articles',
				title: 'Articles',
				description: 'Community moderation',
				url: '/_admin/community',
				icon: <ArticleRoundedIcon />,
			},
			{
				key: 'comments',
				title: 'Comments',
				description: 'Comment moderation',
				url: '/_admin/community/comments',
				icon: <CommentRoundedIcon />,
			},
		],
	},
	{
		title: 'Help later',
		items: [
			{
				key: 'faq',
				title: 'FAQ',
				description: 'Help content',
				disabled: true,
				icon: <HelpCenterRoundedIcon />,
			},
			{
				key: 'notices',
				title: 'Notices',
				description: 'Platform notices',
				disabled: true,
				icon: <CampaignRoundedIcon />,
			},
			{
				key: 'inquiries',
				title: 'Inquiries',
				description: 'Support requests',
				disabled: true,
				icon: <ContactSupportRoundedIcon />,
			},
		],
	},
];

const AdminMenuList = (props: any) => {
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
					primary={<Typography className="admin-menu-item-title">{item.title}</Typography>}
					secondary={
						item.description ? (
							<Typography className="admin-menu-item-description">{item.description}</Typography>
						) : null
					}
				/>
				{item.disabled && <Typography className="admin-menu-status">Later</Typography>}
			</ListItemButton>
		);
	};

	return (
		<Stack className="admin-menu">
			{menuSections.map((section) => (
				<Stack className="admin-menu-section" key={section.title}>
					<Typography className="admin-menu-section-title">{section.title}</Typography>
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
