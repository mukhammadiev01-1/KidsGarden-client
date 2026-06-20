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

const getAge = (birthDate?: Date | string) => {
	if (!birthDate) return '-';

	const parsedBirthDate = new Date(birthDate);
	if (Number.isNaN(parsedBirthDate.getTime())) return '-';

	const today = new Date();
	let age = today.getFullYear() - parsedBirthDate.getFullYear();
	const monthDiff = today.getMonth() - parsedBirthDate.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedBirthDate.getDate())) {
		age -= 1;
	}

	return age >= 0 ? `${age}` : '-';
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
	const [showAdvancedParentLink, setShowAdvancedParentLink] = useState(false);

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
		setShowAdvancedParentLink(false);
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

					return [parentId, result.data?.getMember?.memberNick || 'Linked parent'] as const;
				} catch (err) {
					return [parentId, 'Linked parent'] as const;
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
		setShowAdvancedParentLink(false);
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
			if (!parentId) throw new Error('Please enter the parent link value.');

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
				[parentId]: member.memberNick || 'Linked parent',
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
		setShowAdvancedParentLink(true);
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
			if (!parentId) throw new Error('Please link a parent account.');
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
		<Stack className="admin-dashboard-screen admin-children-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>Children</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Review enrolled children, classroom placement, and parent links for your center.
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2}>
				<Stack className="dashboard-panel-header" spacing={0.5}>
					<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Select kindergarten</Typography>
					<Typography className="dashboard-panel-subtitle">
						Child records are scoped to the selected kindergarten.
					</Typography>
				</Stack>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>Loading your kindergartens...</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography className="dashboard-empty-state">Create a kindergarten profile before managing children.</Typography>
				)}
				{hideKindergartenSelector && (
					<Stack className="admin-selector-card admin-readonly-selector">
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

			<Stack className="dashboard-panel admin-children-list-panel" spacing={2}>
				<Stack className="admin-list-panel-header" direction={{ xs: 'column', md: 'row' }} justifyContent={'space-between'} spacing={2}>
					<Stack className="dashboard-panel-header" spacing={0.5}>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Children list</Typography>
						<Typography className="dashboard-panel-subtitle">
							Review enrollment status, parent links, and group assignments.
						</Typography>
					</Stack>
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
					<Typography className="dashboard-empty-state">No children found for this kindergarten.</Typography>
				)}
				{children.length > 0 && (
					<Stack className="admin-card-list admin-children-list">
						{children.map((child) => {
							const isInactive = child.childStatus === ChildStatus.INACTIVE;

							return (
								<Stack
									key={child._id}
									className="admin-record-card admin-child-card"
									spacing={2}
									sx={{ opacity: isInactive ? 0.55 : 1 }}
								>
									<Stack className="admin-record-card-header">
										<Stack className="admin-record-title-block" spacing={0.5}>
											<Typography className="dashboard-primary-text admin-record-title">{child.childFullName}</Typography>
											<Typography className="dashboard-muted-text">
												{getAge(child.childBirthDate)} years old · {child.childGender}
											</Typography>
										</Stack>
										<Chip label={getStatusLabel(child.childStatus)} size="small" sx={getStatusChipSx(child.childStatus)} />
									</Stack>
									<Stack className="admin-record-grid admin-child-grid">
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">Birth date</Typography>
											<Typography className="admin-meta-value">{formatDate(child.childBirthDate)}</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">Kindergarten</Typography>
											<Typography className="admin-meta-value">{selectedKindergartenTitle}</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">Group</Typography>
											<Typography className="admin-meta-value">
												{groupNameById[child.groupId] || 'Unassigned group'}
											</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">Parent</Typography>
											<Typography className="admin-meta-value">
												{parentNames[child.parentId] || 'Linked parent'}
											</Typography>
										</Stack>
									</Stack>
									<Stack className="admin-record-actions admin-danger-actions">
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
								</Stack>
							);
						})}
					</Stack>
				)}
			</Stack>

			<Stack className="dashboard-panel admin-children-form-panel" spacing={2}>
				<Stack className="dashboard-panel-header" direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
					<Stack spacing={0.5}>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>
							{selectedChildId ? 'Edit child' : 'Create child'}
						</Typography>
						<Typography className="dashboard-panel-subtitle">
							Add or update a child record after checking the existing list above.
						</Typography>
					</Stack>
					{selectedChildId && (
						<Button variant="text" onClick={resetForm}>
							Cancel edit
						</Button>
					)}
				</Stack>
				{groupsLoading && <Typography sx={{ color: '#6b7280' }}>Loading groups...</Typography>}
				{!groupsLoading && selectedKindergartenId && selectableGroups.length === 0 && (
					<Typography className="dashboard-empty-state">Create an active group before adding children.</Typography>
				)}
				<Typography className="admin-form-section-title">Child details</Typography>
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
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
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
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
				<Typography className="admin-form-section-title">Enrollment</Typography>
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
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
				</Stack>
				<Stack className="admin-parent-link-section" spacing={1.25}>
					<Typography className="admin-form-section-title">Parent link</Typography>
					<Typography className="dashboard-panel-subtitle">
						Parent search is not available in this screen yet. Use Advanced options only when manually linking an existing parent account.
					</Typography>
					<Button
						variant="text"
						onClick={() => setShowAdvancedParentLink((prev) => !prev)}
						sx={{ width: 'fit-content' }}
					>
						{showAdvancedParentLink ? 'Hide advanced options' : 'Advanced options'}
					</Button>
					{showAdvancedParentLink && (
						<Stack className="admin-advanced-panel" spacing={1.5}>
							<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
								<TextField
									fullWidth
									label="Manual parent link"
									value={form.parentId}
									onChange={(event) => updateParentId(event.target.value)}
									helperText="Use only when the parent cannot be found through normal search or selection."
								/>
								<Button variant="outlined" onClick={previewParentHandler} sx={{ minWidth: 160 }}>
									Preview Parent
								</Button>
							</Stack>
							{parentPreview && (
								<Stack className="admin-candidate-card admin-selected-member-card" spacing={0.5}>
									<Typography className="admin-form-section-title">Parent preview</Typography>
									<Typography className="dashboard-primary-text">{parentPreview.memberNick || 'Unnamed parent'}</Typography>
									<Typography className="dashboard-muted-text">{parentPreview.memberPhone || 'No phone'}</Typography>
									<Stack className="admin-chip-row">
										<Chip label={getStatusLabel(parentPreview.memberType)} size="small" className="admin-info-chip" />
										<Chip label={getStatusLabel(parentPreview.memberStatus)} size="small" sx={getStatusChipSx(parentPreview.memberStatus)} />
									</Stack>
								</Stack>
							)}
							{parentPreviewError && <Typography sx={{ color: '#dc2626' }}>{parentPreviewError}</Typography>}
						</Stack>
					)}
				</Stack>
				<Button
					variant="contained"
					onClick={submitChildHandler}
					disabled={!selectedKindergartenId || !form.groupId || parentPreviewInvalid}
					sx={{ width: 'fit-content' }}
				>
					{selectedChildId ? 'Save Child' : 'Create Child'}
				</Button>
			</Stack>
		</Stack>
	);
};

export default KindergartenChildren;
