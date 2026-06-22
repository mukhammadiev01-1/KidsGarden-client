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
import { formatDate, getStatusChipSx, getStatusLabel } from '../../../libs/components/mypage/dashboardUtils';

const statusTabs = [
	'ALL',
	KindergartenAdminApplicationStatus.PENDING,
	KindergartenAdminApplicationStatus.APPROVED,
	KindergartenAdminApplicationStatus.REJECTED,
	KindergartenAdminApplicationStatus.CANCELED,
];

const getApplicantName = (application: KindergartenAdminApplication) => {
	const applicant = application.applicantData;
	if (applicant?.memberNick && applicant?.memberFullName) return `${applicant.memberNick} (${applicant.memberFullName})`;
	return applicant?.memberNick || applicant?.memberFullName || 'Applicant';
};

const getFinalStateCopy = (status: KindergartenAdminApplicationStatus) => {
	switch (status) {
		case KindergartenAdminApplicationStatus.APPROVED:
			return 'Approved applications are final in this review queue.';
		case KindergartenAdminApplicationStatus.REJECTED:
			return 'Rejected applications are final in this review queue.';
		case KindergartenAdminApplicationStatus.CANCELED:
			return 'Canceled applications cannot be reviewed.';
		default:
			return '';
	}
};

const AdminKindergartenAdminApplications: NextPage = ({ initialInquiry }: any) => {
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
			if (!(await sweetConfirmAlert('Approve this kindergarten admin application?'))) return;
			await approveKindergartenAdminApplication({ variables: { input: { _id: applicationId } } });
			await refetch();
			await sweetMixinSuccessAlert('Application approved');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const rejectApplicationHandler = async (applicationId: string) => {
		try {
			const rejectReason = rejectReasons[applicationId]?.trim();
			if (!rejectReason) throw new Error('Enter a reject reason before rejecting.');
			if (!(await sweetConfirmAlert('Reject this kindergarten admin application?'))) return;
			await rejectKindergartenAdminApplication({ variables: { input: { _id: applicationId, rejectReason } } });
			setRejectReasons((prev) => ({ ...prev, [applicationId]: '' }));
			await refetch();
			await sweetMixinSuccessAlert('Application rejected');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	return (
		<Box component={'div'} className={'content admin-kindergarten-admin-applications'}>
			<Stack className="admin-review-page-header">
				<Stack spacing={0.75}>
					<Typography className="admin-review-kicker">Super Admin Review Queue</Typography>
					<Typography variant={'h2'} className={'tit'}>
						Kindergarten Admin Applications
					</Typography>
					<Typography className="admin-review-subtitle">
						Review center admin access requests without exposing raw technical identifiers in the normal workflow.
					</Typography>
				</Stack>
				<Chip className="admin-review-count-chip" label={`${total} total`} />
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
										{getStatusLabel(status)}
									</ListItem>
								))}
							</List>
							<Divider />
						</Box>
						<div className="admin-review-list">
							{loading && (
								<Stack className="admin-review-state-card">
									<Typography className="admin-review-state-title">Loading applications...</Typography>
									<Typography className="admin-review-state-copy">Fetching the latest Super Admin review queue.</Typography>
								</Stack>
							)}
							{!loading && error && (
								<Stack className="admin-review-state-card">
									<Typography className="admin-review-state-title">Unable to load applications.</Typography>
									<Typography className="admin-review-state-copy">
										Check the backend connection and try refreshing the review queue.
									</Typography>
								</Stack>
							)}
							{!loading && !error && applications.length === 0 && (
								<Stack className="admin-review-state-card">
									<Typography className="admin-review-state-title">
										No kindergarten admin applications yet.
									</Typography>
									<Typography className="admin-review-state-copy">
										Applications will appear here when a parent or center user requests admin access.
									</Typography>
								</Stack>
							)}
							{!error && applications.map((application) => {
								const applicant = application.applicantData;
								const isPending = application.applicationStatus === KindergartenAdminApplicationStatus.PENDING;
								const finalStateCopy = getFinalStateCopy(application.applicationStatus);

								return (
									<Stack className="admin-review-card" key={application._id}>
										<Stack className="admin-review-card-header">
											<Stack spacing={0.4}>
												<Typography className="admin-review-card-title">
													{application.kindergartenTitle || 'Kindergarten draft'}
												</Typography>
												<Typography className="admin-review-card-meta">
													Created {formatDate(application.createdAt)}
												</Typography>
											</Stack>
											<Chip
												label={getStatusLabel(application.applicationStatus)}
												size="small"
												sx={getStatusChipSx(application.applicationStatus)}
											/>
										</Stack>

										<Stack className="admin-review-card-grid">
											<Stack className="admin-review-info-box">
												<Typography className="admin-review-label">Applicant</Typography>
												<Typography className="admin-review-primary">{getApplicantName(application)}</Typography>
												<Typography className="admin-review-muted">{applicant?.memberPhone || 'No phone provided'}</Typography>
												<Typography className="admin-review-muted">
													{[applicant?.memberType, applicant?.memberStatus].filter(Boolean).join(' · ') ||
														'Account details unavailable'}
												</Typography>
											</Stack>

											<Stack className="admin-review-info-box admin-review-wide">
												<Typography className="admin-review-label">Kindergarten Draft</Typography>
												<Typography className="admin-review-primary">
													{application.kindergartenTitle || 'Untitled center'}
												</Typography>
												<Typography className="admin-review-muted">
													{application.kindergartenAddress || 'No address provided'}
												</Typography>
												<Typography className="admin-review-muted">
													{application.kindergartenPhone || 'No center phone provided'}
												</Typography>
											</Stack>

											<Stack className="admin-review-info-box">
												<Typography className="admin-review-label">Review</Typography>
												<Typography className="admin-review-muted">
													Reviewed: {formatDate(application.reviewedAt)}
												</Typography>
												<Typography className="admin-review-muted">
													{application.rejectReason ? `Reason: ${application.rejectReason}` : 'No review note yet'}
												</Typography>
											</Stack>
										</Stack>

										<Stack className="admin-review-text-grid">
											<Stack className="admin-review-text-panel">
												<Typography className="admin-review-label">Business info</Typography>
												<Typography className="admin-review-body">{application.businessInfo || 'No business info provided.'}</Typography>
											</Stack>
											<Stack className="admin-review-text-panel">
												<Typography className="admin-review-label">Applicant message</Typography>
												<Typography className="admin-review-body">{application.message || 'No message provided.'}</Typography>
											</Stack>
										</Stack>

										<Stack className="admin-review-footer">
											{isPending ? (
												<>
													<TextField
														className="admin-review-reject-field"
														size="small"
														placeholder="Reason required to reject"
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
															Approve
														</Button>
														<Button variant="outlined" color="error" onClick={() => rejectApplicationHandler(application._id)}>
															Reject
														</Button>
													</Stack>
												</>
											) : (
												<Stack className="admin-review-final-state">
													<Typography>{finalStateCopy || 'This application is no longer pending.'}</Typography>
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
