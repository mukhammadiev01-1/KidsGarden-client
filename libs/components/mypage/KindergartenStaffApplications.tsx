import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
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
import { APPROVE_STAFF_APPLICATION, REJECT_STAFF_APPLICATION } from '../../../apollo/user/mutation';
import { GET_OWNER_KINDERGARTENS, GET_STAFF_APPLICATIONS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { KindergartenStatus } from '../../enums/kindergarten.enum';
import { MemberType } from '../../enums/member.enum';
import { StaffApplicationStatus } from '../../enums/staff-application.enum';
import { StaffApplication } from '../../types/staff-application/staff-application';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import {
	formatDate,
	getSelectedKindergartenTitle,
	getStatusChipSx,
	getStatusLabel,
	shouldHideKindergartenSelector,
	truncateId,
} from './dashboardUtils';

const applicationStatusOptions = [
	StaffApplicationStatus.PENDING,
	StaffApplicationStatus.APPROVED,
	StaffApplicationStatus.REJECTED,
	StaffApplicationStatus.CANCELED,
];

const KindergartenStaffApplications = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [selectedKindergartenId, setSelectedKindergartenId] = useState('');
	const [statusFilter, setStatusFilter] = useState<StaffApplicationStatus | 'ALL'>(StaffApplicationStatus.PENDING);
	const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
	const [approveStaffApplication] = useMutation(APPROVE_STAFF_APPLICATION);
	const [rejectStaffApplication] = useMutation(REJECT_STAFF_APPLICATION);

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

	useEffect(() => {
		if (!selectedKindergartenId && kindergartens.length > 0) {
			setSelectedKindergartenId(kindergartens[0]._id);
		}
	}, [kindergartens, selectedKindergartenId]);

	const approveApplicationHandler = async (applicationId: string) => {
		try {
			if (!(await sweetConfirmAlert('Approve this teacher application?'))) return;
			await approveStaffApplication({ variables: { input: { _id: applicationId } } });
			await refetchApplications();
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
			await refetchApplications();
			await sweetMixinSuccessAlert('Application rejected');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (user.memberType !== MemberType.KINDERGARTEN_ADMIN) {
		router.back();
		return null;
	}

	return (
		<Stack className="admin-dashboard-screen admin-staff-applications-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>Staff Applications</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Review teacher applications submitted to your kindergarten.
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Filters</Typography>
						<Typography className="dashboard-panel-subtitle">
							Review applications for the selected kindergarten and status.
						</Typography>
					</Stack>
				</Stack>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>Loading your kindergartens...</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						Create a kindergarten profile before reviewing applications.
					</Typography>
				)}
				{kindergartens.length > 0 && (
					<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
						{hideKindergartenSelector ? (
							<Stack className="admin-selector-card admin-readonly-selector">
								<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
									Kindergarten: {selectedKindergartenTitle}
								</Typography>
							</Stack>
						) : (
							<TextField
								fullWidth
								select
								label="Kindergarten"
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
							label="Status"
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value as StaffApplicationStatus | 'ALL')}
						>
							<MenuItem value="ALL">ALL</MenuItem>
							{applicationStatusOptions.map((status) => (
								<MenuItem key={status} value={status}>
									{status}
								</MenuItem>
							))}
						</TextField>
					</Stack>
				)}
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Applications</Typography>
						<Typography className="dashboard-panel-subtitle">
							Applicant details are shown only in this guarded review screen.
						</Typography>
					</Stack>
					<Chip label={`${applications.length} found`} size="small" className="dashboard-count-chip" />
				</Stack>
				{applicationsLoading && <Typography sx={{ color: '#6b7280' }}>Loading applications...</Typography>}
				{!applicationsLoading && selectedKindergartenId && applications.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No applications found for this filter.
					</Typography>
				)}
				{applications.length > 0 && (
					<TableContainer className="dashboard-table-container admin-applications-table">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Applicant</TableCell>
									<TableCell>Role</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Message</TableCell>
									<TableCell>Created</TableCell>
									<TableCell>Reject reason</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{applications.map((application) => {
									const applicant = application.applicantData;
									const isPending = application.applicationStatus === StaffApplicationStatus.PENDING;

									return (
										<TableRow key={application._id}>
											<TableCell sx={{ maxWidth: 220 }}>
												<Stack spacing={0.25}>
													<Typography className="dashboard-primary-text">
														{applicant?.memberNick
															? `${applicant.memberNick}${applicant.memberFullName ? ` (${applicant.memberFullName})` : ''}`
															: applicant?.memberFullName || 'Applicant reference'}
													</Typography>
													<Typography className="dashboard-muted-text">
														{applicant?.memberPhone || 'No phone'}
													</Typography>
													<Stack className="admin-chip-row">
														{applicant?.memberType && (
															<Chip label={getStatusLabel(applicant.memberType)} size="small" className="admin-info-chip" />
														)}
														{applicant?.memberStatus && (
															<Chip
																label={getStatusLabel(applicant.memberStatus)}
																size="small"
																sx={getStatusChipSx(applicant.memberStatus)}
															/>
														)}
													</Stack>
													<Typography className="dashboard-muted-text" sx={{ wordBreak: 'break-all' }}>
														{truncateId(application.applicantId)}
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
											<TableCell sx={{ maxWidth: 220 }}>
												<Typography className="dashboard-note-text">{application.message || '-'}</Typography>
											</TableCell>
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
														<Typography className="dashboard-note-text">{application.rejectReason || '-'}</Typography>
														<Typography className="dashboard-muted-text">
															{formatDate(application.reviewedAt)}
														</Typography>
													</Stack>
												)}
											</TableCell>
											<TableCell align="right">
												<Stack className="admin-review-actions" direction="row" spacing={1} justifyContent="flex-end">
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
				)}
			</Stack>
		</Stack>
	);
};

export default KindergartenStaffApplications;
