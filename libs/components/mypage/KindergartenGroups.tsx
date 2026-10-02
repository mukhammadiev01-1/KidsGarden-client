import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Button,
	Checkbox,
	Chip,
	FormControlLabel,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
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
	const { t } = useTranslation('common');
	const router = useRouter();
	const apolloClient = useApolloClient();
	const user = useReactiveVar(userVar);
	const [selectedKindergartenId, setSelectedKindergartenId] = useState('');
	const [selectedGroupId, setSelectedGroupId] = useState('');
	const [teacherIdsInput, setTeacherIdsInput] = useState('');
	const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
	const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});
	const [showAdvancedTeacherEntry, setShowAdvancedTeacherEntry] = useState(false);
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

					return [memberId, result.data?.getMember?.memberNick || t('roles.TEACHER')] as const;
				} catch (err) {
					return [memberId, t('roles.TEACHER')] as const;
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
	}, [activeTeacherIds, apolloClient, groupTeacherIds, teacherNames, t]);

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
			if (!selectedKindergartenId) throw new Error(t('mypageText.KindergartenGroups.selectKindergartenFirst'));
			if (!form.groupName.trim()) throw new Error(t('mypageText.KindergartenGroups.enterGroupName'));
			if (!form.groupAgeRange.trim()) throw new Error(t('mypageText.KindergartenGroups.enterAgeRange'));
			if (form.groupCapacity <= 0) throw new Error(t('mypageText.KindergartenGroups.capacityPositive'));

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
				await sweetMixinSuccessAlert(t('mypageText.KindergartenGroups.groupUpdated'));
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
				await sweetMixinSuccessAlert(t('mypageText.KindergartenGroups.groupCreated'));
			}

			resetForm();
			await refetchGroups();
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const removeGroupHandler = async (groupId: string) => {
		try {
			if (!(await sweetConfirmAlert(t('mypageText.KindergartenGroups.archiveConfirm')))) return;
			await removeGroup({ variables: { input: groupId } });
			await refetchGroups();
			await sweetMixinSuccessAlert(t('mypageText.KindergartenGroups.groupArchived'));
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
		<Stack className="admin-dashboard-screen admin-groups-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>{t('mypage.menu.groups')}</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					{t('mypageText.KindergartenGroups.subtitle')}
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.KindergartenGroups.selectKindergarten')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenGroups.selectKindergartenSubtitle')}
						</Typography>
					</Stack>
				</Stack>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.MyKindergarten.loadingKindergartens')}</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.KindergartenGroups.createProfileFirst')}
					</Typography>
				)}
				{hideKindergartenSelector && (
					<Stack className="admin-selector-card admin-readonly-selector">
						<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
							{t('mypageText.KindergartenGroups.kindergartenTitle', { title: selectedKindergartenTitle })}
						</Typography>
					</Stack>
				)}
				{kindergartens.length > 0 && !hideKindergartenSelector && (
					<TextField
						select
						label={t('kindergartens.card.kindergarten')}
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

			<Stack className="dashboard-panel admin-groups-form-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>
							{selectedGroupId ? t('mypageText.KindergartenGroups.editGroup') : t('mypageText.KindergartenGroups.createGroup')}
						</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenGroups.formSubtitle')}
						</Typography>
					</Stack>
					{selectedGroupId && (
						<Button variant="text" onClick={resetForm}>
							{t('mypageText.KindergartenGroups.cancelEdit')}
						</Button>
					)}
				</Stack>
				<Typography className="admin-form-section-title">{t('mypageText.KindergartenGroups.groupDetails')}</Typography>
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						label={t('mypageText.KindergartenGroups.groupName')}
						value={form.groupName}
						onChange={(event) => setForm((prev) => ({ ...prev, groupName: event.target.value }))}
					/>
					<TextField
						fullWidth
						label={t('adminTables.ageRange')}
						placeholder="4-5"
						value={form.groupAgeRange}
						onChange={(event) => setForm((prev) => ({ ...prev, groupAgeRange: event.target.value }))}
					/>
				</Stack>
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						label={t('adminTables.capacity')}
						type="number"
						value={form.groupCapacity}
						onChange={(event) => setForm((prev) => ({ ...prev, groupCapacity: Number(event.target.value) }))}
					/>
					<TextField
						fullWidth
						select
						label={t('dashboardCommon.status')}
						value={form.groupStatus}
						onChange={(event) => setForm((prev) => ({ ...prev, groupStatus: event.target.value as GroupStatus }))}
					>
						{groupStatusOptions.map((status) => (
							<MenuItem key={status} value={status}>
								{t(`statuses.${status}`)}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				<Stack className="admin-teacher-assignment" spacing={1}>
					<Typography className="admin-form-section-title">{t('mypageText.KindergartenGroups.assignTeachers')}</Typography>
					<Typography className="dashboard-panel-subtitle">
						{t('mypageText.KindergartenGroups.assignTeachersHint')}
					</Typography>
					{staffLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenGroups.loadingTeachers')}</Typography>}
					{!staffLoading && activeTeacherStaff.length === 0 && (
						<Typography className="dashboard-empty-state" sx={{ color: '#9ca3af' }}>
							{t('mypageText.KindergartenGroups.noActiveTeachers')}
						</Typography>
					)}
					{activeTeacherStaff.length > 0 && (
						<Stack className="admin-teacher-list" spacing={1}>
							{activeTeacherStaff.map((staff) => (
								<FormControlLabel
									key={staff._id}
									className="admin-teacher-option"
									control={
										<Checkbox
											checked={selectedTeacherIds.includes(staff.memberId)}
											onChange={() => toggleTeacher(staff.memberId)}
										/>
									}
									label={
										<Stack>
											<Typography className="dashboard-primary-text">
												{teacherNames[staff.memberId] || t('roles.TEACHER')}
											</Typography>
											<Typography className="dashboard-muted-text">{t('mypageText.KindergartenGroups.activeTeacherStaff')}</Typography>
										</Stack>
									}
								/>
							))}
						</Stack>
					)}
					<Button
						variant="text"
						onClick={() => setShowAdvancedTeacherEntry((prev) => !prev)}
						sx={{ width: 'fit-content' }}
					>
						{showAdvancedTeacherEntry ? t('mypageText.KindergartenGroups.hideAdvanced') : t('mypageText.KindergartenGroups.showAdvanced')}
					</Button>
					{showAdvancedTeacherEntry && (
						<Stack className="admin-advanced-panel">
							<TextField
								fullWidth
								label={t('mypageText.KindergartenGroups.teacherIdsLabel')}
								placeholder="teacherId1, teacherId2"
								value={teacherIdsInput}
								onChange={(event) => setTeacherIdsInput(event.target.value)}
								helperText={t('mypageText.KindergartenGroups.teacherIdsHelper')}
							/>
						</Stack>
					)}
				</Stack>
				<Button variant="contained" onClick={submitGroupHandler} disabled={!selectedKindergartenId} sx={{ width: 'fit-content' }}>
					{selectedGroupId ? t('mypageText.KindergartenGroups.saveGroup') : t('mypageText.KindergartenGroups.createGroupButton')}
				</Button>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.KindergartenGroups.groupList')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenGroups.groupListSubtitle')}
						</Typography>
					</Stack>
					<Chip label={t('mypageText.KindergartenGroups.groupCount', { count: groups.length })} size="small" className="dashboard-count-chip" />
				</Stack>
				{groupsLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenGroups.loadingGroups')}</Typography>}
				{!groupsLoading && selectedKindergartenId && groups.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.KindergartenGroups.noGroups')}
					</Typography>
				)}
				{groups.length > 0 && (
					<Stack className="admin-card-list admin-groups-list">
						{groups.map((group) => {
							const isArchived = group.groupStatus === GroupStatus.ARCHIVED;

							return (
								<Stack
									key={group._id}
									className="admin-record-card admin-group-card"
									spacing={2}
									sx={{ opacity: isArchived ? 0.55 : 1 }}
								>
									<Stack className="admin-record-card-header">
										<Stack className="admin-record-title-block" spacing={0.5}>
											<Typography className="dashboard-primary-text admin-record-title">{group.groupName}</Typography>
											<Typography className="dashboard-muted-text">{t('mypageText.KindergartenGroups.classGroup')}</Typography>
										</Stack>
										<Chip label={getStatusLabel(group.groupStatus)} size="small" sx={getStatusChipSx(group.groupStatus)} />
									</Stack>
									<Stack className="admin-record-grid admin-group-grid">
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.ageRange')}</Typography>
											<Typography className="admin-meta-value">{group.groupAgeRange}</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.capacity')}</Typography>
											<Typography className="admin-meta-value">{t('mypageText.KindergartenGroups.childrenCount', { count: group.groupCapacity })}</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.created')}</Typography>
											<Typography className="admin-meta-value">{formatDate(group.createdAt)}</Typography>
										</Stack>
										<Stack className="admin-meta-item admin-meta-wide">
											<Typography className="admin-meta-label">{t('kadmin.teachers')}</Typography>
											<Typography className="admin-meta-value">
												{group.teacherIds?.length
													? group.teacherIds.map((teacherId) => teacherNames[teacherId] || t('mypageText.KindergartenGroups.assignedTeacher')).join(', ')
													: t('mypageText.KindergartenGroups.noTeachersAssigned')}
											</Typography>
										</Stack>
									</Stack>
									<Stack className="admin-record-actions admin-danger-actions">
										<Button variant="outlined" disabled={isArchived} onClick={() => editGroupHandler(group)}>
											{t('common.edit')}
										</Button>
										<Button
											variant="outlined"
											color="error"
											disabled={isArchived}
											onClick={() => removeGroupHandler(group._id)}
										>
											{isArchived ? t('statuses.ARCHIVED') : t('mypageText.KindergartenGroups.archive')}
										</Button>
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

export default KindergartenGroups;
