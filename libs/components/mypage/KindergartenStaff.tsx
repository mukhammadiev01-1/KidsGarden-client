import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Button,
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
import {
	GET_KINDERGARTEN_STAFFS,
	GET_MEMBER,
	GET_OWNER_KINDERGARTENS,
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
import { formatDate, getSelectedKindergartenTitle, shouldHideKindergartenSelector, truncateId } from './dashboardUtils';

const staffRoleOptions = [StaffRole.ADMIN, StaffRole.TEACHER];
const staffStatusOptions = [StaffStatus.ACTIVE, StaffStatus.PENDING, StaffStatus.BLOCKED];
type StaffSelectableMember = Pick<Member, '_id' | 'memberNick' | 'memberPhone' | 'memberType' | 'memberStatus' | 'memberImage'>;

const KindergartenStaff = () => {
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
	const expectedMemberType = form.staffRole === StaffRole.ADMIN ? MemberType.KINDERGARTEN_ADMIN : MemberType.TEACHER;
	const previewRoleError =
		memberPreview && memberPreview.memberType !== expectedMemberType
			? `${form.staffRole} staff must use a ${expectedMemberType} account.`
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

					return [memberId, result.data?.getMember?.memberNick || memberId] as const;
				} catch (err) {
					return [memberId, memberId] as const;
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
	}, [apolloClient, memberNames, staffMemberIds]);

	const searchStaffCandidatesHandler = async () => {
		try {
			const trimmedSearchText = searchText.trim();
			if (!selectedKindergartenId) throw new Error('Please select a kindergarten first.');
			if (!trimmedSearchText) throw new Error('Enter a nickname or phone to search.');

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
			setCandidateSearchError('Could not search staff candidates. Please try again.');
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
			[candidate._id]: candidate.memberNick || candidate._id,
		}));
	};

	const previewMemberHandler = async () => {
		try {
			const memberId = form.memberId.trim();
			if (!memberId) throw new Error('Please enter a member ID.');

			const result = await apolloClient.query({
				query: GET_MEMBER,
				variables: { input: memberId },
				fetchPolicy: 'network-only',
			});
			const member: Member | null = result.data?.getMember ?? null;
			if (!member) throw new Error('Member was not found.');

			setMemberPreview(member);
			setMemberPreviewError('');
			setMemberNames((prev) => ({
				...prev,
				[memberId]: member.memberNick || memberId,
			}));
		} catch (err: any) {
			setMemberPreview(null);
			setMemberPreviewError(err?.message || 'Could not load member preview.');
		}
	};

	const createStaffHandler = async () => {
		try {
			const memberId = form.memberId.trim();
			if (!selectedKindergartenId) throw new Error('Please select a kindergarten first.');
			if (!memberId) throw new Error('Please enter a member ID.');
			if (!memberPreview) throw new Error('Preview member before adding.');
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
			await sweetMixinSuccessAlert('Staff record created');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const updateStaffHandler = async (input: KindergartenStaffUpdate) => {
		try {
			await updateKindergartenStaff({ variables: { input } });
			await refetchStaff();
			await sweetMixinSuccessAlert('Staff record updated');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const removeStaffHandler = async (staffId: string) => {
		try {
			if (!(await sweetConfirmAlert('Remove this staff record?'))) return;
			await removeKindergartenStaff({ variables: { input: staffId } });
			await refetchStaff();
			await sweetMixinSuccessAlert('Staff record removed');
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
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>Staff</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Search existing teacher or kindergarten admin accounts and add them to your center.
				</Typography>
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Select kindergarten</Typography>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>Loading your kindergartens...</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography sx={{ color: '#6b7280' }}>Create a kindergarten profile before managing staff.</Typography>
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
				<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Add staff member</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Choose a role, search by nickname or phone, then select a candidate before adding.
				</Typography>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						select
						label="Role"
						value={form.staffRole}
						onChange={(event) => updateStaffRole(event.target.value as StaffRole)}
					>
						{staffRoleOptions.map((role) => (
							<MenuItem key={role} value={role}>
								{role}
							</MenuItem>
						))}
					</TextField>
					<TextField
						fullWidth
						label="Search by nickname or phone"
						value={searchText}
						onChange={(event) => updateSearchText(event.target.value)}
					/>
					<Button
						variant="outlined"
						onClick={searchStaffCandidatesHandler}
						disabled={!selectedKindergartenId || !searchText.trim() || searchingCandidates}
						sx={{ minWidth: 140 }}
					>
						{searchingCandidates ? 'Searching...' : 'Search'}
					</Button>
					<TextField
						fullWidth
						select
						label="Status"
						value={form.staffStatus}
						onChange={(event) => setForm((prev) => ({ ...prev, staffStatus: event.target.value as StaffStatus }))}
					>
						{staffStatusOptions.map((status) => (
							<MenuItem key={status} value={status}>
								{status}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				{candidateSearchError && <Typography sx={{ color: '#dc2626' }}>{candidateSearchError}</Typography>}
				{hasSearchedCandidates && !searchingCandidates && candidates.length === 0 && !candidateSearchError && (
					<Typography sx={{ color: '#6b7280' }}>No available candidates found.</Typography>
				)}
				{candidates.length > 0 && (
					<Stack spacing={1.25}>
						{candidates.map((candidate) => (
							<Stack
								key={candidate._id}
								direction={{ xs: 'column', md: 'row' }}
								spacing={1.5}
								alignItems={{ xs: 'flex-start', md: 'center' }}
								justifyContent="space-between"
								sx={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
							>
								<Stack spacing={0.25}>
									<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
										{candidate.memberNick || 'Unnamed member'}
									</Typography>
									<Typography sx={{ color: '#6b7280' }}>{candidate.memberPhone || 'No phone'}</Typography>
									<Typography sx={{ color: '#6b7280' }}>{candidate.memberType}</Typography>
									<Typography sx={{ fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
										{truncateId(candidate._id)}
									</Typography>
								</Stack>
								<Button variant="contained" onClick={() => selectCandidate(candidate)}>
									Select
								</Button>
							</Stack>
						))}
					</Stack>
				)}
				{memberPreview && (
					<Stack spacing={0.75} sx={{ padding: '16px', borderRadius: '8px', background: '#f9fafb' }}>
						<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#6b7280' }}>Selected member</Typography>
						<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
							{memberPreview.memberNick || 'Unnamed member'}
						</Typography>
						<Typography sx={{ color: '#6b7280' }}>{memberPreview.memberPhone || 'No phone'}</Typography>
						<Typography sx={{ color: '#6b7280' }}>{memberPreview.memberType}</Typography>
						<Typography sx={{ fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
							{truncateId(memberPreview._id)}
						</Typography>
					</Stack>
				)}
				{memberPreviewError && <Typography sx={{ color: '#dc2626' }}>{memberPreviewError}</Typography>}
				{previewRoleError && <Typography sx={{ color: '#dc2626' }}>{previewRoleError}</Typography>}
				{!memberPreview && !memberPreviewError && (
					<Typography sx={{ color: '#6b7280' }}>Select a member before adding.</Typography>
				)}
				<Button variant="text" onClick={() => setShowManualFallback((prev) => !prev)} sx={{ width: 'fit-content' }}>
					{showManualFallback ? 'Hide advanced member ID entry' : 'Advanced: enter member ID manually'}
				</Button>
				{showManualFallback && (
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
						<TextField
							fullWidth
							label="Member ID"
							value={form.memberId}
							onChange={(event) => updateMemberId(event.target.value)}
						/>
						<Button
							variant="outlined"
							onClick={previewMemberHandler}
							disabled={!form.memberId.trim()}
							sx={{ minWidth: 150 }}
						>
							Preview member
						</Button>
					</Stack>
				)}
				<Button variant="contained" onClick={createStaffHandler} disabled={!canCreateStaff} sx={{ width: 'fit-content' }}>
					Create Staff
				</Button>
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Staff list</Typography>
				{staffLoading && <Typography sx={{ color: '#6b7280' }}>Loading staff records...</Typography>}
				{!staffLoading && selectedKindergartenId && staffRecords.length === 0 && (
					<Typography sx={{ color: '#6b7280' }}>No staff records found for this kindergarten.</Typography>
				)}
				{staffRecords.length > 0 && (
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Staff member</TableCell>
									<TableCell>Role</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Created</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{staffRecords.map((staff) => {
									const isRemoved = staff.staffStatus === StaffStatus.REMOVED;

									return (
										<TableRow key={staff._id} sx={{ opacity: isRemoved ? 0.55 : 1 }}>
											<TableCell sx={{ maxWidth: 230 }}>
												<Stack>
													<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
														{memberNames[staff.memberId] || truncateId(staff.memberId)}
													</Typography>
													<Typography sx={{ fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
														{truncateId(staff.memberId)}
													</Typography>
												</Stack>
											</TableCell>
											<TableCell>
												<TextField
													select
													size="small"
													value={staff.staffRole}
													disabled={isRemoved || staff.staffRole === StaffRole.OWNER}
													onChange={(event) =>
														updateStaffHandler({ _id: staff._id, staffRole: event.target.value as StaffRole })
													}
													sx={{ minWidth: 130 }}
												>
													{staff.staffRole === StaffRole.OWNER && (
														<MenuItem value={StaffRole.OWNER}>{StaffRole.OWNER}</MenuItem>
													)}
													{staffRoleOptions.map((role) => (
														<MenuItem key={role} value={role}>
															{role}
														</MenuItem>
													))}
												</TextField>
											</TableCell>
											<TableCell>
												<TextField
													select
													size="small"
													value={staff.staffStatus}
													disabled={isRemoved}
													onChange={(event) =>
														updateStaffHandler({ _id: staff._id, staffStatus: event.target.value as StaffStatus })
													}
													sx={{ minWidth: 130 }}
												>
													{staffStatusOptions.map((status) => (
														<MenuItem key={status} value={status}>
															{status}
														</MenuItem>
													))}
													{isRemoved && <MenuItem value={StaffStatus.REMOVED}>{StaffStatus.REMOVED}</MenuItem>}
												</TextField>
											</TableCell>
											<TableCell>{formatDate(staff.createdAt)}</TableCell>
											<TableCell align="right">
												<Button
													variant="outlined"
													color="error"
													disabled={isRemoved || staff.staffRole === StaffRole.OWNER}
													onClick={() => removeStaffHandler(staff._id)}
												>
													{isRemoved ? 'Removed' : 'Remove'}
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

export default KindergartenStaff;
