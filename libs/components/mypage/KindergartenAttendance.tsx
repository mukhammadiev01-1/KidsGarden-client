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

interface AttendanceDraft {
	attendanceStatus: AttendanceStatus;
	note: string;
}

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
	const children: Child[] = childrenData?.getChildren?.list ?? [];
	const attendances: Attendance[] = attendancesData?.getAttendances?.list ?? [];
	const attendanceTotal = attendancesData?.getAttendances?.metaCounter?.[0]?.total ?? 0;
	const hideKindergartenSelector = shouldHideKindergartenSelector(user.memberType, kindergartens);
	const selectedKindergartenTitle = getSelectedKindergartenTitle(kindergartens, selectedKindergartenId);
	const selectableGroups = groups.filter(
		(group) => group.groupStatus === GroupStatus.ACTIVE || group.groupStatus === GroupStatus.FULL,
	);
	const selectedGroupName = selectableGroups.find((group) => group._id === selectedGroupId)?.groupName || 'Selected group';
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
			return next;
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
			if (!selectedKindergartenId) throw new Error('Please select a kindergarten first.');
			if (!selectedGroupId) throw new Error('Please select a group.');
			if (!selectedDate) throw new Error('Please select an attendance date.');

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
				await sweetMixinSuccessAlert('Attendance updated');
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
					await sweetMixinSuccessAlert('Attendance marked');
				} catch (markErr: any) {
					const isDuplicateLikeError = String(markErr?.message ?? '').includes('Create failed');
					if (!isDuplicateLikeError) throw markErr;

					await refetchAttendances();
					await sweetMixinErrorAlert('Attendance already exists. Please try saving again.');
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
			if (!(await sweetConfirmAlert('Remove this attendance record?'))) return;
			await removeAttendance({ variables: { input: attendanceId } });
			await refetchAttendances();
			await sweetMixinSuccessAlert('Attendance removed');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (user.memberType !== MemberType.KINDERGARTEN_ADMIN) {
		router.back();
		return null;
	}

	return (
		<Stack className="admin-dashboard-screen admin-attendance-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>Attendance</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Prepare the daily classroom roll call and save each child independently.
				</Typography>
			</Stack>

			<Stack className="dashboard-panel admin-attendance-scope-panel" spacing={2}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Daily attendance setup</Typography>
						<Typography className="dashboard-panel-subtitle">
							Choose the center, classroom, and date before marking attendance.
						</Typography>
					</Stack>
				</Stack>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>Loading your kindergartens...</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography className="dashboard-empty-state">
						Create a kindergarten profile before managing attendance.
					</Typography>
				)}
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					{hideKindergartenSelector && (
						<Stack className="admin-selector-card admin-readonly-selector">
							<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
								Kindergarten: {selectedKindergartenTitle}
							</Typography>
						</Stack>
					)}
					{kindergartens.length > 0 && !hideKindergartenSelector && (
						<TextField
							fullWidth
							select
							label="Kindergarten"
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
						label="Group"
						value={selectedGroupId}
						onChange={(event) => {
							setSelectedGroupId(event.target.value);
							setDrafts({});
						}}
						disabled={!selectedKindergartenId || groupsLoading || selectableGroups.length === 0}
					>
						{selectableGroups.map((group) => (
							<MenuItem key={group._id} value={group._id}>
								{group.groupName} ({group.groupStatus})
							</MenuItem>
						))}
					</TextField>
					<TextField
						fullWidth
						label="Attendance date"
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
						<Typography className="admin-meta-label">Kindergarten</Typography>
						<Typography className="admin-meta-value">
							{selectedKindergartenId ? selectedKindergartenTitle : 'No kindergarten selected'}
						</Typography>
					</Stack>
					<Stack className="dashboard-context-card">
						<Typography className="admin-meta-label">Group</Typography>
						<Typography className="admin-meta-value">
							{selectedGroupId ? selectedGroupName : 'No group selected'}
						</Typography>
					</Stack>
					<Stack className="dashboard-context-card">
						<Typography className="admin-meta-label">Date</Typography>
						<Typography className="admin-meta-value">{selectedDate || '-'}</Typography>
					</Stack>
				</Stack>
				<Typography className="dashboard-note-text">
					Selected date is saved as the attendance day for the chosen group.
				</Typography>
				{!ownerLoading && kindergartens.length > 0 && !selectedKindergartenId && (
					<Typography className="dashboard-empty-state">Select a kindergarten to load attendance groups.</Typography>
				)}
				{selectedKindergartenId && !selectedGroupId && selectableGroups.length > 0 && (
					<Typography className="dashboard-empty-state">Select a group to load children and attendance records.</Typography>
				)}
				{!groupsLoading && selectedKindergartenId && selectableGroups.length === 0 && (
					<Typography className="dashboard-empty-state">Create an active group before marking attendance.</Typography>
				)}
			</Stack>

			<Stack className="dashboard-panel" spacing={2}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Classroom roll call</Typography>
						<Typography className="dashboard-panel-subtitle">
							Choose a status, add a short note if needed, then mark or update the record.
						</Typography>
					</Stack>
					<Chip label={`${children.length} children`} size="small" className="dashboard-count-chip" />
				</Stack>
				{(childrenLoading || attendancesLoading || fetchingMoreAttendances) && (
					<Typography sx={{ color: '#6b7280' }}>Loading attendance records...</Typography>
				)}
				{!selectedKindergartenId && !ownerLoading && (
					<Typography className="dashboard-empty-state">No kindergarten selected.</Typography>
				)}
				{selectedKindergartenId && !selectedGroupId && (
					<Typography className="dashboard-empty-state">No group selected.</Typography>
				)}
				{!childrenLoading && selectedGroupId && children.length === 0 && (
					<Stack className="admin-polished-empty-state admin-attendance-empty-state" spacing={1.25}>
						<Stack className="admin-empty-indicator" aria-hidden="true">
							<span />
						</Stack>
						<Typography className="admin-empty-title">No active children in this classroom</Typography>
						<Typography className="dashboard-note-text">
							No active children are assigned to this group yet. Add children or choose another group to mark attendance.
						</Typography>
						<Button variant="outlined" onClick={() => router.push('/mypage?category=children')} sx={{ width: 'fit-content' }}>
							Go to Children
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
												label={getStatusLabel(attendance?.attendanceStatus)}
												size="small"
												sx={getStatusChipSx(attendance?.attendanceStatus)}
											/>
										) : (
											<Chip label="Not marked yet" size="small" sx={getStatusChipSx('INACTIVE')} />
										)}
									</Stack>
									<Stack className="admin-record-grid admin-attendance-grid">
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">Saved status</Typography>
											<Typography className="admin-meta-value">
												{hasExistingRecord ? getStatusLabel(attendance?.attendanceStatus) : 'Not marked yet'}
											</Typography>
											{hasExistingRecord && (
												<Typography className="dashboard-muted-text">
													Updated {formatDate(attendance?.updatedAt)}
												</Typography>
											)}
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">New status</Typography>
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
														{status}
													</MenuItem>
												))}
											</TextField>
										</Stack>
										<Stack className="admin-meta-item admin-meta-wide">
											<Typography className="admin-meta-label">Note</Typography>
											<TextField
												fullWidth
												size="small"
												placeholder="Optional note"
												value={draft.note}
												onChange={(event) => updateDraft(child._id, { note: event.target.value })}
											/>
										</Stack>
									</Stack>
									<Stack className="admin-record-actions admin-danger-actions">
										<Button variant="contained" onClick={() => saveAttendanceHandler(child)}>
											{hasExistingRecord ? 'Update attendance' : 'Mark attendance'}
										</Button>
										{hasExistingRecord && (
											<Button
												variant="outlined"
												color="error"
												onClick={() => attendance && removeAttendanceHandler(attendance._id)}
											>
												Remove
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
