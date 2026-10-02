import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Button,
	Chip,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { GET_ATTENDANCES, GET_CHILDREN, GET_GROUPS, GET_OWNER_KINDERGARTENS } from '../../../apollo/user/query';
import { MARK_ATTENDANCE, REMOVE_ATTENDANCE, UPDATE_ATTENDANCE } from '../../../apollo/user/mutation';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { KindergartenStatus } from '../../enums/kindergarten.enum';
import { GroupStatus } from '../../enums/group.enum';
import { ChildStatus } from '../../enums/child.enum';
import { AttendanceStatus } from '../../enums/attendance.enum';
import { MemberType } from '../../enums/member.enum';
import { Group } from '../../types/group/group';
import { Child } from '../../types/child/child';
import { Attendance } from '../../types/attendance/attendance';
import { AttendanceInput } from '../../types/attendance/attendance.input';
import { AttendanceUpdate } from '../../types/attendance/attendance.update';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import {
	formatDate,
	getSelectedKindergartenTitle,
	getStatusChipSx,
	getStatusLabel,
	shouldHideKindergartenSelector,
} from './dashboardUtils';
import { areDraftMapsEqual } from '../../utils/attendanceDrafts';

interface AttendanceDraft {
	attendanceStatus: AttendanceStatus;
	note: string;
}

// Stable fallbacks. `?? []` allocates a new array every render while a query is
// skipped or loading, which changes the drafts effect's dependencies each render.
const EMPTY_CHILDREN: Child[] = [];
const EMPTY_ATTENDANCES: Attendance[] = [];

const attendanceStatusOptions = [
	AttendanceStatus.PRESENT,
	AttendanceStatus.ABSENT,
	AttendanceStatus.LATE,
	AttendanceStatus.EXCUSED,
];

const attendancePageLimit = 100;

const today = () => new Date().toISOString().slice(0, 10);

const toAttendanceDate = (selectedDate: string) => new Date(`${selectedDate}T00:00:00.000Z`).toISOString();

const toUtcDateKey = (date: Date) => date.toISOString().slice(0, 10);

const toKoreaDateKey = (date: Date) => new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

const getDateKeys = (date?: Date | string) => {
	if (!date) return [];
	const parsedDate = new Date(date);
	if (Number.isNaN(parsedDate.getTime())) return [];

	return Array.from(new Set([toUtcDateKey(parsedDate), toKoreaDateKey(parsedDate)]));
};

const getSelectedDateKeys = (selectedDate: string) => {
	if (!selectedDate) return [];

	return [selectedDate];
};

const isSameAttendanceDay = (attendanceDate: Date | string, selectedDate: string) => {
	const attendanceDateKeys = getDateKeys(attendanceDate);
	const selectedDateKeys = getSelectedDateKeys(selectedDate);

	return attendanceDateKeys.some((dateKey) => selectedDateKeys.includes(dateKey));
};

const findAttendanceForChild = (attendances: Attendance[], childId: string, selectedDate: string) => {
	return attendances.find(
		(attendance) => attendance.childId === childId && isSameAttendanceDay(attendance.attendanceDate, selectedDate),
	);
};

const mergeAttendancePages = (previousResult: any, { fetchMoreResult }: any) => {
	if (!fetchMoreResult?.getAttendances) return previousResult;

	const previousList = previousResult?.getAttendances?.list ?? [];
	const nextList = fetchMoreResult.getAttendances.list ?? [];
	const mergedById = new Map<string, Attendance>();

	previousList.forEach((attendance: Attendance) => mergedById.set(attendance._id, attendance));
	nextList.forEach((attendance: Attendance) => mergedById.set(attendance._id, attendance));

	return {
		...previousResult,
		getAttendances: {
			...previousResult.getAttendances,
			list: Array.from(mergedById.values()),
			metaCounter: fetchMoreResult.getAttendances.metaCounter ?? previousResult.getAttendances.metaCounter,
		},
	};
};

const KindergartenAttendance = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [selectedKindergartenId, setSelectedKindergartenId] = useState('');
	const [selectedGroupId, setSelectedGroupId] = useState('');
	const [selectedDate, setSelectedDate] = useState(today());
	const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({});
	const [fetchingMoreAttendances, setFetchingMoreAttendances] = useState(false);

	const [markAttendance] = useMutation(MARK_ATTENDANCE);
	const [updateAttendance] = useMutation(UPDATE_ATTENDANCE);
	const [removeAttendance] = useMutation(REMOVE_ATTENDANCE);

	const ownerKindergartensInput = useMemo(
		() => ({
			page: 1,
			limit: 20,
			sort: 'createdAt',
			search: {
				kindergartenStatus: KindergartenStatus.ACTIVE,
			},
		}),
		[],
	);

	const groupsInput = useMemo(
		() => ({
			page: 1,
			limit: 100,
			sort: 'createdAt',
			search: {
				kindergartenId: selectedKindergartenId,
			},
		}),
		[selectedKindergartenId],
	);

	const childrenInput = useMemo(
		() => ({
			page: 1,
			limit: 100,
			sort: 'childFullName',
			search: {
				kindergartenId: selectedKindergartenId,
				groupId: selectedGroupId,
				childStatus: ChildStatus.ACTIVE,
			},
		}),
		[selectedKindergartenId, selectedGroupId],
	);

	const attendancesInput = useMemo(
		() => ({
			page: 1,
			limit: attendancePageLimit,
			sort: 'createdAt',
			search: {
				kindergartenId: selectedKindergartenId,
				groupId: selectedGroupId,
			},
		}),
		[selectedKindergartenId, selectedGroupId],
	);

	const { data: ownerData, loading: ownerLoading } = useQuery(GET_OWNER_KINDERGARTENS, {
		variables: { input: ownerKindergartensInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const { data: groupsData, loading: groupsLoading } = useQuery(GET_GROUPS, {
		variables: { input: groupsInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN || !selectedKindergartenId,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const { data: childrenData, loading: childrenLoading } = useQuery(GET_CHILDREN, {
		variables: { input: childrenInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN || !selectedKindergartenId || !selectedGroupId,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const {
		data: attendancesData,
		loading: attendancesLoading,
		fetchMore: fetchMoreAttendances,
		refetch: refetchAttendances,
	} = useQuery(GET_ATTENDANCES, {
		variables: { input: attendancesInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN || !selectedKindergartenId || !selectedGroupId || !selectedDate,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const kindergartens: Kindergarten[] = ownerData?.getOwnerKindergartens?.list ?? [];
	const groups: Group[] = groupsData?.getGroups?.list ?? [];
	const children: Child[] = childrenData?.getChildren?.list ?? EMPTY_CHILDREN;
	const attendances: Attendance[] = attendancesData?.getAttendances?.list ?? EMPTY_ATTENDANCES;
	const attendanceTotal = attendancesData?.getAttendances?.metaCounter?.[0]?.total ?? 0;
	const hideKindergartenSelector = shouldHideKindergartenSelector(user.memberType, kindergartens);
	const selectedKindergartenTitle = getSelectedKindergartenTitle(kindergartens, selectedKindergartenId);
	const selectableGroups = groups.filter(
		(group) => group.groupStatus === GroupStatus.ACTIVE || group.groupStatus === GroupStatus.FULL,
	);
	const selectedGroupName = selectableGroups.find((group) => group._id === selectedGroupId)?.groupName || t('mypageText.KindergartenAttendance.selectedGroup');
	const attendanceByChildId = useMemo(() => {
		return attendances.reduce<Record<string, Attendance>>((acc, attendance) => {
			if (isSameAttendanceDay(attendance.attendanceDate, selectedDate)) {
				acc[attendance.childId] = attendance;
			}
			return acc;
		}, {});
	}, [attendances, selectedDate]);

	useEffect(() => {
		if (!selectedKindergartenId && kindergartens.length > 0) {
			setSelectedKindergartenId(kindergartens[0]._id);
		}
	}, [kindergartens, selectedKindergartenId]);

	useEffect(() => {
		setSelectedGroupId('');
		setDrafts({});
	}, [selectedKindergartenId]);

	useEffect(() => {
		if (!selectedGroupId && selectableGroups.length > 0) {
			setSelectedGroupId(selectableGroups[0]._id);
		}
	}, [selectableGroups, selectedGroupId]);

	useEffect(() => {
		setDrafts((prev) => {
			const next: Record<string, AttendanceDraft> = {};
			children.forEach((child) => {
				const attendance = attendanceByChildId[child._id];
				next[child._id] = {
					attendanceStatus:
						prev[child._id]?.attendanceStatus ?? attendance?.attendanceStatus ?? AttendanceStatus.PRESENT,
					note: prev[child._id]?.note ?? attendance?.note ?? '',
				};
			});
			return areDraftMapsEqual(prev, next) ? prev : next;
		});
	}, [attendanceByChildId, children]);

	useEffect(() => {
		if (!selectedKindergartenId || !selectedGroupId || fetchingMoreAttendances || attendanceTotal <= attendances.length) return;

		const nextPage = Math.ceil(attendances.length / attendancePageLimit) + 1;
		const totalPages = Math.ceil(attendanceTotal / attendancePageLimit);
		if (nextPage > totalPages) return;

		setFetchingMoreAttendances(true);
		fetchMoreAttendances({
			variables: {
				input: {
					...attendancesInput,
					page: nextPage,
					limit: attendancePageLimit,
				},
			},
			updateQuery: mergeAttendancePages,
		})
			.catch((err) => sweetErrorHandling(err).then())
			.finally(() => {
				setFetchingMoreAttendances(false);
			});
	}, [
		attendanceTotal,
		attendances.length,
		attendancesInput,
		fetchingMoreAttendances,
		fetchMoreAttendances,
		selectedGroupId,
		selectedKindergartenId,
	]);

	const updateDraft = (childId: string, patch: Partial<AttendanceDraft>) => {
		setDrafts((prev) => ({
			...prev,
			[childId]: {
				attendanceStatus: prev[childId]?.attendanceStatus ?? AttendanceStatus.PRESENT,
				note: prev[childId]?.note ?? '',
				...patch,
			},
		}));
	};

	const saveAttendanceHandler = async (child: Child) => {
		try {
			if (!selectedKindergartenId) throw new Error(t('mypageText.KindergartenAttendance.selectKindergartenFirst'));
			if (!selectedGroupId) throw new Error(t('mypageText.KindergartenAttendance.selectGroup'));
			if (!selectedDate) throw new Error(t('mypageText.KindergartenAttendance.selectDate'));

			const draft = drafts[child._id] ?? {
				attendanceStatus: AttendanceStatus.PRESENT,
				note: '',
			};
			const attendance = attendanceByChildId[child._id] ?? findAttendanceForChild(attendances, child._id, selectedDate);
			const attendanceDate = toAttendanceDate(selectedDate);
			const note = draft.note.trim() || undefined;

			if (attendance) {
				const input: AttendanceUpdate = {
					_id: attendance._id,
					childId: child._id,
					kindergartenId: selectedKindergartenId,
					groupId: selectedGroupId,
					attendanceDate,
					attendanceStatus: draft.attendanceStatus,
					note,
				};

				await updateAttendance({ variables: { input } });
				await sweetMixinSuccessAlert(t('mypageText.KindergartenAttendance.attendanceUpdated'));
			} else {
				const input: AttendanceInput = {
					childId: child._id,
					kindergartenId: selectedKindergartenId,
					groupId: selectedGroupId,
					attendanceDate,
					attendanceStatus: draft.attendanceStatus,
					note,
				};

				try {
					await markAttendance({ variables: { input } });
					await sweetMixinSuccessAlert(t('mypageText.KindergartenAttendance.attendanceMarked'));
				} catch (markErr: any) {
					const isDuplicateLikeError = String(markErr?.message ?? '').includes('Create failed');
					if (!isDuplicateLikeError) throw markErr;

					await refetchAttendances();
					await sweetMixinErrorAlert(t('mypageText.KindergartenAttendance.attendanceExists'));
					return;
				}
			}

			await refetchAttendances();
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const removeAttendanceHandler = async (attendanceId: string) => {
		try {
			if (!(await sweetConfirmAlert(t('mypageText.KindergartenAttendance.confirmRemove')))) return;
			await removeAttendance({ variables: { input: attendanceId } });
			await refetchAttendances();
			await sweetMixinSuccessAlert(t('mypageText.KindergartenAttendance.attendanceRemoved'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	// Role guard. Navigating during render (router.back() in the component
	// body) is a side effect React may run twice under StrictMode; do it in an
	// effect and render nothing meanwhile.
	const roleAllowed = !(user.memberType !== MemberType.KINDERGARTEN_ADMIN);
	useEffect(() => {
		if (!roleAllowed) router.back();
	}, [roleAllowed, router]);
	if (!roleAllowed) return null;

	return (
		<Stack className="admin-dashboard-screen admin-attendance-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>{t('mypage.menu.attendance')}</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					{t('mypageText.KindergartenAttendance.subtitle')}
				</Typography>
			</Stack>

			<Stack className="dashboard-panel admin-attendance-scope-panel" spacing={2}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.KindergartenAttendance.setupTitle')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenAttendance.setupSubtitle')}
						</Typography>
					</Stack>
				</Stack>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenAttendance.loadingKindergartens')}</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography className="dashboard-empty-state">
						{t('mypageText.KindergartenAttendance.noKindergartens')}
					</Typography>
				)}
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					{hideKindergartenSelector && (
						<Stack className="admin-selector-card admin-readonly-selector">
							<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
								{t('mypageText.KindergartenAttendance.kindergartenLabel', { title: selectedKindergartenTitle })}
							</Typography>
						</Stack>
					)}
					{kindergartens.length > 0 && !hideKindergartenSelector && (
						<TextField
							fullWidth
							select
							label={t('adminTables.kindergarten')}
							value={selectedKindergartenId}
							onChange={(event) => setSelectedKindergartenId(event.target.value)}
						>
							{kindergartens.map((kindergarten) => (
								<MenuItem key={kindergarten._id} value={kindergarten._id}>
									{kindergarten.kindergartenTitle}
								</MenuItem>
							))}
						</TextField>
					)}
					<TextField
						fullWidth
						select
						label={t('adminTables.group')}
						value={selectedGroupId}
						onChange={(event) => {
							setSelectedGroupId(event.target.value);
							setDrafts({});
						}}
						disabled={!selectedKindergartenId || groupsLoading || selectableGroups.length === 0}
					>
						{selectableGroups.map((group) => (
							<MenuItem key={group._id} value={group._id}>
								{group.groupName} ({t(`statuses.${group.groupStatus}`, { defaultValue: getStatusLabel(group.groupStatus) })})
							</MenuItem>
						))}
					</TextField>
					<TextField
						fullWidth
						label={t('mypageText.KindergartenAttendance.attendanceDate')}
						type="date"
						value={selectedDate}
						onChange={(event) => {
							setSelectedDate(event.target.value);
							setDrafts({});
						}}
						InputLabelProps={{ shrink: true }}
					/>
				</Stack>
				<Stack className="admin-attendance-context" direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
					<Stack className="dashboard-context-card">
						<Typography className="admin-meta-label">{t('adminTables.kindergarten')}</Typography>
						<Typography className="admin-meta-value">
							{selectedKindergartenId ? selectedKindergartenTitle : t('mypageText.KindergartenAttendance.noKindergartenSelected')}
						</Typography>
					</Stack>
					<Stack className="dashboard-context-card">
						<Typography className="admin-meta-label">{t('adminTables.group')}</Typography>
						<Typography className="admin-meta-value">
							{selectedGroupId ? selectedGroupName : t('mypageText.KindergartenAttendance.noGroupSelected')}
						</Typography>
					</Stack>
					<Stack className="dashboard-context-card">
						<Typography className="admin-meta-label">{t('dashboardCommon.date')}</Typography>
						<Typography className="admin-meta-value">{selectedDate || '-'}</Typography>
					</Stack>
				</Stack>
				<Typography className="dashboard-note-text">
					{t('mypageText.KindergartenAttendance.dateNote')}
				</Typography>
				{!ownerLoading && kindergartens.length > 0 && !selectedKindergartenId && (
					<Typography className="dashboard-empty-state">{t('mypageText.KindergartenAttendance.selectKindergartenHint')}</Typography>
				)}
				{selectedKindergartenId && !selectedGroupId && selectableGroups.length > 0 && (
					<Typography className="dashboard-empty-state">{t('mypageText.KindergartenAttendance.selectGroupHint')}</Typography>
				)}
				{!groupsLoading && selectedKindergartenId && selectableGroups.length === 0 && (
					<Typography className="dashboard-empty-state">{t('mypageText.KindergartenAttendance.noActiveGroups')}</Typography>
				)}
			</Stack>

			<Stack className="dashboard-panel" spacing={2}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.KindergartenAttendance.rollCallTitle')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenAttendance.rollCallSubtitle')}
						</Typography>
					</Stack>
					<Chip label={t('mypageText.KindergartenAttendance.childrenCount', { count: children.length })} size="small" className="dashboard-count-chip" />
				</Stack>
				{(childrenLoading || attendancesLoading || fetchingMoreAttendances) && (
					<Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenAttendance.loadingRecords')}</Typography>
				)}
				{!selectedKindergartenId && !ownerLoading && (
					<Typography className="dashboard-empty-state">{t('mypageText.KindergartenAttendance.noKindergartenSelectedEmpty')}</Typography>
				)}
				{selectedKindergartenId && !selectedGroupId && (
					<Typography className="dashboard-empty-state">{t('mypageText.KindergartenAttendance.noGroupSelectedEmpty')}</Typography>
				)}
				{!childrenLoading && selectedGroupId && children.length === 0 && (
					<Stack className="admin-polished-empty-state admin-attendance-empty-state" spacing={1.25}>
						<Stack className="admin-empty-indicator" aria-hidden="true">
							<span />
						</Stack>
						<Typography className="admin-empty-title">{t('mypageText.KindergartenAttendance.emptyTitle')}</Typography>
						<Typography className="dashboard-note-text">
							{t('mypageText.KindergartenAttendance.emptyBody')}
						</Typography>
						<Button variant="outlined" onClick={() => router.push('/mypage?category=children')} sx={{ width: 'fit-content' }}>
							{t('mypageText.KindergartenAttendance.goToChildren')}
						</Button>
					</Stack>
				)}
				{children.length > 0 && (
					<Stack className="admin-card-list admin-attendance-list">
						{children.map((child) => {
							const attendance = attendanceByChildId[child._id];
							const hasExistingRecord = Boolean(attendance);
							const draft = drafts[child._id] ?? {
								attendanceStatus: attendance?.attendanceStatus ?? AttendanceStatus.PRESENT,
								note: attendance?.note ?? '',
							};

							return (
								<Stack key={child._id} className="admin-record-card admin-attendance-card" spacing={2}>
									<Stack className="admin-record-card-header">
										<Stack className="admin-record-title-block" spacing={0.5}>
											<Typography className="dashboard-primary-text admin-record-title">{child.childFullName}</Typography>
											<Typography className="dashboard-muted-text">{selectedGroupName}</Typography>
										</Stack>
										{hasExistingRecord ? (
											<Chip
												label={t(`statuses.${attendance?.attendanceStatus}`, { defaultValue: getStatusLabel(attendance?.attendanceStatus) })}
												size="small"
												sx={getStatusChipSx(attendance?.attendanceStatus)}
											/>
										) : (
											<Chip label={t('mypageText.KindergartenAttendance.notMarkedYet')} size="small" sx={getStatusChipSx('INACTIVE')} />
										)}
									</Stack>
									<Stack className="admin-record-grid admin-attendance-grid">
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('mypageText.KindergartenAttendance.savedStatus')}</Typography>
											<Typography className="admin-meta-value">
												{hasExistingRecord
													? t(`statuses.${attendance?.attendanceStatus}`, { defaultValue: getStatusLabel(attendance?.attendanceStatus) })
													: t('mypageText.KindergartenAttendance.notMarkedYet')}
											</Typography>
											{hasExistingRecord && (
												<Typography className="dashboard-muted-text">
													{t('mypageText.KindergartenAttendance.updatedAt', { date: formatDate(attendance?.updatedAt) })}
												</Typography>
											)}
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('mypageText.KindergartenAttendance.newStatus')}</Typography>
											<TextField
												select
												size="small"
												value={draft.attendanceStatus}
												onChange={(event) =>
													updateDraft(child._id, { attendanceStatus: event.target.value as AttendanceStatus })
												}
											>
												{attendanceStatusOptions.map((status) => (
													<MenuItem key={status} value={status}>
														{t(`statuses.${status}`, { defaultValue: getStatusLabel(status) })}
													</MenuItem>
												))}
											</TextField>
										</Stack>
										<Stack className="admin-meta-item admin-meta-wide">
											<Typography className="admin-meta-label">{t('mypageText.KindergartenAttendance.noteLabel')}</Typography>
											<TextField
												fullWidth
												size="small"
												placeholder={t('mypageText.KindergartenAttendance.optionalNote')}
												value={draft.note}
												onChange={(event) => updateDraft(child._id, { note: event.target.value })}
											/>
										</Stack>
									</Stack>
									<Stack className="admin-record-actions admin-danger-actions">
										<Button variant="contained" onClick={() => saveAttendanceHandler(child)}>
											{hasExistingRecord ? t('mypageText.KindergartenAttendance.updateAttendance') : t('mypageText.KindergartenAttendance.markAttendance')}
										</Button>
										{hasExistingRecord && (
											<Button
												variant="outlined"
												color="error"
												onClick={() => attendance && removeAttendanceHandler(attendance._id)}
											>
												{t('messages.remove')}
											</Button>
										)}
									</Stack>
								</Stack>
							);
						})}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default KindergartenAttendance;
