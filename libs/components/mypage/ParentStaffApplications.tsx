import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { CANCEL_STAFF_APPLICATION } from '../../../apollo/user/mutation';
import { GET_KINDERGARTEN, GET_MY_STAFF_APPLICATIONS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { MemberType } from '../../enums/member.enum';
import { StaffApplicationStatus } from '../../enums/staff-application.enum';
import { StaffApplication } from '../../types/staff-application/staff-application';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel, truncateId } from './dashboardUtils';

const ParentStaffApplications = () => {
	const router = useRouter();
	const apolloClient = useApolloClient();
	const user = useReactiveVar(userVar);
	const [kindergartenNames, setKindergartenNames] = useState<Record<string, string>>({});
	const [cancelStaffApplication] = useMutation(CANCEL_STAFF_APPLICATION);

	const applicationsInput = useMemo(
		() => ({
			page: 1,
			limit: 50,
			sort: 'createdAt',
			search: {},
		}),
		[],
	);

	const { data, loading, refetch } = useQuery(GET_MY_STAFF_APPLICATIONS, {
		variables: { input: applicationsInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.PARENT,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const applications: StaffApplication[] = data?.getMyStaffApplications?.list ?? [];
	const approvedApplication = applications.find(
		(application) => application.applicationStatus === StaffApplicationStatus.APPROVED,
	);
	const kindergartenIds = useMemo(
		() => Array.from(new Set(applications.map((application) => application.kindergartenId).filter(Boolean))),
		[applications],
	);

	useEffect(() => {
		const missingKindergartenIds = kindergartenIds.filter((kindergartenId) => !kindergartenNames[kindergartenId]);
		if (!missingKindergartenIds.length) return;

		let isMounted = true;

		Promise.all(
			missingKindergartenIds.map(async (kindergartenId) => {
				try {
					const result = await apolloClient.query({
						query: GET_KINDERGARTEN,
						variables: { input: kindergartenId },
						fetchPolicy: 'cache-first',
					});

					return [kindergartenId, result.data?.getKindergarten?.kindergartenTitle || kindergartenId] as const;
				} catch (err) {
					return [kindergartenId, kindergartenId] as const;
				}
			}),
		).then((entries) => {
			if (!isMounted) return;
			setKindergartenNames((prev) => ({
				...prev,
				...Object.fromEntries(entries),
			}));
		});

		return () => {
			isMounted = false;
		};
	}, [apolloClient, kindergartenIds, kindergartenNames]);

	const cancelApplicationHandler = async (applicationId: string) => {
		try {
			if (!(await sweetConfirmAlert('Cancel this teacher application?'))) return;
			await cancelStaffApplication({ variables: { applicationId } });
			await refetch();
			await sweetMixinSuccessAlert('Application canceled');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const reloginHandler = async () => {
		logOut();
		await router.push('/account/join');
	};

	if (user.memberType !== MemberType.PARENT) {
		router.back();
		return null;
	}

	return (
		<Stack className="parent-dashboard-screen parent-staff-applications-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>Teacher Access Request</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Track your applications to teach at kindergartens and cancel pending requests.
				</Typography>
			</Stack>

			{approvedApplication && (
				<Stack className="dashboard-approved-notice" spacing={1.5} sx={{ padding: '20px 24px', borderRadius: '16px', background: '#ecfdf5' }}>
					<Typography sx={{ color: '#166534', fontWeight: 700 }}>
						Approved. Please log out and sign in again to access the teacher dashboard.
					</Typography>
					<Button variant="contained" onClick={reloginHandler} sx={{ width: 'fit-content' }}>
						Log out and sign in again
					</Button>
				</Stack>
			)}

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Applications</Typography>
						<Typography className="dashboard-panel-subtitle">
							Requests you have sent from kindergarten detail pages.
						</Typography>
					</Stack>
					<Chip label={`${applications.length} total`} size="small" className="dashboard-count-chip" />
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>Loading your applications...</Typography>}
				{!loading && applications.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No teacher applications yet. Open a kindergarten detail page to apply.
					</Typography>
				)}
				{applications.length > 0 && (
					<TableContainer className="dashboard-table-container parent-applications-table">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Kindergarten</TableCell>
									<TableCell>Role</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Message</TableCell>
									<TableCell>Review</TableCell>
									<TableCell>Created</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{applications.map((application) => (
									<TableRow key={application._id}>
										<TableCell sx={{ maxWidth: 240 }}>
											<Stack spacing={0.25}>
												<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
													{kindergartenNames[application.kindergartenId] || 'Kindergarten reference'}
												</Typography>
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
										<TableCell sx={{ maxWidth: 220 }}>
											<Typography className="dashboard-note-text">{application.message || '-'}</Typography>
										</TableCell>
										<TableCell sx={{ maxWidth: 220 }}>
											<Stack spacing={0.25}>
												<Typography className="dashboard-note-text">{application.rejectReason || '-'}</Typography>
												<Typography className="dashboard-muted-text">
													{formatDate(application.reviewedAt)}
												</Typography>
											</Stack>
										</TableCell>
										<TableCell>{formatDate(application.createdAt)}</TableCell>
										<TableCell align="right">
											<Button
												variant="outlined"
												color="error"
												disabled={application.applicationStatus !== StaffApplicationStatus.PENDING}
												onClick={() => cancelApplicationHandler(application._id)}
											>
												{application.applicationStatus === StaffApplicationStatus.PENDING ? 'Cancel' : 'Closed'}
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Stack>
		</Stack>
	);
};

export default ParentStaffApplications;
