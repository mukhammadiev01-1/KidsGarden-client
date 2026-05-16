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
import { APPROVE_STAFF_APPLICATION, REJECT_STAFF_APPLICATION } from '../../../apollo/user/mutation';
import { GET_MEMBER, GET_OWNER_KINDERGARTENS, GET_STAFF_APPLICATIONS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { KindergartenStatus } from '../../enums/kindergarten.enum';
import { MemberType } from '../../enums/member.enum';
import { StaffApplicationStatus } from '../../enums/staff-application.enum';
import { StaffApplication } from '../../types/staff-application/staff-application';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
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

type ApplicantPreview = Pick<Member, '_id' | 'memberNick' | 'memberPhone' | 'memberType'>;

const applicationStatusOptions = [
	StaffApplicationStatus.PENDING,
	StaffApplicationStatus.APPROVED,
	StaffApplicationStatus.REJECTED,
	StaffApplicationStatus.CANCELED,
];

const KindergartenStaffApplications = () => {
	const router = useRouter();
	const apolloClient = useApolloClient();
	const user = useReactiveVar(userVar);
	const [selectedKindergartenId, setSelectedKindergartenId] = useState('');
	const [statusFilter, setStatusFilter] = useState<StaffApplicationStatus | 'ALL'>(StaffApplicationStatus.PENDING);
	const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
	const [applicantsById, setApplicantsById] = useState<Record<string, ApplicantPreview | null>>({});
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
	const applicantIds = useMemo(
		() => Array.from(new Set(applications.map((application) => application.applicantId).filter(Boolean))),
		[applications],
	);

	useEffect(() => {
		if (!selectedKindergartenId && kindergartens.length > 0) {
			setSelectedKindergartenId(kindergartens[0]._id);
		}
	}, [kindergartens, selectedKindergartenId]);

	useEffect(() => {
		const missingApplicantIds = applicantIds.filter((applicantId) => !(applicantId in applicantsById));
		if (!missingApplicantIds.length) return;

		let isMounted = true;

		Promise.all(
			missingApplicantIds.map(async (applicantId) => {
				try {
					const result = await apolloClient.query({
						query: GET_MEMBER,
						variables: { input: applicantId },
						fetchPolicy: 'cache-first',
					});

					const member: ApplicantPreview | null = result.data?.getMember ?? null;
					return [applicantId, member] as const;
				} catch (err) {
					return [applicantId, null] as const;
				}
			}),
		).then((entries) => {
			if (!isMounted) return;
			setApplicantsById((prev) => ({
				...prev,
				...Object.fromEntries(entries),
			}));
		});

		return () => {
			isMounted = false;
		};
	}, [apolloClient, applicantIds, applicantsById]);

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
		<Stack spacing={3} sx={{ width: '100%' }}>
			<Stack spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>Staff Applications</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Review teacher applications submitted to your kindergarten.
				</Typography>
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Filters</Typography>
				{ownerLoading && <Typography sx={{ color: '#6b7280' }}>Loading your kindergartens...</Typography>}
				{!ownerLoading && kindergartens.length === 0 && (
					<Typography sx={{ color: '#6b7280' }}>Create a kindergarten profile before reviewing applications.</Typography>
				)}
				{kindergartens.length > 0 && (
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
						{hideKindergartenSelector ? (
							<Stack
								sx={{
									flex: 1,
									padding: '14px',
									border: '1px solid #e5e7eb',
									borderRadius: '8px',
									background: '#f9fafb',
									justifyContent: 'center',
								}}
							>
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

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Applications</Typography>
				{applicationsLoading && <Typography sx={{ color: '#6b7280' }}>Loading applications...</Typography>}
				{!applicationsLoading && selectedKindergartenId && applications.length === 0 && (
					<Typography sx={{ color: '#6b7280' }}>No applications found for this filter.</Typography>
				)}
				{applications.length > 0 && (
					<TableContainer>
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
									const applicant = applicantsById[application.applicantId];
									const isPending = application.applicationStatus === StaffApplicationStatus.PENDING;

									return (
										<TableRow key={application._id}>
											<TableCell sx={{ maxWidth: 220 }}>
												<Stack spacing={0.25}>
													<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
														{applicant?.memberNick || 'Applicant reference'}
													</Typography>
													<Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
														{applicant?.memberPhone || applicant?.memberType || '-'}
													</Typography>
													<Typography sx={{ fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
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
											<TableCell sx={{ maxWidth: 220 }}>{application.message || '-'}</TableCell>
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
				)}
			</Stack>
		</Stack>
	);
};

export default KindergartenStaffApplications;
