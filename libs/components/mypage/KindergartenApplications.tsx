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
import { UPDATE_APPLICATION_STATUS } from '../../../apollo/user/mutation';
import { GET_KINDERGARTEN_APPLICATIONS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { ApplicationStatus, FINAL_APPLICATION_STATUSES } from '../../enums/application.enum';
import { MemberType } from '../../enums/member.enum';
import { Application, ApplicationDocument } from '../../types/application/application';
import { getImageUrl } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel, truncateId } from './dashboardUtils';
import ApplicationChatPanel from '../chat/ApplicationChatPanel';

const reviewStatuses = [
	ApplicationStatus.REVIEWING,
	ApplicationStatus.APPROVED,
	ApplicationStatus.REJECTED,
	ApplicationStatus.NEED_MORE_INFO,
];

const formatDocumentSize = (size: number) => {
	if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const renderApplicationDocuments = (documents?: ApplicationDocument[]) => {
	if (!documents?.length) return <Typography className="dashboard-muted-text">-</Typography>;

	return (
		<Stack spacing={0.5}>
			{documents.map((document) => (
				<a
					key={`${document.url}-${document.name}`}
					href={getImageUrl(document.url)}
					target="_blank"
					rel="noreferrer"
					className="dashboard-document-link"
				>
					{document.name} ({formatDocumentSize(document.size)})
				</a>
			))}
		</Stack>
	);
};

const KindergartenApplications = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [activeChatApplicationId, setActiveChatApplicationId] = useState<string>('');
	const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
	const [updateApplicationStatus] = useMutation(UPDATE_APPLICATION_STATUS);

	const applicationsInput = useMemo(
		() => ({
			page: 1,
			limit: 50,
			sort: 'createdAt',
			direction: 'DESC',
			search: {},
		}),
		[],
	);

	const { data, loading, refetch } = useQuery(GET_KINDERGARTEN_APPLICATIONS, {
		variables: { input: applicationsInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const applications: Application[] = data?.getKindergartenApplications?.list ?? [];

	const toggleChatHandler = (applicationId: string) => {
		setActiveChatApplicationId((currentId) => (currentId === applicationId ? '' : applicationId));
	};

	const updateStatusHandler = async (application: Application, status: ApplicationStatus) => {
		try {
			const adminNote = adminNotes[application._id]?.trim();
			if (!(await sweetConfirmAlert(`Set this application to ${getStatusLabel(status)}?`))) return;
			await updateApplicationStatus({
				variables: {
					input: {
						_id: application._id,
						status,
						...(adminNote ? { adminNote } : {}),
					},
				},
			});
			setAdminNotes((prev) => ({ ...prev, [application._id]: '' }));
			await refetch();
			await sweetMixinSuccessAlert('Application updated');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (user.memberType !== MemberType.KINDERGARTEN_ADMIN) {
		router.back();
		return null;
	}

	return (
		<Stack className="admin-dashboard-screen kindergarten-applications-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>
					Kindergarten Applications
				</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Review parent applications sent to kindergartens you manage.
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Applications</Typography>
						<Typography className="dashboard-panel-subtitle">
							Applicant information is visible only in this guarded dashboard.
						</Typography>
					</Stack>
					<Chip label={`${applications.length} found`} size="small" className="dashboard-count-chip" />
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>Loading applications...</Typography>}
				{!loading && applications.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No kindergarten applications found.
					</Typography>
				)}
				{applications.length > 0 && (
					<TableContainer className="dashboard-table-container admin-applications-table">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Parent</TableCell>
									<TableCell>Kindergarten</TableCell>
									<TableCell>Child</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Message</TableCell>
									<TableCell>Documents</TableCell>
									<TableCell>Created</TableCell>
									<TableCell>Admin note</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{applications.map((application) => {
									const parent = application.parentData;
									const isFinal = FINAL_APPLICATION_STATUSES.includes(application.status);

									return (
										<React.Fragment key={application._id}>
											<TableRow>
												<TableCell sx={{ maxWidth: 220 }}>
													<Stack spacing={0.25}>
														<Typography className="dashboard-primary-text">
															{parent?.memberNick || parent?.memberFullName || 'Parent reference'}
														</Typography>
														<Typography className="dashboard-muted-text" sx={{ wordBreak: 'break-all' }}>
															{truncateId(application.parentId)}
														</Typography>
													</Stack>
												</TableCell>
												<TableCell sx={{ maxWidth: 240 }}>
													<Stack spacing={0.25}>
														<Typography sx={{ fontWeight: 700, color: '#24332d' }}>
															{application.kindergartenData?.kindergartenTitle || 'Kindergarten reference'}
														</Typography>
														<Typography className="dashboard-muted-text" sx={{ wordBreak: 'break-all' }}>
															{truncateId(application.kindergartenId)}
														</Typography>
													</Stack>
												</TableCell>
												<TableCell>
													<Stack spacing={0.25}>
														<Typography className="dashboard-primary-text">{application.childName}</Typography>
														<Typography className="dashboard-muted-text">{application.childAge} years old</Typography>
													</Stack>
												</TableCell>
												<TableCell>
													<Chip label={getStatusLabel(application.status)} size="small" sx={getStatusChipSx(application.status)} />
												</TableCell>
												<TableCell sx={{ maxWidth: 220 }}>
													<Typography className="dashboard-note-text">{application.parentMessage || '-'}</Typography>
												</TableCell>
												<TableCell sx={{ maxWidth: 240 }}>
													{renderApplicationDocuments(application.documents)}
												</TableCell>
												<TableCell>{formatDate(application.createdAt)}</TableCell>
												<TableCell sx={{ minWidth: 220 }}>
													<TextField
														fullWidth
														size="small"
														placeholder={application.adminNote || 'Optional note'}
														value={adminNotes[application._id] || ''}
														onChange={(event) =>
															setAdminNotes((prev) => ({
																...prev,
																[application._id]: event.target.value,
															}))
														}
														disabled={isFinal}
													/>
												</TableCell>
												<TableCell align="right">
													<Stack className="admin-review-actions" direction="row" spacing={1} justifyContent="flex-end">
														<Button variant="outlined" onClick={() => toggleChatHandler(application._id)}>
															{activeChatApplicationId === application._id ? 'Close Chat' : 'Open Chat'}
														</Button>
														{reviewStatuses.map((status) => (
															<Button
																key={status}
																variant={status === ApplicationStatus.APPROVED ? 'contained' : 'outlined'}
																color={status === ApplicationStatus.REJECTED ? 'error' : 'primary'}
																disabled={isFinal || application.status === status}
																onClick={() => updateStatusHandler(application, status)}
															>
																{getStatusLabel(status)}
															</Button>
														))}
													</Stack>
												</TableCell>
											</TableRow>
											{activeChatApplicationId === application._id && (
												<TableRow>
													<TableCell colSpan={9}>
														<ApplicationChatPanel
															applicationId={application._id}
															title="Application chat"
															onClose={() => setActiveChatApplicationId('')}
														/>
													</TableCell>
												</TableRow>
											)}
										</React.Fragment>
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

export default KindergartenApplications;
