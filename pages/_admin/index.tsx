import React from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { Box, Chip, Stack, Typography } from '@mui/material';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import { useRouter } from 'next/router';
import { getStaticCommonTranslator } from '../../libs/i18n/staticCommon';

const overviewSections = [
	{
		key: 'platform',
		titleKey: 'admin.sections.platform',
		items: [
			{
				titleKey: 'admin.overview.membersTitle',
				descriptionKey: 'admin.overview.membersDescription',
				url: '/_admin/users',
				badgeKey: 'admin.badges.statusOnly',
			},
			{
				titleKey: 'admin.overview.kindergartensTitle',
				descriptionKey: 'admin.overview.kindergartensDescription',
				url: '/_admin/kindergartens',
				badgeKey: 'admin.badges.statusOnly',
			},
		],
	},
	{
		key: 'applications',
		titleKey: 'admin.sections.applications',
		items: [
			{
				titleKey: 'admin.overview.kindergartenApplicationsTitle',
				descriptionKey: 'admin.overview.kindergartenApplicationsDescription',
				url: '/_admin/applications',
				badgeKey: 'admin.badges.review',
			},
			{
				titleKey: 'admin.overview.kindergartenAdminApplicationsTitle',
				descriptionKey: 'admin.overview.kindergartenAdminApplicationsDescription',
				url: '/_admin/users/kindergarten-admin-applications',
				badgeKey: 'admin.badges.review',
			},
			{
				titleKey: 'admin.overview.teacherApplicationsTitle',
				descriptionKey: 'admin.overview.teacherApplicationsDescription',
				url: '/_admin/users/staff-applications',
				badgeKey: 'admin.badges.review',
			},
		],
	},
	{
		key: 'community',
		titleKey: 'admin.sections.community',
		items: [
			{
				titleKey: 'admin.overview.communityArticlesTitle',
				descriptionKey: 'admin.overview.communityArticlesDescription',
				url: '/_admin/community',
				badgeKey: 'admin.badges.moderation',
			},
			{
				titleKey: 'admin.overview.communityCommentsTitle',
				descriptionKey: 'admin.overview.communityCommentsDescription',
				url: '/_admin/community/comments',
				badgeKey: 'admin.badges.moderation',
			},
		],
	},
	{
		key: 'operations',
		titleKey: 'admin.sections.operations',
		items: [
			{
				titleKey: 'admin.overview.operationsStaffTitle',
				descriptionKey: 'admin.overview.operationsStaffDescription',
				url: '/_admin/operations/staff',
				badgeKey: 'admin.badges.readOnly',
			},
			{
				titleKey: 'admin.overview.operationsGroupsTitle',
				descriptionKey: 'admin.overview.operationsGroupsDescription',
				url: '/_admin/operations/groups',
				badgeKey: 'admin.badges.readOnly',
			},
			{
				titleKey: 'admin.overview.operationsChildrenTitle',
				descriptionKey: 'admin.overview.operationsChildrenDescription',
				url: '/_admin/operations/children',
				badgeKey: 'admin.badges.readOnly',
			},
			{
				titleKey: 'admin.overview.operationsAttendanceTitle',
				descriptionKey: 'admin.overview.operationsAttendanceDescription',
				url: '/_admin/operations/attendance',
				badgeKey: 'admin.badges.readOnly',
			},
		],
	},
];

const AdminHome: NextPage = () => {
	const router = useRouter();
	const t = getStaticCommonTranslator(router.locale);

	return (
		<Box component="div" className="content">
			<Typography variant="h2" className="tit" sx={{ mb: '12px' }}>
				{t('admin.overview.title')}
			</Typography>
			<Typography sx={{ mb: '24px', color: '#64746b' }}>
				{t('admin.overview.subtitle')}
			</Typography>

			<Stack spacing={3}>
				{overviewSections.map((section) => (
					<Box component="section" className="table-wrap" key={section.key} sx={{ p: '24px' }}>
						<Typography sx={{ mb: '16px', fontSize: '18px', fontWeight: 800, color: '#1f3a2d' }}>
							{t(section.titleKey)}
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
												label={t(item.badgeKey)}
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
												{t(item.titleKey)}
											</Typography>
											<Typography sx={{ color: '#64746b', lineHeight: 1.55 }}>{t(item.descriptionKey)}</Typography>
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
