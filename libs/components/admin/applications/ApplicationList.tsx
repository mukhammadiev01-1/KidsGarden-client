import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
	Button,
	Chip,
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
import { GET_ALL_APPLICATIONS_FOR_ADMIN } from '../../../../apollo/admin/query';
import { UPDATE_APPLICATION_STATUS } from '../../../../apollo/user/mutation';
import { ApplicationStatus, FINAL_APPLICATION_STATUSES } from '../../../enums/application.enum';
import { Application, ApplicationDocument } from '../../../types/application/application';
import { ApplicationsInquiry } from '../../../types/application/application.input';
import { getImageUrl } from '../../../config';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../../sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel, truncateId } from '../../mypage/dashboardUtils';
import ApplicationChatPanel from '../../chat/ApplicationChatPanel';

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
	if (!documents?.length) return <Typography sx={{ fontSize: '12px', color: '#9ca3af' }}>-</Typography>;

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

interface Props {
	initialInquiry: ApplicationsInquiry;
}

const ApplicationList = ({ initialInquiry }: Props) => {
	const [applicationsInquiry, setApplicationsInquiry] = useState<ApplicationsInquiry>(initialInquiry);
	const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
	const [activeChatApplicationId, setActiveChatApplicationId] = useState<string>('');
	const [updateApplicationStatus] = useMutation(UPDATE_APPLICATION_STATUS);

	const { data, loading, refetch } = useQuery(GET_ALL_APPLICATIONS_FOR_ADMIN, {
		variables: { input: applicationsInquiry },
		fetchPolicy: 'network-only',
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const applications: Application[] = data?.getAllApplicationsForAdmin?.list ?? [];
	const total = data?.getAllApplicationsForAdmin?.metaCounter?.[0]?.total ?? 0;

	const toggleChatHandler = (applicationId: string) => {
		setActiveChatApplicationId((currentId) => (currentId === applicationId ? '' : applicationId));
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

	return (
		<Stack spacing={3}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography variant="h2" className="tit">
					Kindergarten Applications
				</Typography>
				<Typography sx={{ color: '#64746b' }}>
					Review child admission applications and inquiries across all kindergartens.
				</Typography>
			</Stack>

			<Stack className="table-wrap" spacing={2} sx={{ p: '24px' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Applications</Typography>
						<Typography className="dashboard-panel-subtitle">Super Admin review list.</Typography>
					</Stack>
					<Chip label={`${total} total`} size="small" className="dashboard-count-chip" />
				</Stack>
				<TableContainer>
					<Table sx={{ minWidth: 1220 }} size="medium">
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
							{loading && (
								<TableRow>
									<TableCell align="center" colSpan={9}>
										Loading applications...
									</TableCell>
								</TableRow>
							)}
							{!loading && applications.length === 0 && (
								<TableRow>
									<TableCell align="center" colSpan={9}>
										<span className="no-data">No kindergarten applications found.</span>
									</TableCell>
								</TableRow>
							)}
							{applications.map((application) => {
								const parent = application.parentData;
								const isFinal = FINAL_APPLICATION_STATUSES.includes(application.status);

								return (
									<React.Fragment key={application._id}>
										<TableRow hover>
											<TableCell sx={{ maxWidth: 220 }}>
												<Stack spacing={0.25}>
													<Typography sx={{ fontWeight: 700 }}>
														{parent?.memberNick || parent?.memberFullName || 'Parent reference'}
													</Typography>
													<Typography sx={{ fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
														{truncateId(application.parentId)}
													</Typography>
												</Stack>
											</TableCell>
											<TableCell sx={{ maxWidth: 240 }}>
												<Stack spacing={0.25}>
													<Typography sx={{ fontWeight: 700 }}>
														{application.kindergartenData?.kindergartenTitle || 'Kindergarten reference'}
													</Typography>
													<Typography sx={{ fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
														{truncateId(application.kindergartenId)}
													</Typography>
												</Stack>
											</TableCell>
											<TableCell>
												<Stack spacing={0.25}>
													<Typography sx={{ fontWeight: 700 }}>{application.childName}</Typography>
													<Typography sx={{ fontSize: '12px', color: '#64746b' }}>{application.childAge} years old</Typography>
												</Stack>
											</TableCell>
											<TableCell>
												<Chip label={getStatusLabel(application.status)} size="small" sx={getStatusChipSx(application.status)} />
											</TableCell>
											<TableCell sx={{ maxWidth: 220 }}>{application.parentMessage || '-'}</TableCell>
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
												<Stack direction="row" spacing={1} justifyContent="flex-end">
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
				<TablePagination
					rowsPerPageOptions={[20, 50, 100]}
					component="div"
					count={total}
					rowsPerPage={applicationsInquiry.limit}
					page={applicationsInquiry.page - 1}
					onPageChange={changePageHandler}
					onRowsPerPageChange={changeRowsPerPageHandler}
				/>
			</Stack>
		</Stack>
	);
};

export default ApplicationList;
