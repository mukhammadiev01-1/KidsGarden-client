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
	const { t } = useTranslation('common');
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

					return [parentId, result.data?.getMember?.memberNick || t('mypageText.KindergartenChildren.linkedParent')] as const;
				} catch (err) {
					return [parentId, t('mypageText.KindergartenChildren.linkedParent')] as const;
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
			if (!selectedKindergartenId) throw new Error(t('mypageText.KindergartenChildren.selectKindergartenFirst'));
			if (!parentId) throw new Error(t('mypageText.KindergartenChildren.enterParentLink'));

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

			if (!member) throw new Error(t('mypageText.KindergartenChildren.parentNotFound'));

			setParentPreview(member);
			setParentPreviewError(member.memberType !== MemberType.PARENT ? t('mypageText.KindergartenChildren.notParentAccount') : '');
			setParentNames((prev) => ({
				...prev,
				[parentId]: member.memberNick || t('mypageText.KindergartenChildren.linkedParent'),
			}));
		} catch (err: any) {
			setParentPreview(null);
			setParentPreviewError(err?.message || t('mypageText.KindergartenChildren.previewLoadFailed'));
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
			if (!selectedKindergartenId) throw new Error(t('mypageText.KindergartenChildren.selectKindergartenFirst'));
			if (!form.groupId) throw new Error(t('mypageText.KindergartenChildren.selectGroup'));
			if (!form.childFullName.trim()) throw new Error(t('mypageText.KindergartenChildren.enterChildName'));
			if (!form.childBirthDate) throw new Error(t('mypageText.KindergartenChildren.enterBirthDate'));
			if (!parentId) throw new Error(t('mypageText.KindergartenChildren.linkParent'));
			if (parentPreviewInvalid) throw new Error(t('mypageText.KindergartenChildren.notParentAccount'));

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
				await sweetMixinSuccessAlert(t('mypageText.KindergartenChildren.childUpdated'));
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
				await sweetMixinSuccessAlert(t('mypageText.KindergartenChildren.childCreated'));
			}

			resetForm();
			await refetchChildren();
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const removeChildHandler = async (childId: string) => {
		try {
			if (!(await sweetConfirmAlert(t('mypageText.KindergartenChildren.confirmInactive')))) return;
			await removeChild({ variables: { input: childId } });
			await refetchChildren();
			await sweetMixinSuccessAlert(t('mypageText.KindergartenChildren.childSetInactive'));
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
		<Stack className="admin-dashboard-screen admin-children-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>{t('mypage.menu.children')}</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					{t('mypageText.KindergartenChildren.subtitle')}
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2}>
				<Stack className="dashboard-panel-header" spacing={0.5}>
					<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.KindergartenChildren.selectKindergarten')}</Typography>
					<Typography className="dashboard-panel-subtitle">
						{t('mypageText.KindergartenChildren.scopeHint')}
					</Typography>
				</Stack>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenChildren.loadingKindergartens')}</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography className="dashboard-empty-state">{t('mypageText.KindergartenChildren.noKindergartens')}</Typography>
				)}
				{hideKindergartenSelector && (
					<Stack className="admin-selector-card admin-readonly-selector">
						<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
							{t('mypageText.KindergartenChildren.kindergartenLabel', { title: selectedKindergartenTitle })}
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

			<Stack className="dashboard-panel admin-children-list-panel" spacing={2}>
				<Stack className="admin-list-panel-header" direction={{ xs: 'column', md: 'row' }} justifyContent={'space-between'} spacing={2}>
					<Stack className="dashboard-panel-header" spacing={0.5}>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.KindergartenChildren.listTitle')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenChildren.listSubtitle')}
						</Typography>
					</Stack>
					<TextField
						select
						label={t('mypageText.KindergartenChildren.groupFilter')}
						value={selectedGroupFilter}
						onChange={(event) => setSelectedGroupFilter(event.target.value)}
						sx={{ minWidth: 260 }}
					>
						<MenuItem value="">{t('mypageText.KindergartenChildren.allGroups')}</MenuItem>
						{groups.map((group) => (
							<MenuItem key={group._id} value={group._id}>
								{group.groupName}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				{childrenLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenChildren.loadingChildren')}</Typography>}
				{!childrenLoading && selectedKindergartenId && children.length === 0 && (
					<Typography className="dashboard-empty-state">{t('mypageText.KindergartenChildren.noChildren')}</Typography>
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
												{t('mypageText.KindergartenChildren.ageAndGender', {
													age: getAge(child.childBirthDate),
													gender: t(`mypageText.KindergartenChildren.gender.${child.childGender}`, { defaultValue: child.childGender }),
												})}
											</Typography>
										</Stack>
										<Chip
											label={t(`statuses.${child.childStatus}`, { defaultValue: getStatusLabel(child.childStatus) })}
											size="small"
											sx={getStatusChipSx(child.childStatus)}
										/>
									</Stack>
									<Stack className="admin-record-grid admin-child-grid">
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('mypageText.KindergartenChildren.birthDate')}</Typography>
											<Typography className="admin-meta-value">{formatDate(child.childBirthDate)}</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.kindergarten')}</Typography>
											<Typography className="admin-meta-value">{selectedKindergartenTitle}</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.group')}</Typography>
											<Typography className="admin-meta-value">
												{groupNameById[child.groupId] || t('mypageText.KindergartenChildren.unassignedGroup')}
											</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.parent')}</Typography>
											<Typography className="admin-meta-value">
												{parentNames[child.parentId] || t('mypageText.KindergartenChildren.linkedParent')}
											</Typography>
										</Stack>
									</Stack>
									<Stack className="admin-record-actions admin-danger-actions">
										<Button variant="outlined" onClick={() => editChildHandler(child)}>
											{t('common.edit')}
										</Button>
										<Button
											variant="outlined"
											color="error"
											disabled={isInactive}
											onClick={() => removeChildHandler(child._id)}
										>
											{isInactive ? t('statuses.INACTIVE') : t('mypageText.KindergartenChildren.setInactive')}
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
							{selectedChildId ? t('mypageText.KindergartenChildren.editChild') : t('mypageText.KindergartenChildren.createChild')}
						</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenChildren.formSubtitle')}
						</Typography>
					</Stack>
					{selectedChildId && (
						<Button variant="text" onClick={resetForm}>
							{t('mypageText.KindergartenChildren.cancelEdit')}
						</Button>
					)}
				</Stack>
				{groupsLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenChildren.loadingGroups')}</Typography>}
				{!groupsLoading && selectedKindergartenId && selectableGroups.length === 0 && (
					<Typography className="dashboard-empty-state">{t('mypageText.KindergartenChildren.noActiveGroups')}</Typography>
				)}
				<Typography className="admin-form-section-title">{t('mypageText.KindergartenChildren.childDetails')}</Typography>
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						label={t('mypageText.KindergartenChildren.childFullName')}
						value={form.childFullName}
						onChange={(event) => setForm((prev) => ({ ...prev, childFullName: event.target.value }))}
					/>
					<TextField
						fullWidth
						label={t('mypageText.KindergartenChildren.birthDate')}
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
						label={t('mypageText.KindergartenChildren.genderLabel')}
						value={form.childGender}
						onChange={(event) => setForm((prev) => ({ ...prev, childGender: event.target.value as ChildGender }))}
					>
						{childGenderOptions.map((gender) => (
							<MenuItem key={gender} value={gender}>
								{t(`mypageText.KindergartenChildren.gender.${gender}`, { defaultValue: gender })}
							</MenuItem>
						))}
					</TextField>
					<TextField
						fullWidth
						select
						label={t('common.status')}
						value={form.childStatus}
						onChange={(event) => setForm((prev) => ({ ...prev, childStatus: event.target.value as ChildStatus }))}
					>
						{childStatusOptions.map((status) => (
							<MenuItem key={status} value={status}>
								{t(`statuses.${status}`, { defaultValue: getStatusLabel(status) })}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				<Typography className="admin-form-section-title">{t('mypageText.KindergartenChildren.enrollment')}</Typography>
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						select
						label={t('adminTables.group')}
						value={form.groupId}
						onChange={(event) => setForm((prev) => ({ ...prev, groupId: event.target.value }))}
					>
						{selectableGroups.map((group) => (
							<MenuItem key={group._id} value={group._id}>
								{group.groupName} ({t(`statuses.${group.groupStatus}`, { defaultValue: getStatusLabel(group.groupStatus) })})
							</MenuItem>
						))}
					</TextField>
				</Stack>
				<Stack className="admin-parent-link-section" spacing={1.25}>
					<Typography className="admin-form-section-title">{t('mypageText.KindergartenChildren.parentLink')}</Typography>
					<Typography className="dashboard-panel-subtitle">
						{t('mypageText.KindergartenChildren.parentLinkHint')}
					</Typography>
					<Button
						variant="text"
						onClick={() => setShowAdvancedParentLink((prev) => !prev)}
						sx={{ width: 'fit-content' }}
					>
						{showAdvancedParentLink ? t('mypageText.KindergartenChildren.hideAdvanced') : t('mypageText.KindergartenChildren.advancedOptions')}
					</Button>
					{showAdvancedParentLink && (
						<Stack className="admin-advanced-panel" spacing={1.5}>
							<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
								<TextField
									fullWidth
									label={t('mypageText.KindergartenChildren.manualParentLink')}
									value={form.parentId}
									onChange={(event) => updateParentId(event.target.value)}
									helperText={t('mypageText.KindergartenChildren.manualParentHelper')}
								/>
								<Button variant="outlined" onClick={previewParentHandler} sx={{ minWidth: 160 }}>
									{t('mypageText.KindergartenChildren.previewParent')}
								</Button>
							</Stack>
							{parentPreview && (
								<Stack className="admin-candidate-card admin-selected-member-card" spacing={0.5}>
									<Typography className="admin-form-section-title">{t('mypageText.KindergartenChildren.parentPreview')}</Typography>
									<Typography className="dashboard-primary-text">{parentPreview.memberNick || t('mypageText.KindergartenChildren.unnamedParent')}</Typography>
									<Typography className="dashboard-muted-text">{parentPreview.memberPhone || t('mypageText.KindergartenChildren.noPhone')}</Typography>
									<Stack className="admin-chip-row">
										<Chip
											label={t(`roles.${parentPreview.memberType}`, { defaultValue: getStatusLabel(parentPreview.memberType) })}
											size="small"
											className="admin-info-chip"
										/>
										<Chip
											label={t(`statuses.${parentPreview.memberStatus}`, { defaultValue: getStatusLabel(parentPreview.memberStatus) })}
											size="small"
											sx={getStatusChipSx(parentPreview.memberStatus)}
										/>
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
					{selectedChildId ? t('mypageText.KindergartenChildren.saveChild') : t('mypageText.KindergartenChildren.createChildButton')}
				</Button>
			</Stack>
		</Stack>
	);
};

export default KindergartenChildren;
