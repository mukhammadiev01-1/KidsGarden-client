import React, { useMemo, useEffect } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Chip, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { GET_GROUPS } from '../../../apollo/user/query';
import { GroupStatus } from '../../enums/group.enum';
import { MemberType } from '../../enums/member.enum';
import { Group } from '../../types/group/group';
import { sweetErrorHandling } from '../../sweetAlert';
import { getStatusChipSx, getStatusLabel } from './dashboardUtils';

const getKindergartenLabel = (group: Group, fallback: string) => {
	const groupWithKindergarten = group as Group & {
		kindergartenTitle?: string;
		kindergartenData?: { kindergartenTitle?: string };
	};

	return groupWithKindergarten.kindergartenData?.kindergartenTitle || groupWithKindergarten.kindergartenTitle || fallback;
};

const TeacherGroups = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);

	const groupsInput = useMemo(
		() => ({
			page: 1,
			limit: 100,
			sort: 'createdAt',
			search: {
				groupStatus: GroupStatus.ACTIVE,
			},
		}),
		[],
	);

	const { data, loading } = useQuery(GET_GROUPS, {
		variables: { input: groupsInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.TEACHER,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const groups: Group[] = data?.getGroups?.list ?? [];
	const kindergartenFallback = t('mypageText.TeacherGroups.assignedKindergarten');

	// Role guard. Navigating during render (router.back() in the component
	// body) is a side effect React may run twice under StrictMode; do it in an
	// effect and render nothing meanwhile.
	const roleAllowed = !(user.memberType !== MemberType.TEACHER);
	useEffect(() => {
		if (!roleAllowed) router.back();
	}, [roleAllowed, router]);
	if (!roleAllowed) return null;

	return (
		<Stack className="teacher-dashboard-screen teacher-groups-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>{t('mypage.menu.myGroups')}</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					{t('mypageText.TeacherGroups.subtitle')}
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.TeacherGroups.assignedGroups')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.TeacherGroups.assignedGroupsSubtitle')}
						</Typography>
					</Stack>
					<Chip label={t('mypageText.TeacherGroups.activeCount', { count: groups.length })} size="small" className="dashboard-count-chip" />
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.TeacherGroups.loading')}</Typography>}
				{!loading && groups.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.TeacherGroups.noGroups')}
					</Typography>
				)}
				{groups.length > 0 && (
					<Stack className="teacher-card-list teacher-groups-list">
						{groups.map((group) => (
							<Stack key={group._id} className="teacher-record-card teacher-group-card" spacing={2}>
								<Stack className="teacher-record-card-header">
									<Stack className="teacher-record-title-block" spacing={0.5}>
										<Typography className="dashboard-primary-text teacher-record-title">{group.groupName}</Typography>
										<Typography className="dashboard-muted-text">{getKindergartenLabel(group, kindergartenFallback)}</Typography>
									</Stack>
									<Chip
										label={t(`statuses.${group.groupStatus}`, { defaultValue: getStatusLabel(group.groupStatus) })}
										size="small"
										sx={getStatusChipSx(group.groupStatus)}
									/>
								</Stack>

								<Stack className="teacher-record-grid teacher-group-grid">
									<Stack className="teacher-meta-item">
										<Typography className="teacher-meta-label">{t('statuses.KINDERGARTEN')}</Typography>
										<Typography className="teacher-meta-value">{getKindergartenLabel(group, kindergartenFallback)}</Typography>
									</Stack>
									<Stack className="teacher-meta-item">
										<Typography className="teacher-meta-label">{t('adminTables.ageRange')}</Typography>
										<Typography className="teacher-meta-value">{group.groupAgeRange || '-'}</Typography>
									</Stack>
									<Stack className="teacher-meta-item">
										<Typography className="teacher-meta-label">{t('adminTables.capacity')}</Typography>
										<Typography className="teacher-meta-value">
											{t('mypageText.TeacherGroups.capacityChildren', { count: group.groupCapacity })}
										</Typography>
									</Stack>
								</Stack>
							</Stack>
						))}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default TeacherGroups;
