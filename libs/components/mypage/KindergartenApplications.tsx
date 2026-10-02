import React, { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Button,
	Chip,
	Menu,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { UPDATE_APPLICATION_STATUS } from '../../../apollo/user/mutation';
import { GET_KINDERGARTEN_APPLICATIONS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { ApplicationStatus, FINAL_APPLICATION_STATUSES } from '../../enums/application.enum';
import { MemberType } from '../../enums/member.enum';
import { Application, ApplicationDocument } from '../../types/application/application';
import { getImageUrl } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { formatDate, getStatusChipSx, getStatusLabel } from './dashboardUtils';
import ApplicationChatPanel from '../chat/ApplicationChatPanel';

const reviewStatuses = [
	ApplicationStatus.REVIEWING,
	ApplicationStatus.APPROVED,
	ApplicationStatus.REJECTED,
	ApplicationStatus.NEED_MORE_INFO,
];

type Translate = (key: string, options?: Record<string, unknown>) => string;

const formatDocumentSize = (size: number, t: Translate) => {
	if (size >= 1024 * 1024) return t('mypageText.KindergartenApplications.sizeMb', { size: (size / (1024 * 1024)).toFixed(1) });
	return t('mypageText.KindergartenApplications.sizeKb', { size: Math.max(1, Math.round(size / 1024)) });
};

const renderApplicationDocuments = (documents: ApplicationDocument[] | undefined, t: Translate) => {
	if (!documents?.length) return <Typography className="dashboard-muted-text">{t('mypageText.KindergartenApplications.noDocuments')}</Typography>;

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
					{document.name} ({formatDocumentSize(document.size, t)})
				</a>
			))}
		</Stack>
	);
};

const KindergartenApplications = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [activeChatApplicationId, setActiveChatApplicationId] = useState<string>('');
	const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
	const [statusMenu, setStatusMenu] = useState<{ applicationId: string; anchorEl: HTMLElement | null }>({
		applicationId: '',
		anchorEl: null,
	});
	const [updateApplicationStatus, { loading: updatingApplicationStatus }] = useMutation(UPDATE_APPLICATION_STATUS);

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
	// The chip used to show the page size (applications.length), not the real total.
	const applicationsTotal: number = data?.getKindergartenApplications?.metaCounter?.[0]?.total ?? applications.length;

	const statusLabel = (status?: string) => (status ? t(`statuses.${status}`, { defaultValue: getStatusLabel(status) }) : '-');

	const toggleChatHandler = (applicationId: string) => {
		setActiveChatApplicationId((currentId) => (currentId === applicationId ? '' : applicationId));
	};

	const openStatusMenuHandler = (event: React.MouseEvent<HTMLButtonElement>, applicationId: string) => {
		setStatusMenu({ applicationId, anchorEl: event.currentTarget });
	};

	const closeStatusMenuHandler = () => {
		setStatusMenu({ applicationId: '', anchorEl: null });
	};

	const updateStatusHandler = async (application: Application, status: ApplicationStatus) => {
		try {
			const adminNote = adminNotes[application._id]?.trim();
			if (!(await sweetConfirmAlert(t('mypageText.KindergartenApplications.setStatusConfirm', { status: statusLabel(status) })))) return;
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
			await sweetMixinSuccessAlert(t('mypageText.KindergartenApplications.updated'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const selectStatusHandler = async (application: Application, status: ApplicationStatus) => {
		closeStatusMenuHandler();
		if (application.status === status) return;
		await updateStatusHandler(application, status);
	};

	// Role guard. Navigating during render (router.back() in the component
	// body) is a side effect React may run twice under StrictMode; do it in an
	// effect and render nothing meanwhile.
	const roleAllowed = !(user.memberType !== MemberType.KINDERGARTEN_ADMIN);
	useEffect(() => {
		if (!roleAllowed) router.back();
	}, [roleAllowed, router]);
	if (!roleAllowed) return null;

	return (
		<Stack className="admin-dashboard-screen kindergarten-applications-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>
					{t('mypage.menu.kindergartenApplications')}
				</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					{t('mypageText.KindergartenApplications.subtitle')}
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('adminPages.applications.panelTitle')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.KindergartenApplications.applicationsHint')}
						</Typography>
					</Stack>
					<Chip label={t('mypageText.KindergartenStaffApplications.foundCount', { count: applicationsTotal })} size="small" className="dashboard-count-chip" />
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>{t('adminPages.applications.loading')}</Typography>}
				{!loading && applications.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.KindergartenApplications.noApplications')}
					</Typography>
				)}
				{applications.length > 0 && (
					<Stack className="admin-card-list admin-applications-list">
						{applications.map((application) => {
							const parent = application.parentData;
							const isFinal = FINAL_APPLICATION_STATUSES.includes(application.status);
							const isStatusMenuOpen = statusMenu.applicationId === application._id && Boolean(statusMenu.anchorEl);
							const parentName = parent?.memberNick || parent?.memberFullName || t('mypageText.KindergartenApplications.parentFallback');
							const kindergartenTitle = application.kindergartenData?.kindergartenTitle || t('adminTables.kindergarten');

							return (
								<Stack key={application._id} className="admin-record-card admin-application-card" spacing={2}>
									<Stack className="admin-record-card-header">
										<Stack className="admin-record-title-block" spacing={0.5}>
											<Typography className="dashboard-primary-text admin-record-title">{parentName}</Typography>
											<Typography className="dashboard-muted-text">{kindergartenTitle}</Typography>
										</Stack>
										<Chip label={statusLabel(application.status)} size="small" sx={getStatusChipSx(application.status)} />
									</Stack>
									<Stack className="admin-record-grid admin-application-grid">
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.child')}</Typography>
											<Typography className="admin-meta-value">{application.childName}</Typography>
											<Typography className="dashboard-muted-text">{t('mypageText.KindergartenApplications.yearsOld', { count: application.childAge })}</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.created')}</Typography>
											<Typography className="admin-meta-value">{formatDate(application.createdAt)}</Typography>
										</Stack>
										<Stack className="admin-meta-item admin-meta-wide">
											<Typography className="admin-meta-label">{t('adminTables.message')}</Typography>
											<Typography className="dashboard-note-text">{application.parentMessage || t('mypageText.KindergartenStaffApplications.noMessage')}</Typography>
										</Stack>
										<Stack className="admin-meta-item">
											<Typography className="admin-meta-label">{t('adminTables.documents')}</Typography>
											{renderApplicationDocuments(application.documents, t)}
										</Stack>
										<Stack className="admin-meta-item admin-note-field">
											<Typography className="admin-meta-label">{t('adminTables.adminNote')}</Typography>
											<TextField
												fullWidth
												size="small"
												placeholder={application.adminNote || t('adminForms.optionalNote')}
												value={adminNotes[application._id] || ''}
												onChange={(event) =>
													setAdminNotes((prev) => ({
														...prev,
														[application._id]: event.target.value,
													}))
												}
												disabled={isFinal}
											/>
										</Stack>
									</Stack>
									<Stack className="admin-record-actions admin-review-actions">
										<Button className="admin-chat-action" variant="outlined" onClick={() => toggleChatHandler(application._id)}>
											{activeChatApplicationId === application._id ? t('adminActions.closeChat') : t('adminActions.openChat')}
										</Button>
										<Button
											className="admin-change-status-button"
											variant="contained"
											disabled={isFinal || updatingApplicationStatus}
											aria-haspopup="menu"
											aria-expanded={isStatusMenuOpen ? 'true' : undefined}
											onClick={(event) => openStatusMenuHandler(event, application._id)}
										>
											{t('mypageText.KindergartenStaffApplications.changeStatus')}
										</Button>
										<Menu
											anchorEl={statusMenu.anchorEl}
											open={isStatusMenuOpen}
											onClose={closeStatusMenuHandler}
											anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
											transformOrigin={{ vertical: 'top', horizontal: 'right' }}
											PaperProps={{
												sx: {
													mt: 0.75,
													minWidth: 190,
													borderRadius: '14px',
													border: '1px solid #dbe9d5',
													boxShadow: '0 14px 34px rgba(36, 51, 45, 0.16)',
													backgroundColor: '#fffdf8',
													p: 0.5,
												},
											}}
										>
											{reviewStatuses.map((status) => {
												const isCurrentStatus = application.status === status;

												return (
													<MenuItem
														key={status}
														selected={isCurrentStatus}
														disabled={updatingApplicationStatus}
														onClick={() => selectStatusHandler(application, status)}
														sx={{
															minHeight: 34,
															borderRadius: '10px',
															my: 0.25,
															gap: 2,
															justifyContent: 'space-between',
															color: status === ApplicationStatus.REJECTED ? '#9f3c3c' : '#405346',
															fontFamily: 'inherit',
															fontSize: 13,
															fontWeight: 800,
															'&.Mui-selected': {
																backgroundColor: '#edf7e9',
															},
															'&.Mui-selected:hover': {
																backgroundColor: '#e2f1dd',
															},
														}}
													>
														{statusLabel(status)}
														{isCurrentStatus && (
															<Typography
																component="span"
																sx={{ color: '#6d856f', fontSize: 11, fontWeight: 900, lineHeight: 1 }}
															>
																{t('mypageText.KindergartenApplications.currentStatus')}
															</Typography>
														)}
													</MenuItem>
												);
											})}
										</Menu>
									</Stack>
									{activeChatApplicationId === application._id && (
										<ApplicationChatPanel
											applicationId={application._id}
											title={t('messages.conversationTypes.APPLICATION_CHAT')}
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

export default KindergartenApplications;
