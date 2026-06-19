import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Button,
	Chip,
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
import {
	CANCEL_KINDERGARTEN_ADMIN_APPLICATION,
	CREATE_KINDERGARTEN_ADMIN_APPLICATION,
} from '../../../apollo/user/mutation';
import { GET_MY_KINDERGARTEN_ADMIN_APPLICATIONS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { MemberType } from '../../enums/member.enum';
import { KindergartenAdminApplicationStatus } from '../../enums/kindergarten-admin-application.enum';
import { KindergartenAdminApplication } from '../../types/kindergarten-admin-application/kindergarten-admin-application';
import { KindergartenAdminApplicationInput } from '../../types/kindergarten-admin-application/kindergarten-admin-application.input';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel } from './dashboardUtils';

const emptyForm: KindergartenAdminApplicationInput = {
	kindergartenTitle: '',
	kindergartenAddress: '',
	kindergartenPhone: '',
	businessInfo: '',
	message: '',
};

const ParentKindergartenAdminApplications = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [form, setForm] = useState<KindergartenAdminApplicationInput>(emptyForm);
	const [createKindergartenAdminApplication, { loading: creatingApplication }] = useMutation(
		CREATE_KINDERGARTEN_ADMIN_APPLICATION,
	);
	const [cancelKindergartenAdminApplication] = useMutation(CANCEL_KINDERGARTEN_ADMIN_APPLICATION);

	const applicationsInput = useMemo(
		() => ({
			page: 1,
			limit: 50,
			sort: 'createdAt',
			search: {},
		}),
		[],
	);

	const { data, loading, refetch } = useQuery(GET_MY_KINDERGARTEN_ADMIN_APPLICATIONS, {
		variables: { input: applicationsInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.PARENT,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const applications: KindergartenAdminApplication[] = data?.getMyKindergartenAdminApplications?.list ?? [];
	const pendingApplication = applications.find(
		(application) => application.applicationStatus === KindergartenAdminApplicationStatus.PENDING,
	);
	const approvedApplication = applications.find(
		(application) => application.applicationStatus === KindergartenAdminApplicationStatus.APPROVED,
	);

	const updateForm = (name: keyof KindergartenAdminApplicationInput, value: string) => {
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const createApplicationHandler = async () => {
		try {
			if (pendingApplication) throw new Error('You already have a pending application.');
			await createKindergartenAdminApplication({
				variables: {
					input: {
						kindergartenTitle: form.kindergartenTitle?.trim() || undefined,
						kindergartenAddress: form.kindergartenAddress?.trim() || undefined,
						kindergartenPhone: form.kindergartenPhone?.trim() || undefined,
						businessInfo: form.businessInfo?.trim() || undefined,
						message: form.message?.trim() || undefined,
					},
				},
			});
			setForm(emptyForm);
			await refetch();
			await sweetMixinSuccessAlert('Application submitted');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const cancelApplicationHandler = async (applicationId: string) => {
		try {
			if (!(await sweetConfirmAlert('Cancel this kindergarten admin application?'))) return;
			await cancelKindergartenAdminApplication({ variables: { applicationId } });
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
		<Stack className="parent-dashboard-screen parent-admin-applications-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>
					Center Admin Access Request
				</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Apply to manage your own kindergarten. A super admin will review your request.
				</Typography>
			</Stack>

			<Stack className="dashboard-panel parent-application-form-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Apply to manage a kindergarten</Typography>
						<Typography className="dashboard-panel-subtitle">
							Share the basic center information a super admin should review.
						</Typography>
					</Stack>
					{pendingApplication && <Chip label="Application pending" size="small" className="dashboard-warning-chip" />}
				</Stack>
				{approvedApplication && (
					<Stack className="dashboard-approved-notice" spacing={1.5} sx={{ padding: '16px 18px', borderRadius: '12px', background: '#ecfdf5' }}>
						<Typography sx={{ color: '#166534', fontWeight: 700 }}>
							Approved. Please log out and sign in again to access the kindergarten admin dashboard.
						</Typography>
						<Button variant="contained" onClick={reloginHandler} sx={{ width: 'fit-content' }}>
							Log out and sign in again
						</Button>
					</Stack>
				)}
				<Stack className="dashboard-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						label="Kindergarten title"
						value={form.kindergartenTitle}
						onChange={(event) => updateForm('kindergartenTitle', event.target.value)}
						disabled={Boolean(pendingApplication)}
					/>
					<TextField
						fullWidth
						label="Kindergarten phone"
						value={form.kindergartenPhone}
						onChange={(event) => updateForm('kindergartenPhone', event.target.value)}
						disabled={Boolean(pendingApplication)}
					/>
				</Stack>
				<TextField
					fullWidth
					label="Kindergarten address"
					value={form.kindergartenAddress}
					onChange={(event) => updateForm('kindergartenAddress', event.target.value)}
					disabled={Boolean(pendingApplication)}
				/>
				<TextField
					fullWidth
					multiline
					minRows={3}
					label="Business info"
					value={form.businessInfo}
					onChange={(event) => updateForm('businessInfo', event.target.value)}
					disabled={Boolean(pendingApplication)}
				/>
				<TextField
					fullWidth
					multiline
					minRows={3}
					label="Message"
					value={form.message}
					onChange={(event) => updateForm('message', event.target.value)}
					disabled={Boolean(pendingApplication)}
				/>
				<Button
					variant="contained"
					onClick={createApplicationHandler}
					disabled={Boolean(pendingApplication) || creatingApplication}
					sx={{ width: 'fit-content' }}
				>
					{creatingApplication ? 'Submitting...' : pendingApplication ? 'Application Pending' : 'Submit Application'}
				</Button>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Application history</Typography>
						<Typography className="dashboard-panel-subtitle">
							Review status, feedback, and submitted kindergarten draft details.
						</Typography>
					</Stack>
					<Chip label={`${applications.length} total`} size="small" className="dashboard-count-chip" />
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>Loading your applications...</Typography>}
				{!loading && applications.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>No kindergarten admin applications yet.</Typography>
				)}
				{applications.length > 0 && (
					<TableContainer className="dashboard-table-container parent-applications-table">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Kindergarten draft</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Business info</TableCell>
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
													{application.kindergartenTitle || 'Kindergarten draft'}
												</Typography>
												<Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
													{application.kindergartenAddress || '-'}
												</Typography>
												<Typography sx={{ fontSize: '12px', color: '#9ca3af' }}>
													{application.kindergartenPhone || '-'}
												</Typography>
											</Stack>
										</TableCell>
										<TableCell>
											<Chip
												label={getStatusLabel(application.applicationStatus)}
												size="small"
												sx={getStatusChipSx(application.applicationStatus)}
											/>
										</TableCell>
										<TableCell sx={{ maxWidth: 220 }}>
											<Typography className="dashboard-note-text">{application.businessInfo || '-'}</Typography>
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
												disabled={application.applicationStatus !== KindergartenAdminApplicationStatus.PENDING}
												onClick={() => cancelApplicationHandler(application._id)}
											>
												{application.applicationStatus === KindergartenAdminApplicationStatus.PENDING ? 'Cancel' : 'Closed'}
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

export default ParentKindergartenAdminApplications;
