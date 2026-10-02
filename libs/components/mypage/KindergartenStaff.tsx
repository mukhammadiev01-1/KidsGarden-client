import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useMutation, useQuery, useReactiveVar } from '@apollo/client';
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
import {
	GET_KINDERGARTEN_STAFFS,
	GET_MEMBER,
	GET_OWNER_KINDERGARTENS,
	PREVIEW_KINDERGARTEN_MEMBER,
	SEARCH_STAFF_CANDIDATES,
} from '../../../apollo/user/query';
import {
	CREATE_KINDERGARTEN_STAFF,
	REMOVE_KINDERGARTEN_STAFF,
	UPDATE_KINDERGARTEN_STAFF,
} from '../../../apollo/user/mutation';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { KindergartenStatus } from '../../enums/kindergarten.enum';
import { StaffRole, StaffStatus } from '../../enums/kindergarten-staff.enum';
import { KindergartenStaff as KindergartenStaffType } from '../../types/kindergarten-staff/kindergarten-staff';
import { KindergartenStaffInput } from '../../types/kindergarten-staff/kindergarten-staff.input';
import { KindergartenStaffUpdate } from '../../types/kindergarten-staff/kindergarten-staff.update';
import { MemberType } from '../../enums/member.enum';
import { Member } from '../../types/member/member';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import {
	formatDate,
	getSelectedKindergartenTitle,
	getStatusChipSx,
	getStatusLabel,
	shouldHideKindergartenSelector,
} from './dashboardUtils';

const staffRoleOptions = [StaffRole.ADMIN, StaffRole.TEACHER];
const staffStatusOptions = [StaffStatus.ACTIVE, StaffStatus.PENDING, StaffStatus.BLOCKED];
const staffRoleLabelKeys: Record<string, string> = {
	[StaffRole.OWNER]: 'mypageText.KindergartenStaff.roleOwner',
	[StaffRole.ADMIN]: 'mypageText.KindergartenStaff.roleAdmin',
	[StaffRole.TEACHER]: 'mypageText.KindergartenStaff.roleTeacher',
};
type StaffSelectableMember = Pick<Member, '_id' | 'memberNick' | 'memberPhone' | 'memberType' | 'memberStatus' | 'memberImage'>;

const KindergartenStaff = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const apolloClient = useApolloClient();
	const user = useReactiveVar(userVar);
	const [selectedKindergartenId, setSelectedKindergartenId] = useState('');
	const [memberNames, setMemberNames] = useState<Record<string, string>>({});
	const [memberPreview, setMemberPreview] = useState<StaffSelectableMember | null>(null);
	const [memberPreviewError, setMemberPreviewError] = useState('');
	const [searchText, setSearchText] = useState('');
	const [candidateSearchError, setCandidateSearchError] = useState('');
	const [candidates, setCandidates] = useState<StaffSelectableMember[]>([]);
	const [hasSearchedCandidates, setHasSearchedCandidates] = useState(false);
	const [searchingCandidates, setSearchingCandidates] = useState(false);
	const [showManualFallback, setShowManualFallback] = useState(false);
	const [form, setForm] = useState<KindergartenStaffInput>({
		kindergartenId: '',
		memberId: '',
		staffRole: StaffRole.TEACHER,
		staffStatus: StaffStatus.PENDING,
	});

	const [createKindergartenStaff] = useMutation(CREATE_KINDERGARTEN_STAFF);
	const [updateKindergartenStaff] = useMutation(UPDATE_KINDERGARTEN_STAFF);
	const [removeKindergartenStaff] = useMutation(REMOVE_KINDERGARTEN_STAFF);

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

	const staffInput = useMemo(
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

	const { data: ownerData, loading: ownerLoading } = useQuery(GET_OWNER_KINDERGARTENS, {
		variables: { input: ownerKindergartensInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const {
		data: staffData,
		loading: staffLoading,
		refetch: refetchStaff,
	} = useQuery(GET_KINDERGARTEN_STAFFS, {
		variables: { input: staffInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN || !selectedKindergartenId,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const kindergartens: Kindergarten[] = ownerData?.getOwnerKindergartens?.list ?? [];
	const staffRecords: KindergartenStaffType[] = staffData?.getKindergartenStaffs?.list ?? [];
	const hideKindergartenSelector = shouldHideKindergartenSelector(user.memberType, kindergartens);
	const selectedKindergartenTitle = getSelectedKindergartenTitle(kindergartens, selectedKindergartenId);
	const staffMemberIds = useMemo(
		() => Array.from(new Set(staffRecords.map((staff) => staff.memberId).filter(Boolean))),
		[staffRecords],
	);
	const roleLabel = (role?: string) =>
		role ? t(staffRoleLabelKeys[role] ?? '', { defaultValue: getStatusLabel(role) }) : '-';
	const statusLabel = (status?: string) => (status ? t(`statuses.${status}`, { defaultValue: getStatusLabel(status) }) : '-');
	const memberTypeLabel = (type?: string) => (type ? t(`roles.${type}`, { defaultValue: getStatusLabel(type) }) : '-');
	const expectedMemberType = form.staffRole === StaffRole.ADMIN ? MemberType.KINDERGARTEN_ADMIN : MemberType.TEACHER;
	const previewRoleError =
		memberPreview && memberPreview.memberType !== expectedMemberType
			? t('mypageText.KindergartenStaff.roleAccountMismatch', {
					role: roleLabel(form.staffRole),
					accountType: memberTypeLabel(expectedMemberType),
			  })
			: '';
	const canCreateStaff = Boolean(selectedKindergartenId && memberPreview && !memberPreviewError && !previewRoleError);

	const updateMemberId = (memberId: string) => {
		setMemberPreview(null);
		setMemberPreviewError('');
		setForm((prev) => ({ ...prev, memberId }));
	};

	const clearSelectedMember = () => {
		setMemberPreview(null);
		setMemberPreviewError('');
		setForm((prev) => ({ ...prev, memberId: '' }));
	};

	const updateStaffRole = (staffRole: StaffRole) => {
		clearSelectedMember();
		setCandidates([]);
		setCandidateSearchError('');
		setHasSearchedCandidates(false);
		setForm((prev) => ({ ...prev, staffRole }));
	};

	const updateSearchText = (value: string) => {
		setSearchText(value);
		clearSelectedMember();
		setCandidateSearchError('');
	};

	useEffect(() => {
		if (!selectedKindergartenId && kindergartens.length > 0) {
			setSelectedKindergartenId(kindergartens[0]._id);
		}
	}, [kindergartens, selectedKindergartenId]);

	useEffect(() => {
		setForm((prev) => ({ ...prev, kindergartenId: selectedKindergartenId }));
		clearSelectedMember();
		setCandidates([]);
		setCandidateSearchError('');
		setHasSearchedCandidates(false);
	}, [selectedKindergartenId]);

	useEffect(() => {
		const missingMemberIds = staffMemberIds.filter((memberId) => !memberNames[memberId]);
		if (!missingMemberIds.length) return;

		let isMounted = true;

		Promise.all(
			missingMemberIds.map(async (memberId) => {
				try {
					const result = await apolloClient.query({
						query: GET_MEMBER,
						variables: { input: memberId },
						fetchPolicy: 'cache-first',
					});

					return [memberId, result.data?.getMember?.memberNick || t('mypageText.KindergartenStaff.staffMemberFallback')] as const;
				} catch (err) {
					return [memberId, t('mypageText.KindergartenStaff.staffMemberFallback')] as const;
				}
			}),
		).then((entries) => {
			if (!isMounted) return;
			setMemberNames((prev) => ({
				...prev,
				...Object.fromEntries(entries),
			}));
		});

		return () => {
			isMounted = false;
		};
	}, [apolloClient, memberNames, staffMemberIds, t]);

	const searchStaffCandidatesHandler = async () => {
		try {
			const trimmedSearchText = searchText.trim();
			if (!selectedKindergartenId) throw new Error(t('mypageText.KindergartenStaff.selectKindergartenFirst'));
			if (!trimmedSearchText) throw new Error(t('mypageText.KindergartenStaff.enterSearchText'));

			setSearchingCandidates(true);
			setCandidateSearchError('');
			setHasSearchedCandidates(true);

			const result = await apolloClient.query({
				query: SEARCH_STAFF_CANDIDATES,
				variables: {
					input: {
						kindergartenId: selectedKindergartenId,
						searchText: trimmedSearchText,
						staffRole: form.staffRole,
						page: 1,
						limit: 10,
					},
				},
				fetchPolicy: 'network-only',
			});

			setCandidates(result.data?.searchStaffCandidates?.list ?? []);
		} catch (err: any) {
			setCandidates([]);
			setHasSearchedCandidates(true);
			setCandidateSearchError(t('mypageText.KindergartenStaff.candidateSearchFailed'));
		} finally {
			setSearchingCandidates(false);
		}
	};

	const selectCandidate = (candidate: StaffSelectableMember) => {
		setMemberPreview(candidate);
		setMemberPreviewError('');
		setForm((prev) => ({ ...prev, memberId: candidate._id }));
		setMemberNames((prev) => ({
			...prev,
			[candidate._id]: candidate.memberNick || t('mypageText.KindergartenStaff.selectedMember'),
		}));
	};

	const previewMemberHandler = async () => {
		try {
			const memberId = form.memberId.trim();
			if (!selectedKindergartenId) throw new Error(t('mypageText.KindergartenStaff.selectKindergartenFirst'));
			if (!memberId) throw new Error(t('mypageText.KindergartenStaff.enterMemberId'));

			const result = await apolloClient.query({
				query: PREVIEW_KINDERGARTEN_MEMBER,
				variables: {
					input: {
						kindergartenId: selectedKindergartenId,
						memberId,
						purpose: 'STAFF_CANDIDATE',
						staffRole: form.staffRole,
					},
				},
				fetchPolicy: 'network-only',
			});
			const member: StaffSelectableMember | null = result.data?.previewKindergartenMember ?? null;
			if (!member) throw new Error(t('mypageText.KindergartenStaff.memberNotFound'));

			setMemberPreview(member);
			setMemberPreviewError('');
			setMemberNames((prev) => ({
				...prev,
				[memberId]: member.memberNick || t('mypageText.KindergartenStaff.selectedMember'),
			}));
		} catch (err: any) {
			setMemberPreview(null);
			setMemberPreviewError(err?.message || t('mypageText.KindergartenStaff.memberPreviewFailed'));
		}
	};

	const createStaffHandler = async () => {
		try {
			const memberId = form.memberId.trim();
			if (!selectedKindergartenId) throw new Error(t('mypageText.KindergartenStaff.selectKindergartenFirst'));
			if (!memberId) throw new Error(t('mypageText.KindergartenStaff.enterMemberId'));
			if (!memberPreview) throw new Error(t('mypageText.KindergartenStaff.previewBeforeAdding'));
			if (previewRoleError) throw new Error(previewRoleError);

			await createKindergartenStaff({
				variables: {
					input: {
						...form,
						kindergartenId: selectedKindergartenId,
						memberId,
					},
				},
			});

			setForm({
				kindergartenId: selectedKindergartenId,
				memberId: '',
				staffRole: StaffRole.TEACHER,
				staffStatus: StaffStatus.PENDING,
			});
			setMemberPreview(null);
			setMemberPreviewError('');
			await refetchStaff();
			await sweetMixinSuccessAlert(t('mypageText.KindergartenStaff.staffCreated'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const updateStaffHandler = async (input: KindergartenStaffUpdate) => {
		try {
			await updateKindergartenStaff({ variables: { input } });
			await refetchStaff();
			await sweetMixinSuccessAlert(t('mypageText.KindergartenStaff.staffUpdated'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const removeStaffHandler = async (staffId: string) => {
		try {
			if (!(await sweetConfirmAlert(t('mypageText.KindergartenStaff.removeConfirm')))) return;
			await removeKindergartenStaff({ variables: { input: staffId } });
			await refetchStaff();
			await sweetMixinSuccessAlert(t('mypageText.KindergartenStaff.staffRemoved'));
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
		<Stack className="admin-dashboard-screen admin-staff-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>{t('mypage.menu.staff')}</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					{t('mypageText.KindergartenStaff.subtitle')}
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.KindergartenStaff.selectKindergarten')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenStaff.selectKindergartenHint')}
						</Typography>
					</Stack>
				</Stack>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenStaff.loadingKindergartens')}</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.KindergartenStaff.createKindergartenFirst')}
					</Typography>
				)}
				{hideKindergartenSelector && (
					<Stack className="admin-selector-card admin-readonly-selector">
						<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
							{t('mypageText.KindergartenStaff.kindergartenLabel', { title: selectedKindergartenTitle })}
						</Typography>
					</Stack>
				)}
				{kindergartens.length > 0 && !hideKindergartenSelector && (
					<TextField
						select
						label={t('adminTables.kindergarten')}
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

			<Stack className="dashboard-panel admin-staff-create-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.KindergartenStaff.addStaffTitle')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenStaff.addStaffHint')}
						</Typography>
					</Stack>
				</Stack>
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						select
						label={t('dashboardCommon.role')}
						value={form.staffRole}
						onChange={(event) => updateStaffRole(event.target.value as StaffRole)}
					>
						{staffRoleOptions.map((role) => (
							<MenuItem key={role} value={role}>
								{roleLabel(role)}
							</MenuItem>
						))}
					</TextField>
					<TextField
						fullWidth
						label={t('mypageText.KindergartenStaff.searchLabel')}
						value={searchText}
						onChange={(event) => updateSearchText(event.target.value)}
					/>
					<Button
						variant="outlined"
						onClick={searchStaffCandidatesHandler}
						disabled={!selectedKindergartenId || !searchText.trim() || searchingCandidates}
						sx={{ minWidth: 140 }}
					>
						{searchingCandidates ? t('kindergartens.searching') : t('common.search')}
					</Button>
					<TextField
						fullWidth
						select
						label={t('dashboardCommon.status')}
						value={form.staffStatus}
						onChange={(event) => setForm((prev) => ({ ...prev, staffStatus: event.target.value as StaffStatus }))}
					>
						{staffStatusOptions.map((status) => (
							<MenuItem key={status} value={status}>
								{statusLabel(status)}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				{candidateSearchError && <Typography sx={{ color: '#dc2626' }}>{candidateSearchError}</Typography>}
				{hasSearchedCandidates && !searchingCandidates && candidates.length === 0 && !candidateSearchError && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenStaff.noCandidates')}</Typography>
				)}
				{candidates.length > 0 && (
					<Stack className="admin-candidate-list" spacing={1.25}>
						{candidates.map((candidate) => (
							<Stack
								key={candidate._id}
								className="admin-candidate-card"
								direction={{ xs: 'column', md: 'row' }}
								spacing={1.5}
								alignItems={{ xs: 'flex-start', md: 'center' }}
								justifyContent="space-between"
							>
								<Stack spacing={0.25}>
									<Typography className="dashboard-primary-text">
										{candidate.memberNick || t('mypageText.KindergartenStaff.unnamedMember')}
									</Typography>
									<Typography className="dashboard-muted-text">{candidate.memberPhone || t('mypageText.KindergartenStaff.noPhone')}</Typography>
									<Stack className="admin-chip-row">
										<Chip label={memberTypeLabel(candidate.memberType)} size="small" className="admin-info-chip" />
										<Chip label={statusLabel(candidate.memberStatus)} size="small" sx={getStatusChipSx(candidate.memberStatus)} />
									</Stack>
								</Stack>
								<Button variant="contained" onClick={() => selectCandidate(candidate)}>
									{t('mypageText.KindergartenStaff.select')}
								</Button>
							</Stack>
						))}
					</Stack>
				)}
				{memberPreview && (
					<Stack className="admin-candidate-card admin-selected-member-card" spacing={0.75}>
						<Typography className="admin-form-section-title">{t('mypageText.KindergartenStaff.selectedMember')}</Typography>
						<Typography className="dashboard-primary-text">
							{memberPreview.memberNick || t('mypageText.KindergartenStaff.unnamedMember')}
						</Typography>
						<Typography className="dashboard-muted-text">{memberPreview.memberPhone || t('mypageText.KindergartenStaff.noPhone')}</Typography>
						<Stack className="admin-chip-row">
							<Chip label={memberTypeLabel(memberPreview.memberType)} size="small" className="admin-info-chip" />
							<Chip label={statusLabel(memberPreview.memberStatus)} size="small" sx={getStatusChipSx(memberPreview.memberStatus)} />
						</Stack>
					</Stack>
				)}
				{memberPreviewError && <Typography sx={{ color: '#dc2626' }}>{memberPreviewError}</Typography>}
				{previewRoleError && <Typography sx={{ color: '#dc2626' }}>{previewRoleError}</Typography>}
				{!memberPreview && !memberPreviewError && (
					<Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenStaff.selectMemberHint')}</Typography>
				)}
				<Button variant="text" onClick={() => setShowManualFallback((prev) => !prev)} sx={{ width: 'fit-content' }}>
					{showManualFallback ? t('mypageText.KindergartenStaff.hideAdvanced') : t('mypageText.KindergartenStaff.showAdvanced')}
				</Button>
				{showManualFallback && (
					<Stack className="admin-form-grid admin-advanced-panel" direction={{ xs: 'column', md: 'row' }} spacing={2}>
						<TextField
							fullWidth
							label={t('mypageText.KindergartenStaff.memberIdLabel')}
							value={form.memberId}
							onChange={(event) => updateMemberId(event.target.value)}
							helperText={t('mypageText.KindergartenStaff.memberIdHelper')}
						/>
						<Button
							variant="outlined"
							onClick={previewMemberHandler}
							disabled={!form.memberId.trim()}
							sx={{ minWidth: 150 }}
						>
							{t('mypageText.KindergartenStaff.previewMember')}
						</Button>
					</Stack>
				)}
				<Button variant="contained" onClick={createStaffHandler} disabled={!canCreateStaff} sx={{ width: 'fit-content' }}>
					{t('mypageText.KindergartenStaff.createStaff')}
				</Button>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.KindergartenStaff.staffListTitle')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenStaff.staffListHint')}
						</Typography>
					</Stack>
					<Chip label={t('mypageText.KindergartenStaff.recordsCount', { count: staffRecords.length })} size="small" className="dashboard-count-chip" />
				</Stack>
				{staffLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenStaff.loadingStaff')}</Typography>}
				{!staffLoading && selectedKindergartenId && staffRecords.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.KindergartenStaff.noStaff')}
					</Typography>
				)}
				{staffRecords.length > 0 && (
					<Stack className="admin-card-list admin-staff-list">
						{staffRecords.map((staff) => {
							const isRemoved = staff.staffStatus === StaffStatus.REMOVED;
							const isOwner = staff.staffRole === StaffRole.OWNER;

							return (
								<Stack
									key={staff._id}
									className="admin-record-card admin-staff-card"
									spacing={2}
									sx={{ opacity: isRemoved ? 0.55 : 1 }}
								>
									<Stack className="admin-record-card-header">
										<Stack className="admin-record-title-block" spacing={0.5}>
											<Typography className="dashboard-primary-text admin-record-title">
												{memberNames[staff.memberId] || t('mypageText.KindergartenStaff.staffMemberFallback')}
											</Typography>
											<Typography className="dashboard-muted-text">{t('mypageText.KindergartenStaff.teamMember')}</Typography>
										</Stack>
										<Stack className="admin-chip-row">
											<Chip label={roleLabel(staff.staffRole)} size="small" className="admin-info-chip" />
											<Chip label={statusLabel(staff.staffStatus)} size="small" sx={getStatusChipSx(staff.staffStatus)} />
											{isOwner && <Chip label={t('mypageText.KindergartenStaff.protectedOwner')} size="small" className="admin-protected-badge" />}
										</Stack>
									</Stack>
									<Stack className="admin-record-grid admin-staff-grid">
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('dashboardCommon.role')}</Typography>
											<TextField
												select
												size="small"
												value={staff.staffRole}
												disabled={isRemoved || isOwner}
												onChange={(event) =>
													updateStaffHandler({ _id: staff._id, staffRole: event.target.value as StaffRole })
												}
											>
												{staff.staffRole === StaffRole.OWNER && (
													<MenuItem value={StaffRole.OWNER}>{roleLabel(StaffRole.OWNER)}</MenuItem>
												)}
												{staffRoleOptions.map((role) => (
													<MenuItem key={role} value={role}>
														{roleLabel(role)}
													</MenuItem>
												))}
											</TextField>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('dashboardCommon.status')}</Typography>
											<TextField
												select
												size="small"
												value={staff.staffStatus}
												disabled={isRemoved || isOwner}
												onChange={(event) =>
													updateStaffHandler({ _id: staff._id, staffStatus: event.target.value as StaffStatus })
												}
											>
												{staffStatusOptions.map((status) => (
													<MenuItem key={status} value={status}>
														{statusLabel(status)}
													</MenuItem>
												))}
												{isRemoved && <MenuItem value={StaffStatus.REMOVED}>{statusLabel(StaffStatus.REMOVED)}</MenuItem>}
											</TextField>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.created')}</Typography>
											<Typography className="admin-meta-value">{formatDate(staff.createdAt)}</Typography>
										</Stack>
									</Stack>
									<Stack className="admin-record-actions admin-danger-actions">
										<Button
											variant="outlined"
											color="error"
											disabled={isRemoved || isOwner}
											onClick={() => removeStaffHandler(staff._id)}
										>
											{isRemoved ? t('statuses.REMOVED') : t('messages.remove')}
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

export default KindergartenStaff;
