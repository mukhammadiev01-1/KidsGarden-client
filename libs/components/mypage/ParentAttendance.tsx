import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import {
	Chip,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { GET_ATTENDANCES, GET_CHILDREN, GET_GROUP } from '../../../apollo/user/query';
import { MemberType } from '../../enums/member.enum';
import { Attendance } from '../../types/attendance/attendance';
import { Child } from '../../types/child/child';
import { Group } from '../../types/group/group';
import { sweetErrorHandling } from '../../sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel } from './dashboardUtils';

const ParentAttendance = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const apolloClient = useApolloClient();
	const user = useReactiveVar(userVar);
	const [selectedChildId, setSelectedChildId] = useState('');
	const [groupsById, setGroupsById] = useState<
		Record<string, Pick<Group, '_id' | 'groupName' | 'groupAgeRange' | 'groupCapacity' | 'groupStatus'> | null>
	>({});

	const childrenInput = useMemo(
		() => ({
			page: 1,
			limit: 100,
			sort: 'createdAt',
			search: {},
		}),
		[],
	);

	const attendancesInput = useMemo(
		() => ({
			page: 1,
			limit: 50,
			sort: 'attendanceDate',
			search: {
				childId: selectedChildId,
			},
		}),
		[selectedChildId],
	);

	const { data: childrenData, loading: childrenLoading } = useQuery(GET_CHILDREN, {
		variables: { input: childrenInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.PARENT,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const { data: attendancesData, loading: attendancesLoading } = useQuery(GET_ATTENDANCES, {
		variables: { input: attendancesInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.PARENT || !selectedChildId,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const children: Child[] = childrenData?.getChildren?.list ?? [];
	const attendances: Attendance[] = attendancesData?.getAttendances?.list ?? [];
	const selectedChild = children.find((child) => child._id === selectedChildId);
	const groupIds = useMemo(() => Array.from(new Set(children.map((child) => child.groupId).filter(Boolean))), [children]);

	useEffect(() => {
		if (!selectedChildId && children.length > 0) {
			setSelectedChildId(children[0]._id);
		}
	}, [children, selectedChildId]);

	useEffect(() => {
		const missingGroupIds = groupIds.filter((groupId) => !(groupId in groupsById));
		if (!missingGroupIds.length) return;

		let isMounted = true;

		Promise.all(
			missingGroupIds.map(async (groupId) => {
				try {
					const result = await apolloClient.query({
						query: GET_GROUP,
						variables: { groupId },
						fetchPolicy: 'cache-first',
					});

					return [groupId, result.data?.getGroup ?? null] as const;
				} catch (err) {
					return [groupId, null] as const;
				}
			}),
		).then((entries) => {
			if (!isMounted) return;
			setGroupsById((prev) => ({
				...prev,
				...Object.fromEntries(entries),
			}));
		});

		return () => {
			isMounted = false;
		};
	}, [apolloClient, groupIds, groupsById]);

	// Role guard. Navigating during render (router.back() in the component
	// body) is a side effect React may run twice under StrictMode; do it in an
	// effect and render nothing meanwhile.
	const roleAllowed = !(user.memberType !== MemberType.PARENT);
	useEffect(() => {
		if (!roleAllowed) router.back();
	}, [roleAllowed, router]);
	if (!roleAllowed) return null;

	return (
		<Stack className="parent-dashboard-screen parent-attendance-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>{t('mypage.menu.attendance')}</Typography>
				<Typography sx={{ color: '#6b7280' }}>{t('mypageText.ParentAttendance.subtitle')}</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.ParentAttendance.selectChild')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.ParentAttendance.selectChildSubtitle')}
						</Typography>
					</Stack>
					<Chip
						label={
							children.length === 1
								? t('mypageText.ParentAttendance.childCountOne')
								: t('mypageText.ParentAttendance.childCount', { count: children.length })
						}
						size="small"
						className="dashboard-count-chip"
					/>
				</Stack>
				{childrenLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.ParentAttendance.loadingChildren')}</Typography>}
				{!childrenLoading && children.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.ParentAttendance.noChildren')}
					</Typography>
				)}
				{children.length > 0 && (
					<TextField
						select
						label={t('mypageText.ParentAttendance.childLabel')}
						value={selectedChildId}
						onChange={(event) => setSelectedChildId(event.target.value)}
						sx={{ maxWidth: 520 }}
					>
						{children.map((child) => (
							<MenuItem key={child._id} value={child._id}>
								{child.childFullName}
							</MenuItem>
						))}
					</TextField>
				)}
				{selectedChild && (
					<Stack className="dashboard-context-card">
						<Typography className="dashboard-primary-text">
							{t('mypageText.ParentAttendance.showingFor', { name: selectedChild.childFullName })}
						</Typography>
						<Typography className="dashboard-muted-text">
							{t('mypageText.ParentAttendance.group', { name: groupsById[selectedChild.groupId]?.groupName || t('mypageText.ParentAttendance.classroom') })}
						</Typography>
					</Stack>
				)}
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.ParentAttendance.historyTitle')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.ParentAttendance.historySubtitle')}
						</Typography>
					</Stack>
					<Chip label={t('mypageText.ParentAttendance.recordsCount', { count: attendances.length })} size="small" className="dashboard-count-chip" />
				</Stack>
				{attendancesLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.ParentAttendance.loadingHistory')}</Typography>}
				{!attendancesLoading && selectedChildId && attendances.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.ParentAttendance.noRecords')}
					</Typography>
				)}
				{attendances.length > 0 && (
					<Stack className="parent-card-list parent-attendance-list">
						{attendances.map((attendance) => (
							<Stack key={attendance._id} className="parent-record-card parent-attendance-card" spacing={2}>
								<Stack className="parent-record-card-header">
									<Stack className="parent-record-title-block" spacing={0.5}>
										<Typography className="dashboard-primary-text parent-record-title parent-nowrap">
											{formatDate(attendance.attendanceDate)}
										</Typography>
									</Stack>
									<Chip
										label={t(`statuses.${attendance.attendanceStatus}`, {
										defaultValue: getStatusLabel(attendance.attendanceStatus),
									})}
										size="small"
										sx={getStatusChipSx(attendance.attendanceStatus)}
									/>
								</Stack>

								<Stack className="parent-record-grid parent-attendance-grid">
									<Stack className="parent-meta-item parent-meta-wide">
										<Typography className="parent-meta-label">{t('mypageText.ParentAttendance.note')}</Typography>
										<Typography className="dashboard-note-text">{attendance.note || t('mypageText.ParentAttendance.noNote')}</Typography>
									</Stack>
									<Stack className="parent-meta-item">
										<Typography className="parent-meta-label">{t('mypageText.ParentAttendance.markedBy')}</Typography>
										<Typography className="parent-meta-value">
											{attendance.markedBy ? t('mypageText.ParentAttendance.staffMember') : t('mypageText.ParentAttendance.notAvailable')}
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

export default ParentAttendance;
