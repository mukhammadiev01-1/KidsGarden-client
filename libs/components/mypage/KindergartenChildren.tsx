import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useMutation, useQuery, useReactiveVar } from '@apollo/client';
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
import {
	GET_CHILDREN,
	GET_GROUPS,
	GET_MEMBER,
	GET_OWNER_KINDERGARTENS,
	PREVIEW_KINDERGARTEN_MEMBER,
} from '../../../apollo/user/query';
import { CREATE_CHILD, REMOVE_CHILD, UPDATE_CHILD } from '../../../apollo/user/mutation';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { KindergartenStatus } from '../../enums/kindergarten.enum';
import { GroupStatus } from '../../enums/group.enum';
import { ChildGender, ChildStatus } from '../../enums/child.enum';
import { MemberType } from '../../enums/member.enum';
import { Group } from '../../types/group/group';
import { Child } from '../../types/child/child';
import { ChildInput } from '../../types/child/child.input';
import { ChildUpdate } from '../../types/child/child.update';
import { Member } from '../../types/member/member';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import {
	formatDate,
	getSelectedKindergartenTitle,
	getStatusChipSx,
	getStatusLabel,
	shouldHideKindergartenSelector,
	truncateId,
} from './dashboardUtils';

const childGenderOptions = [ChildGender.BOY, ChildGender.GIRL];
const childStatusOptions = [ChildStatus.ACTIVE, ChildStatus.INACTIVE, ChildStatus.GRADUATED, ChildStatus.TRANSFERRED];
type ParentPreview = Pick<Member, '_id' | 'memberNick' | 'memberPhone' | 'memberType' | 'memberStatus' | 'memberImage'>;

const emptyForm: ChildInput = {
	childFullName: '',
	childBirthDate: '',
	childGender: ChildGender.BOY,
	childStatus: ChildStatus.ACTIVE,
	parentId: '',
	kindergartenId: '',
	groupId: '',
};

const KindergartenChildren = () => {
	const router = useRouter();
	const apolloClient = useApolloClient();
	const user = useReactiveVar(userVar);
	const [selectedKindergartenId, setSelectedKindergartenId] = useState('');
	const [selectedChildId, setSelectedChildId] = useState('');
	const [selectedGroupFilter, setSelectedGroupFilter] = useState('');
	const [form, setForm] = useState<ChildInput>(emptyForm);
	const [parentPreview, setParentPreview] = useState<ParentPreview | null>(null);
	const [parentPreviewError, setParentPreviewError] = useState('');
	const [parentNames, setParentNames] = useState<Record<string, string>>({});

	const [createChild] = useMutation(CREATE_CHILD);
	const [updateChild] = useMutation(UPDATE_CHILD);
	const [removeChild] = useMutation(REMOVE_CHILD);

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
			sort: 'createdAt',
			search: {
				kindergartenId: selectedKindergartenId,
				...(selectedGroupFilter ? { groupId: selectedGroupFilter } : {}),
			},
		}),
		[selectedKindergartenId, selectedGroupFilter],
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

	const {
		data: childrenData,
		loading: childrenLoading,
		refetch: refetchChildren,
	} = useQuery(GET_CHILDREN, {
		variables: { input: childrenInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN || !selectedKindergartenId,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const kindergartens: Kindergarten[] = ownerData?.getOwnerKindergartens?.list ?? [];
	const groups: Group[] = groupsData?.getGroups?.list ?? [];
	const children: Child[] = childrenData?.getChildren?.list ?? [];
	const hideKindergartenSelector = shouldHideKindergartenSelector(user.memberType, kindergartens);
	const selectedKindergartenTitle = getSelectedKindergartenTitle(kindergartens, selectedKindergartenId);
	const selectableGroups = groups.filter(
		(group) => group.groupStatus === GroupStatus.ACTIVE || group.groupStatus === GroupStatus.FULL,
	);
	const groupNameById = useMemo(
		() => Object.fromEntries(groups.map((group) => [group._id, group.groupName])),
		[groups],
	);
	const parentIds = useMemo(
		() => Array.from(new Set(children.map((child) => child.parentId).filter(Boolean))),
		[children],
	);
	const parentPreviewInvalid =
		!!parentPreview && parentPreview._id === form.parentId.trim() && parentPreview.memberType !== MemberType.PARENT;

	useEffect(() => {
		if (!selectedKindergartenId && kindergartens.length > 0) {
			setSelectedKindergartenId(kindergartens[0]._id);
		}
	}, [kindergartens, selectedKindergartenId]);

	useEffect(() => {
		setSelectedChildId('');
		setSelectedGroupFilter('');
		setParentPreview(null);
		setParentPreviewError('');
		setForm({ ...emptyForm, kindergartenId: selectedKindergartenId });
	}, [selectedKindergartenId]);

	useEffect(() => {
		if (!form.groupId && selectableGroups.length > 0 && !selectedChildId) {
			setForm((prev) => ({ ...prev, groupId: selectableGroups[0]._id }));
		}
	}, [form.groupId, selectableGroups, selectedChildId]);

	useEffect(() => {
		const missingParentIds = parentIds.filter((parentId) => !parentNames[parentId]);
		if (!missingParentIds.length) return;

		let isMounted = true;

		Promise.all(
			missingParentIds.map(async (parentId) => {
				try {
					const result = await apolloClient.query({
						query: GET_MEMBER,
						variables: { input: parentId },
						fetchPolicy: 'cache-first',
					});

					return [parentId, result.data?.getMember?.memberNick || parentId] as const;
				} catch (err) {
					return [parentId, parentId] as const;
				}
			}),
		).then((entries) => {
			if (!isMounted) return;
			setParentNames((prev) => ({
				...prev,
				...Object.fromEntries(entries),
			}));
		});

		return () => {
			isMounted = false;
		};
	}, [apolloClient, parentIds, parentNames]);

	const resetForm = () => {
		setSelectedChildId('');
		setParentPreview(null);
		setParentPreviewError('');
		setForm({ ...emptyForm, kindergartenId: selectedKindergartenId, groupId: selectableGroups[0]?._id ?? '' });
	};

	const updateParentId = (parentId: string) => {
		setParentPreview(null);
		setParentPreviewError('');
		setForm((prev) => ({ ...prev, parentId }));
	};

	const previewParentHandler = async () => {
		try {
			const parentId = form.parentId.trim();
			if (!selectedKindergartenId) throw new Error('Please select a kindergarten first.');
			if (!parentId) throw new Error('Please enter a parent member ID.');

			const result = await apolloClient.query({
				query: PREVIEW_KINDERGARTEN_MEMBER,
				variables: {
					input: {
						kindergartenId: selectedKindergartenId,
						memberId: parentId,
						purpose: 'PARENT_CANDIDATE',
					},
				},
				fetchPolicy: 'network-only',
			});
			const member: ParentPreview | null = result.data?.previewKindergartenMember ?? null;

			if (!member) throw new Error('Parent member was not found.');

			setParentPreview(member);
			setParentPreviewError(member.memberType !== MemberType.PARENT ? 'Selected member is not a PARENT account.' : '');
			setParentNames((prev) => ({
				...prev,
				[parentId]: member.memberNick || parentId,
			}));
		} catch (err: any) {
			setParentPreview(null);
			setParentPreviewError(err?.message || 'Could not load parent preview.');
		}
	};

	const editChildHandler = (child: Child) => {
		setSelectedChildId(child._id);
		setParentPreview(null);
		setParentPreviewError('');
		setForm({
			childFullName: child.childFullName,
			childBirthDate: String(child.childBirthDate).slice(0, 10),
			childGender: child.childGender,
			childImage: child.childImage,
			childStatus: child.childStatus,
			parentId: child.parentId,
			kindergartenId: child.kindergartenId,
			groupId: child.groupId,
		});
	};

	const submitChildHandler = async () => {
		try {
			const parentId = form.parentId.trim();
			if (!selectedKindergartenId) throw new Error('Please select a kindergarten first.');
			if (!form.groupId) throw new Error('Please select a group.');
			if (!form.childFullName.trim()) throw new Error('Please enter the child full name.');
			if (!form.childBirthDate) throw new Error('Please enter the child birth date.');
			if (!parentId) throw new Error('Please enter a parent member ID.');
			if (parentPreviewInvalid) throw new Error('Selected member is not a PARENT account.');

			if (selectedChildId) {
				const input: ChildUpdate = {
					_id: selectedChildId,
					childFullName: form.childFullName.trim(),
					childBirthDate: form.childBirthDate,
					childGender: form.childGender,
					childStatus: form.childStatus,
					parentId,
					kindergartenId: selectedKindergartenId,
					groupId: form.groupId,
				};

				await updateChild({ variables: { input } });
				await sweetMixinSuccessAlert('Child updated');
			} else {
				const input: ChildInput = {
					...form,
					childFullName: form.childFullName.trim(),
					childBirthDate: form.childBirthDate,
					parentId,
					kindergartenId: selectedKindergartenId,
					groupId: form.groupId,
				};

				await createChild({ variables: { input } });
				await sweetMixinSuccessAlert('Child created');
			}

			resetForm();
			await refetchChildren();
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const removeChildHandler = async (childId: string) => {
		try {
			if (!(await sweetConfirmAlert('Set this child inactive?'))) return;
			await removeChild({ variables: { input: childId } });
			await refetchChildren();
			await sweetMixinSuccessAlert('Child set inactive');
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
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>Children</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Manage enrolled children by group. Parent IDs are entered manually in this first version.
				</Typography>
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Select kindergarten</Typography>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>Loading your kindergartens...</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography sx={{ color: '#6b7280' }}>Create a kindergarten profile before managing children.</Typography>
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
						{selectedChildId ? 'Edit child' : 'Create child'}
					</Typography>
					{selectedChildId && (
						<Button variant="text" onClick={resetForm}>
							Cancel edit
						</Button>
					)}
				</Stack>
				{groupsLoading && <Typography sx={{ color: '#6b7280' }}>Loading groups...</Typography>}
				{!groupsLoading && selectedKindergartenId && selectableGroups.length === 0 && (
					<Typography sx={{ color: '#9ca3af' }}>Create an active group before adding children.</Typography>
				)}
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						label="Child full name"
						value={form.childFullName}
						onChange={(event) => setForm((prev) => ({ ...prev, childFullName: event.target.value }))}
					/>
					<TextField
						fullWidth
						label="Birth date"
						type="date"
						value={form.childBirthDate}
						onChange={(event) => setForm((prev) => ({ ...prev, childBirthDate: event.target.value }))}
						InputLabelProps={{ shrink: true }}
					/>
				</Stack>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						select
						label="Gender"
						value={form.childGender}
						onChange={(event) => setForm((prev) => ({ ...prev, childGender: event.target.value as ChildGender }))}
					>
						{childGenderOptions.map((gender) => (
							<MenuItem key={gender} value={gender}>
								{gender}
							</MenuItem>
						))}
					</TextField>
					<TextField
						fullWidth
						select
						label="Status"
						value={form.childStatus}
						onChange={(event) => setForm((prev) => ({ ...prev, childStatus: event.target.value as ChildStatus }))}
					>
						{childStatusOptions.map((status) => (
							<MenuItem key={status} value={status}>
								{status}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						select
						label="Group"
						value={form.groupId}
						onChange={(event) => setForm((prev) => ({ ...prev, groupId: event.target.value }))}
					>
						{selectableGroups.map((group) => (
							<MenuItem key={group._id} value={group._id}>
								{group.groupName} ({group.groupStatus})
							</MenuItem>
						))}
					</TextField>
					<TextField
						fullWidth
						label="Parent member ID"
						value={form.parentId}
						onChange={(event) => updateParentId(event.target.value)}
					/>
					<Button variant="outlined" onClick={previewParentHandler} sx={{ minWidth: 160 }}>
						Preview Parent
					</Button>
				</Stack>
				{parentPreview && (
					<Stack spacing={0.5} sx={{ padding: '12px', borderRadius: '12px', background: '#fbfcf8' }}>
						<Typography sx={{ fontWeight: 700 }}>{parentPreview.memberNick || 'Unnamed parent'}</Typography>
						<Typography sx={{ color: '#6b7280', fontSize: '14px' }}>
							{parentPreview.memberPhone || 'No phone'} · {parentPreview.memberType}
						</Typography>
					</Stack>
				)}
				{parentPreviewError && <Typography sx={{ color: '#dc2626' }}>{parentPreviewError}</Typography>}
				<Button
					variant="contained"
					onClick={submitChildHandler}
					disabled={!selectedKindergartenId || !form.groupId || parentPreviewInvalid}
					sx={{ width: 'fit-content' }}
				>
					{selectedChildId ? 'Save Child' : 'Create Child'}
				</Button>
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack direction={{ xs: 'column', md: 'row' }} justifyContent={'space-between'} spacing={2}>
					<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Children list</Typography>
					<TextField
						select
						label="Group filter"
						value={selectedGroupFilter}
						onChange={(event) => setSelectedGroupFilter(event.target.value)}
						sx={{ minWidth: 260 }}
					>
						<MenuItem value="">All groups</MenuItem>
						{groups.map((group) => (
							<MenuItem key={group._id} value={group._id}>
								{group.groupName}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				{childrenLoading && <Typography sx={{ color: '#6b7280' }}>Loading children...</Typography>}
				{!childrenLoading && selectedKindergartenId && children.length === 0 && (
					<Typography sx={{ color: '#6b7280' }}>No children found for this kindergarten.</Typography>
				)}
				{children.length > 0 && (
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Name</TableCell>
									<TableCell>Birth date</TableCell>
									<TableCell>Gender</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Parent</TableCell>
									<TableCell>Group reference</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{children.map((child) => {
									const isInactive = child.childStatus === ChildStatus.INACTIVE;

									return (
										<TableRow key={child._id} sx={{ opacity: isInactive ? 0.55 : 1 }}>
											<TableCell>{child.childFullName}</TableCell>
											<TableCell>{formatDate(child.childBirthDate)}</TableCell>
											<TableCell>{child.childGender}</TableCell>
											<TableCell>
												<Chip label={getStatusLabel(child.childStatus)} size="small" sx={getStatusChipSx(child.childStatus)} />
											</TableCell>
											<TableCell sx={{ maxWidth: 220 }}>
												<Stack>
													<Typography sx={{ fontWeight: 700, color: '#24332d', fontSize: '13px' }}>
														{parentNames[child.parentId] || truncateId(child.parentId)}
													</Typography>
													<Typography sx={{ color: '#9ca3af', fontSize: '11px', wordBreak: 'break-all' }}>
														{truncateId(child.parentId)}
													</Typography>
												</Stack>
											</TableCell>
											<TableCell>{groupNameById[child.groupId] || truncateId(child.groupId)}</TableCell>
											<TableCell align="right">
												<Stack direction={'row'} spacing={1} justifyContent={'flex-end'}>
													<Button variant="outlined" onClick={() => editChildHandler(child)}>
														Edit
													</Button>
													<Button
														variant="outlined"
														color="error"
														disabled={isInactive}
														onClick={() => removeChildHandler(child._id)}
													>
														{isInactive ? 'Inactive' : 'Set inactive'}
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

export default KindergartenChildren;
