import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Button,
	Chip,
	MenuItem,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
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
import { getStatusChipSx, getStatusLabel, truncateId } from './dashboardUtils';

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

const TeacherAttendance = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [selectedGroupId, setSelectedGroupId] = useState('');
	const [selectedDate, setSelectedDate] = useState(today());
	const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({});

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
			limit: 200,
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
		refetch: refetchAttendances,
	} = useQuery(GET_ATTENDANCES, {
		variables: { input: attendancesInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.TEACHER || !selectedGroupId || !selectedDate,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const groups: Group[] = groupsData?.getGroups?.list ?? [];
	const children: Child[] = childrenData?.getChildren?.list ?? [];
	const attendances: Attendance[] = attendancesData?.getAttendances?.list ?? [];
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
			return next;
		});
	}, [attendanceByChildId, children]);

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
			if (!selectedGroupId) throw new Error('Please select a group.');
			if (!selectedDate) throw new Error('Please select an attendance date.');

			const draft = drafts[child._id] ?? {
				attendanceStatus: AttendanceStatus.PRESENT,
				note: '',
			};
			const attendance = attendanceByChildId[child._id] ?? findAttendanceForChild(attendances, child._id, selectedDate);
			const attendanceDate = toAttendanceDate(selectedDate);
			const kindergartenId = child.kindergartenId || selectedGroup?.kindergartenId;
			const note = draft.note.trim() || undefined;

			if (!kindergartenId) throw new Error('Could not determine kindergarten for this child.');

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
				await sweetMixinSuccessAlert('Attendance updated');
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

	if (user.memberType !== MemberType.TEACHER) {
		router.back();
		return null;
	}

	return (
		<Stack className="teacher-dashboard-screen teacher-attendance-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>Attendance</Typography>
				<Typography sx={{ color: '#6b7280' }}>Mark attendance for the groups assigned to you.</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Select group and date</Typography>
						<Typography className="dashboard-panel-subtitle">
							Choose the active group and attendance day before marking children.
						</Typography>
					</Stack>
					<Chip label={`${groups.length} groups`} size="small" className="dashboard-count-chip" />
				</Stack>
				{groupsLoading && <Typography sx={{ color: '#6b7280' }}>Loading your groups...</Typography>}
				{!groupsLoading && groups.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No active groups are assigned to you yet.
					</Typography>
				)}
				<Stack className="dashboard-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						select
						label="Group"
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
				{selectedGroup && (
					<Stack className="dashboard-context-card">
						<Typography className="dashboard-primary-text">
							{selectedGroup.groupName} for {selectedDate}
						</Typography>
						<Typography className="dashboard-muted-text">
							Age range {selectedGroup.groupAgeRange} · Capacity {selectedGroup.groupCapacity} · Group ID{' '}
							{truncateId(selectedGroup._id)}
						</Typography>
					</Stack>
				)}
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Daily attendance</Typography>
						<Typography className="dashboard-panel-subtitle">
							Choose a status for each child, add an optional note, then click Mark or Update.
						</Typography>
					</Stack>
					<Chip label={`${children.length} children`} size="small" className="dashboard-count-chip" />
				</Stack>
				{(childrenLoading || attendancesLoading) && (
					<Typography sx={{ color: '#6b7280' }}>Loading attendance records...</Typography>
				)}
				{!childrenLoading && selectedGroupId && children.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No active children found in this group.
					</Typography>
				)}
				{children.length > 0 && (
					<TableContainer className="dashboard-table-container teacher-attendance-table">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Child</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Note</TableCell>
									<TableCell>Saved record</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{children.map((child) => {
									const attendance = attendanceByChildId[child._id];
									const hasExistingRecord = Boolean(attendance);
									const draft = drafts[child._id] ?? {
										attendanceStatus: attendance?.attendanceStatus ?? AttendanceStatus.PRESENT,
										note: attendance?.note ?? '',
									};

									return (
										<TableRow key={child._id}>
											<TableCell>
												<Stack spacing={0.25}>
													<Typography className="dashboard-primary-text">{child.childFullName}</Typography>
													<Typography className="dashboard-muted-text">Child ID {truncateId(child._id)}</Typography>
												</Stack>
											</TableCell>
											<TableCell>
												<TextField
													select
													size="small"
													value={draft.attendanceStatus}
													onChange={(event) =>
														updateDraft(child._id, { attendanceStatus: event.target.value as AttendanceStatus })
													}
													sx={{ minWidth: 140 }}
												>
													{attendanceStatusOptions.map((status) => (
														<MenuItem key={status} value={status}>
															{status}
														</MenuItem>
													))}
												</TextField>
											</TableCell>
											<TableCell>
												<TextField
													fullWidth
													size="small"
													placeholder="Optional note"
													value={draft.note}
													onChange={(event) => updateDraft(child._id, { note: event.target.value })}
												/>
											</TableCell>
											<TableCell>
												{hasExistingRecord ? (
													<Chip
														label={`Saved: ${getStatusLabel(attendance?.attendanceStatus)}`}
														size="small"
														sx={getStatusChipSx(attendance?.attendanceStatus)}
													/>
												) : (
													<Chip label="Not marked yet" size="small" sx={getStatusChipSx('INACTIVE')} />
												)}
											</TableCell>
											<TableCell align="right">
												<Button variant="contained" onClick={() => saveAttendanceHandler(child)}>
													{hasExistingRecord ? 'Update attendance' : 'Mark attendance'}
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Stack>
		</Stack>
	);
};

export default TeacherAttendance;
