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
import { GET_ATTENDANCES, GET_CHILDREN, GET_GROUPS } from '../../../apollo/user/query';
import { MARK_ATTENDANCE, UPDATE_ATTENDANCE } from '../../../apollo/user/mutation';
import { AttendanceStatus } from '../../enums/attendance.enum';
import { ChildStatus } from '../../enums/child.enum';
import { GroupStatus } from '../../enums/group.enum';
import { MemberType } from '../../enums/member.enum';
import { Attendance } from '../../types/attendance/attendance';
import { AttendanceInput } from '../../types/attendance/attendance.input';
import { AttendanceUpdate } from '../../types/attendance/attendance.update';
import { Child } from '../../types/child/child';
import { Group } from '../../types/group/group';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import ParentTeacherChatPanel from '../chat/ParentTeacherChatPanel';
import { getStatusChipSx, getStatusLabel } from './dashboardUtils';
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

const TeacherAttendance = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [selectedGroupId, setSelectedGroupId] = useState('');
	const [selectedDate, setSelectedDate] = useState(today());
	const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({});
	const [fetchingMoreAttendances, setFetchingMoreAttendances] = useState(false);
	const [activeChatChildId, setActiveChatChildId] = useState<string | null>(null);

	const [markAttendance] = useMutation(MARK_ATTENDANCE);
	const [updateAttendance] = useMutation(UPDATE_ATTENDANCE);

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

	const childrenInput = useMemo(
		() => ({
			page: 1,
			limit: 100,
			sort: 'childFullName',
			search: {
				groupId: selectedGroupId,
				childStatus: ChildStatus.ACTIVE,
			},
		}),
		[selectedGroupId],
	);

	const attendancesInput = useMemo(
		() => ({
			page: 1,
			limit: attendancePageLimit,
			sort: 'createdAt',
			search: {
				groupId: selectedGroupId,
			},
		}),
		[selectedGroupId],
	);

	const { data: groupsData, loading: groupsLoading } = useQuery(GET_GROUPS, {
		variables: { input: groupsInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.TEACHER,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const { data: childrenData, loading: childrenLoading } = useQuery(GET_CHILDREN, {
		variables: { input: childrenInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.TEACHER || !selectedGroupId,
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
		skip: user.memberType !== MemberType.TEACHER || !selectedGroupId || !selectedDate,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const groups: Group[] = groupsData?.getGroups?.list ?? [];
	const children: Child[] = childrenData?.getChildren?.list ?? EMPTY_CHILDREN;
	const attendances: Attendance[] = attendancesData?.getAttendances?.list ?? EMPTY_ATTENDANCES;
	const attendanceTotal = attendancesData?.getAttendances?.metaCounter?.[0]?.total ?? 0;
	const selectedGroup = groups.find((group) => group._id === selectedGroupId);
	const attendanceByChildId = useMemo(() => {
		return attendances.reduce<Record<string, Attendance>>((acc, attendance) => {
			if (isSameAttendanceDay(attendance.attendanceDate, selectedDate)) {
				acc[attendance.childId] = attendance;
			}
			return acc;
		}, {});
	}, [attendances, selectedDate]);

	useEffect(() => {
		if (!selectedGroupId && groups.length > 0) {
			setSelectedGroupId(groups[0]._id);
		}
	}, [groups, selectedGroupId]);

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
		if (!selectedGroupId || fetchingMoreAttendances || attendanceTotal <= attendances.length) return;

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

	const toggleChat = (childId: string) => {
		setActiveChatChildId((prev) => (prev === childId ? null : childId));
	};

	const saveAttendanceHandler = async (child: Child) => {
		try {
			if (!selectedGroupId) throw new Error(t('mypageText.TeacherAttendance.selectGroupError'));
			if (!selectedDate) throw new Error(t('mypageText.TeacherAttendance.selectDateError'));

			const draft = drafts[child._id] ?? {
				attendanceStatus: AttendanceStatus.PRESENT,
				note: '',
			};
			const attendance = attendanceByChildId[child._id] ?? findAttendanceForChild(attendances, child._id, selectedDate);
			const attendanceDate = toAttendanceDate(selectedDate);
			const kindergartenId = child.kindergartenId || selectedGroup?.kindergartenId;
			const note = draft.note.trim() || undefined;

			if (!kindergartenId) throw new Error(t('mypageText.TeacherAttendance.kindergartenUnknownError'));

			if (attendance) {
				const input: AttendanceUpdate = {
					_id: attendance._id,
					childId: child._id,
					kindergartenId,
					groupId: selectedGroupId,
					attendanceDate,
					attendanceStatus: draft.attendanceStatus,
					note,
				};

				await updateAttendance({ variables: { input } });
				await sweetMixinSuccessAlert(t('mypageText.TeacherAttendance.attendanceUpdated'));
			} else {
				const input: AttendanceInput = {
					childId: child._id,
					kindergartenId,
					groupId: selectedGroupId,
					attendanceDate,
					attendanceStatus: draft.attendanceStatus,
					note,
				};

				try {
					await markAttendance({ variables: { input } });
					await sweetMixinSuccessAlert(t('mypageText.TeacherAttendance.attendanceMarked'));
				} catch (markErr: any) {
					const isDuplicateLikeError = String(markErr?.message ?? '').includes('Create failed');
					if (!isDuplicateLikeError) throw markErr;

					await refetchAttendances();
					await sweetMixinErrorAlert(t('mypageText.TeacherAttendance.attendanceExists'));
					return;
				}
			}

			await refetchAttendances();
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	// Role guard. Navigating during render (router.back() in the component
	// body) is a side effect React may run twice under StrictMode; do it in an
	// effect and render nothing meanwhile.
	const roleAllowed = !(user.memberType !== MemberType.TEACHER);
	useEffect(() => {
		if (!roleAllowed) router.back();
	}, [roleAllowed, router]);
	if (!roleAllowed) return null;

	return (
		<Stack className="teacher-dashboard-screen teacher-attendance-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>{t('mypage.menu.attendance')}</Typography>
				<Typography sx={{ color: '#6b7280' }}>{t('mypageText.TeacherAttendance.subtitle')}</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.TeacherAttendance.selectGroupAndDate')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.TeacherAttendance.selectGroupAndDateSubtitle')}
						</Typography>
					</Stack>
					<Chip label={t('mypageText.TeacherAttendance.groupsCount', { count: groups.length })} size="small" className="dashboard-count-chip" />
				</Stack>
				{groupsLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.TeacherAttendance.loadingGroups')}</Typography>}
				{!groupsLoading && groups.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.TeacherAttendance.noGroups')}
					</Typography>
				)}
				<Stack className="dashboard-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						select
						label={t('adminTables.group')}
						value={selectedGroupId}
						onChange={(event) => {
							setSelectedGroupId(event.target.value);
							setDrafts({});
						}}
						disabled={groups.length === 0}
					>
						{groups.map((group) => (
							<MenuItem key={group._id} value={group._id}>
								{group.groupName}
							</MenuItem>
						))}
					</TextField>
					<TextField
						fullWidth
						label={t('mypageText.TeacherAttendance.attendanceDate')}
						type="date"
						value={selectedDate}
						onChange={(event) => {
							setSelectedDate(event.target.value);
							setDrafts({});
						}}
						InputLabelProps={{ shrink: true }}
					/>
				</Stack>
				{selectedGroup && (
					<Stack className="dashboard-context-card">
						<Typography className="dashboard-primary-text">
							{t('mypageText.TeacherAttendance.groupForDate', { group: selectedGroup.groupName, date: selectedDate })}
						</Typography>
						<Typography className="dashboard-muted-text">
							{t('mypageText.TeacherAttendance.groupMeta', {
								ageRange: selectedGroup.groupAgeRange,
								capacity: selectedGroup.groupCapacity,
							})}
						</Typography>
					</Stack>
				)}
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.TeacherAttendance.dailyAttendance')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.TeacherAttendance.dailyAttendanceSubtitle')}
						</Typography>
					</Stack>
					<Chip label={t('mypageText.TeacherAttendance.childrenCount', { count: children.length })} size="small" className="dashboard-count-chip" />
				</Stack>
				{(childrenLoading || attendancesLoading || fetchingMoreAttendances) && (
					<Typography sx={{ color: '#6b7280' }}>{t('mypageText.TeacherAttendance.loadingRecords')}</Typography>
				)}
				{!childrenLoading && selectedGroupId && children.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.TeacherAttendance.noChildren')}
					</Typography>
				)}
				{children.length > 0 && (
					<Stack className="teacher-card-list teacher-attendance-list">
						{children.map((child) => {
							const attendance = attendanceByChildId[child._id];
							const hasExistingRecord = Boolean(attendance);
							const draft = drafts[child._id] ?? {
								attendanceStatus: attendance?.attendanceStatus ?? AttendanceStatus.PRESENT,
								note: attendance?.note ?? '',
							};
							const isChatOpen = activeChatChildId === child._id;

							return (
								<Stack key={child._id} className="teacher-record-card teacher-attendance-card" spacing={2}>
									<Stack className="teacher-record-card-header">
										<Stack className="teacher-record-title-block" spacing={0.5}>
											<Typography className="dashboard-primary-text teacher-record-title">
												{child.childFullName}
											</Typography>
										</Stack>
										{hasExistingRecord ? (
											<Chip
												label={t('mypageText.TeacherAttendance.savedStatus', {
													status: t(`statuses.${attendance?.attendanceStatus}`, {
														defaultValue: getStatusLabel(attendance?.attendanceStatus),
													}),
												})}
												size="small"
												sx={getStatusChipSx(attendance?.attendanceStatus)}
											/>
										) : (
											<Chip label={t('mypageText.TeacherAttendance.notMarkedYet')} size="small" sx={getStatusChipSx('INACTIVE')} />
										)}
									</Stack>

									<Stack className="teacher-record-grid teacher-attendance-grid">
										<Stack className="teacher-meta-item">
											<Typography className="teacher-meta-label">{t('mypageText.TeacherAttendance.attendanceStatus')}</Typography>
											<TextField
												fullWidth
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
										<Stack className="teacher-meta-item teacher-meta-wide">
											<Typography className="teacher-meta-label">{t('adminForms.optionalNote')}</Typography>
											<TextField
												fullWidth
												size="small"
												placeholder={t('adminForms.optionalNote')}
												value={draft.note}
												onChange={(event) => updateDraft(child._id, { note: event.target.value })}
											/>
										</Stack>
									</Stack>

									<Stack className="teacher-record-actions">
										<Button variant="outlined" onClick={() => toggleChat(child._id)}>
											{isChatOpen
												? t('mypageText.TeacherAttendance.closeParentChat')
												: t('mypageText.TeacherAttendance.openParentChat')}
										</Button>
										<Button variant="contained" onClick={() => saveAttendanceHandler(child)}>
											{hasExistingRecord
												? t('mypageText.TeacherAttendance.updateAttendance')
												: t('mypageText.TeacherAttendance.markAttendance')}
										</Button>
									</Stack>

									{isChatOpen && (
										<ParentTeacherChatPanel
											childId={child._id}
											title={t('mypageText.TeacherAttendance.parentChat')}
											onClose={() => setActiveChatChildId(null)}
										/>
									)}
								</Stack>
							);
						})}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default TeacherAttendance;
