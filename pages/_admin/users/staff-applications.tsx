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
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { TabContext } from '@mui/lab';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { APPROVE_STAFF_APPLICATION, REJECT_STAFF_APPLICATION } from '../../../apollo/admin/mutation';
import { GET_STAFF_APPLICATIONS } from '../../../apollo/admin/query';
import { StaffApplicationStatus } from '../../../libs/enums/staff-application.enum';
import { StaffApplication } from '../../../libs/types/staff-application/staff-application';
import { StaffApplicationsInquiry } from '../../../libs/types/staff-application/staff-application.input';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../../libs/sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel, truncateId } from '../../../libs/components/mypage/dashboardUtils';

const statusTabs = [
	'ALL',
	StaffApplicationStatus.PENDING,
	StaffApplicationStatus.APPROVED,
	StaffApplicationStatus.REJECTED,
	StaffApplicationStatus.CANCELED,
];

const AdminStaffApplications: NextPage = ({ initialInquiry }: any) => {
	const [applicationsInquiry, setApplicationsInquiry] = useState<StaffApplicationsInquiry>(initialInquiry);
	const [value, setValue] = useState<string>(StaffApplicationStatus.PENDING);
	const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
	const [approveStaffApplication] = useMutation(APPROVE_STAFF_APPLICATION);
	const [rejectStaffApplication] = useMutation(REJECT_STAFF_APPLICATION);

	const { data, loading, refetch } = useQuery(GET_STAFF_APPLICATIONS, {
		variables: { input: applicationsInquiry },
		fetchPolicy: 'network-only',
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const applications: StaffApplication[] = data?.getStaffApplications?.list ?? [];
	const total = data?.getStaffApplications?.metaCounter?.[0]?.total ?? 0;

	const tabChangeHandler = (event: any, newValue: string) => {
		setValue(newValue);
		setApplicationsInquiry({
			...applicationsInquiry,
			page: 1,
			search:
				newValue === 'ALL'
					? {}
					: {
							applicationStatus: newValue as StaffApplicationStatus,
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
			if (!(await sweetConfirmAlert('Approve this teacher application?'))) return;
			await approveStaffApplication({ variables: { input: { _id: applicationId } } });
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
			if (!(await sweetConfirmAlert('Reject this teacher application?'))) return;
			await rejectStaffApplication({ variables: { input: { _id: applicationId, rejectReason } } });
			setRejectReasons((prev) => ({ ...prev, [applicationId]: '' }));
			await refetch();
			await sweetMixinSuccessAlert('Application rejected');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				Staff Applications
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
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
						<TableContainer>
							<Table sx={{ minWidth: 1220 }} size="medium">
								<TableHead>
									<TableRow>
										<TableCell>Applicant</TableCell>
										<TableCell>Kindergarten</TableCell>
										<TableCell>Role</TableCell>
										<TableCell>Status</TableCell>
										<TableCell>Message</TableCell>
										<TableCell>Created</TableCell>
										<TableCell>Review</TableCell>
										<TableCell align="right">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{loading && (
										<TableRow>
											<TableCell align="center" colSpan={8}>
												Loading applications...
											</TableCell>
										</TableRow>
									)}
									{!loading && applications.length === 0 && (
										<TableRow>
											<TableCell align="center" colSpan={8}>
												<span className={'no-data'}>No staff applications found.</span>
											</TableCell>
										</TableRow>
									)}
									{applications.map((application) => {
										const applicant = application.applicantData;
										const isPending = application.applicationStatus === StaffApplicationStatus.PENDING;

										return (
											<TableRow hover key={application._id}>
												<TableCell sx={{ maxWidth: 240 }}>
													<Stack spacing={0.25}>
														<Typography sx={{ fontWeight: 700 }}>
															{applicant?.memberNick
																? `${applicant.memberNick}${applicant.memberFullName ? ` (${applicant.memberFullName})` : ''}`
																: applicant?.memberFullName || 'Applicant reference'}
														</Typography>
														<Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
															{applicant?.memberPhone || 'No phone'}
														</Typography>
														<Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
															{[applicant?.memberType, applicant?.memberStatus].filter(Boolean).join(' · ') || '-'}
														</Typography>
														<Typography sx={{ fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
															{truncateId(application.applicantId)}
														</Typography>
													</Stack>
												</TableCell>
												<TableCell sx={{ maxWidth: 220 }}>
													<Stack spacing={0.25}>
														<Typography sx={{ fontWeight: 700 }}>Kindergarten</Typography>
														<Typography sx={{ fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
															{truncateId(application.kindergartenId)}
														</Typography>
													</Stack>
												</TableCell>
												<TableCell>{application.requestedRole}</TableCell>
												<TableCell>
													<Chip
														label={getStatusLabel(application.applicationStatus)}
														size="small"
														sx={getStatusChipSx(application.applicationStatus)}
													/>
												</TableCell>
												<TableCell sx={{ maxWidth: 240 }}>{application.message || '-'}</TableCell>
												<TableCell>{formatDate(application.createdAt)}</TableCell>
												<TableCell sx={{ minWidth: 220 }}>
													{isPending ? (
														<TextField
															fullWidth
															size="small"
															placeholder="Reason for rejection"
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
															<Typography sx={{ fontSize: '13px' }}>{application.rejectReason || '-'}</Typography>
															<Typography sx={{ fontSize: '12px', color: '#9ca3af' }}>
																{formatDate(application.reviewedAt)}
															</Typography>
														</Stack>
													)}
												</TableCell>
												<TableCell align="right">
													<Stack direction="row" spacing={1} justifyContent="flex-end">
														<Button
															variant="contained"
															disabled={!isPending}
															onClick={() => approveApplicationHandler(application._id)}
														>
															Approve
														</Button>
														<Button
															variant="outlined"
															color="error"
															disabled={!isPending}
															onClick={() => rejectApplicationHandler(application._id)}
														>
															Reject
														</Button>
													</Stack>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</TableContainer>
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

AdminStaffApplications.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			applicationStatus: StaffApplicationStatus.PENDING,
		},
	},
};

export default withAdminLayout(AdminStaffApplications);
