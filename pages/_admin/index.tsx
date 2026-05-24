import React from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { Box, Chip, Stack, Typography } from '@mui/material';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';

const overviewSections = [
	{
		title: 'Platform',
		items: [
			{
				title: 'Members',
				description: 'Review member accounts and update account status.',
				url: '/_admin/users',
				badge: 'Status only',
			},
			{
				title: 'Kindergartens',
				description: 'Review kindergarten profiles and update profile status.',
				url: '/_admin/properties',
				badge: 'Status only',
			},
		],
	},
	{
		title: 'Applications',
		items: [
			{
				title: 'Kindergarten Admin Applications',
				description: 'Review requests to manage a kindergarten.',
				url: '/_admin/users/kindergarten-admin-applications',
				badge: 'Review',
			},
			{
				title: 'Staff Applications',
				description: 'Review teacher applications across the platform.',
				url: '/_admin/users/staff-applications',
				badge: 'Review',
			},
		],
	},
	{
		title: 'Community',
		items: [
			{
				title: 'Community Articles',
				description: 'Moderate Parent Board and News articles.',
				url: '/_admin/community',
				badge: 'Moderation',
			},
			{
				title: 'Community Comments',
				description: 'Moderate comments with status-only actions.',
				url: '/_admin/community/comments',
				badge: 'Moderation',
			},
		],
	},
	{
		title: 'Operations',
		items: [
			{
				title: 'Operations Staff',
				description: 'Inspect staff records across kindergartens.',
				url: '/_admin/operations/staff',
				badge: 'Read-only',
			},
			{
				title: 'Operations Groups',
				description: 'Inspect group and classroom records.',
				url: '/_admin/operations/groups',
				badge: 'Read-only',
			},
			{
				title: 'Operations Children',
				description: 'Inspect child records across the platform.',
				url: '/_admin/operations/children',
				badge: 'Read-only',
			},
			{
				title: 'Operations Attendance',
				description: 'Inspect attendance records across the platform.',
				url: '/_admin/operations/attendance',
				badge: 'Read-only',
			},
		],
	},
];

const AdminHome: NextPage = () => {
	return (
		<Box component="div" className="content">
			<Typography variant="h2" className="tit" sx={{ mb: '12px' }}>
				KidsGarden Admin Overview
			</Typography>
			<Typography sx={{ mb: '24px', color: '#64746b' }}>
				Use this dashboard to navigate platform management, application review, community moderation, and read-only
				operations views.
			</Typography>

			<Stack spacing={3}>
				{overviewSections.map((section) => (
					<Box component="section" className="table-wrap" key={section.title} sx={{ p: '24px' }}>
						<Typography sx={{ mb: '16px', fontSize: '18px', fontWeight: 800, color: '#1f3a2d' }}>
							{section.title}
						</Typography>
						<Box
							component="div"
							sx={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
								gap: '16px',
							}}
						>
							{section.items.map((item) => (
								<Link href={item.url} key={item.url} style={{ color: 'inherit', textDecoration: 'none' }}>
									<Box
										component="article"
										sx={{
											height: '100%',
											minHeight: 150,
											p: '18px',
											border: '1px solid #dfe9df',
											borderRadius: '16px',
											background: '#ffffff',
											boxShadow: '0 10px 24px rgba(20, 55, 35, 0.06)',
											transition: 'border-color 0.2s ease, transform 0.2s ease',
											'&:hover': {
												borderColor: '#86b88c',
												transform: 'translateY(-2px)',
											},
										}}
									>
										<Stack spacing={1.5}>
											<Chip
												label={item.badge}
												size="small"
												sx={{
													alignSelf: 'flex-start',
													height: 24,
													fontWeight: 700,
													color: '#166534',
													backgroundColor: '#dcfce7',
												}}
											/>
											<Typography sx={{ fontSize: '17px', fontWeight: 800, color: '#17251d' }}>
												{item.title}
											</Typography>
											<Typography sx={{ color: '#64746b', lineHeight: 1.55 }}>{item.description}</Typography>
										</Stack>
									</Box>
								</Link>
							))}
						</Box>
					</Box>
				))}
			</Stack>
		</Box>
	);
};

export default withAdminLayout(AdminHome);
