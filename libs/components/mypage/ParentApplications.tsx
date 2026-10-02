import React, { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Chip, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import type { TFunction } from 'next-i18next';
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

const formatDocumentSize = (t: TFunction, size: number): string => {
	if (size >= 1024 * 1024) {
		return t('mypageText.ParentApplications.sizeMb', { size: (size / (1024 * 1024)).toFixed(1) }) as string;
	}
	return t('mypageText.ParentApplications.sizeKb', { size: Math.max(1, Math.round(size / 1024)) }) as string;
};

const renderApplicationDocuments = (t: TFunction, documents?: ApplicationDocument[]) => {
	if (!documents?.length) {
		return (
			<Typography className="dashboard-muted-text">
				{t('mypageText.ParentApplications.noDocuments') as string}
			</Typography>
		);
	}

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
					{document.name} ({formatDocumentSize(t, document.size)})
				</a>
			))}
		</Stack>
	);
};

const ParentApplications = () => {
	const { t } = useTranslation('common');
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
	// The chip used to show the page size (applications.length), not the real total.
	const applicationsTotal: number = data?.getMyApplications?.metaCounter?.[0]?.total ?? applications.length;

	const toggleChatHandler = (applicationId: string) => {
		setActiveChatApplicationId((currentId) => (currentId === applicationId ? '' : applicationId));
	};

	const cancelApplicationHandler = async (applicationId: string) => {
		try {
			if (!(await sweetConfirmAlert(t('mypageText.ParentApplications.cancelConfirm')))) return;
			await cancelApplication({ variables: { applicationId } });
			await refetch();
			await sweetMixinSuccessAlert(t('mypageText.ParentApplications.canceled'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	// Role guard. Navigating during render (router.back() in the component
	// body) is a side effect React may run twice under StrictMode; do it in an
	// effect and render nothing meanwhile.
	const roleAllowed = !(user.memberType !== MemberType.PARENT);
	useEffect(() => {
		if (!roleAllowed) router.back();
	}, [roleAllowed, router]);
	if (!roleAllowed) return null;

	return (
		<Stack className="parent-dashboard-screen parent-kindergarten-applications-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>
					{t('mypageText.ParentApplications.title')}
				</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					{t('mypageText.ParentApplications.subtitle')}
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypage.menu.kindergartenApplications')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.ParentApplications.panelSubtitle')}
						</Typography>
					</Stack>
					<Chip label={t('mypageText.ParentApplications.totalCount', { count: applicationsTotal })} size="small" className="dashboard-count-chip" />
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.ParentApplications.loading')}</Typography>}
				{!loading && applications.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.ParentApplications.empty')}
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
												{application.kindergartenData?.kindergartenTitle || t('statuses.KINDERGARTEN')}
											</Typography>
											<Typography className="dashboard-muted-text parent-nowrap">
												{t('mypageText.ParentApplications.createdAt', { date: formatDate(application.createdAt) })}
											</Typography>
										</Stack>
										<Chip label={t(`statuses.${application.status}`, { defaultValue: getStatusLabel(application.status) })} size="small" sx={getStatusChipSx(application.status)} />
									</Stack>

									<Stack className="parent-record-grid parent-application-grid">
										<Stack className="parent-meta-item">
											<Typography className="parent-meta-label">{t('mypageText.ParentApplications.child')}</Typography>
											<Typography className="parent-meta-value">{application.childName}</Typography>
											<Typography className="dashboard-muted-text">{t('mypageText.ParentApplications.yearsOld', { count: application.childAge })}</Typography>
										</Stack>
										<Stack className="parent-meta-item parent-meta-wide">
											<Typography className="parent-meta-label">{t('mypageText.ParentApplications.message')}</Typography>
											<Typography className="dashboard-note-text">
												{application.parentMessage || t('mypageText.ParentApplications.noMessage')}
											</Typography>
										</Stack>
										<Stack className="parent-meta-item">
											<Typography className="parent-meta-label">{t('mypageText.ParentApplications.documents')}</Typography>
											{renderApplicationDocuments(t, application.documents)}
										</Stack>
										<Stack className="parent-meta-item parent-meta-wide">
											<Typography className="parent-meta-label">{t('mypageText.ParentApplications.adminNote')}</Typography>
											<Typography className="dashboard-note-text">{application.adminNote || t('mypageText.ParentApplications.noAdminNote')}</Typography>
										</Stack>
									</Stack>

									<Stack className="parent-record-actions">
										<Button variant="outlined" onClick={() => toggleChatHandler(application._id)}>
											{activeChatApplicationId === application._id ? t('mypageText.ParentApplications.closeChat') : t('mypageText.ParentApplications.openChat')}
										</Button>
										{isFinal || application.status === ApplicationStatus.CANCELED ? (
											<Chip label={t('statuses.CLOSED')} size="small" className="parent-action-status" />
										) : (
											<Button
												variant="outlined"
												color="error"
												onClick={() => cancelApplicationHandler(application._id)}
											>
												{t('common.cancel')}
											</Button>
										)}
									</Stack>

									{activeChatApplicationId === application._id && (
										<ApplicationChatPanel
											applicationId={application._id}
											title={t('mypageText.ParentApplications.chatTitle')}
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
