import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Chip, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { CANCEL_APPLICATION } from '../../../apollo/user/mutation';
import { GET_MY_APPLICATIONS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { ApplicationStatus, FINAL_APPLICATION_STATUSES } from '../../enums/application.enum';
import { MemberType } from '../../enums/member.enum';
import { Application, ApplicationDocument } from '../../types/application/application';
import { getImageUrl } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel } from './dashboardUtils';
import ApplicationChatPanel from '../chat/ApplicationChatPanel';

const formatDocumentSize = (size: number) => {
	if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const renderApplicationDocuments = (documents?: ApplicationDocument[]) => {
	if (!documents?.length) return <Typography className="dashboard-muted-text">No documents</Typography>;

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

const ParentApplications = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [activeChatApplicationId, setActiveChatApplicationId] = useState<string>('');
	const [cancelApplication] = useMutation(CANCEL_APPLICATION);

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

	const { data, loading, refetch } = useQuery(GET_MY_APPLICATIONS, {
		variables: { input: applicationsInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.PARENT,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const applications: Application[] = data?.getMyApplications?.list ?? [];

	const toggleChatHandler = (applicationId: string) => {
		setActiveChatApplicationId((currentId) => (currentId === applicationId ? '' : applicationId));
	};

	const cancelApplicationHandler = async (applicationId: string) => {
		try {
			if (!(await sweetConfirmAlert('Cancel this kindergarten application?'))) return;
			await cancelApplication({ variables: { applicationId } });
			await refetch();
			await sweetMixinSuccessAlert('Application canceled');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (user.memberType !== MemberType.PARENT) {
		router.back();
		return null;
	}

	return (
		<Stack className="parent-dashboard-screen parent-kindergarten-applications-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>
					My Kindergarten Applications
				</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Track kindergarten applications and cancel requests that are still open.
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Kindergarten Applications</Typography>
						<Typography className="dashboard-panel-subtitle">
							Requests you have sent from kindergarten detail pages.
						</Typography>
					</Stack>
					<Chip label={`${applications.length} total`} size="small" className="dashboard-count-chip" />
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>Loading your applications...</Typography>}
				{!loading && applications.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No kindergarten applications yet. Open a kindergarten detail page to apply.
					</Typography>
				)}
				{applications.length > 0 && (
					<Stack className="parent-card-list parent-applications-list">
						{applications.map((application) => {
							const isFinal = FINAL_APPLICATION_STATUSES.includes(application.status);

							return (
								<Stack key={application._id} className="parent-record-card parent-application-card" spacing={2}>
									<Stack className="parent-record-card-header">
										<Stack className="parent-record-title-block" spacing={0.5}>
											<Typography className="dashboard-primary-text parent-record-title">
												{application.kindergartenData?.kindergartenTitle || 'Kindergarten'}
											</Typography>
											<Typography className="dashboard-muted-text parent-nowrap">
												Created {formatDate(application.createdAt)}
											</Typography>
										</Stack>
										<Chip label={getStatusLabel(application.status)} size="small" sx={getStatusChipSx(application.status)} />
									</Stack>

									<Stack className="parent-record-grid parent-application-grid">
										<Stack className="parent-meta-item">
											<Typography className="parent-meta-label">Child</Typography>
											<Typography className="parent-meta-value">{application.childName}</Typography>
											<Typography className="dashboard-muted-text">{application.childAge} years old</Typography>
										</Stack>
										<Stack className="parent-meta-item parent-meta-wide">
											<Typography className="parent-meta-label">Message</Typography>
											<Typography className="dashboard-note-text">
												{application.parentMessage || 'No message provided'}
											</Typography>
										</Stack>
										<Stack className="parent-meta-item">
											<Typography className="parent-meta-label">Documents</Typography>
											{renderApplicationDocuments(application.documents)}
										</Stack>
										<Stack className="parent-meta-item parent-meta-wide">
											<Typography className="parent-meta-label">Admin note</Typography>
											<Typography className="dashboard-note-text">{application.adminNote || 'No admin note yet'}</Typography>
										</Stack>
									</Stack>

									<Stack className="parent-record-actions">
										<Button variant="outlined" onClick={() => toggleChatHandler(application._id)}>
											{activeChatApplicationId === application._id ? 'Close Chat' : 'Open Chat'}
										</Button>
										{isFinal || application.status === ApplicationStatus.CANCELED ? (
											<Chip label="Closed" size="small" className="parent-action-status" />
										) : (
											<Button
												variant="outlined"
												color="error"
												onClick={() => cancelApplicationHandler(application._id)}
											>
												Cancel
											</Button>
										)}
									</Stack>

									{activeChatApplicationId === application._id && (
										<ApplicationChatPanel
											applicationId={application._id}
											title="Application chat"
											onClose={() => setActiveChatApplicationId('')}
										/>
									)}
								</Stack>
							);
						})}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default ParentApplications;
