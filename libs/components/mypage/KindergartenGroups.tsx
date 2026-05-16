import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Button,
	Checkbox,
	Chip,
	FormControlLabel,
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
import { GET_GROUPS, GET_KINDERGARTEN_STAFFS, GET_MEMBER, GET_OWNER_KINDERGARTENS } from '../../../apollo/user/query';
import { CREATE_GROUP, REMOVE_GROUP, UPDATE_GROUP } from '../../../apollo/user/mutation';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { KindergartenStatus } from '../../enums/kindergarten.enum';
import { GroupStatus } from '../../enums/group.enum';
import { StaffRole, StaffStatus } from '../../enums/kindergarten-staff.enum';
import { Group } from '../../types/group/group';
import { GroupInput } from '../../types/group/group.input';
import { GroupUpdate } from '../../types/group/group.update';
import { KindergartenStaff as KindergartenStaffType } from '../../types/kindergarten-staff/kindergarten-staff';
import { MemberType } from '../../enums/member.enum';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import {
	formatDate,
	getSelectedKindergartenTitle,
	getStatusChipSx,
	getStatusLabel,
	shouldHideKindergartenSelector,
	truncateId,
} from './dashboardUtils';

const groupStatusOptions = [GroupStatus.ACTIVE, GroupStatus.INACTIVE, GroupStatus.FULL];

const emptyForm: GroupInput = {
	kindergartenId: '',
	groupName: '',
	groupAgeRange: '',
	groupCapacity: 1,
	teacherIds: [],
	groupStatus: GroupStatus.ACTIVE,
};

const parseTeacherIds = (value: string): string[] => {
	return value
		.split(',')
		.map((teacherId) => teacherId.trim())
		.filter(Boolean);
};

const KindergartenGroups = () => {
	const router = useRouter();
	const apolloClient = useApolloClient();
	const user = useReactiveVar(userVar);
	const [selectedKindergartenId, setSelectedKindergartenId] = useState('');
	const [selectedGroupId, setSelectedGroupId] = useState('');
	const [teacherIdsInput, setTeacherIdsInput] = useState('');
	const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
	const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});
	const [form, setForm] = useState<GroupInput>(emptyForm);

	const [createGroup] = useMutation(CREATE_GROUP);
	const [updateGroup] = useMutation(UPDATE_GROUP);
	const [removeGroup] = useMutation(REMOVE_GROUP);

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
			limit: 50,
			sort: 'createdAt',
			search: {
				kindergartenId: selectedKindergartenId,
			},
		}),
		[selectedKindergartenId],
	);

	const staffInput = useMemo(
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

	const { data: ownerData, loading: ownerLoading } = useQuery(GET_OWNER_KINDERGARTENS, {
		variables: { input: ownerKindergartensInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const {
		data: groupsData,
		loading: groupsLoading,
		refetch: refetchGroups,
	} = useQuery(GET_GROUPS, {
		variables: { input: groupsInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN || !selectedKindergartenId,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const { data: staffData, loading: staffLoading } = useQuery(GET_KINDERGARTEN_STAFFS, {
		variables: { input: staffInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN || !selectedKindergartenId,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const kindergartens: Kindergarten[] = ownerData?.getOwnerKindergartens?.list ?? [];
	const groups: Group[] = groupsData?.getGroups?.list ?? [];
	const staffRecords: KindergartenStaffType[] = staffData?.getKindergartenStaffs?.list ?? [];
	const hideKindergartenSelector = shouldHideKindergartenSelector(user.memberType, kindergartens);
	const selectedKindergartenTitle = getSelectedKindergartenTitle(kindergartens, selectedKindergartenId);
	const activeTeacherStaff = staffRecords.filter(
		(staff) => staff.staffRole === StaffRole.TEACHER && staff.staffStatus === StaffStatus.ACTIVE,
	);
	const activeTeacherIds = useMemo(
		() => Array.from(new Set(activeTeacherStaff.map((staff) => staff.memberId))),
		[activeTeacherStaff],
	);
	const groupTeacherIds = useMemo(
		() => Array.from(new Set(groups.flatMap((group) => group.teacherIds ?? []).filter(Boolean))),
		[groups],
	);

	useEffect(() => {
		if (!selectedKindergartenId && kindergartens.length > 0) {
			setSelectedKindergartenId(kindergartens[0]._id);
		}
	}, [kindergartens, selectedKindergartenId]);

	useEffect(() => {
		setForm((prev) => ({ ...prev, kindergartenId: selectedKindergartenId }));
		setSelectedGroupId('');
		setTeacherIdsInput('');
		setSelectedTeacherIds([]);
	}, [selectedKindergartenId]);

	useEffect(() => {
		const missingTeacherIds = Array.from(new Set([...activeTeacherIds, ...groupTeacherIds])).filter(
			(memberId) => !teacherNames[memberId],
		);
		if (!missingTeacherIds.length) return;

		let isMounted = true;

		Promise.all(
			missingTeacherIds.map(async (memberId) => {
				try {
					const result = await apolloClient.query({
						query: GET_MEMBER,
						variables: { input: memberId },
						fetchPolicy: 'cache-first',
					});

					return [memberId, result.data?.getMember?.memberNick || memberId] as const;
				} catch (err) {
					return [memberId, memberId] as const;
				}
			}),
		).then((entries) => {
			if (!isMounted) return;
			setTeacherNames((prev) => ({
				...prev,
				...Object.fromEntries(entries),
			}));
		});

		return () => {
			isMounted = false;
		};
	}, [activeTeacherIds, apolloClient, groupTeacherIds, teacherNames]);

	const resetForm = () => {
		setSelectedGroupId('');
		setTeacherIdsInput('');
		setSelectedTeacherIds([]);
		setForm({ ...emptyForm, kindergartenId: selectedKindergartenId });
	};

	const editGroupHandler = (group: Group) => {
		const teacherIds = group.teacherIds ?? [];
		setSelectedGroupId(group._id);
		setTeacherIdsInput(teacherIds.join(', '));
		setSelectedTeacherIds(teacherIds);
		setForm({
			kindergartenId: group.kindergartenId,
			groupName: group.groupName,
			groupAgeRange: group.groupAgeRange,
			groupCapacity: group.groupCapacity,
			teacherIds,
			groupStatus: group.groupStatus,
		});
	};

	const toggleTeacher = (memberId: string) => {
		setSelectedTeacherIds((prev) =>
			prev.includes(memberId) ? prev.filter((teacherId) => teacherId !== memberId) : [...prev, memberId],
		);
	};

	const submitGroupHandler = async () => {
		try {
			const teacherIds = Array.from(new Set([...selectedTeacherIds, ...parseTeacherIds(teacherIdsInput)]));
			if (!selectedKindergartenId) throw new Error('Please select a kindergarten first.');
			if (!form.groupName.trim()) throw new Error('Please enter a group name.');
			if (!form.groupAgeRange.trim()) throw new Error('Please enter an age range.');
			if (form.groupCapacity <= 0) throw new Error('Capacity must be greater than 0.');

			if (selectedGroupId) {
				const input: GroupUpdate = {
					_id: selectedGroupId,
					groupName: form.groupName.trim(),
					groupAgeRange: form.groupAgeRange.trim(),
					groupCapacity: Number(form.groupCapacity),
					teacherIds,
					groupStatus: form.groupStatus,
				};
				await updateGroup({ variables: { input } });
				await sweetMixinSuccessAlert('Group updated');
			} else {
				const input: GroupInput = {
					...form,
					kindergartenId: selectedKindergartenId,
					groupName: form.groupName.trim(),
					groupAgeRange: form.groupAgeRange.trim(),
					groupCapacity: Number(form.groupCapacity),
					teacherIds,
				};
				await createGroup({ variables: { input } });
				await sweetMixinSuccessAlert('Group created');
			}

			resetForm();
			await refetchGroups();
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const removeGroupHandler = async (groupId: string) => {
		try {
			if (!(await sweetConfirmAlert('Archive this group?'))) return;
			await removeGroup({ variables: { input: groupId } });
			await refetchGroups();
			await sweetMixinSuccessAlert('Group archived');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (user.memberType !== MemberType.KINDERGARTEN_ADMIN) {
		router.back();
		return null;
	}

	return (
		<Stack spacing={3} sx={{ width: '100%' }}>
			<Stack spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>Groups</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Create class groups for a selected kindergarten. Teacher IDs must already be ACTIVE TEACHER staff records.
				</Typography>
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Select kindergarten</Typography>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>Loading your kindergartens...</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography sx={{ color: '#6b7280' }}>Create a kindergarten profile before managing groups.</Typography>
				)}
				{hideKindergartenSelector && (
					<Stack sx={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
						<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
							Kindergarten: {selectedKindergartenTitle}
						</Typography>
					</Stack>
				)}
				{kindergartens.length > 0 && !hideKindergartenSelector && (
					<TextField
						select
						label="Kindergarten"
						value={selectedKindergartenId}
						onChange={(event) => setSelectedKindergartenId(event.target.value)}
						sx={{ maxWidth: 520 }}
					>
						{kindergartens.map((kindergarten) => (
							<MenuItem key={kindergarten._id} value={kindergarten._id}>
								{kindergarten.kindergartenTitle}
							</MenuItem>
						))}
					</TextField>
				)}
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
					<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>
						{selectedGroupId ? 'Edit group' : 'Create group'}
					</Typography>
					{selectedGroupId && (
						<Button variant="text" onClick={resetForm}>
							Cancel edit
						</Button>
					)}
				</Stack>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						label="Group name"
						value={form.groupName}
						onChange={(event) => setForm((prev) => ({ ...prev, groupName: event.target.value }))}
					/>
					<TextField
						fullWidth
						label="Age range"
						placeholder="4-5"
						value={form.groupAgeRange}
						onChange={(event) => setForm((prev) => ({ ...prev, groupAgeRange: event.target.value }))}
					/>
				</Stack>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						label="Capacity"
						type="number"
						value={form.groupCapacity}
						onChange={(event) => setForm((prev) => ({ ...prev, groupCapacity: Number(event.target.value) }))}
					/>
					<TextField
						fullWidth
						select
						label="Status"
						value={form.groupStatus}
						onChange={(event) => setForm((prev) => ({ ...prev, groupStatus: event.target.value as GroupStatus }))}
					>
						{groupStatusOptions.map((status) => (
							<MenuItem key={status} value={status}>
								{status}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				<Stack spacing={1}>
					<Typography sx={{ fontWeight: 700, color: '#24332d' }}>Assign teachers</Typography>
					<Typography sx={{ color: '#6b7280', fontSize: '14px' }}>
						Only ACTIVE TEACHER staff can be assigned to groups.
					</Typography>
					{staffLoading && <Typography sx={{ color: '#6b7280' }}>Loading active teachers...</Typography>}
					{!staffLoading && activeTeacherStaff.length === 0 && (
						<Typography sx={{ color: '#9ca3af' }}>No active teachers yet. Add teachers in Staff first.</Typography>
					)}
					{activeTeacherStaff.length > 0 && (
						<Stack spacing={1} sx={{ padding: '12px', borderRadius: '12px', background: '#fbfcf8' }}>
							{activeTeacherStaff.map((staff) => (
								<FormControlLabel
									key={staff._id}
									control={
										<Checkbox
											checked={selectedTeacherIds.includes(staff.memberId)}
											onChange={() => toggleTeacher(staff.memberId)}
										/>
									}
									label={
										<Stack>
											<Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#24332d' }}>
												{teacherNames[staff.memberId] || staff.memberId}
											</Typography>
											<Typography sx={{ fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
												{staff.memberId}
											</Typography>
										</Stack>
									}
								/>
							))}
						</Stack>
					)}
					<TextField
						fullWidth
						label="Additional teacher IDs"
						placeholder="teacherId1, teacherId2"
						value={teacherIdsInput}
						onChange={(event) => setTeacherIdsInput(event.target.value)}
						helperText="Optional fallback for comma-separated teacher member IDs."
					/>
				</Stack>
				<Button variant="contained" onClick={submitGroupHandler} disabled={!selectedKindergartenId} sx={{ width: 'fit-content' }}>
					{selectedGroupId ? 'Save Group' : 'Create Group'}
				</Button>
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Group list</Typography>
				{groupsLoading && <Typography sx={{ color: '#6b7280' }}>Loading groups...</Typography>}
				{!groupsLoading && selectedKindergartenId && groups.length === 0 && (
					<Typography sx={{ color: '#6b7280' }}>No groups found for this kindergarten.</Typography>
				)}
				{groups.length > 0 && (
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Name</TableCell>
									<TableCell>Age range</TableCell>
									<TableCell>Capacity</TableCell>
									<TableCell>Teachers</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Created</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{groups.map((group) => {
									const isArchived = group.groupStatus === GroupStatus.ARCHIVED;

									return (
										<TableRow key={group._id} sx={{ opacity: isArchived ? 0.55 : 1 }}>
											<TableCell>{group.groupName}</TableCell>
											<TableCell>{group.groupAgeRange}</TableCell>
											<TableCell>{group.groupCapacity}</TableCell>
											<TableCell sx={{ maxWidth: 280 }}>
												{group.teacherIds?.length
													? group.teacherIds.map((teacherId) => (
															<Stack key={teacherId} sx={{ mb: 0.5 }}>
																<Typography sx={{ fontWeight: 700, color: '#24332d', fontSize: '13px' }}>
																	{teacherNames[teacherId] || truncateId(teacherId)}
																</Typography>
																<Typography sx={{ color: '#9ca3af', fontSize: '11px', wordBreak: 'break-all' }}>
																	{truncateId(teacherId)}
																</Typography>
															</Stack>
													  ))
													: '-'}
											</TableCell>
											<TableCell>
												<Chip label={getStatusLabel(group.groupStatus)} size="small" sx={getStatusChipSx(group.groupStatus)} />
											</TableCell>
											<TableCell>{formatDate(group.createdAt)}</TableCell>
											<TableCell align="right">
												<Stack direction={'row'} spacing={1} justifyContent={'flex-end'}>
													<Button variant="outlined" disabled={isArchived} onClick={() => editGroupHandler(group)}>
														Edit
													</Button>
													<Button
														variant="outlined"
														color="error"
														disabled={isArchived}
														onClick={() => removeGroupHandler(group._id)}
													>
														{isArchived ? 'Archived' : 'Archive'}
													</Button>
												</Stack>
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

export default KindergartenGroups;
