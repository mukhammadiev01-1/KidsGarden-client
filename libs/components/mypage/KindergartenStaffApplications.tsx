import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Button,
	Chip,
	Menu,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { APPROVE_STAFF_APPLICATION, REJECT_STAFF_APPLICATION } from '../../../apollo/user/mutation';
import { GET_OWNER_KINDERGARTENS, GET_STAFF_APPLICATIONS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { KindergartenStatus } from '../../enums/kindergarten.enum';
import { MemberType } from '../../enums/member.enum';
import { StaffApplicationStatus } from '../../enums/staff-application.enum';
import { StaffRole } from '../../enums/kindergarten-staff.enum';
import { StaffApplication } from '../../types/staff-application/staff-application';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import {
	formatDate,
	getSelectedKindergartenTitle,
	getStatusChipSx,
	getStatusLabel,
	shouldHideKindergartenSelector,
} from './dashboardUtils';

const applicationStatusOptions = [
	StaffApplicationStatus.PENDING,
	StaffApplicationStatus.APPROVED,
	StaffApplicationStatus.REJECTED,
	StaffApplicationStatus.CANCELED,
];

const staffReviewStatuses = [StaffApplicationStatus.APPROVED, StaffApplicationStatus.REJECTED];
const staffRoleLabelKeys: Record<string, string> = {
	[StaffRole.OWNER]: 'mypageText.KindergartenStaff.roleOwner',
	[StaffRole.ADMIN]: 'mypageText.KindergartenStaff.roleAdmin',
	[StaffRole.TEACHER]: 'mypageText.KindergartenStaff.roleTeacher',
};

const KindergartenStaffApplications = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [selectedKindergartenId, setSelectedKindergartenId] = useState('');
	const [statusFilter, setStatusFilter] = useState<StaffApplicationStatus | 'ALL'>(StaffApplicationStatus.PENDING);
	const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
	const [statusMenu, setStatusMenu] = useState<{ applicationId: string; anchorEl: HTMLElement | null }>({
		applicationId: '',
		anchorEl: null,
	});
	const [approveStaffApplication, { loading: approvingStaffApplication }] = useMutation(APPROVE_STAFF_APPLICATION);
	const [rejectStaffApplication, { loading: rejectingStaffApplication }] = useMutation(REJECT_STAFF_APPLICATION);

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

	const applicationsInput = useMemo(
		() => ({
			page: 1,
			limit: 50,
			sort: 'createdAt',
			search: {
				kindergartenId: selectedKindergartenId,
				...(statusFilter === 'ALL' ? {} : { applicationStatus: statusFilter }),
			},
		}),
		[selectedKindergartenId, statusFilter],
	);

	const { data: ownerData, loading: ownerLoading } = useQuery(GET_OWNER_KINDERGARTENS, {
		variables: { input: ownerKindergartensInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const {
		data: applicationsData,
		loading: applicationsLoading,
		refetch: refetchApplications,
	} = useQuery(GET_STAFF_APPLICATIONS, {
		variables: { input: applicationsInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN || !selectedKindergartenId,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const kindergartens: Kindergarten[] = ownerData?.getOwnerKindergartens?.list ?? [];
	const applications: StaffApplication[] = applicationsData?.getStaffApplications?.list ?? [];
	const hideKindergartenSelector = shouldHideKindergartenSelector(user.memberType, kindergartens);
	const selectedKindergartenTitle = getSelectedKindergartenTitle(kindergartens, selectedKindergartenId);
	const roleLabel = (role?: string) =>
		role ? t(staffRoleLabelKeys[role] ?? '', { defaultValue: getStatusLabel(role) }) : '-';
	const statusLabel = (status?: string) => (status ? t(`statuses.${status}`, { defaultValue: getStatusLabel(status) }) : '-');
	const memberTypeLabel = (type?: string) => (type ? t(`roles.${type}`, { defaultValue: getStatusLabel(type) }) : '-');

	useEffect(() => {
		if (!selectedKindergartenId && kindergartens.length > 0) {
			setSelectedKindergartenId(kindergartens[0]._id);
		}
	}, [kindergartens, selectedKindergartenId]);

	const approveApplicationHandler = async (applicationId: string) => {
		try {
			if (!(await sweetConfirmAlert(t('mypageText.KindergartenStaffApplications.approveConfirm')))) return;
			await approveStaffApplication({ variables: { input: { _id: applicationId } } });
			await refetchApplications();
			await sweetMixinSuccessAlert(t('mypageText.KindergartenStaffApplications.approved'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const openStatusMenuHandler = (event: React.MouseEvent<HTMLButtonElement>, applicationId: string) => {
		setStatusMenu({ applicationId, anchorEl: event.currentTarget });
	};

	const closeStatusMenuHandler = () => {
		setStatusMenu({ applicationId: '', anchorEl: null });
	};

	const rejectApplicationHandler = async (applicationId: string) => {
		try {
			const rejectReason = rejectReasons[applicationId]?.trim();
			if (!rejectReason) throw new Error(t('mypageText.KindergartenStaffApplications.rejectReasonRequired'));
			if (!(await sweetConfirmAlert(t('mypageText.KindergartenStaffApplications.rejectConfirm')))) return;
			await rejectStaffApplication({ variables: { input: { _id: applicationId, rejectReason } } });
			setRejectReasons((prev) => ({ ...prev, [applicationId]: '' }));
			await refetchApplications();
			await sweetMixinSuccessAlert(t('mypageText.KindergartenStaffApplications.rejected'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const selectStatusHandler = async (applicationId: string, status: StaffApplicationStatus) => {
		closeStatusMenuHandler();
		if (status === StaffApplicationStatus.APPROVED) {
			await approveApplicationHandler(applicationId);
			return;
		}
		if (status === StaffApplicationStatus.REJECTED) {
			await rejectApplicationHandler(applicationId);
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
		<Stack className="admin-dashboard-screen admin-staff-applications-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>{t('mypage.menu.teacherAccessRequests')}</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					{t('mypageText.KindergartenStaffApplications.subtitle')}
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('kindergartens.filters')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenStaffApplications.filtersHint')}
						</Typography>
					</Stack>
				</Stack>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.KindergartenStaff.loadingKindergartens')}</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.KindergartenStaffApplications.createKindergartenFirst')}
					</Typography>
				)}
				{kindergartens.length > 0 && (
					<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
						{hideKindergartenSelector ? (
							<Stack className="admin-selector-card admin-readonly-selector">
								<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
									{t('mypageText.KindergartenStaff.kindergartenLabel', { title: selectedKindergartenTitle })}
								</Typography>
							</Stack>
						) : (
							<TextField
								fullWidth
								select
								label={t('adminTables.kindergarten')}
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
							label={t('dashboardCommon.status')}
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value as StaffApplicationStatus | 'ALL')}
						>
							<MenuItem value="ALL">{t('statuses.ALL')}</MenuItem>
							{applicationStatusOptions.map((status) => (
								<MenuItem key={status} value={status}>
									{statusLabel(status)}
								</MenuItem>
							))}
						</TextField>
					</Stack>
				)}
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('adminPages.applications.panelTitle')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenStaffApplications.applicationsHint')}
						</Typography>
					</Stack>
					<Chip label={t('mypageText.KindergartenStaffApplications.foundCount', { count: applications.length })} size="small" className="dashboard-count-chip" />
				</Stack>
				{applicationsLoading && <Typography sx={{ color: '#6b7280' }}>{t('adminPages.applications.loading')}</Typography>}
				{!applicationsLoading && selectedKindergartenId && applications.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.KindergartenStaffApplications.noApplications')}
					</Typography>
				)}
				{applications.length > 0 && (
					<Stack className="admin-card-list admin-staff-applications-list">
						{applications.map((application) => {
							const applicant = application.applicantData;
							const isPending = application.applicationStatus === StaffApplicationStatus.PENDING;
							const isUpdatingApplicationStatus = approvingStaffApplication || rejectingStaffApplication;
							const isStatusMenuOpen = statusMenu.applicationId === application._id && Boolean(statusMenu.anchorEl);
							const applicantName = applicant?.memberNick
								? `${applicant.memberNick}${applicant.memberFullName ? ` (${applicant.memberFullName})` : ''}`
								: applicant?.memberFullName || t('mypageText.KindergartenStaffApplications.applicantFallback');

							return (
								<Stack key={application._id} className="admin-record-card admin-staff-application-card" spacing={2}>
									<Stack className="admin-record-card-header">
										<Stack className="admin-record-title-block" spacing={0.5}>
											<Typography className="dashboard-primary-text admin-record-title">{applicantName}</Typography>
											<Typography className="dashboard-muted-text">{applicant?.memberPhone || t('mypageText.KindergartenStaff.noPhone')}</Typography>
											<Stack className="admin-chip-row">
												{applicant?.memberType && (
													<Chip label={memberTypeLabel(applicant.memberType)} size="small" className="admin-info-chip" />
												)}
												{applicant?.memberStatus && (
													<Chip
														label={statusLabel(applicant.memberStatus)}
														size="small"
														sx={getStatusChipSx(applicant.memberStatus)}
													/>
												)}
											</Stack>
										</Stack>
										<Chip
											label={statusLabel(application.applicationStatus)}
											size="small"
											sx={getStatusChipSx(application.applicationStatus)}
										/>
									</Stack>
									<Stack className="admin-record-grid admin-application-grid">
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('mypageText.KindergartenStaffApplications.requestedRole')}</Typography>
											<Typography className="admin-meta-value">{roleLabel(application.requestedRole)}</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.created')}</Typography>
											<Typography className="admin-meta-value">{formatDate(application.createdAt)}</Typography>
										</Stack>
										<Stack className="admin-meta-item admin-meta-wide">
											<Typography className="admin-meta-label">{t('adminTables.message')}</Typography>
											<Typography className="dashboard-note-text">{application.message || t('mypageText.KindergartenStaffApplications.noMessage')}</Typography>
										</Stack>
										<Stack className="admin-meta-item admin-meta-wide">
											<Typography className="admin-meta-label">{t('mypageText.KindergartenStaffApplications.rejectReason')}</Typography>
											{isPending ? (
												<TextField
													fullWidth
													size="small"
													placeholder={t('mypageText.KindergartenStaffApplications.rejectReasonPlaceholder')}
													value={rejectReasons[application._id] || ''}
													onChange={(event) =>
														setRejectReasons((prev) => ({
															...prev,
															[application._id]: event.target.value,
														}))
													}
												/>
											) : (
												<Stack spacing={0.25}>
													<Typography className="dashboard-note-text">
														{application.rejectReason || t('mypageText.KindergartenStaffApplications.noRejectReason')}
													</Typography>
													<Typography className="dashboard-muted-text">
														{t('mypageText.KindergartenStaffApplications.reviewedAt', { date: formatDate(application.reviewedAt) })}
													</Typography>
												</Stack>
											)}
										</Stack>
									</Stack>
									<Stack className="admin-record-actions admin-review-actions">
										<Button
											className="admin-change-status-button"
											variant="contained"
											disabled={!isPending || isUpdatingApplicationStatus}
											aria-haspopup="menu"
											aria-expanded={isStatusMenuOpen ? 'true' : undefined}
											onClick={(event) => openStatusMenuHandler(event, application._id)}
										>
											{t('mypageText.KindergartenStaffApplications.changeStatus')}
										</Button>
										<Menu
											anchorEl={statusMenu.anchorEl}
											open={isStatusMenuOpen}
											onClose={closeStatusMenuHandler}
											anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
											transformOrigin={{ vertical: 'top', horizontal: 'right' }}
											PaperProps={{
												sx: {
													mt: 0.75,
													minWidth: 180,
													borderRadius: '14px',
													border: '1px solid #dbe9d5',
													boxShadow: '0 14px 34px rgba(36, 51, 45, 0.16)',
													backgroundColor: '#fffdf8',
													p: 0.5,
												},
											}}
										>
											{staffReviewStatuses.map((status) => (
												<MenuItem
													key={status}
													disabled={isUpdatingApplicationStatus}
													onClick={() => selectStatusHandler(application._id, status)}
													sx={{
														minHeight: 34,
														borderRadius: '10px',
														my: 0.25,
														color: status === StaffApplicationStatus.REJECTED ? '#9f3c3c' : '#405346',
														fontFamily: 'inherit',
														fontSize: 13,
														fontWeight: 800,
													}}
												>
													{statusLabel(status)}
												</MenuItem>
											))}
										</Menu>
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

export default KindergartenStaffApplications;
