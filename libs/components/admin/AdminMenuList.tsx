<<<<<<< ours
import React, { useEffect, useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import Link from 'next/link';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { User, UserCircleGear } from 'phosphor-react';
import cookies from 'js-cookie';
import useDeviceDetect from '../../hooks/useDeviceDetect';

const AdminMenuList = (props: any) => {
	const router = useRouter();
	const device = useDeviceDetect();
	const [mobileLayout, setMobileLayout] = useState(false);
	const [openSubMenu, setOpenSubMenu] = useState('Users');
	const [openMenu, setOpenMenu] = useState(typeof window === 'object' ? cookies.get('admin_menu') === 'true' : false);
	const [clickMenu, setClickMenu] = useState<any>([]);
	const [clickSubMenu, setClickSubMenu] = useState('');

	const {
		router: { pathname },
	} = props;

	const pathnames = pathname.split('/').filter((x: any) => x);

	/** LIFECYCLES **/
	useEffect(() => {
		if (device === 'mobile') setMobileLayout(true);

		switch (pathnames[1]) {
			case 'properties':
				setClickMenu(['kindergartens']);
				break;
			case 'community':
				setClickMenu(['community']);
				break;
			case 'cs':
				setClickMenu(['cs']);
				break;
			default:
				setClickMenu(['members']);
				break;
		}

		switch (pathnames[2]) {
			case 'logs':
				setClickSubMenu('Logs');
				break;
			case 'kindergarten-admin-applications':
				setClickSubMenu('Admin Applications');
				break;
			case 'inquiry':
				setClickSubMenu('1:1 Inquiry');
				break;
			case 'notice':
				setClickSubMenu('Notice');
				break;
			case 'faq':
				setClickSubMenu('FAQ');
				break;
			case 'board_create':
				setClickSubMenu('Board Create');
				break;
			default:
				setClickSubMenu('List');
				break;
		}
	}, []);

	/** HANDLERS **/
	const subMenuChangeHandler = (target: string) => {
		if (clickMenu.find((item: string) => item === target)) {
			// setOpenSubMenu('');
			setClickMenu(clickMenu.filter((menu: string) => target !== menu));
		} else {
			// setOpenSubMenu(target);
			setClickMenu([...clickMenu, target]);
		}
	};

	const menu_set = [
		{
			key: 'members',
			title: 'Members',
			icon: <User size={20} color="#bdbdbd" weight="fill" />,
			on_click: () => subMenuChangeHandler('members'),
		},
		{
			key: 'kindergartens',
			title: 'Kindergartens',
			icon: <UserCircleGear size={20} color="#bdbdbd" weight="fill" />,
			on_click: () => subMenuChangeHandler('kindergartens'),
		},
	];

	const sub_menu_set: any = {
		members: [
			{ title: 'List', url: '/_admin/users' },
			{ title: 'Admin Applications', url: '/_admin/users/kindergarten-admin-applications' },
		],
		kindergartens: [{ title: 'List', url: '/_admin/properties' }],
		community: [{ title: 'List', url: '/_admin/community' }],
		cs: [
			{ title: 'FAQ', url: '/_admin/cs/faq' },
			{ title: 'Notice', url: '/_admin/cs/notice' },
		],
	};

	return (
		<>
			{menu_set.map((item, index) => (
				<List className={'menu_wrap'} key={index} disablePadding>
					<ListItemButton
						onClick={item.on_click}
						component={'li'}
						className={clickMenu[0] === item.key ? 'menu on' : 'menu'}
						sx={{
							minHeight: 48,
							justifyContent: openMenu ? 'initial' : 'center',
							px: 2.5,
						}}
					>
						<ListItemIcon
							sx={{
								minWidth: 0,
								mr: openMenu ? 3 : 'auto',
								justifyContent: 'center',
							}}
						>
							{item.icon}
						</ListItemIcon>
						<ListItemText>{item.title}</ListItemText>
						{clickMenu.find((menu: string) => item.key === menu) ? <ExpandLess /> : <ExpandMore />}
					</ListItemButton>
					<Collapse
						in={!!clickMenu.find((menu: string) => menu === item.key)}
						className="menu"
						timeout="auto"
						component="li"
						unmountOnExit
					>
						<List className="menu-list" disablePadding>
							{sub_menu_set[item.key] &&
								sub_menu_set[item.key].map((sub: any, i: number) => (
									<Link href={sub.url} shallow={true} replace={true} key={i}>
										<ListItemButton
											component="li"
											className={clickMenu[0] === item.key && clickSubMenu === sub.title ? 'li on' : 'li'}
										>
											<Typography variant={sub.title} component={'span'}>
												{sub.title}
											</Typography>
										</ListItemButton>
									</Link>
								))}
						</List>
					</Collapse>
				</List>
			))}
		</>
=======
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
				disabled: true,
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
				title: 'Admin Applications',
				description: 'Kindergarten admin approvals',
				url: '/_admin/users/kindergarten-admin-applications',
				icon: <AssignmentTurnedInRoundedIcon />,
			},
			{
				key: 'staff-applications',
				title: 'Staff Applications',
				description: 'Teacher applications later',
				disabled: true,
				icon: <WorkRoundedIcon />,
			},
		],
	},
	{
		title: 'Operations later',
		items: [
			{
				key: 'staff',
				title: 'Staff',
				description: 'Staff oversight',
				disabled: true,
				icon: <GroupsRoundedIcon />,
			},
			{
				key: 'groups',
				title: 'Groups',
				description: 'Class groups',
				disabled: true,
				icon: <GroupsRoundedIcon />,
			},
			{
				key: 'children',
				title: 'Children',
				description: 'Child records',
				disabled: true,
				icon: <ChildCareRoundedIcon />,
			},
			{
				key: 'attendance',
				title: 'Attendance',
				description: 'Attendance records',
				disabled: true,
				icon: <EventAvailableRoundedIcon />,
			},
		],
	},
	{
		title: 'Community later',
		items: [
			{
				key: 'articles',
				title: 'Articles',
				description: 'Community moderation',
				disabled: true,
				icon: <ArticleRoundedIcon />,
			},
			{
				key: 'comments',
				title: 'Comments',
				description: 'Comment moderation',
				disabled: true,
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
		const button = (
			<ListItemButton
				component="li"
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

		if (item.disabled || !item.url) return button;

		return (
			<Link href={item.url} shallow={true} replace={true} key={item.key}>
				{button}
			</Link>
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
>>>>>>> theirs
	);
};

export default withRouter(AdminMenuList);
