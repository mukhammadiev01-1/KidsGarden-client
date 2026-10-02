import React, { useState } from 'react';
import type { NextPage } from 'next';
import { useMutation, useQuery } from '@apollo/client';
import {
	Box,
	Button,
	Chip,
	Divider,
	List,
	ListItem,
	Stack,
	TablePagination,
	TextField,
	Typography,
} from '@mui/material';
import { TabContext } from '@mui/lab';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import {
	APPROVE_KINDERGARTEN_ADMIN_APPLICATION,
	REJECT_KINDERGARTEN_ADMIN_APPLICATION,
} from '../../../apollo/admin/mutation';
import { GET_KINDERGARTEN_ADMIN_APPLICATIONS } from '../../../apollo/admin/query';
import { KindergartenAdminApplicationStatus } from '../../../libs/enums/kindergarten-admin-application.enum';
import { KindergartenAdminApplication } from '../../../libs/types/kindergarten-admin-application/kindergarten-admin-application';
import { KindergartenAdminApplicationsInquiry } from '../../../libs/types/kindergarten-admin-application/kindergarten-admin-application.input';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../../libs/sweetAlert';
import { formatDate, getStatusChipSx } from '../../../libs/components/mypage/dashboardUtils';
import { useAdminTranslation } from '../../../libs/i18n/adminTranslator';

type AdminTranslate = ReturnType<typeof useAdminTranslation>['t'];

const statusTabs = [
	'ALL',
	KindergartenAdminApplicationStatus.PENDING,
	KindergartenAdminApplicationStatus.APPROVED,
	KindergartenAdminApplicationStatus.REJECTED,
	KindergartenAdminApplicationStatus.CANCELED,
];

const getApplicantName = (application: KindergartenAdminApplication, t: AdminTranslate) => {
	const applicant = application.applicantData;
	if (applicant?.memberNick && applicant?.memberFullName) return `${applicant.memberNick} (${applicant.memberFullName})`;
	return applicant?.memberNick || applicant?.memberFullName || t('adminUsersText.KindergartenAdminApplications.applicant');
};

const getFinalStateCopy = (status: KindergartenAdminApplicationStatus, t: AdminTranslate) => {
	switch (status) {
		case KindergartenAdminApplicationStatus.APPROVED:
			return t('adminUsersText.KindergartenAdminApplications.approvedFinal');
		case KindergartenAdminApplicationStatus.REJECTED:
			return t('adminUsersText.KindergartenAdminApplications.rejectedFinal');
		case KindergartenAdminApplicationStatus.CANCELED:
			return t('adminUsersText.KindergartenAdminApplications.canceledFinal');
		default:
			return '';
	}
};

const AdminKindergartenAdminApplications: NextPage = ({ initialInquiry }: any) => {
	const { t, statusLabel, roleLabel } = useAdminTranslation();
	const [applicationsInquiry, setApplicationsInquiry] =
		useState<KindergartenAdminApplicationsInquiry>(initialInquiry);
	const [value, setValue] = useState<string>(KindergartenAdminApplicationStatus.PENDING);
	const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
	const [approveKindergartenAdminApplication] = useMutation(APPROVE_KINDERGARTEN_ADMIN_APPLICATION);
	const [rejectKindergartenAdminApplication] = useMutation(REJECT_KINDERGARTEN_ADMIN_APPLICATION);

	const { data, loading, error, refetch } = useQuery(GET_KINDERGARTEN_ADMIN_APPLICATIONS, {
		variables: { input: applicationsInquiry },
		fetchPolicy: 'network-only',
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const applications: KindergartenAdminApplication[] = data?.getKindergartenAdminApplications?.list ?? [];
	const total = data?.getKindergartenAdminApplications?.metaCounter?.[0]?.total ?? 0;

	const tabChangeHandler = (event: any, newValue: string) => {
		setValue(newValue);
		setApplicationsInquiry({
			...applicationsInquiry,
			page: 1,
			search:
				newValue === 'ALL'
					? {}
					: {
							applicationStatus: newValue as KindergartenAdminApplicationStatus,
					  },
		});
	};

	const changePageHandler = async (event: unknown, newPage: number) => {
		setApplicationsInquiry({ ...applicationsInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setApplicationsInquiry({
			...applicationsInquiry,
			limit: parseInt(event.target.value, 10),
			page: 1,
		});
	};

	const approveApplicationHandler = async (applicationId: string) => {
		try {
			if (!(await sweetConfirmAlert(t('adminUsersText.KindergartenAdminApplications.approveConfirm')))) return;
			await approveKindergartenAdminApplication({ variables: { input: { _id: applicationId } } });
			await refetch();
			await sweetMixinSuccessAlert(t('adminUsersText.KindergartenAdminApplications.approved'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const rejectApplicationHandler = async (applicationId: string) => {
		try {
			const rejectReason = rejectReasons[applicationId]?.trim();
			if (!rejectReason) throw new Error(t('adminUsersText.KindergartenAdminApplications.rejectReasonRequired'));
			if (!(await sweetConfirmAlert(t('adminUsersText.KindergartenAdminApplications.rejectConfirm')))) return;
			await rejectKindergartenAdminApplication({ variables: { input: { _id: applicationId, rejectReason } } });
			setRejectReasons((prev) => ({ ...prev, [applicationId]: '' }));
			await refetch();
			await sweetMixinSuccessAlert(t('adminUsersText.KindergartenAdminApplications.rejected'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	return (
		<Box component={'div'} className={'content admin-kindergarten-admin-applications'}>
			<Stack className="admin-review-page-header">
				<Stack spacing={0.75}>
					<Typography className="admin-review-kicker">{t('adminUsersText.KindergartenAdminApplications.kicker')}</Typography>
					<Typography variant={'h2'} className={'tit'}>
						{t('admin.menu.kindergartenAdminApplications')}
					</Typography>
					<Typography className="admin-review-subtitle">
						{t('adminUsersText.KindergartenAdminApplications.subtitle')}
					</Typography>
				</Stack>
				<Chip className="admin-review-count-chip" label={t('adminTables.totalCount', { count: total })} />
			</Stack>

			<Box component={'div'} className={'table-wrap admin-review-wrap'}>
				<Box component={'div'} sx={{ width: '100%', typography: 'body1' }}>
					<TabContext value={value}>
						<Box component={'div'}>
							<List className={'tab-menu'}>
								{statusTabs.map((status) => (
									<ListItem
										key={status}
										onClick={(event) => tabChangeHandler(event, status)}
										value={status}
										className={value === status ? 'li on' : 'li'}
									>
										{statusLabel(status)}
									</ListItem>
								))}
							</List>
							<Divider />
						</Box>
						<div className="admin-review-list">
							{loading && (
								<Stack className="admin-review-state-card">
									<Typography className="admin-review-state-title">{t('adminPages.applications.loading')}</Typography>
									<Typography className="admin-review-state-copy">{t('adminUsersText.KindergartenAdminApplications.loadingCopy')}</Typography>
								</Stack>
							)}
							{!loading && error && (
								<Stack className="admin-review-state-card">
									<Typography className="admin-review-state-title">{t('adminUsersText.KindergartenAdminApplications.loadErrorTitle')}</Typography>
									<Typography className="admin-review-state-copy">
										{t('adminUsersText.KindergartenAdminApplications.loadErrorCopy')}
									</Typography>
								</Stack>
							)}
							{!loading && !error && applications.length === 0 && (
								<Stack className="admin-review-state-card">
									<Typography className="admin-review-state-title">
										{t('adminUsersText.KindergartenAdminApplications.emptyTitle')}
									</Typography>
									<Typography className="admin-review-state-copy">
										{t('adminUsersText.KindergartenAdminApplications.emptyCopy')}
									</Typography>
								</Stack>
							)}
							{!error && applications.map((application) => {
								const applicant = application.applicantData;
								const isPending = application.applicationStatus === KindergartenAdminApplicationStatus.PENDING;
								const finalStateCopy = getFinalStateCopy(application.applicationStatus, t);

								return (
									<Stack className="admin-review-card" key={application._id}>
										<Stack className="admin-review-card-header">
											<Stack spacing={0.4}>
												<Typography className="admin-review-card-title">
													{application.kindergartenTitle || t('adminUsersText.KindergartenAdminApplications.kindergartenDraft')}
												</Typography>
												<Typography className="admin-review-card-meta">
													{t('adminUsersText.KindergartenAdminApplications.createdAt', { date: formatDate(application.createdAt) })}
												</Typography>
											</Stack>
											<Chip
												label={statusLabel(application.applicationStatus)}
												size="small"
												sx={getStatusChipSx(application.applicationStatus)}
											/>
										</Stack>

										<Stack className="admin-review-card-grid">
											<Stack className="admin-review-info-box">
												<Typography className="admin-review-label">{t('adminUsersText.KindergartenAdminApplications.applicant')}</Typography>
												<Typography className="admin-review-primary">{getApplicantName(application, t)}</Typography>
												<Typography className="admin-review-muted">{applicant?.memberPhone || t('adminUsersText.KindergartenAdminApplications.noPhone')}</Typography>
												<Typography className="admin-review-muted">
													{[
														applicant?.memberType ? roleLabel(applicant.memberType) : '',
														applicant?.memberStatus ? statusLabel(applicant.memberStatus) : '',
													]
														.filter(Boolean)
														.join(' · ') || t('adminUsersText.KindergartenAdminApplications.accountDetailsUnavailable')}
												</Typography>
											</Stack>

											<Stack className="admin-review-info-box admin-review-wide">
												<Typography className="admin-review-label">{t('adminUsersText.KindergartenAdminApplications.kindergartenDraftLabel')}</Typography>
												<Typography className="admin-review-primary">
													{application.kindergartenTitle || t('adminUsersText.KindergartenAdminApplications.untitledCenter')}
												</Typography>
												<Typography className="admin-review-muted">
													{application.kindergartenAddress || t('adminUsersText.KindergartenAdminApplications.noAddress')}
												</Typography>
												<Typography className="admin-review-muted">
													{application.kindergartenPhone || t('adminUsersText.KindergartenAdminApplications.noCenterPhone')}
												</Typography>
											</Stack>

											<Stack className="admin-review-info-box">
												<Typography className="admin-review-label">{t('admin.badges.review')}</Typography>
												<Typography className="admin-review-muted">
													{t('adminUsersText.KindergartenAdminApplications.reviewedAt', { date: formatDate(application.reviewedAt) })}
												</Typography>
												<Typography className="admin-review-muted">
													{application.rejectReason
														? t('adminUsersText.KindergartenAdminApplications.reason', { reason: application.rejectReason })
														: t('adminUsersText.KindergartenAdminApplications.noReviewNote')}
												</Typography>
											</Stack>
										</Stack>

										<Stack className="admin-review-text-grid">
											<Stack className="admin-review-text-panel">
												<Typography className="admin-review-label">{t('adminUsersText.KindergartenAdminApplications.businessInfo')}</Typography>
												<Typography className="admin-review-body">{application.businessInfo || t('adminUsersText.KindergartenAdminApplications.noBusinessInfo')}</Typography>
											</Stack>
											<Stack className="admin-review-text-panel">
												<Typography className="admin-review-label">{t('adminUsersText.KindergartenAdminApplications.applicantMessage')}</Typography>
												<Typography className="admin-review-body">{application.message || t('adminUsersText.KindergartenAdminApplications.noMessage')}</Typography>
											</Stack>
										</Stack>

										<Stack className="admin-review-footer">
											{isPending ? (
												<>
													<TextField
														className="admin-review-reject-field"
														size="small"
														placeholder={t('adminUsersText.KindergartenAdminApplications.rejectReasonPlaceholder')}
														value={rejectReasons[application._id] || ''}
														onChange={(event) =>
															setRejectReasons((prev) => ({
																...prev,
																[application._id]: event.target.value,
															}))
														}
													/>
													<Stack className="admin-review-actions">
														<Button variant="contained" onClick={() => approveApplicationHandler(application._id)}>
															{t('adminUsersText.KindergartenAdminApplications.approve')}
														</Button>
														<Button variant="outlined" color="error" onClick={() => rejectApplicationHandler(application._id)}>
															{t('adminUsersText.KindergartenAdminApplications.reject')}
														</Button>
													</Stack>
												</>
											) : (
												<Stack className="admin-review-final-state">
													<Typography>{finalStateCopy || t('adminUsersText.KindergartenAdminApplications.noLongerPending')}</Typography>
												</Stack>
											)}
										</Stack>
									</Stack>
								);
							})}
						</div>
						<TablePagination
							rowsPerPageOptions={[10, 20, 40, 60]}
							component="div"
							count={total}
							rowsPerPage={applicationsInquiry.limit}
							page={applicationsInquiry.page - 1}
							onPageChange={changePageHandler}
							onRowsPerPageChange={changeRowsPerPageHandler}
						/>
					</TabContext>
				</Box>
			</Box>
		</Box>
	);
};

AdminKindergartenAdminApplications.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			applicationStatus: KindergartenAdminApplicationStatus.PENDING,
		},
	},
};

export default withAdminLayout(AdminKindergartenAdminApplications);
